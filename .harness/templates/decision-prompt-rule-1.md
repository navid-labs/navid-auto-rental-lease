# Decision Review Rule 1 Prompt

Use this prompt before dispatching TASK cards that carry `sub_boundary: <X>`.

## Input

- Sub-project boundary: `SUB-<X>`
- Plan/spec artifacts for the just-completed sub-project
- Proposed next TASK cards that depend on that boundary
- Relevant `.handoff/*.review.json` artifacts

## Review Questions

1. Does the next TASK set correctly encode the intended sub-project semantics?
2. Are thresholds, schema names, file paths, and status values consistent with the source artifacts?
3. Is any TASK asking Codex Fast to execute a decision that should first be reviewed by Claude, Codex Strict, or a human?
4. Are defers, overrides, or unresolved inventory gaps explicitly represented rather than hidden in prose?

## Output

Write `.handoff/SUB-<X>.decision.json`:

```json
{
  "scope": "SUB-<X>",
  "verdict": "pass",
  "rule": "rule-1",
  "evidence_paths": ["<reviewed artifact paths>"],
  "reviewer": "critic",
  "evaluated_at": "2026-04-28T00:00:00Z",
  "notes": "<short rationale>"
}
```

Use `verdict: fail` when the TASK semantics are not ready for dispatch.
