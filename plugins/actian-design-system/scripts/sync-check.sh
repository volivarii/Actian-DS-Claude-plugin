#!/bin/bash
# Run sync tests silently on session start.
# Warns if any drift is detected but does NOT block.

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$PLUGIN_ROOT" || exit 0

# Run the quick sync tests (contract, snapshot, path-validation, css-staleness)
ISSUES=0
for test in tests/contract.test.js tests/snapshot.test.js tests/path-validation.test.js tests/css-staleness.test.js; do
  if [ -f "$test" ]; then
    node "$test" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      ISSUES=$((ISSUES + 1))
    fi
  fi
done

if [ "$ISSUES" -gt 0 ]; then
  echo "{\"hookSpecificOutput\":{\"sessionStartContext\":\"⚠ Plugin sync check: $ISSUES test suite(s) failing. Run tests from ${PLUGIN_ROOT}/tests/ for details.\"}}" >&1
fi

exit 0
