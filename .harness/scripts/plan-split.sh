#!/usr/bin/env bash
# Validate that every TASK card under .tasks/ has files.length == 1.
# Used by Claude to self-check before dispatch.
set -euo pipefail

bad=0
for f in .tasks/TASK-*.md; do
  [[ -f "$f" ]] || continue
  files_line="$(awk '/^files:/{print; exit}' "$f")"
  count="$(printf '%s' "$files_line" | grep -o '"' | wc -l)"
  if (( count != 2 )); then
    echo "BAD: $f files line: $files_line" >&2
    bad=$((bad+1))
  fi
done

if (( bad > 0 )); then
  echo "$bad task(s) violate single-file invariant" >&2
  exit 1
fi
echo "All TASK cards comply with single-file scope."
