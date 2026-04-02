#!/bin/bash
# Auto-approve Read tool calls for files within the plugin's own directory.
# This prevents permission prompts when skills read their reference docs.
# Exit 0 with no output = no opinion (defer to normal permissions).

# Hook input is JSON on stdin
input=$(cat)
file_path=$(echo "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# If we couldn't extract the path, defer to normal permissions
if [ -z "$file_path" ]; then
  exit 0
fi

# Allow reads from the plugin's own directory
plugin_root="${CLAUDE_PLUGIN_ROOT:-}"
if [ -n "$plugin_root" ] && [[ "$file_path" == "$plugin_root"/* ]]; then
  echo '{"decision":"allow","reason":"Plugin internal file"}'
  exit 0
fi

# Defer to normal permission rules for everything else
exit 0
