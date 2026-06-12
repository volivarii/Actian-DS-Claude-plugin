#!/bin/bash
# Locate a python3 that can `import pptx` (python-pptx). Sets $PYTHON_BIN.
# Mirrors resolve-node.sh. Returns nonzero (and leaves $PYTHON_BIN empty) if none found.
# Usage: source this file, then use $PYTHON_BIN instead of bare 'python3'.
#   source "$(dirname "$0")/resolve-python.sh"
#   "$PYTHON_BIN" my-script.py

PYTHON_BIN=""
for _cand in python3 python /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
  if command -v "$_cand" >/dev/null 2>&1; then
    if "$_cand" -c "import pptx" >/dev/null 2>&1; then
      PYTHON_BIN="$(command -v "$_cand")"
      break
    fi
  fi
done
export PYTHON_BIN

if [ -z "$PYTHON_BIN" ]; then
  echo "Error: no python3 with python-pptx found. Install it (pip install python-pptx) or export PYTHON_BIN=/path/to/python3." >&2
  if [ "${BASH_SOURCE[0]}" = "${0}" ]; then exit 1; else return 1; fi
fi
