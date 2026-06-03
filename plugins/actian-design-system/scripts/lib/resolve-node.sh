#!/bin/bash
# Resolve the node binary path — handles Desktop sandbox where node isn't in PATH.
# Usage: source this file, then use $NODE_BIN instead of bare 'node'.
#   source "$(dirname "$0")/resolve-node.sh"
#   "$NODE_BIN" my-script.js

NODE_BIN="$(command -v node 2>/dev/null || echo "")"
if [ -z "$NODE_BIN" ]; then
  for _candidate in \
    /usr/local/bin/node /opt/homebrew/bin/node \
    "$HOME"/.volta/bin/node "$HOME"/.asdf/shims/node \
    "$HOME"/.nvm/versions/node/*/bin/node \
    "$HOME"/.fnm/aliases/default/bin/node \
    "$HOME"/.local/share/fnm/aliases/default/bin/node; do
    if [ -x "$_candidate" ]; then NODE_BIN="$_candidate"; break; fi
  done
fi
if [ -z "$NODE_BIN" ]; then
  echo "Error: node not found. Install Node.js (https://nodejs.org) or export NODE_BIN=/path/to/node." >&2
  # This file is meant to be sourced. When sourced, `return` hands control back to
  # the caller (so e.g. ensure-server.sh can run its own fallback); `exit` would kill
  # the caller's shell. Only `exit` when executed directly.
  if [ "${BASH_SOURCE[0]}" = "${0}" ]; then exit 1; else return 1; fi
fi
export NODE_BIN
