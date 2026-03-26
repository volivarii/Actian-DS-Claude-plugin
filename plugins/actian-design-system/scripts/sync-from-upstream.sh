#!/usr/bin/env bash
# sync-from-upstream.sh — Fetch generated docs and tokens from the Assembler repo
#
# The Assembler repo (volivarii/Actian-DS-Assembler) is the single source of truth
# for all Figma-derived data. This script pulls the latest versions into the Plugin.
#
# Usage:
#   ./scripts/sync-from-upstream.sh                # sync everything
#   ./scripts/sync-from-upstream.sh docs           # sync docs only
#   ./scripts/sync-from-upstream.sh tokens         # sync tokens only
#   ./scripts/sync-from-upstream.sh guidelines     # sync component guidelines only
#   ./scripts/sync-from-upstream.sh foundations     # sync foundations only
#
# Requires: curl, python3 (for JSON parsing)

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

echo ""
echo -e "${YELLOW}⚠  DEPRECATED: This script syncs from the Assembler repo.${NC}"
echo -e "${YELLOW}   Use '/sync-design-system' skill instead for direct Figma extraction.${NC}"
echo -e "${YELLOW}   This script will be removed in a future version.${NC}"
echo ""

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
  fetch_file "registry/ds2026-components.md" "$PLUGIN_DIR/docs/ds2026-components.md" && ok=$((ok + 1)) || fail=$((fail + 1))
  fetch_file "registry/fm-components.md" "$PLUGIN_DIR/docs/fm-components.md" && ok=$((ok + 1)) || fail=$((fail + 1))

  fetch_file "docs/token-reference.md" "$PLUGIN_DIR/docs/token-reference.md" && ok=$((ok + 1)) || fail=$((fail + 1))

  # Curated guideline docs (canonical source is Assembler)
  fetch_file "docs/content-guidelines.md" "$PLUGIN_DIR/docs/content-guidelines.md" && ok=$((ok + 1)) || fail=$((fail + 1))
  fetch_file "docs/accessibility-guidelines.md" "$PLUGIN_DIR/docs/accessibility-guidelines.md" && ok=$((ok + 1)) || fail=$((fail + 1))

  echo ""
  echo -e "Docs: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
}

sync_guidelines() {
  echo ""
  echo "Syncing component guidelines from ${REPO}..."
  echo ""

  local ok=0 fail=0
  local guidelines_dir="$PLUGIN_DIR/docs/component-guidelines"
  mkdir -p "$guidelines_dir"

  # Fetch the index first to discover all component files
  fetch_file "docs/component-guidelines/_index.json" "$guidelines_dir/_index.json" && ok=$((ok + 1)) || fail=$((fail + 1))

  if [ ! -f "$guidelines_dir/_index.json" ]; then
    echo -e "  ${RED}Cannot fetch _index.json — skipping component guidelines${NC}"
    echo ""
    echo -e "Guidelines: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
    return
  fi

  # Parse slugs from _index.json and fetch each component file
  local slugs
  slugs=$(python3 -c "
import json
with open('$guidelines_dir/_index.json') as f:
    data = json.load(f)
for c in data.get('components', []):
    print(c['slug'])
")

  for slug in $slugs; do
    fetch_file "docs/component-guidelines/${slug}.json" "$guidelines_dir/${slug}.json" && ok=$((ok + 1)) || fail=$((fail + 1))
  done

  echo ""
  echo -e "Guidelines: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
}

sync_foundations() {
  echo ""
  echo "Syncing foundations from ${REPO}..."
  echo ""

  local ok=0 fail=0
  local foundations_dir="$PLUGIN_DIR/docs/foundations"
  mkdir -p "$foundations_dir"

  # Known foundation files
  local foundations=(
    "accessibility"
    "borders"
    "breakpoint-grid-structure"
    "color"
    "content-guidelines"
    "elevation"
    "icons"
    "interaction-motion"
    "spacing"
    "typography"
    "usage-example"
  )

  for f in "${foundations[@]}"; do
    fetch_file "docs/foundations/${f}.json" "$foundations_dir/${f}.json" && ok=$((ok + 1)) || fail=$((fail + 1))
  done

  echo ""
  echo -e "Foundations: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
}

sync_tokens() {
  echo ""
  echo "Syncing tokens from ${REPO}..."
  echo ""

  local ok=0 fail=0

  fetch_file "tokens/tokens.css" "$PLUGIN_DIR/tokens/tokens.css" && ok=$((ok + 1)) || fail=$((fail + 1))

  fetch_file "tokens/actian-ds.tokens.json" "$PLUGIN_DIR/tokens/actian-ds.tokens.json" && ok=$((ok + 1)) || fail=$((fail + 1))

  echo ""
  echo -e "Tokens: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
}

sync_meta_kit() {
  echo ""
  echo "Syncing Meta Kit catalogs from ${REPO}..."
  echo ""

  local ok=0 fail=0

  fetch_file "docs/meta-kit-components.md" "$PLUGIN_DIR/docs/meta-kit/components.md" && ok=$((ok + 1)) || fail=$((fail + 1))
  fetch_file "docs/meta-kit-variables.md" "$PLUGIN_DIR/docs/meta-kit/variables.md" && ok=$((ok + 1)) || fail=$((fail + 1))
  fetch_file "docs/meta-kit-builders.md" "$PLUGIN_DIR/docs/meta-kit/builders.md" && ok=$((ok + 1)) || fail=$((fail + 1))

  echo ""
  echo -e "Meta Kit: ${GREEN}${ok} synced${NC}, ${RED}${fail} failed${NC}"
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
    sync_guidelines
    sync_foundations
    sync_tokens
    sync_meta_kit
    ;;
  docs)
    sync_docs
    ;;
  guidelines)
    sync_guidelines
    ;;
  foundations)
    sync_foundations
    ;;
  tokens)
    sync_tokens
    ;;
  meta-kit)
    sync_meta_kit
    ;;
  *)
    echo -e "${RED}Unknown target: ${SYNC_TARGET}${NC}"
    echo "Usage: $0 [all|docs|tokens|guidelines|foundations|meta-kit]"
    exit 1
    ;;
esac

echo ""
echo "Done. Review changes with: git diff docs/ tokens/"
