#!/bin/bash
# Build minified interpreter from source.
# Run from the plugin root: bash scripts/build-interpreters.sh
# Requires: npx terser

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SCRIPT_DIR/figma-interpreter.js"

echo "Source: $(wc -c < "$SRC" | tr -d ' ') bytes"

npx terser "$SRC" --compress --mangle -o "$SCRIPT_DIR/figma-interpreter.min.js"

MIN_SIZE=$(wc -c < "$SCRIPT_DIR/figma-interpreter.min.js" | tr -d ' ')
echo "Minified: ${MIN_SIZE} bytes ($(( (MIN_SIZE * 100) / $(wc -c < "$SRC" | tr -d ' ') ))% of source)"
echo "Spec budget: $((50000 - MIN_SIZE)) bytes per use_figma call"
