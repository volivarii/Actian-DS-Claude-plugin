#!/usr/bin/env bash
# sync-from-upstream.sh — Fetch generated docs and tokens from the Assembler repo
#
# The Assembler repo (volivarii/Actian-DS-Assembler) is the single source of truth
# for all Figma-derived data. This script pulls the latest versions into the Plugin.
#
# Usage:
#   ./scripts/sync-from-upstream.sh           # sync everything
#   ./scripts/sync-from-upstream.sh docs      # sync docs only
#   ./scripts/sync-from-upstream.sh tokens    # sync tokens only
#
# Requires: curl

set -euo pipefail

REPO="volivarii/Actian-DS-Assembler"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

# Resolve plugin root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# What to sync
SYNC_TARGET="${1:-all}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

fetch_file() {
  local remote_path="$1"
  local local_path="$2"
  local url="${BASE_URL}/${remote_path}"

  printf "  %-50s " "${remote_path}"

  # Create parent directory if needed
  mkdir -p "$(dirname "$local_path")"

  local http_code
  http_code=$(curl -s -w "%{http_code}" -o "$local_path.tmp" "$url")

  if [ "$http_code" = "200" ]; then
    mv "$local_path.tmp" "$local_path"
    echo -e "${GREEN}OK${NC}"
    return 0
  else
    rm -f "$local_path.tmp"
    echo -e "${RED}FAILED (HTTP ${http_code})${NC}"
    return 1
  fi
}

sync_docs() {
  echo ""
  echo "Syncing docs from ${REPO}..."
  echo ""

  local ok=0 fail=0

  # Generated component reference docs (currently under registry/ in the Assembler repo)
  fetch_file "registry/ds2026-component-reference.md" "$PLUGIN_DIR/docs/ds2026-component-reference.md" && ok=$((ok + 1)) || fail=$((fail + 1))
  fetch_file "registry/fm-component-catalog.md" "$PLUGIN_DIR/docs/fm-component-catalog.md" && ok=$((ok + 1)) || fail=$((fail + 1))

  # design-system.md is not yet in the Assembler repo — skip for now
  # TODO: move design-system.md to Assembler, then uncomment:
  # fetch_file "docs/design-system.md" "$PLUGIN_DIR/docs/design-system.md" && ok=$((ok + 1)) || fail=$((fail + 1))

  echo ""
  echo -e "Docs: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
}

sync_tokens() {
  echo ""
  echo "Syncing tokens from ${REPO}..."
  echo ""

  local ok=0 fail=0

  fetch_file "tokens/tokens.css" "$PLUGIN_DIR/tokens/tokens.css" && ok=$((ok + 1)) || fail=$((fail + 1))

  # actian-ds.tokens.json is not yet in the Assembler repo — skip for now
  # TODO: move actian-ds.tokens.json to Assembler, then uncomment:
  # fetch_file "tokens/actian-ds.tokens.json" "$PLUGIN_DIR/tokens/actian-ds.tokens.json" && ok=$((ok + 1)) || fail=$((fail + 1))

  echo ""
  echo -e "Tokens: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
}

# Main
echo "========================================"
echo "  Sync from upstream: ${REPO}"
echo "  Target: ${SYNC_TARGET}"
echo "  Plugin: ${PLUGIN_DIR}"
echo "========================================"

case "$SYNC_TARGET" in
  all)
    sync_docs
    sync_tokens
    ;;
  docs)
    sync_docs
    ;;
  tokens)
    sync_tokens
    ;;
  *)
    echo -e "${RED}Unknown target: ${SYNC_TARGET}${NC}"
    echo "Usage: $0 [all|docs|tokens]"
    exit 1
    ;;
esac

echo ""
echo "Done. Review changes with: git diff docs/ tokens/"
