#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
source "$ROOT/scripts/lib/resolve-python.sh"
if python3 -c "import pptx" >/dev/null 2>&1; then
  [ -n "$PYTHON_BIN" ] || { echo "FAIL: pptx importable but PYTHON_BIN empty"; exit 1; }
  echo "PASS: found $PYTHON_BIN"
else
  [ -z "$PYTHON_BIN" ] || { echo "FAIL: pptx absent but PYTHON_BIN set"; exit 1; }
  echo "PASS: correctly empty (pptx absent)"
fi
