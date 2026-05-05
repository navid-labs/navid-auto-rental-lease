#!/bin/bash
# audit-failure-taxonomy.sh
# Read-only audit of .handoff/ artifacts.
# Output: 5-layer failure taxonomy (scope_violation / infra_failure /
#         strict_false_positive / strict_pass_followup / rescope) + verdict tally.
#
# Usage: .harness/scripts/audit-failure-taxonomy.sh [handoff_dir]
# Default handoff_dir: .handoff
#
# Source: 2026-05-05 audit recommendation (Hybrid v1.1 Tier 1 measurement).

set -uo pipefail

HANDOFF_DIR="${1:-.handoff}"
TASKS_DIR="${TASKS_DIR:-.tasks}"

if [[ ! -d "$HANDOFF_DIR" ]]; then
  echo "FATAL: $HANDOFF_DIR not found" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "FATAL: jq not installed" >&2
  exit 2
fi

shopt -s nullglob

review_files=("$HANDOFF_DIR"/*.review.json)
exec_files=("$HANDOFF_DIR"/*.exec.json)

total_reviews=${#review_files[@]}
total_execs=${#exec_files[@]}

echo "=== Hybrid Failure Taxonomy ==="
echo "Source: $HANDOFF_DIR"
echo "Date:   $(date '+%Y-%m-%d %H:%M:%S')"
echo "Reviews: $total_reviews | Execs: $total_execs"
echo ""

if (( total_reviews == 0 && total_execs == 0 )); then
  echo "No artifacts found. Exiting." >&2
  exit 1
fi

echo "## 1. Strict review verdicts"
if (( total_reviews > 0 )); then
  jq -r '.verdict // "missing"' "${review_files[@]}" 2>/dev/null \
    | sort | uniq -c | sort -rn \
    | awk '{printf "   %5d  %s\n", $1, $2}'
fi
echo ""

echo "## 2. Severity (failed reviews only)"
if (( total_reviews > 0 )); then
  jq -r 'select(.verdict=="fail") | .severity // "unknown"' "${review_files[@]}" 2>/dev/null \
    | sort | uniq -c | sort -rn \
    | awk '{printf "   %5d  %s\n", $1, $2}'
fi
echo ""

echo "## 3. Codex Fast exec status"
if (( total_execs > 0 )); then
  jq -r '.status // "missing"' "${exec_files[@]}" 2>/dev/null \
    | sort | uniq -c | sort -rn \
    | awk '{printf "   %5d  %s\n", $1, $2}'
fi
echo ""

echo "## 4. Failure Taxonomy (heuristic match on findings/error text)"

count_pat() {
  local pat="$1"; shift
  local files=("$@")
  if (( ${#files[@]} == 0 )); then echo 0; return; fi
  jq -r --arg pat "$pat" '
    (.findings // []) as $f
    | (.required_changes // []) as $rc
    | (.error // "") as $err
    | [$f[], $rc[], $err] | tostring
    | select(test($pat; "i"))
  ' "${files[@]}" 2>/dev/null | wc -l | tr -d ' '
}

scope_violation=$(count_pat 'scope|out of scope|wrong file|forbidden path|file not in scope' "${review_files[@]}")
infra_failure_exec=$(count_pat 'sandbox|timeout|auth fail|env|quota|missing tool|connection' "${exec_files[@]}")
infra_failure_rev=$(count_pat 'sandbox|timeout|auth fail|env|quota' "${review_files[@]}")
test_missing=$(count_pat 'no test|missing test|test coverage' "${review_files[@]}")
type_error=$(count_pat 'type error|tsc|typescript error' "${review_files[@]}")

needs_split=0
blocked=0
failed=0
if (( total_execs > 0 )); then
  needs_split=$(jq -r 'select(.status=="NEEDS_SPLIT") | .task_id // ""' "${exec_files[@]}" 2>/dev/null | grep -c . || true)
  blocked=$(jq -r 'select(.status=="BLOCKED") | .task_id // ""' "${exec_files[@]}" 2>/dev/null | grep -c . || true)
  failed=$(jq -r 'select(.status=="FAILED") | .task_id // ""' "${exec_files[@]}" 2>/dev/null | grep -c . || true)
fi

printf "   %-30s %5s\n" "scope_violation"        "$scope_violation"
printf "   %-30s %5s\n" "infra_failure (exec)"   "$infra_failure_exec"
printf "   %-30s %5s\n" "infra_failure (review)" "$infra_failure_rev"
printf "   %-30s %5s\n" "missing_tests"          "$test_missing"
printf "   %-30s %5s\n" "type_error"             "$type_error"
printf "   %-30s %5s\n" "needs_split"            "$needs_split"
printf "   %-30s %5s\n" "blocked"                "$blocked"
printf "   %-30s %5s\n" "failed"                 "$failed"
echo ""

echo "## 5. Top 10 fail finding strings (raw)"
if (( total_reviews > 0 )); then
  jq -r 'select(.verdict=="fail") | (.findings // [])[] | tostring' "${review_files[@]}" 2>/dev/null \
    | sort | uniq -c | sort -rn | head -10 \
    | awk '{count=$1; $1=""; printf "   %5d %s\n", count, $0}'
fi
echo ""

if [[ -d "$TASKS_DIR" ]]; then
  echo "## 6. Per-route summary (path prefix from TASK files)"
  for review in "${review_files[@]}"; do
    task_id=$(basename "$review" .review.json)
    task_file="$TASKS_DIR/$task_id.md"
    [[ -f "$task_file" ]] || continue
    verdict=$(jq -r '.verdict // "missing"' "$review" 2>/dev/null)
    file_path=$(grep -E '^[[:space:]]*-?[[:space:]]*files?:' "$task_file" 2>/dev/null | head -1 | sed -E 's/.*:[[:space:]]*//;s/^- //;s/^"//;s/"$//')
    if [[ -n "$file_path" ]]; then
      prefix=$(echo "$file_path" | cut -d/ -f1-2)
      echo "$verdict|$prefix"
    fi
  done | sort | uniq -c | sort -rn | head -20 \
    | awk -F'|' '{printf "   %s | %s\n", $1, $2}'
  echo ""
fi

echo "Done."
