#!/usr/bin/env bash
# Harness self-check.
# Cheap mode (default): syntax + schemas + per-script unit tests. Zero Codex tokens.
# --full: round-trip a tiny TASK through agent-loop.sh against .harness/DRYRUN.md.
set -euo pipefail

HH="${HARNESS_HOME:-$HOME/dotfiles/harness}"
MODE="cheap"
case "${1:-}" in
  --full) MODE="full" ;;
  ""|--cheap) MODE="cheap" ;;
  -h|--help) echo "usage: dry-run-smoke.sh [--cheap|--full]"; exit 0 ;;
  *) echo "unknown arg: $1" >&2; exit 2 ;;
esac

echo "== dry-run-smoke ($MODE) =="

# 1. bash -n on every script in HARNESS_HOME and the local repo .harness
echo "-- bash -n --"
for d in "$HH/scripts" .harness/scripts; do
  [[ -d "$d" ]] || continue
  for f in "$d"/*.sh; do
    [[ -f "$f" ]] || continue
    bash -n "$f"
    echo "OK syntax $f"
  done
done

# 2. JSON schemas parse
echo "-- schemas --"
for f in "$HH/schemas"/*.schema.json; do
  [[ -f "$f" ]] || continue
  jq -e . "$f" >/dev/null
  echo "OK schema $f"
done

# 3. Run each per-script unit test (export HARNESS_HOME so they can locate fixtures)
echo "-- unit tests --"
HARNESS_HOME="$HH" "$HH/tests/test-codex-env-check.sh"
HARNESS_HOME="$HH" "$HH/tests/test-decision-brief.sh"
HARNESS_HOME="$HH" "$HH/tests/test-orchestrate.sh"

if [[ "$MODE" == "cheap" ]]; then
  echo "== smoke OK ($MODE) =="
  exit 0
fi

# --- Full mode (Task 9) ---
"$HH/scripts/dry-run-smoke-full.sh"
echo "== smoke OK ($MODE) =="
