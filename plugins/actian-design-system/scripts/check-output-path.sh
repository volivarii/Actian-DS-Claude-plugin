#!/bin/bash
# PreToolUse hook for Write: block writes to the plugin cache directory.
# Generated files must go to the user's project directory, not the plugin cache.

plugin_root="${CLAUDE_PLUGIN_ROOT:-}"
[ -z "$plugin_root" ] && exit 0

input=$(cat)
file_path=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

[ -z "$file_path" ] && exit 0

# Allow writes to the plugin's own directory for internal operations (hooks, config)
# Block writes that look like generated output going to plugin cache
if [[ "$file_path" == "$plugin_root"/components/* ]] || \
   [[ "$file_path" == "$plugin_root"/presentations/* ]] || \
   [[ "$file_path" == "$plugin_root"/flows/* ]]; then
  echo '{"decision":"block","reason":"Write generated files to the project directory, not the plugin cache. Use {project_working_directory} for output paths."}'
  exit 2
fi

exit 0
