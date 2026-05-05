#!/usr/bin/env bash
# Run one TASK card through execute -> review.
# Usage: agent-loop.sh .tasks/TASK-001.md
set -euo pipefail

TASK_FILE="${1:?usage: agent-loop.sh .tasks/TASK-NNN.md}"
HARNESS_HOME="${HARNESS_HOME:-$HOME/dotfiles/harness}"
MAX_RETRIES="${MAX_RETRIES:-2}"

[[ -f "$TASK_FILE" ]] || { echo "TASK file not found: $TASK_FILE" >&2; exit 2; }
[[ -d "$HARNESS_HOME" ]] || { echo "HARNESS_HOME missing: $HARNESS_HOME" >&2; exit 2; }

mkdir -p .tasks/locks .handoff

frontmatter_value() {
  local key="$1" file="$2"
  awk -v key="$key" '
    BEGIN { in_fm = 0 }
    /^---$/ { in_fm = !in_fm; next }
    in_fm && $0 ~ "^" key ":" {
      sub("^" key ":[[:space:]]*", "", $0)
      print $0
      exit
    }
  ' "$file"
}

set_status() {
  local new_status="$1" tmp
  tmp="$(mktemp)"
  awk -v s="$new_status" '
    BEGIN { in_fm = 0; changed = 0 }
    /^---$/ { in_fm = !in_fm; print; next }
    in_fm && /^status:/ && changed == 0 { print "status: " s; changed = 1; next }
    { print }
  ' "$TASK_FILE" > "$tmp"
  mv "$tmp" "$TASK_FILE"
}

TASK_JSON="$(bun --silent -e "
  import('./scripts/harness/parse-task-card').then(async (m) => {
    const c = await m.parseTaskCard(process.argv[1]);
    process.stdout.write(JSON.stringify(c));
  }).catch((error) => {
    console.error(String(error?.message ?? error));
    process.exit(1);
  });
" "$TASK_FILE")" || { echo "could not parse TASK card: $TASK_FILE" >&2; exit 2; }

TASK_ID="$(jq -r '.id' <<<"$TASK_JSON")"
FILES_LEN="$(jq -r '.files | length' <<<"$TASK_JSON")"

EXEC_JSON=".handoff/${TASK_ID}.exec.json"
EXEC_JSONL=".handoff/${TASK_ID}.exec.jsonl"
REVIEW_JSON=".handoff/${TASK_ID}.review.json"
REVIEW_JSONL=".handoff/${TASK_ID}.review.jsonl"
DIFF_FILE=".handoff/${TASK_ID}.diff"
WARNINGS_JSONL=".handoff/${TASK_ID}.warnings.jsonl"
rm -f "$WARNINGS_JSONL"

if [[ "$FILES_LEN" != "1" ]]; then
  printf '{"task_id":"%s","status":"NEEDS_SPLIT","summary":"TASK must target exactly one file","touched_files":[],"verification":[],"blockers":["files must contain exactly one path"]}\n' \
    "$TASK_ID" > "$EXEC_JSON"
  set_status blocked
  exit 0
fi

TARGET_FILE="$(jq -r '.files[0]' <<<"$TASK_JSON")"
LOCK_DIR=".tasks/locks/${TARGET_FILE//\//__}.lock"

[[ -n "$TASK_ID" && -n "$TARGET_FILE" ]] || { echo "could not parse id/files from $TASK_FILE" >&2; exit 2; }

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Target locked by another worker: $TARGET_FILE" >&2
  exit 75
fi
trap 'rm -rf "$LOCK_DIR"' EXIT

DECISION_REVIEW_SCRIPT=".harness/scripts/decision-review.sh"
[[ -x "$DECISION_REVIEW_SCRIPT" ]] || { echo "decision-review script missing or not executable: $DECISION_REVIEW_SCRIPT" >&2; exit 2; }
"$DECISION_REVIEW_SCRIPT" "$TASK_FILE" || exit $?

# Layer 2: cross-session conflict detection.
# Active only when HARNESS_SESSION_ID is set; legacy callers retain prior behavior.
CONFLICT_CHECK_SCRIPT=".harness/scripts/conflict-check.sh"
if [[ -n "${HARNESS_SESSION_ID:-}" && -x "$CONFLICT_CHECK_SCRIPT" ]]; then
  CC_STDERR="$(mktemp)"
  if ! "$CONFLICT_CHECK_SCRIPT" "$TASK_FILE" 2>"$CC_STDERR"; then
    rc=$?
    cat "$CC_STDERR" >&2
    if (( rc == 2 )); then
      reason="$(head -n1 "$CC_STDERR" | tr -d '\n' | sed 's/"/\\"/g')"
      printf '{"task_id":"%s","status":"BLOCKED","summary":"cross-session conflict detected","touched_files":[],"verification":[],"blockers":["%s"]}\n' \
        "$TASK_ID" "$reason" > "$EXEC_JSON"
      rm -f "$CC_STDERR"
      set_status blocked
      exit 0
    fi
    rm -f "$CC_STDERR"
    set_status rejected
    exit 1
  fi
  rm -f "$CC_STDERR"
fi

# Heartbeat addInFlight: registers this task on the session heartbeat for cross-session visibility.
record_warning() {
  local code="$1" message="$2"
  jq -cn \
    --arg task_id "$TASK_ID" \
    --arg code "$code" \
    --arg message "$message" \
    --arg emitted_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    '{task_id:$task_id,code:$code,message:$message,emitted_at:$emitted_at}' >> "$WARNINGS_JSONL"
}

add_in_flight() {
  [[ -n "${HARNESS_SESSION_ID:-}" ]] || return 0
  bun --silent -e "
    import('./scripts/harness/heartbeat').then(async (m) => {
      const c = await (await import('./scripts/harness/parse-task-card')).parseTaskCard(process.argv[1]);
      await m.addInFlight(process.argv[2], c);
    }).catch((error) => {
      console.error(String(error?.message ?? error));
      process.exit(1);
    });
  " "$TASK_FILE" "$HARNESS_SESSION_ID"
}
remove_in_flight() {
  [[ -n "${HARNESS_SESSION_ID:-}" ]] || return 0
  bun --silent -e "
    import('./scripts/harness/heartbeat').then(m =>
      m.removeInFlight(process.argv[1], process.argv[2])
    ).catch((error) => {
      console.error(String(error?.message ?? error));
      process.exit(1);
    });
  " "$HARNESS_SESSION_ID" "$TASK_ID"
}

set_status in_progress
add_in_flight || record_warning heartbeat_add_failed "failed to register task in session heartbeat"
trap 'rm -rf "$LOCK_DIR"; remove_in_flight || record_warning heartbeat_remove_failed "failed to remove task from session heartbeat"' EXIT

retry=0
while (( retry <= MAX_RETRIES )); do
  HARNESS_EXEC_JSON="$EXEC_JSON" bun scripts/harness/run-with-resources.ts "$TASK_FILE" -- \
    codex exec \
    --profile fast \
    --skip-git-repo-check \
    --json \
    --output-schema "$HARNESS_HOME/schemas/result.schema.json" \
    --output-last-message "$EXEC_JSON" \
    "\$execute-task
Read $TASK_FILE.
Respect AGENTS.md, $HARNESS_HOME/HARNESS.md, .harness/routing.md, $HARNESS_HOME/HANDOFF.md.
Touch only the file listed in 'files:' ($TARGET_FILE).
If more than one file is required, return status NEEDS_SPLIT.
Return only structured JSON matching the output schema." \
    > "$EXEC_JSONL" 2>&1 || true

  if [[ ! -s "$EXEC_JSON" ]]; then
    echo "execute pass produced no output for $TASK_ID" >&2
    set_status rejected; exit 1
  fi

  EXEC_STATUS="$(jq -r '.status' "$EXEC_JSON" 2>/dev/null || echo PARSE_ERROR)"

  case "$EXEC_STATUS" in
    ok) break ;;
    NEEDS_SPLIT|BLOCKED) set_status blocked; exit 0 ;;
    *)
      retry=$((retry + 1))
      if (( retry > MAX_RETRIES )); then set_status rejected; exit 1; fi
      ;;
  esac
done

# Include untracked files in diff via intent-to-add (placeholder, not staged).
# Without this, newly-created files render an empty diff and Strict review fails.
git add -N -- "$TARGET_FILE" 2>/dev/null || true
git diff -- "$TARGET_FILE" > "$DIFF_FILE"

codex exec \
  --profile strict \
  --skip-git-repo-check \
  --json \
  --output-schema "$HARNESS_HOME/schemas/review.schema.json" \
  --output-last-message "$REVIEW_JSON" \
  "\$strict-review
Review the diff at $DIFF_FILE against $TASK_FILE.
Respect AGENTS.md, $HARNESS_HOME/HARNESS.md, .harness/routing.md.
Do not edit files.
Return only structured JSON matching the output schema." \
  > "$REVIEW_JSONL" 2>&1 || true

REVIEW_VERDICT="$(jq -r '.verdict' "$REVIEW_JSON" 2>/dev/null || echo PARSE_ERROR)"

if [[ "$REVIEW_VERDICT" == "pass" ]]; then
  set_status review
  exit 0
else
  set_status rejected
  exit 1
fi
