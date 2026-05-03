#!/usr/bin/env bash
# execute-figma-call.sh — Read a generated .js call file and output a
# JSON object ready for use_figma's code parameter.
#
# Usage: ./scripts/execute-figma-call.sh <call-file.js> <fileKey>
#
# Outputs JSON: { "code": "<file contents>", "fileKey": "<key>", "skillNames": "figma-use" }
# The caller can pipe this to use_figma or read the code field.

set -euo pipefail

CALL_FILE="${1:?Usage: execute-figma-call.sh <call-file.js> <fileKey>}"
FILE_KEY="${2:?Usage: execute-figma-call.sh <call-file.js> <fileKey>}"

if [ ! -f "$CALL_FILE" ]; then
  echo "ERROR: File not found: $CALL_FILE" >&2
  exit 1
fi

SIZE=$(wc -c < "$CALL_FILE" | tr -d ' ')
if [ "$SIZE" -gt 50000 ]; then
  echo "ERROR: File exceeds 50KB use_figma limit: $SIZE bytes" >&2
  exit 1
fi

# Output the code content — the caller passes this to use_figma's code parameter
cat "$CALL_FILE"
