#!/usr/bin/env bash
# Read .tasks/ and .handoff/ artifacts and emit:
#   .handoff/decision-brief.md   (markdown report)
#   .handoff/usage-summary.json  (per-task + totals)
# Read-only over .handoff inputs. Never calls decision-review.sh.
set -euo pipefail

RUN_MODE="${HARNESS_RUN_MODE:-no-arg}"
mkdir -p .handoff
BRIEF=".handoff/decision-brief.md"
USAGE=".handoff/usage-summary.json"

# --- Helpers ---------------------------------------------------------------

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

first_file() {
  # files: ["src/foo.ts"] -> src/foo.ts
  printf '%s' "$1" | sed -E 's/^\["?([^",]+)".*/\1/' | tr -d ' '
}

diff_stats() {
  local f="$1"
  if [[ -f "$f" ]]; then
    awk '
      /^\+[^+]/ { plus++ } /^-[^-]/ { minus++ }
      END { printf("+%d/-%d", plus+0, minus+0) }
    ' "$f"
  else
    printf -
  fi
}

# --- Walk TASKs ------------------------------------------------------------

ROWS=()
SUMMARY_PASS=() SUMMARY_FAIL=() SUMMARY_BLOCKED=() SUMMARY_SKIPPED=() SUMMARY_NEEDSPLIT=()
TASK_TOTAL=0; DISPATCHED=0; SKIPPED=0; PASSED=0; FAILED=0; BLOCKED=0; NEEDS_SPLIT=0; REVIEW_MH=0

shopt -s nullglob
for tf in .tasks/TASK-*.md; do
  [[ -f "$tf" ]] || continue
  TASK_TOTAL=$((TASK_TOTAL+1))
  id="$(frontmatter_value id "$tf" | tr -d ' "')"
  status="$(frontmatter_value status "$tf" | tr -d ' ')"
  owner="$(frontmatter_value owner "$tf" | tr -d ' ')"
  files_line="$(frontmatter_value files "$tf")"
  file="$(first_file "$files_line")"

  exec_json=".handoff/${id}.exec.json"
  review_json=".handoff/${id}.review.json"
  diff_file=".handoff/${id}.diff"

  exec_status="-"
  if [[ -f "$exec_json" ]]; then
    exec_status="$(jq -r '.status // "-"' "$exec_json" 2>/dev/null || echo -)"
  fi

  review_verdict="-"
  review_sev="-"
  if [[ -f "$review_json" ]]; then
    review_verdict="$(jq -r '.verdict  // "-"' "$review_json" 2>/dev/null || echo -)"
    review_sev="$(    jq -r '.severity // "-"' "$review_json" 2>/dev/null || echo -)"
  fi

  diff_summary="$(diff_stats "$diff_file")"

  # Classify
  classify="other"
  if [[ "$owner" != "codex-fast" && "$status" == "pending" ]]; then
    SKIPPED=$((SKIPPED+1)); SUMMARY_SKIPPED+=("$id (owner: $owner)"); classify="skipped"
  elif [[ "$exec_status" == "BLOCKED" || "$status" == "blocked" ]]; then
    BLOCKED=$((BLOCKED+1)); SUMMARY_BLOCKED+=("$id"); classify="blocked"
  elif [[ "$exec_status" == "NEEDS_SPLIT" ]]; then
    NEEDS_SPLIT=$((NEEDS_SPLIT+1)); SUMMARY_NEEDSPLIT+=("$id"); classify="needs_split"
  elif [[ "$review_verdict" == "pass" ]]; then
    PASSED=$((PASSED+1)); SUMMARY_PASS+=("$id"); classify="passed"
    DISPATCHED=$((DISPATCHED+1))
  elif [[ "$review_verdict" == "fail" ]]; then
    FAILED=$((FAILED+1)); SUMMARY_FAIL+=("$id (severity: $review_sev)"); classify="failed"
    DISPATCHED=$((DISPATCHED+1))
    if [[ "$review_sev" == "medium" || "$review_sev" == "high" ]]; then
      REVIEW_MH=$((REVIEW_MH+1))
    fi
  elif [[ -f "$exec_json" ]]; then
    DISPATCHED=$((DISPATCHED+1))
  fi

  note=""
  case "$classify" in
    passed)      note="clean" ;;
    failed)      note="$(jq -r '.findings[0] // ""' "$review_json" 2>/dev/null)" ;;
    blocked)     note="blocked" ;;
    needs_split) note="needs split" ;;
    skipped)     note="owner: $owner" ;;
  esac

  ROWS+=("| $id | $status | $owner | $exec_status | $review_verdict | $review_sev | $file | $diff_summary | $note |")
done

# --- Emit brief ------------------------------------------------------------

NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

{
  printf '%s\n' "---"
  printf 'generated_at: %s\n' "$NOW"
  printf 'run_mode: %s\n' "$RUN_MODE"
  printf 'task_total: %d\n' "$TASK_TOTAL"
  printf 'dispatched: %d\n' "$DISPATCHED"
  printf 'skipped: %d\n' "$SKIPPED"
  printf 'passed: %d\n' "$PASSED"
  printf 'failed: %d\n' "$FAILED"
  printf 'blocked: %d\n' "$BLOCKED"
  printf 'needs_split: %d\n' "$NEEDS_SPLIT"
  printf 'review_medium_high: %d\n' "$REVIEW_MH"
  printf '%s\n\n' "---"
  printf '# Decision Brief\n\n'
  printf '## Summary\n\n'
  printf -- "- passed: %s\n"      "$( (( ${#SUMMARY_PASS[@]} ))      && IFS=,; echo "${SUMMARY_PASS[*]:-}"      || echo "(none)" )"
  printf -- "- failed: %s\n"      "$( (( ${#SUMMARY_FAIL[@]} ))      && IFS=,; echo "${SUMMARY_FAIL[*]:-}"      || echo "(none)" )"
  printf -- "- blocked: %s\n"     "$( (( ${#SUMMARY_BLOCKED[@]} ))   && IFS=,; echo "${SUMMARY_BLOCKED[*]:-}"   || echo "(none)" )"
  printf -- "- needs_split: %s\n" "$( (( ${#SUMMARY_NEEDSPLIT[@]} )) && IFS=,; echo "${SUMMARY_NEEDSPLIT[*]:-}" || echo "(none)" )"
  printf -- "- skipped: %s\n"     "$( (( ${#SUMMARY_SKIPPED[@]} ))   && IFS=,; echo "${SUMMARY_SKIPPED[*]:-}"   || echo "(none)" )"
  printf '\n## All TASKs\n\n'
  printf '| ID | task_status | owner | exec | review | sev | file | diff | note |\n'
  printf '|---|---|---|---|---|---|---|---|---|\n'
  if (( ${#ROWS[@]} > 0 )); then
    printf '%s\n' "${ROWS[@]}"
  else
    printf '| (none) | | | | | | | | |\n'
  fi
  printf '\n'

  # --- Flagged section ---
  printf '## Flagged\n\n'
  any_flagged=0
  for tf in .tasks/TASK-*.md; do
    [[ -f "$tf" ]] || continue
    id="$(frontmatter_value id "$tf" | tr -d ' "')"
    status="$(frontmatter_value status "$tf" | tr -d ' ')"
    owner="$(frontmatter_value owner "$tf" | tr -d ' ')"
    file="$(first_file "$(frontmatter_value files "$tf")")"
    exec_json=".handoff/${id}.exec.json"
    review_json=".handoff/${id}.review.json"
    diff_file=".handoff/${id}.diff"
    exec_status="-"; review_verdict="-"; review_sev="-"
    [[ -f "$exec_json" ]]   && exec_status="$(jq -r '.status   // "-"' "$exec_json"   2>/dev/null || echo -)"
    [[ -f "$review_json" ]] && review_verdict="$(jq -r '.verdict  // "-"' "$review_json" 2>/dev/null || echo -)"
    [[ -f "$review_json" ]] && review_sev="$(    jq -r '.severity // "-"' "$review_json" 2>/dev/null || echo -)"

    flag=0
    [[ "$review_verdict" == "fail" ]] && flag=1
    [[ "$review_sev" == "medium" || "$review_sev" == "high" ]] && flag=1
    [[ "$exec_status" == "NEEDS_SPLIT" || "$exec_status" == "BLOCKED" || "$exec_status" == "FAILED" ]] && flag=1
    [[ "$status" == "rejected" || "$status" == "blocked" ]] && flag=1
    [[ "$owner" != "codex-fast" && "$status" == "pending" ]] && flag=1
    if [[ ! -f "$exec_json" && "$status" != "pending" ]]; then flag=1; fi

    (( flag == 0 )) && continue
    any_flagged=1

    printf '### %s \xe2\x80\x94 %s (%s)\n\n' "$id" "$review_verdict" "$review_sev"
    printf '**file**: `%s`\n' "$file"
    printf '**task_status**: `%s`\n' "$status"
    printf '**exec_status**: `%s`\n' "$exec_status"
    printf '**review_verdict**: `%s`\n\n' "$review_verdict"

    if [[ -f "$review_json" ]]; then
      printf '**review highlights**\n'
      jq -r '(.findings // [])[] | "- " + .' "$review_json" 2>/dev/null || true
      printf '\n'
    fi

    printf '**next probes**\n'
    printf -- "- \`.tasks/%s.md\`\n" "$id"
    [[ -f "$review_json" ]] && printf -- "- \`%s\`\n" "$review_json"
    [[ -f "$diff_file" ]]   && printf -- "- \`%s\`\n" "$diff_file"
    [[ -f "$exec_json" ]]   && printf -- "- \`%s\`\n" "$exec_json"
    printf '\n'

    printf '**suggested follow-up**\n'
    printf '%s\n\n' '- Single-file follow-up if the fix stays within one file; otherwise split before re-dispatch.'
  done
  if (( any_flagged == 0 )); then
    printf '_(no flagged tasks)_\n\n'
  fi

  # --- Failure Classes section ---
  printf '## Failure Classes\n\n'
  printf '| class | count |\n'
  printf '|---|---:|\n'
  analysis_json="$(mktemp)"
  if bun scripts/harness/analyze-handoff.ts --format=json > "$analysis_json" 2>/dev/null; then
    jq -r '
      .totals
      | to_entries
      | sort_by(.key)
      | .[]
      | "| \(.key) | \(.value) |"
    ' "$analysis_json"
  else
    printf '| unavailable | 0 |\n'
  fi
  rm -f "$analysis_json"
  printf '\n'
} > "$BRIEF"

# --- usage-summary.json ---
write_usage() {
  local now="$1" run_mode="$2" task_total="$3"
  local total_in=0 total_out=0 wall_total=0
  local per_task_json="[]"
  shopt -s nullglob

  for tf in .tasks/TASK-*.md; do
    [[ -f "$tf" ]] || continue
    local id; id="$(frontmatter_value id "$tf" | tr -d ' "')"
    local exec_json=".handoff/${id}.exec.json"
    local review_json=".handoff/${id}.review.json"
    [[ -f "$exec_json" || -f "$review_json" ]] || continue

    local fast_in=0 fast_out=0 fast_cost=null
    local strict_in=0 strict_out=0 strict_cost=null
    local wall=0

    if [[ -f "$exec_json" ]]; then
      fast_in="$( jq -r '.usage.tokens_in  // 0' "$exec_json")"
      fast_out="$(jq -r '.usage.tokens_out // 0' "$exec_json")"
      wall=$(( wall + $(jq -r '.wall_seconds // 0' "$exec_json") ))
    fi
    if [[ -f "$review_json" ]]; then
      strict_in="$( jq -r '.usage.tokens_in  // 0' "$review_json")"
      strict_out="$(jq -r '.usage.tokens_out // 0' "$review_json")"
      wall=$(( wall + $(jq -r '.wall_seconds // 0' "$review_json") ))
    fi

    total_in=$((  total_in  + fast_in + strict_in ))
    total_out=$(( total_out + fast_out + strict_out ))
    wall_total=$((wall_total + wall))

    per_task_json="$(jq --arg id "$id" \
      --argjson fi "$fast_in" --argjson fo "$fast_out" \
      --argjson si "$strict_in" --argjson so "$strict_out" \
      --argjson w "$wall" \
      '. + [{
         id: $id,
         fast:   { tokens_in: $fi, tokens_out: $fo, cost_usd: null },
         strict: { tokens_in: $si, tokens_out: $so, cost_usd: null },
         wall_seconds: $w
      }]' <<<"$per_task_json")"
  done

  jq -n \
    --arg now "$now" \
    --arg run_mode "$run_mode" \
    --argjson tasks "$task_total" \
    --argjson tin  "$total_in" \
    --argjson tout "$total_out" \
    --argjson wall "$wall_total" \
    --argjson per  "$per_task_json" \
    '{
       generated_at: $now,
       run_mode:     $run_mode,
       totals: {
         tasks:        $tasks,
         tokens_in:    $tin,
         tokens_out:   $tout,
         cost_usd:     null,
         wall_seconds: $wall
       },
       per_task: $per
     }'
}
write_usage "$NOW" "$RUN_MODE" "$TASK_TOTAL" > "$USAGE"
