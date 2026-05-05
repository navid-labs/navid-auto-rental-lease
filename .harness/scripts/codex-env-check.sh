#!/usr/bin/env bash
# Validate the Hybrid harness environment.
# Fail-fast on missing essentials (rows 1, 3, 4, 5, 6 in the spec).
# Warn-only on rows 2, 8, 9. Auto-create row-7 directories.
# Never modifies global config.
set -euo pipefail

ok()   { printf 'OK   %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1"; FAILED=$((FAILED+1)); }
warn() { printf 'WARN %s\n' "$1" >&2; }

FAILED=0
MIN_CODEX_VERSION="${MIN_CODEX_VERSION:-0.0.0}"

# 1. codex binary on PATH
if command -v codex >/dev/null 2>&1; then ok "codex on PATH ($(command -v codex))"; else fail "codex binary not found on PATH"; fi

# 2. codex --version (warn only)
if command -v codex >/dev/null 2>&1; then
  ver="$(codex --version 2>/dev/null | awk '{print $NF; exit}')"
  if [[ -n "${ver:-}" ]]; then
    ok "codex --version=$ver (min=$MIN_CODEX_VERSION)"
  else
    warn "could not read codex --version"
  fi
fi

# 3. ~/.codex/config.toml with fast/strict profiles
CODEX_TOML="${CODEX_HOME:-$HOME/.codex}/config.toml"
if [[ -f "$CODEX_TOML" ]]; then
  if grep -qE '^\[profiles\.fast\]'   "$CODEX_TOML" \
  && grep -qE '^\[profiles\.strict\]' "$CODEX_TOML"; then
    ok "codex profiles fast/strict present"
  else
    fail "codex profiles fast/strict missing in $CODEX_TOML"
  fi
else
  fail "codex config not found: $CODEX_TOML"
fi

# 4. HARNESS_HOME and core docs
if [[ -n "${HARNESS_HOME:-}" && -d "$HARNESS_HOME" ]]; then
  ok "HARNESS_HOME=$HARNESS_HOME"
else
  fail "HARNESS_HOME unset or not a directory"
fi
if [[ -n "${HARNESS_HOME:-}" && -d "$HARNESS_HOME" ]]; then
  for f in HARNESS.md ONTOLOGY.md WORKFLOW.md HANDOFF.md; do
    if [[ -f "$HARNESS_HOME/$f" ]]; then ok "$HARNESS_HOME/$f"; else fail "missing $HARNESS_HOME/$f"; fi
  done
fi

# 5. Required scripts under HARNESS_HOME
if [[ -n "${HARNESS_HOME:-}" && -d "$HARNESS_HOME" ]]; then
  for s in agent-loop.sh run-parallel.sh decision-review.sh plan-split.sh; do
    p="$HARNESS_HOME/scripts/$s"
    if [[ -x "$p" ]]; then ok "$p executable"; else fail "missing or non-executable: $p"; fi
  done
fi

# 6. Required schemas under HARNESS_HOME
if [[ -n "${HARNESS_HOME:-}" && -d "$HARNESS_HOME" ]]; then
  for s in task result review decision override inventory-stats; do
    p="$HARNESS_HOME/schemas/$s.schema.json"
    if [[ -f "$p" ]]; then ok "$p"; else fail "missing schema: $p"; fi
  done
fi

# 7. Auto-create working directories
mkdir -p .tasks/locks .handoff
ok ".tasks/, .tasks/locks/, .handoff/ ready"
# .handoff/locks is reserved/optional — only create when explicitly asked
if [[ "${HARNESS_RESERVE_HANDOFF_LOCKS:-0}" == "1" ]]; then
  mkdir -p .handoff/locks
  ok ".handoff/locks/ reserved-create requested"
fi

# 8. Dirty git worktree (warn only)
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    warn "git worktree has uncommitted changes"
  else
    ok "git worktree clean"
  fi
fi

# 9. codex login/auth (warn only — best effort)
if command -v codex >/dev/null 2>&1; then
  if codex auth status >/dev/null 2>&1; then
    ok "codex auth status looks healthy"
  else
    warn "codex auth status check did not succeed (login may be required)"
  fi
fi

if (( FAILED > 0 )); then
  printf '\n%d required check(s) failed.\n' "$FAILED" >&2
  exit 1
fi
exit 0
