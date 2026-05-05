#!/usr/bin/env bash
# Real Codex round-trip against .harness/DRYRUN.md.
# Invoked by dry-run-smoke.sh --full. Cleans up unless KEEP_SMOKE_ARTIFACTS=1.
set -euo pipefail

HH="${HARNESS_HOME:-$HOME/dotfiles/harness}"
KEEP="${KEEP_SMOKE_ARTIFACTS:-0}"

[[ -f .harness/DRYRUN.md ]] || { echo "skip: .harness/DRYRUN.md not present in this repo"; exit 0; }
mkdir -p .tasks/locks .handoff

DRY_BACKUP="$(mktemp)"
cp .harness/DRYRUN.md "$DRY_BACKUP"

TASK_ID="TASK-SMOKE-$$"
TASK_FILE=".tasks/${TASK_ID}.md"
cat > "$TASK_FILE" <<TASK
---
id: $TASK_ID
status: pending
owner: codex-fast
files: [".harness/DRYRUN.md"]
---

Append a single line "<!-- smoke $$$$ -->" to .harness/DRYRUN.md if it is not already present.
TASK

cleanup() {
  cp "$DRY_BACKUP" .harness/DRYRUN.md || true
  rm -f "$DRY_BACKUP" || true
  if [[ "$KEEP" != "1" ]]; then
    rm -f "$TASK_FILE"
    rm -f .handoff/${TASK_ID}.{exec,review}.json .handoff/${TASK_ID}.{exec,review}.jsonl .handoff/${TASK_ID}.diff
  fi
}
trap cleanup EXIT

classify_failure() {
  local rc="$1" id="$2"
  if [[ ! -f ".handoff/${id}.exec.json" ]]; then echo "auth-or-fast"; return; fi
  local exec_status; exec_status="$(jq -r '.status // ""' ".handoff/${id}.exec.json")"
  if [[ "$exec_status" != "ok" ]]; then echo "fast"; return; fi
  if [[ ! -f ".handoff/${id}.review.json" ]]; then echo "strict-or-gate"; return; fi
  echo "unknown"
}

set +e
HARNESS_HOME="$HH" bash "$HH/scripts/agent-loop.sh" "$TASK_FILE"
rc=$?
set -e

if (( rc != 0 )); then
  reason="$(classify_failure "$rc" "$TASK_ID")"
  echo "FAIL full smoke: $reason (agent-loop rc=$rc)" >&2
  exit 1
fi

[[ -f ".handoff/${TASK_ID}.exec.json"   ]] || { echo "FAIL: missing exec.json after dispatch"   >&2; exit 1; }
[[ -f ".handoff/${TASK_ID}.review.json" ]] || { echo "FAIL: missing review.json after dispatch" >&2; exit 1; }
[[ -f ".handoff/${TASK_ID}.diff"        ]] || { echo "FAIL: missing diff after dispatch"        >&2; exit 1; }

HARNESS_RUN_MODE="full-smoke" "$HH/scripts/decision-brief.sh"
[[ -f .handoff/decision-brief.md  ]] || { echo "FAIL: brief not generated" >&2; exit 1; }
[[ -f .handoff/usage-summary.json ]] || { echo "FAIL: usage-summary not generated" >&2; exit 1; }

echo "OK full smoke"
