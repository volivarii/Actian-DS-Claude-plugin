#!/bin/bash
# PreToolUse hook for Bash: block ensure-server.sh called with '.' as directory.
# On Desktop, '.' resolves to the plugin cache, not the project.

input=$(cat)
command=$(echo "$input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/p' | head -1)

[ -z "$command" ] && exit 0

# Check for ensure-server.sh with '.' or "." as the directory argument
if echo "$command" | grep -qE 'ensure-server\.sh\s+["\x27]?\.["\x27]?\s'; then
  echo '{"decision":"block","reason":"Pass the project working directory to ensure-server.sh, not \".\" — on Desktop \".\" resolves to the plugin cache."}'
  exit 2
fi

exit 0
