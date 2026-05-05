#!/usr/bin/env bash
# Evaluate Hybrid Layer 1.5 dispatch gates.
# Usage: decision-review.sh <TASK_FILE_OR_BATCH_ID>
set -euo pipefail

INPUT="${1:?usage: decision-review.sh <TASK_FILE_OR_BATCH_ID>}"
HANDOFF_DIR="${HANDOFF_DIR:-.handoff}"
DEFAULT_THRESHOLD="${DECISION_DEFER_THRESHOLD:-0.60}"

mkdir -p "$HANDOFF_DIR"

command -v jq >/dev/null 2>&1 || {
  echo "decision-review: jq is required" >&2
  exit 2
}

log_event() {
  local level="$1" scope="$2" rule="$3" message="$4"
  jq -cn \
    --arg component "decision-review" \
    --arg level "$level" \
    --arg scope "$scope" \
    --arg rule "$rule" \
    --arg message "$message" \
    '{component:$component,level:$level,scope:$scope,rule:$rule,message:$message}' >&2
}

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

clean_scalar() {
  sed -E 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"//; s/"$//; s/^'\''//; s/'\''$//'
}

write_decision() {
  local scope="$1" verdict="$2" rule="$3" reviewer="$4" notes="$5" evidence_json="$6"
  local path="$HANDOFF_DIR/${scope}.decision.json"

  jq -n \
    --arg scope "$scope" \
    --arg verdict "$verdict" \
    --arg rule "$rule" \
    --arg reviewer "$reviewer" \
    --arg evaluated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg notes "$notes" \
    --argjson evidence_paths "$evidence_json" \
    '{
      scope: $scope,
      verdict: $verdict,
      rule: $rule,
      evidence_paths: $evidence_paths,
      reviewer: $reviewer,
      evaluated_at: $evaluated_at,
      notes: $notes
    }' > "$path"
}

validate_override() {
  local scope="$1" override_path="$2" require_followup="$3"
  local rule="${4:-rule-2}"
  local expected_evidence="${5:-}"
  local expected_severity="${6:-}"

  [[ -f "$override_path" ]] || {
    log_event error "$scope" "$rule" "missing override artifact: $override_path"
    return 1
  }

  jq -e . "$override_path" >/dev/null || {
    log_event error "$scope" "$rule" "override artifact is not valid JSON: $override_path"
    return 1
  }

  jq -e --arg scope "$scope" '
    (.task_id == $scope) and
    (.override_by | type == "string" and length > 0) and
    (.override_at | type == "string" and length > 0) and
    (.strict_verdict == "fail") and
    (.strict_severity | IN("low", "medium", "high")) and
    (.override_reason | type == "string" and length >= 10) and
    (.followup_task | type == "string") and
    (.evidence | type == "array" and length > 0 and all(.[]; type == "string"))
  ' "$override_path" >/dev/null || {
    log_event error "$scope" "$rule" "override artifact failed schema check: $override_path"
    return 1
  }

  if [[ -n "$expected_evidence" ]]; then
    jq -e --arg evidence "$expected_evidence" '.evidence | index($evidence) != null' "$override_path" >/dev/null || {
      log_event error "$scope" "$rule" "override evidence must include: $expected_evidence"
      return 1
    }
  fi

  if [[ -n "$expected_severity" ]]; then
    jq -e --arg severity "$expected_severity" '.strict_severity == $severity' "$override_path" >/dev/null || {
      log_event error "$scope" "$rule" "override strict_severity does not match review severity"
      return 1
    }
  fi

  local missing_evidence
  missing_evidence="$(jq -r '.evidence[]' "$override_path" | while IFS= read -r evidence_path; do
    [[ -f "$evidence_path" ]] || printf '%s\n' "$evidence_path"
  done | head -n 1)"
  if [[ -n "$missing_evidence" ]]; then
    log_event error "$scope" "$rule" "override evidence path does not exist: $missing_evidence"
    return 1
  fi

  local reason
  reason="$(jq -r '.override_reason // ""' "$override_path")"
  if [[ ! "$reason" =~ [^[:space:]]+[.!?。] ]]; then
    log_event error "$scope" "$rule" "override_reason must contain at least one sentence"
    return 1
  fi

  if [[ "$require_followup" == "yes" ]]; then
    local followup
    followup="$(jq -r '.followup_task // ""' "$override_path")"
    if [[ -z "$followup" || ! -f "$followup" ]]; then
      log_event error "$scope" "$rule" "followup_task must point to an existing TASK file"
      return 1
    fi
  fi
}

validate_decision_artifact() {
  local scope="$1" path="$2" expected_scope="$3" expected_rule="$4"

  jq -e --arg expected_scope "$expected_scope" --arg expected_rule "$expected_rule" '
    (.scope == $expected_scope) and
    (.verdict | IN("pass", "fail", "rescope_required")) and
    (.rule == $expected_rule) and
    (.evidence_paths | type == "array") and
    (.reviewer | IN("claude", "code-reviewer", "critic")) and
    (.evaluated_at | type == "string")
  ' "$path" >/dev/null || {
    log_event error "$scope" parse "decision artifact failed schema check: $path"
    return 1
  }
}

validate_inventory_stats() {
  local batch_id="$1" stats_path="$2"

  jq -e --arg batch_id "$batch_id" '
    (.batch_id == $batch_id) and
    (.total | type == "number" and . >= 0 and floor == .) and
    (.accept | type == "number" and . >= 0 and floor == .) and
    (.defer | type == "number" and . >= 0 and floor == .) and
    (.reject | type == "number" and . >= 0 and floor == .) and
    (.defer_rate | type == "number" and . >= 0 and . <= 1) and
    (.threshold | type == "number" and . >= 0 and . <= 1) and
    (.emitted_by | type == "string" and length > 0) and
    (.emitted_at | type == "string" and length > 0) and
    ((.accept + .defer + .reject) == .total)
  ' "$stats_path" >/dev/null || {
    log_event error "$batch_id" rule-3 "inventory stats artifact failed schema check: $stats_path"
    return 1
  }
}

evaluate_task() {
  local task_file="$1"
  local task_id sub_boundary review_path override_path
  local triggered_rules=()
  local evidence_paths=()

  task_id="$(frontmatter_value id "$task_file" | clean_scalar | tr -d ' ')"
  [[ -n "$task_id" ]] || {
    log_event error "$task_file" parse "could not parse id from TASK frontmatter"
    exit 2
  }

  sub_boundary="$(frontmatter_value sub_boundary "$task_file" | clean_scalar | tr -d ' ')"
  if [[ -n "$sub_boundary" ]]; then
    local sub_scope="SUB-${sub_boundary}"
    local sub_decision="$HANDOFF_DIR/${sub_scope}.decision.json"
    triggered_rules+=("rule-1")
    evidence_paths+=("$sub_decision")

    if [[ ! -f "$sub_decision" ]]; then
      write_decision "$task_id" fail rule-1 critic "Missing sub-boundary critic decision: $sub_decision" "$(printf '%s\n' "${evidence_paths[@]}" | jq -R . | jq -s .)"
      log_event warn "$task_id" rule-1 "missing sub-boundary critic decision: $sub_decision"
      exit 75
    fi

    if ! validate_decision_artifact "$task_id" "$sub_decision" "$sub_scope" rule-1; then
      exit 2
    fi

    local sub_verdict
    sub_verdict="$(jq -r '.verdict // "missing"' "$sub_decision" 2>/dev/null || echo PARSE_ERROR)"
    if [[ "$sub_verdict" != "pass" ]]; then
      write_decision "$task_id" fail rule-1 critic "Sub-boundary critic decision is not pass: $sub_decision" "$(printf '%s\n' "${evidence_paths[@]}" | jq -R . | jq -s .)"
      log_event warn "$task_id" rule-1 "sub-boundary critic decision is not pass: $sub_decision"
      exit 75
    fi
  fi

  review_path="$HANDOFF_DIR/${task_id}.review.json"
  override_path="$HANDOFF_DIR/${task_id}.override.json"
  if [[ -f "$review_path" ]]; then
    local review_verdict
    review_verdict="$(jq -r '.verdict // "missing"' "$review_path" 2>/dev/null || echo PARSE_ERROR)"
    if [[ "$review_verdict" == "fail" ]]; then
      local review_severity
      review_severity="$(jq -r '.severity // ""' "$review_path")"
      triggered_rules+=("rule-2")
      evidence_paths+=("$review_path" "$override_path")
      if ! validate_override "$task_id" "$override_path" yes rule-2 "$review_path" "$review_severity"; then
        write_decision "$task_id" fail rule-2 claude "Strict fail override is missing or incomplete." "$(printf '%s\n' "${evidence_paths[@]}" | jq -R . | jq -s .)"
        exit 76
      fi
    elif [[ "$review_verdict" == "PARSE_ERROR" ]]; then
      log_event error "$task_id" rule-2 "could not parse review artifact: $review_path"
      exit 2
    fi
  fi

  if ((${#triggered_rules[@]} > 0)); then
    local primary_rule notes
    primary_rule="${triggered_rules[0]}"
    notes="Decision gates passed: ${triggered_rules[*]}"
    write_decision "$task_id" pass "$primary_rule" claude "$notes" "$(printf '%s\n' "${evidence_paths[@]}" | jq -R . | jq -s .)"
    log_event info "$task_id" "$primary_rule" "$notes"
  fi
}

evaluate_batch() {
  local batch_id="$1"
  local stats_path="$HANDOFF_DIR/${batch_id}.inventory-stats.json"
  local override_path="$HANDOFF_DIR/${batch_id}.override.json"

  [[ -f "$stats_path" ]] || {
    log_event info "$batch_id" rule-3 "no inventory stats artifact; Rule 3 skipped"
    exit 0
  }

  jq -e . "$stats_path" >/dev/null || {
    log_event error "$batch_id" rule-3 "inventory stats artifact is not valid JSON: $stats_path"
    exit 2
  }

  if ! validate_inventory_stats "$batch_id" "$stats_path"; then
    exit 2
  fi

  local threshold
  threshold="$DEFAULT_THRESHOLD"

  if ! jq -e --argjson threshold "$threshold" '(.defer_rate | type == "number") and ($threshold | type == "number")' "$stats_path" >/dev/null 2>&1; then
    log_event error "$batch_id" rule-3 "defer_rate and threshold must be numeric"
    exit 2
  fi

  if jq -e --argjson threshold "$threshold" '.defer_rate >= $threshold' "$stats_path" >/dev/null; then
    if validate_override "$batch_id" "$override_path" no rule-3 "$stats_path"; then
      write_decision "$batch_id" pass rule-3 claude "Defer-rate threshold exceeded, but batch override is present." "$(printf '%s\n' "$stats_path" "$override_path" | jq -R . | jq -s .)"
      log_event info "$batch_id" rule-3 "defer-rate override accepted"
      exit 0
    fi

    write_decision "$batch_id" rescope_required rule-3 critic "Inventory defer_rate exceeded threshold; rescope required." "$(printf '%s\n' "$stats_path" | jq -R . | jq -s .)"
    log_event warn "$batch_id" rule-3 "inventory defer_rate exceeded threshold"
    exit 77
  fi

  write_decision "$batch_id" pass rule-3 critic "Inventory defer_rate is below threshold." "$(printf '%s\n' "$stats_path" | jq -R . | jq -s .)"
  log_event info "$batch_id" rule-3 "inventory defer_rate below threshold"
}

if [[ -f "$INPUT" ]]; then
  evaluate_task "$INPUT"
else
  evaluate_batch "$INPUT"
fi
