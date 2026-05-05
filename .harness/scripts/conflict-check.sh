#!/usr/bin/env bash
# Cross-session conflict detector. Called by agent-loop.sh before dispatch.
# Usage: conflict-check.sh .tasks/TASK-NNN.md
# Exit codes:
#   0  clear (no conflict, or HARNESS_SESSION_ID unset)
#   2  conflict detected (line printed to stderr)
#   1  script error
set -euo pipefail

TASK_FILE="${1:?usage: conflict-check.sh .tasks/TASK-NNN.md}"
[[ -f "$TASK_FILE" ]] || { echo "conflict-check: TASK file not found: $TASK_FILE" >&2; exit 1; }

HEARTBEAT_DIR=".handoff/sessions"
SESSION_ID="${HARNESS_SESSION_ID:-}"
STALE_MS=30000

# Legacy: no session id => skip Layer-2 protection
if [[ -z "$SESSION_ID" ]]; then
  exit 0
fi

# No heartbeat dir => no other sessions => clear
if [[ ! -d "$HEARTBEAT_DIR" ]]; then
  exit 0
fi

# Parse this task's db_reads / db_writes from frontmatter via bun.
# Uses scripts/harness/parse-task-card.ts so the parser is the single source of truth.
my_json="$(bun --silent -e "
import { parseTaskCard } from './scripts/harness/parse-task-card';
parseTaskCard(process.argv[1]).then(c => {
  process.stdout.write(JSON.stringify({
    db_reads: c.db_reads,
    db_writes: c.db_writes,
  }));
}).catch(e => { console.error(String(e?.message ?? e)); process.exit(1); });
" "$TASK_FILE" 2>/tmp/conflict-check-parse.$$)" || {
  cat /tmp/conflict-check-parse.$$ >&2
  rm -f /tmp/conflict-check-parse.$$
  echo "conflict-check: parse failed for $TASK_FILE" >&2
  exit 1
}
rm -f /tmp/conflict-check-parse.$$

my_reads_csv="$(printf '%s' "$my_json" | jq -r '.db_reads | join(",")')"
my_writes_csv="$(printf '%s' "$my_json" | jq -r '.db_writes | join(",")')"

# Quick exit: nothing to compare
if [[ -z "$my_reads_csv" && -z "$my_writes_csv" ]]; then
  exit 0
fi

# Walk other sessions' heartbeats.
shopt -s nullglob
now_ms=$(($(date +%s) * 1000))

for hb in "$HEARTBEAT_DIR"/*.heartbeat.json; do
  [[ -f "$hb" ]] || continue
  other_session="$(jq -r '.session_id // ""' "$hb" 2>/dev/null || true)"
  [[ -z "$other_session" || "$other_session" == "$SESSION_ID" ]] && continue

  refreshed_at="$(jq -r '.refreshed_at // ""' "$hb" 2>/dev/null || true)"
  [[ -z "$refreshed_at" ]] && continue

  # Convert ISO8601 (UTC) to epoch ms; tolerate sub-second precision.
  iso_no_frac="${refreshed_at%%.*}"
  iso_no_frac="${iso_no_frac%Z}"
  if refreshed_s="$(date -u -j -f '%Y-%m-%dT%H:%M:%S' "$iso_no_frac" +%s 2>/dev/null)"; then
    refreshed_ms=$((refreshed_s * 1000))
    age=$((now_ms - refreshed_ms))
    if (( age > STALE_MS )); then
      continue   # stale heartbeat; ignore
    fi
  fi

  # Compare resource sets via jq.
  conflict_kind=""
  conflict_resources=""

  # (A) my db_writes ∩ other db_writes  (exclusive vs exclusive)
  if [[ -n "$my_writes_csv" ]]; then
    inter="$(jq -r --arg mine "$my_writes_csv" '
      ($mine | split(",")) as $m
      | [.in_flight[]? | .db_writes[]? | select(. as $x | $m | index($x))]
      | unique | join(",")
    ' "$hb" 2>/dev/null || true)"
    if [[ -n "$inter" && "$inter" != "" ]]; then
      conflict_kind="db_write_x_write"; conflict_resources="$inter"
    fi
  fi

  # (B) my db_writes ∩ other db_reads  (exclusive vs shared)
  if [[ -z "$conflict_kind" && -n "$my_writes_csv" ]]; then
    inter="$(jq -r --arg mine "$my_writes_csv" '
      ($mine | split(",")) as $m
      | [.in_flight[]? | .db_reads[]? | select(. as $x | $m | index($x))]
      | unique | join(",")
    ' "$hb" 2>/dev/null || true)"
    if [[ -n "$inter" && "$inter" != "" ]]; then
      conflict_kind="db_write_x_read"; conflict_resources="$inter"
    fi
  fi

  # (C) my db_reads ∩ other db_writes  (shared vs exclusive)
  if [[ -z "$conflict_kind" && -n "$my_reads_csv" ]]; then
    inter="$(jq -r --arg mine "$my_reads_csv" '
      ($mine | split(",")) as $m
      | [.in_flight[]? | .db_writes[]? | select(. as $x | $m | index($x))]
      | unique | join(",")
    ' "$hb" 2>/dev/null || true)"
    if [[ -n "$inter" && "$inter" != "" ]]; then
      conflict_kind="db_read_x_write"; conflict_resources="$inter"
    fi
  fi

  if [[ -n "$conflict_kind" ]]; then
    echo "CONFLICT $conflict_kind session=$other_session resources=$conflict_resources" >&2
    exit 2
  fi
done

exit 0
