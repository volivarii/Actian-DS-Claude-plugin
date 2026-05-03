#!/bin/bash
# Auto-approve Read/Glob/Grep for files within the plugin's own directory.
# Output shape per https://code.claude.com/docs/en/hooks.md#pretooluse-hook-json-response-format
# No python dependency — pure bash extraction.

plugin_root="${CLAUDE_PLUGIN_ROOT:-}"
[ -z "$plugin_root" ] && exit 0

# Read hook input, extract file_path with sed (handles JSON without python)
input=$(cat)
file_path=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

[ -z "$file_path" ] && exit 0

# Allow reads from the plugin's own directory
if [[ "$file_path" == "$plugin_root"/* ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"Plugin internal file"}}'
fi

exit 0
