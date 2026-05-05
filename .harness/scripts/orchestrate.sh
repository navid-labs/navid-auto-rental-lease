#!/usr/bin/env bash
# Claude's single entry point for a Hybrid harness batch run.
# Sequence: codex-env-check → discover/dispatch via agent-loop.sh → decision-brief.
# Always emits .handoff/decision-brief.md and .handoff/usage-summary.json.
set -euo pipefail

HH="${HARNESS_HOME:-$HOME/dotfiles/harness}"
PARALLEL="${PARALLEL:-3}"
DRY_DISPATCH="${HARNESS_DRY_DISPATCH:-0}"

# Multi-session coordination: assign session id + write heartbeat.
# Session id is exported so child agent-loop.sh invocations inherit it.
SESSION_HOSTNAME="$(hostname -s 2>/dev/null || echo localhost)"
SESSION_HOSTNAME="${SESSION_HOSTNAME//[^A-Za-z0-9_-]/_}"
SESSION_HOSTNAME="${SESSION_HOSTNAME:0:32}"
HARNESS_SESSION_ID="${HARNESS_SESSION_ID:-session-${SESSION_HOSTNAME}-$(date +%s)-$RANDOM}"
export HARNESS_SESSION_ID

heartbeat_lifecycle_start() {
  if [[ -f "scripts/harness/heartbeat.ts" ]]; then
    bun --silent -e "
      import('./scripts/harness/heartbeat').then(m =>
        m.writeHeartbeat(process.argv[1], process.argv[2], parseInt(process.argv[3], 10))
      ).catch(() => process.exit(0));
    " "$HARNESS_SESSION_ID" "$SESSION_HOSTNAME" "$$" 2>/dev/null || true

    (
      while sleep 25; do
        bun --silent -e "
          import('./scripts/harness/heartbeat').then(m =>
            m.refreshHeartbeat(process.argv[1])
          ).catch(() => process.exit(0));
        " "$HARNESS_SESSION_ID" 2>/dev/null || break
      done
    ) &
    HEARTBEAT_REFRESH_PID=$!
  fi
}

heartbeat_lifecycle_stop() {
  if [[ -n "${HEARTBEAT_REFRESH_PID:-}" ]]; then
    kill "$HEARTBEAT_REFRESH_PID" 2>/dev/null || true
    wait "$HEARTBEAT_REFRESH_PID" 2>/dev/null || true
  fi
  if [[ -f "scripts/harness/heartbeat.ts" ]]; then
    bun --silent -e "
      import('./scripts/harness/heartbeat').then(m =>
        m.removeHeartbeat(process.argv[1])
      ).catch(() => process.exit(0));
    " "$HARNESS_SESSION_ID" 2>/dev/null || true
  fi
}

heartbeat_lifecycle_start
trap 'heartbeat_lifecycle_stop' EXIT INT TERM

usage() {
  cat >&2 <<EOF
usage: orchestrate.sh                    # discover & dispatch pending owner:codex-fast TASKs
       orchestrate.sh TASK-ID [TASK-ID...]   # explicit re-run
       orchestrate.sh --all              # all owner:codex-fast TASKs (force re-run)
       orchestrate.sh --force            # no-arg discovery, also re-run TASKs that have review.json
EOF
}

MODE="no-arg"
EXPLICIT=()
ALL=0
FORCE=0
while (( "$#" )); do
  case "$1" in
    --all)   ALL=1;   MODE="all" ;;
    --force) FORCE=1; MODE="force" ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "unknown flag: $1" >&2; usage; exit 2 ;;
    *)  EXPLICIT+=("$1"); MODE="explicit" ;;
  esac
  shift
done

if [[ -x "$HH/scripts/codex-env-check.sh" ]]; then
  if ! "$HH/scripts/codex-env-check.sh" >/dev/null; then
    echo "orchestrate.sh: codex-env-check failed" >&2
    exit 1
  fi
else
  echo "orchestrate.sh: $HH/scripts/codex-env-check.sh missing or non-executable" >&2
  exit 1
fi

frontmatter_value() {
  local key="$1" file="$2"
  awk -v key="$key" '
    BEGIN { in_fm = 0 }
    /^---$/ { in_fm = !in_fm; next }
    in_fm && $0 ~ "^" key ":" {
      sub("^" key ":[[:space:]]*", "", $0); print $0; exit
    }
  ' "$file"
}

clear_handoff() {
  local id="$1"
  rm -f \
    ".handoff/${id}.exec.json" \
    ".handoff/${id}.exec.jsonl" \
    ".handoff/${id}.review.json" \
    ".handoff/${id}.review.jsonl" \
    ".handoff/${id}.diff" \
    ".handoff/${id}.warnings.jsonl"
}

dispatch_one() {
  local id="$1" task_file=".tasks/${id}.md"
  if (( DRY_DISPATCH == 1 )); then
    printf '%s\n' "$id" >> .handoff/.dry-dispatch.log
    return 0
  fi
  HARNESS_HOME="$HH" bash "$HH/scripts/agent-loop.sh" "$task_file" || true
}

mkdir -p .handoff
: > .handoff/.dry-dispatch.log

declare -a DISPATCH_LIST=()
declare -i SKIP_COUNT=0

if (( ${#EXPLICIT[@]} > 0 )); then
  for id in "${EXPLICIT[@]}"; do
    [[ -f ".tasks/${id}.md" ]] || { echo "skip: TASK file missing for $id" >&2; continue; }
    clear_handoff "$id"
    DISPATCH_LIST+=("$id")
  done
elif (( ALL == 1 )); then
  shopt -s nullglob
  for tf in .tasks/TASK-*.md; do
    owner="$(frontmatter_value owner "$tf" | tr -d ' ')"
    [[ "$owner" == "codex-fast" ]] || { SKIP_COUNT=$((SKIP_COUNT+1)); continue; }
    id="$(frontmatter_value id "$tf" | tr -d ' "')"
    clear_handoff "$id"
    DISPATCH_LIST+=("$id")
  done
else
  shopt -s nullglob
  for tf in .tasks/TASK-*.md; do
    owner="$(frontmatter_value owner "$tf" | tr -d ' ')"
    status="$(frontmatter_value status "$tf" | tr -d ' ')"
    id="$(frontmatter_value id "$tf" | tr -d ' "')"
    if [[ "$owner" != "codex-fast" || "$status" != "pending" ]]; then
      SKIP_COUNT=$((SKIP_COUNT+1)); continue
    fi
    if [[ -f ".handoff/${id}.review.json" && "$FORCE" == "0" ]]; then
      SKIP_COUNT=$((SKIP_COUNT+1)); continue
    fi
    if (( FORCE == 1 )); then clear_handoff "$id"; fi
    DISPATCH_LIST+=("$id")
  done
fi

if (( ${#DISPATCH_LIST[@]} > 0 )); then
  if (( DRY_DISPATCH == 1 )); then
    for id in "${DISPATCH_LIST[@]}"; do dispatch_one "$id"; done
  else
    printf '%s\n' "${DISPATCH_LIST[@]}" \
      | xargs -n1 -P "$PARALLEL" -I{} bash -c 'HARNESS_HOME="$0" bash "$0/scripts/agent-loop.sh" ".tasks/$1.md" || true' "$HH" {}
  fi
fi

HARNESS_RUN_MODE="$MODE" "$HH/scripts/decision-brief.sh" || {
  echo "orchestrate.sh: decision-brief.sh failed" >&2
  exit 1
}

PASSED="$(  awk -F': ' '/^passed:/      {print $2; exit}' .handoff/decision-brief.md || echo 0)"
FAILED="$(  awk -F': ' '/^failed:/      {print $2; exit}' .handoff/decision-brief.md || echo 0)"
BLOCKED="$( awk -F': ' '/^blocked:/     {print $2; exit}' .handoff/decision-brief.md || echo 0)"
NSPLIT="$(  awk -F': ' '/^needs_split:/ {print $2; exit}' .handoff/decision-brief.md || echo 0)"

{
  printf 'Dispatched: %d\n' "${#DISPATCH_LIST[@]}"
  printf 'Skipped:    %d\n' "$SKIP_COUNT"
  printf 'Passed:     %d\n' "${PASSED:-0}"
  printf 'Failed:     %d\n' "${FAILED:-0}"
  printf 'Blocked:    %d\n' "${BLOCKED:-0}"
  printf 'NeedsSplit: %d\n' "${NSPLIT:-0}"
  printf 'Brief:      .handoff/decision-brief.md\n'
  printf 'Usage:      .handoff/usage-summary.json\n'
} >&2

exit 0
