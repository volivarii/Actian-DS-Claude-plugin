#!/bin/bash
# PreToolUse hook for Bash: block commands using bare 'node' without $NODE_BIN.
# Exit 2 = block the tool call with a message.

input=$(cat)
command=$(echo "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/p' | head -1)

[ -z "$command" ] && exit 0

# Allow: $NODE_BIN, resolve-node.sh, node_modules, node-related but not bare node execution
# Block: bare 'node ' at start or after && / ; / | that isn't $NODE_BIN or inside a string like "node_modules"
if echo "$command" | grep -qE '(^|[;&|]\s*)node\s' && \
   ! echo "$command" | grep -qE '\$NODE_BIN|resolve-node|node_modules|nvm|fnm'; then
  echo '{"decision":"block","reason":"Use $NODE_BIN after sourcing resolve-node.sh — bare node may not exist on Desktop."}'
  exit 2
fi

# Block: $NODE_BIN used in a Bash call that does not also source resolve-node.sh in the same call.
# Each Bash invocation is a fresh shell — $NODE_BIN is empty unless resolved in this command.
# Allow override if NODE_BIN= is explicitly assigned inline (rare, but valid).
if echo "$command" | grep -qE '\$NODE_BIN' && \
   ! echo "$command" | grep -qE 'resolve-node\.sh|NODE_BIN='; then
  echo '{"decision":"block","reason":"Bare $NODE_BIN is empty without sourcing resolve-node.sh first. Use: source \"$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh\" && \"$NODE_BIN\" ..."}'
  exit 2
fi

exit 0
