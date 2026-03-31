#!/bin/bash
# Check if the marketplace clone has a newer version than the cached plugin.
# Returns additionalContext message if update available, silent otherwise.

MARKETPLACE_DIR="$HOME/.claude/plugins/marketplaces/actian-design-system/plugins/actian-design-system"
PLUGIN_JSON="$MARKETPLACE_DIR/.claude-plugin/plugin.json"

# If marketplace clone doesn't exist, skip silently
if [ ! -f "$PLUGIN_JSON" ]; then
  exit 0
fi

# Get marketplace version
MARKET_VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_JSON'))['version'])" 2>/dev/null)

# Get cached version
CACHE_VERSION=$(python3 -c "import json; print(json.load(open('${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json'))['version'])" 2>/dev/null)

# If versions match or couldn't read, skip silently
if [ -z "$MARKET_VERSION" ] || [ -z "$CACHE_VERSION" ] || [ "$MARKET_VERSION" = "$CACHE_VERSION" ]; then
  exit 0
fi

# Update available — notify via additionalContext
cat <<EOF
{"hookSpecificOutput":{"sessionStartContext":"DS Plugin update available (v${CACHE_VERSION} → v${MARKET_VERSION}). To apply: ! rm -rf ~/.claude/plugins/cache/actian-design-system/ && restart Claude."}}
EOF
