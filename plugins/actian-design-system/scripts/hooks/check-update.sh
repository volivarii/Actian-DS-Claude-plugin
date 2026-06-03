#!/bin/bash
# Check if the marketplace clone has a newer version than the cached plugin.
# Returns additionalContext message if update available, silent otherwise.

MARKETPLACE_DIR="$HOME/.claude/plugins/marketplaces/actian-design-system/plugins/actian-design-system"
PLUGIN_JSON="$MARKETPLACE_DIR/.claude-plugin/plugin.json"

# If marketplace clone doesn't exist, skip silently
if [ ! -f "$PLUGIN_JSON" ]; then
  exit 0
fi

# Resolve node — on Desktop it's rarely in PATH, so bare `node` would silently
# produce empty output and the check would no-op for the entire Desktop audience.
source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" 2>/dev/null || true
if [ -z "$NODE_BIN" ]; then
  exit 0
fi

# Get marketplace version
MARKET_VERSION=$("$NODE_BIN" -e "console.log(require('$PLUGIN_JSON').version)" 2>/dev/null)

# Get cached version
CACHE_VERSION=$("$NODE_BIN" -e "console.log(require('${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json').version)" 2>/dev/null)

# If versions match or couldn't read, skip silently
if [ -z "$MARKET_VERSION" ] || [ -z "$CACHE_VERSION" ] || [ "$MARKET_VERSION" = "$CACHE_VERSION" ]; then
  exit 0
fi

# Update available — notify via additionalContext
cat <<EOF
{"hookSpecificOutput":{"sessionStartContext":"DS Plugin update available (v${CACHE_VERSION} → v${MARKET_VERSION}). If auto-update is enabled it applies at session start (run /reload-plugins). Otherwise: /plugin marketplace update — or last resort ! rm -rf ~/.claude/plugins/cache/actian-design-system/actian-design-system/ && restart Claude."}}
EOF
