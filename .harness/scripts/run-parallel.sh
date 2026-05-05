#!/usr/bin/env bash
# Fan out pending TASK cards to agent-loop.sh, capped at PARALLEL workers.
# Usage: run-parallel.sh
set -euo pipefail

PARALLEL="${PARALLEL:-3}"
HARNESS_HOME="${HARNESS_HOME:-$HOME/dotfiles/harness}"
export HARNESS_HOME

mapfile -t TASKS < <(grep -l '^status: pending$' .tasks/TASK-*.md 2>/dev/null || true)

if (( ${#TASKS[@]} == 0 )); then
  echo "No pending tasks."
  exit 0
fi

echo "Dispatching ${#TASKS[@]} task(s) at parallel=${PARALLEL}"
printf '%s\n' "${TASKS[@]}" \
  | xargs -n1 -P "$PARALLEL" -I{} bash .harness/scripts/agent-loop.sh "{}"
