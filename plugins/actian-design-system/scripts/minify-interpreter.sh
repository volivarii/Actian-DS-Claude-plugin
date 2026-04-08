#!/usr/bin/env bash
# minify-interpreter.sh — Minifies figma-interpreter.js → figma-interpreter.min.js
# Usage: ./scripts/minify-interpreter.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SCRIPT_DIR/figma-interpreter.js"
OUT="$SCRIPT_DIR/figma-interpreter.min.js"

if [ ! -f "$SRC" ]; then
  echo "ERROR: Source not found: $SRC" >&2
  exit 1
fi

# Try terser first (best minification)
if npx terser --version &>/dev/null; then
  echo "Minifying with terser..."
  npx terser "$SRC" --compress --mangle -o "$OUT"
else
  # Fallback: Node.js-based strip comments + collapse whitespace
  echo "terser not available, using Node.js fallback..."
  node -e "
    const fs = require('fs');
    let code = fs.readFileSync('$SRC', 'utf8');
    // Remove single-line comments (but not URLs with //)
    code = code.replace(/(?<![:'\"\\\\])\/\/.*$/gm, '');
    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    // Collapse whitespace: trim lines, remove blank lines, collapse spaces
    code = code.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n')
      .replace(/\n+/g, '\n');
    fs.writeFileSync('$OUT', code);
  "
fi

SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "Done: $OUT ($SIZE bytes)"
