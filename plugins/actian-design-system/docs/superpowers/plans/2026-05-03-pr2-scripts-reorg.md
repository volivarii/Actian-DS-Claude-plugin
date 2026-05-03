# PR-2 Implementation Plan — `scripts/` reorg into 8 purpose buckets

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `plugins/actian-design-system/scripts/` (32 flat files + 3 small subdirs) into 8 purpose buckets — `hooks/`, `sync/`, `validation/`, `renderers/`, `transformers/`, `foundations/`, `changelog/`, `lib/` — and update every consumer of those paths atomically: `require()` calls inside scripts, `require()` calls in tests/, hardcoded paths in `hooks/hooks.json`, and string paths in `CLAUDE.md`, `agents/`, and skills `SKILL.md` files. Also rides along: fix bare-shorthand `library-gap-detection.md` reference in `references/figma/figma-output.md` and sweep for similar.

**Architecture:** Mechanical structural refactor. Each task moves one or two buckets, then updates `require()` paths inside moved files (depth +1), updates external consumers (skills, agents, CLAUDE.md, hooks.json, tests/, schemas/), and runs the test suite as the gate. No code logic changes anywhere. Order is chosen so that the most-imported file (`shared-constants.js` → `lib/`) moves early, so subsequent buckets only update its import path once.

**Tech Stack:** Bash, sed (BSD/macOS — `-i ''`), git mv, Node.js for tests.

---

## Spec reference

Source spec: `plugins/actian-design-system/docs/superpowers/specs/2026-05-03-scripts-references-tests-reorg-design.md` (sections "Final structure → scripts/" and PR sequence row 2).

This plan covers PR-2 only. PR-3 (`tests/` reorg) follows as a separate plan after PR-2 merges.

## Bucket assignments (authoritative)

| Bucket | Files moving in |
|---|---|
| `hooks/` | `allow-internal-reads.sh`, `check-bare-node.sh`, `check-output-path.sh`, `check-server-dir.sh`, `check-update.sh`, `execute-figma-call.sh` |
| `sync/` | `sync-from-figma.js`, `sync-fm-to-ds-map.js`, `figma-rest.js`, `sync-check.sh`, `fingerprint-schema.js` |
| `validation/` | `validate-flow-data.js`, `validate-schema.js`, `component-property-rules.js` |
| `renderers/` | `assemble-preview.js`, `preview-server.js`, `ensure-server.sh`, `render-component-reference.js`, `html-renderers/` (existing subdir) |
| `transformers/` | `transform-to-hifi.js`, `fm-tree-to-flow-data.js`, `brief-sourcing.js`, `merge-partials.js`, `transformers/` (existing subdir), `templates.json` |
| `foundations/` | `derive-foundations.js`, `foundations.parser.json`, `foundations-parser/` (existing subdir) |
| `changelog/` | `changelog.js`, `changelog-classifier.js` |
| `lib/` | `shared-constants.js`, `intent-resolver.js`, `resolve-unit.js`, `derive-scope.js`, `scope-aware-runner.js`, `screen-id.js`, `snapshot-store.js`, `resolve-node.sh` |

## Internal `require()` relationships (authoritative)

These need updating because the requiring file or the required file moves into a different bucket. Format: `<file in scripts/>` → requires `<target>`.

| Requirer (after move) | Required file | Old (relative) | New (relative) |
|---|---|---|---|
| `transformers/brief-sourcing.js` | (none — self-contained) | — | — |
| `foundations/derive-foundations.js` | `foundations-parser/ast-walk.js`, `extractors.js`, `status-emoji.js` | `./foundations-parser/ast-walk.js` | `./foundations-parser/ast-walk.js` (subdir comes along — unchanged) |
| `transformers/fm-tree-to-flow-data.js` | `lib/shared-constants.js` | `./shared-constants` | `../lib/shared-constants` |
| `validation/validate-flow-data.js` | `lib/screen-id.js`, `lib/scope-aware-runner.js` | `./screen-id.js`, `./scope-aware-runner.js` | `../lib/screen-id.js`, `../lib/scope-aware-runner.js` |
| `lib/shared-constants.js` | `lib/screen-id.js` | `./screen-id.js` | `./screen-id.js` (sibling within lib/ — unchanged) |
| `sync/sync-from-figma.js` | `transformers/transformers/transform-registry.js`, `transformers/transformers/transform-styles.js`, `changelog/changelog-classifier.js`, `sync/figma-rest.js` | `./transformers/transform-registry.js`, `./transformers/transform-styles.js`, `./changelog-classifier.js`, `./figma-rest.js` | `../transformers/transformers/transform-registry.js`, `../transformers/transformers/transform-styles.js`, `../changelog/changelog-classifier.js`, `./figma-rest.js` (sibling) |
| `transformers/transform-to-hifi.js` | `lib/intent-resolver.js`, `lib/shared-constants.js` | `./intent-resolver.js`, `./shared-constants.js` | `../lib/intent-resolver.js`, `../lib/shared-constants.js` |
| `renderers/html-renderers/{brief,flow,presentation}-renderer.js` | `renderers/html-renderers/fm-html-map.js` | `./fm-html-map` | `./fm-html-map` (sibling within html-renderers/ — unchanged) |
| `validation/validate-schema.js` | (none — self-contained) | — | — |

Note: the existing `transformers/` and `html-renderers/` subdirs come along with their parent move. For example `scripts/transformers/transform-registry.js` → `scripts/transformers/transformers/transform-registry.js` (the duplicated path is a quirk of the spec's bucket assignment; we accept it for v1.62.2 and may flatten in a follow-up).

## External `require()` from `tests/`

```text
tests/brief-sourcing.test.js               → ../scripts/transformers/brief-sourcing.js
tests/changelog-classifier.test.js         → ../scripts/changelog/changelog-classifier.js
tests/changelog.test.js                    → ../scripts/changelog/changelog.js
tests/component-brief-flow.test.js         → ../scripts/transformers/brief-sourcing.js, ../scripts/validation/validate-schema.js
tests/component-property-rules.test.js     → ../scripts/validation/component-property-rules.js
tests/derive-foundations.test.js           → ../scripts/foundations/foundations-parser/ast-walk.js, etc.
tests/derive-foundations.golden.test.js    → ../scripts/foundations/derive-foundations.js
tests/derive-scope.test.js                 → ../scripts/lib/derive-scope.js
tests/figma-rest.test.js                   → ../scripts/sync/figma-rest.js
tests/fingerprint-schema.test.js           → ../scripts/sync/fingerprint-schema.js
tests/flow-renderer.test.js                → ../scripts/renderers/html-renderers/flow-renderer.js
tests/fm-html-map.test.js                  → ../scripts/renderers/html-renderers/fm-html-map.js
tests/fm-to-ds-map.test.js                 → ../scripts/transformers/fm-tree-to-flow-data.js, etc. (verify per file)
tests/intent-resolver.test.js              → ../scripts/lib/intent-resolver.js
tests/merge-partials.test.js               → ../scripts/transformers/merge-partials.js
tests/render-component-reference.test.js   → ../scripts/renderers/render-component-reference.js
tests/resolve-unit.test.js                 → ../scripts/lib/resolve-unit.js
tests/schema.test.js                       → ../scripts/validation/validate-schema.js
tests/scope-aware-runner.test.js           → ../scripts/lib/scope-aware-runner.js
tests/screen-id.test.js                    → ../scripts/lib/screen-id.js
tests/shared-constants.test.js             → ../scripts/lib/shared-constants.js
tests/snapshot-store.test.js               → ../scripts/lib/snapshot-store.js
tests/sync-description-capture.test.js     → ../scripts/sync/sync-from-figma.js (verify)
tests/sync-fm-to-ds-map.test.js            → ../scripts/sync/sync-fm-to-ds-map.js
tests/sync-from-figma.test.js              → ../scripts/sync/sync-from-figma.js
tests/transform-registry.test.js           → ../scripts/transformers/transformers/transform-registry.js
tests/transform-styles.test.js             → ../scripts/transformers/transformers/transform-styles.js
tests/transform-to-hifi.test.js            → ../scripts/transformers/transform-to-hifi.js
tests/validate-flow-data.test.js           → ../scripts/validation/validate-flow-data.js
```

Each test file's `require("../scripts/<X>")` becomes `require("../scripts/<bucket>/<X>")`. Mechanical sed.

## External path-string consumers (non-`require`)

| File | Lines (approx) | What they reference |
|---|---|---|
| `CLAUDE.md` | 30, 40, 59-63 | `scripts/resolve-node.sh`, `scripts/assemble-preview.js`, `scripts/shared-constants.js`, `scripts/validate-flow-data.js`, `scripts/changelog.js`, `scripts/fm-tree-to-flow-data.js` |
| `hooks/hooks.json` | 5 lines | `scripts/check-update.sh`, `scripts/sync-check.sh`, `scripts/allow-internal-reads.sh`, `scripts/check-bare-node.sh`, `scripts/check-server-dir.sh`, `scripts/check-output-path.sh` |
| `agents/screen-generator.md` | 74-75, 98, 148, 227 | `scripts/resolve-node.sh`, `scripts/component-property-rules.js`, `scripts/validate-flow-data.js` |
| `skills/convert-to-hifi/SKILL.md` | 89-90, 104, 190-191 | `scripts/resolve-node.sh`, `scripts/fm-tree-to-flow-data.js`, `scripts/transform-to-hifi.js` |
| `skills/component-brief/SKILL.md` | 98, 122, 148, 166-167 | `scripts/brief-sourcing.js`, `scripts/merge-partials.js`, `scripts/validate-schema.js`, `scripts/resolve-node.sh`, `scripts/assemble-preview.js` |
| `skills/sync-design-system/sync-phases.md` | (varies) | sync-from-figma, transform-registry, transform-styles, derive-foundations |
| `skills/generate-presentation/SKILL.md` | 46-47 | `scripts/resolve-node.sh`, `scripts/merge-partials.js` |
| `skills/generate-flow/SKILL.md` | 50, 83, 91, 104, 110-111, 134, 146-147, 155, 197-198, 205-206, 217, 222, 248-250, 372 | `scripts/resolve-unit.js`, `scripts/snapshot-store.js`, `scripts/derive-scope.js`, `scripts/resolve-node.sh`, `scripts/validate-flow-data.js`, `scripts/fingerprint-schema.js`, `scripts/merge-partials.js`, `scripts/assemble-preview.js`, `scripts/ensure-server.sh`, `scripts/shared-constants.js` |

## Tasks

### Task 1: Pre-flight verification

**Files:** none modified.

- [ ] **Step 1: Confirm clean state**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git status
git branch --show-current
```

Expected: branch `refactor/scripts-reorg`, working tree clean.

- [ ] **Step 2: Capture baseline test count**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`. If anything fails, stop and investigate before proceeding.

---

### Task 2: Move `hooks/` (6 shell scripts) + update `hooks/hooks.json`

**Files:**
- Move (git mv): 6 files in `plugins/actian-design-system/scripts/` → `plugins/actian-design-system/scripts/hooks/`
- Modify: `plugins/actian-design-system/hooks/hooks.json`

- [ ] **Step 1: Create dir and move files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
mkdir -p scripts/hooks
git mv scripts/allow-internal-reads.sh    scripts/hooks/allow-internal-reads.sh
git mv scripts/check-bare-node.sh         scripts/hooks/check-bare-node.sh
git mv scripts/check-output-path.sh       scripts/hooks/check-output-path.sh
git mv scripts/check-server-dir.sh        scripts/hooks/check-server-dir.sh
git mv scripts/check-update.sh            scripts/hooks/check-update.sh
git mv scripts/execute-figma-call.sh      scripts/hooks/execute-figma-call.sh
git status
```

Expected: 6 renames staged.

- [ ] **Step 2: Update `hooks/hooks.json`**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|scripts/check-update\.sh|scripts/hooks/check-update.sh|g' \
  -e 's|scripts/sync-check\.sh|scripts/sync-check.sh|g' \
  -e 's|scripts/allow-internal-reads\.sh|scripts/hooks/allow-internal-reads.sh|g' \
  -e 's|scripts/check-bare-node\.sh|scripts/hooks/check-bare-node.sh|g' \
  -e 's|scripts/check-server-dir\.sh|scripts/hooks/check-server-dir.sh|g' \
  -e 's|scripts/check-output-path\.sh|scripts/hooks/check-output-path.sh|g' \
  plugins/actian-design-system/hooks/hooks.json
```

Note: `sync-check.sh` does NOT move to hooks/ — it goes to sync/ in Task 6, so the substitution above leaves it as-is.

- [ ] **Step 3: Verify hooks.json paths resolve**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in $(grep -oE 'scripts/[a-z/-]+\.sh' plugins/actian-design-system/hooks/hooks.json | sort -u); do
  test -f "plugins/actian-design-system/$f" && echo "OK: $f" || echo "MISSING: $f"
done
```

Expected: all `OK:` (sync-check.sh will still be at `scripts/sync-check.sh` until Task 6 — that's fine).

- [ ] **Step 4: Run tests**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); echo "FAIL: $f"; fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`.

- [ ] **Step 5: Stage and commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
refactor(scripts): move hook guards into scripts/hooks/

Moves 6 PreToolUse shell guards (allow-internal-reads,
check-bare-node, check-output-path, check-server-dir, check-update,
execute-figma-call) into a new scripts/hooks/ subdir. Updates the
5 hardcoded paths in hooks/hooks.json atomically.

Pure relocation — no logic changes; tests 38/38 green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

---

### Task 3: Move `lib/` (8 utility files)

**Files:**
- Move (git mv): 8 files into `scripts/lib/`
- Modify `require()` paths in scripts that imported these (`scripts/transform-to-hifi.js`, `scripts/fm-tree-to-flow-data.js`, `scripts/validate-flow-data.js`)
- Modify `require()` paths in tests that imported these (~7 test files)
- Modify CLAUDE.md (1 ref to `shared-constants.js`)
- Modify `skills/generate-flow/SKILL.md` (refs to `resolve-unit.js`, `snapshot-store.js`, `derive-scope.js`, `shared-constants.js`)
- Modify `skills/convert-to-hifi/SKILL.md` (1 ref to `resolve-node.sh`)
- Modify `skills/component-brief/SKILL.md` (1 ref to `resolve-node.sh`)
- Modify `skills/generate-presentation/SKILL.md` (1 ref to `resolve-node.sh`)
- Modify `agents/screen-generator.md` (1 ref to `resolve-node.sh`)
- Modify CLAUDE.md (refs to `resolve-node.sh`)

- [ ] **Step 1: Create dir and move files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
mkdir -p scripts/lib
git mv scripts/shared-constants.js     scripts/lib/shared-constants.js
git mv scripts/intent-resolver.js      scripts/lib/intent-resolver.js
git mv scripts/resolve-unit.js         scripts/lib/resolve-unit.js
git mv scripts/derive-scope.js         scripts/lib/derive-scope.js
git mv scripts/scope-aware-runner.js   scripts/lib/scope-aware-runner.js
git mv scripts/screen-id.js            scripts/lib/screen-id.js
git mv scripts/snapshot-store.js       scripts/lib/snapshot-store.js
git mv scripts/resolve-node.sh         scripts/lib/resolve-node.sh
git status
```

Expected: 8 renames.

- [ ] **Step 2: Update internal require() paths in moved files**

Within `scripts/lib/shared-constants.js`, requires are sibling-relative (`./screen-id.js`) — those stay as-is since `screen-id.js` also moved to `lib/`. No edits needed in moved files for sibling requires.

Verify:

```bash
grep -nE "require\(['\"]\./" plugins/actian-design-system/scripts/lib/*.js
```

Expected: only sibling refs (`./screen-id.js` from shared-constants.js).

- [ ] **Step 3: Update require() paths in scripts that import moved files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\./shared-constants|require("../lib/shared-constants|g' \
  -e "s|require('\./shared-constants|require('../lib/shared-constants|g" \
  -e 's|require("\./intent-resolver|require("../lib/intent-resolver|g' \
  -e 's|require("\./resolve-unit|require("../lib/resolve-unit|g' \
  -e 's|require("\./derive-scope|require("../lib/derive-scope|g' \
  -e 's|require("\./scope-aware-runner|require("../lib/scope-aware-runner|g' \
  -e 's|require("\./screen-id|require("../lib/screen-id|g' \
  -e 's|require("\./snapshot-store|require("../lib/snapshot-store|g' \
  plugins/actian-design-system/scripts/transform-to-hifi.js \
  plugins/actian-design-system/scripts/fm-tree-to-flow-data.js \
  plugins/actian-design-system/scripts/validate-flow-data.js
```

These three files are still at `scripts/` root in this commit; they will themselves move in later tasks. Once they move into their own buckets, the path becomes `../lib/X` from a sibling bucket — same form. So we set it once now and it stays correct.

Verify:

```bash
grep -nE "require\(['\"]\.\./lib/" plugins/actian-design-system/scripts/transform-to-hifi.js plugins/actian-design-system/scripts/fm-tree-to-flow-data.js plugins/actian-design-system/scripts/validate-flow-data.js
```

Expected: each updated require visible.

Wait — these scripts are still at `scripts/`, so `../lib/` from `scripts/foo.js` would be `scripts/../lib/` = repo root's `/lib/` which doesn't exist. We need to use the form that's correct WHILE the file is still at `scripts/`, then update again when the file moves.

**Correct approach:** at this task, the importing scripts are still at `scripts/`. From `scripts/foo.js`, `lib/X` is at `scripts/lib/X`, so `require("./lib/X")`. Use `./lib/`:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\./shared-constants|require("./lib/shared-constants|g' \
  -e "s|require('\./shared-constants|require('./lib/shared-constants|g" \
  -e 's|require("\./intent-resolver|require("./lib/intent-resolver|g' \
  -e 's|require("\./resolve-unit|require("./lib/resolve-unit|g' \
  -e 's|require("\./derive-scope|require("./lib/derive-scope|g' \
  -e 's|require("\./scope-aware-runner|require("./lib/scope-aware-runner|g' \
  -e 's|require("\./screen-id|require("./lib/screen-id|g' \
  -e 's|require("\./snapshot-store|require("./lib/snapshot-store|g' \
  plugins/actian-design-system/scripts/transform-to-hifi.js \
  plugins/actian-design-system/scripts/fm-tree-to-flow-data.js \
  plugins/actian-design-system/scripts/validate-flow-data.js
```

When these scripts later move into their own buckets, an additional sed pass converts `./lib/X` → `../lib/X` (handled in their respective tasks).

- [ ] **Step 4: Update require() paths in tests/**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\.\./scripts/shared-constants|require("../scripts/lib/shared-constants|g' \
  -e 's|require("\.\./scripts/intent-resolver|require("../scripts/lib/intent-resolver|g' \
  -e 's|require("\.\./scripts/resolve-unit|require("../scripts/lib/resolve-unit|g' \
  -e 's|require("\.\./scripts/derive-scope|require("../scripts/lib/derive-scope|g' \
  -e 's|require("\.\./scripts/scope-aware-runner|require("../scripts/lib/scope-aware-runner|g' \
  -e 's|require("\.\./scripts/screen-id|require("../scripts/lib/screen-id|g' \
  -e 's|require("\.\./scripts/snapshot-store|require("../scripts/lib/snapshot-store|g' \
  plugins/actian-design-system/tests/*.test.js
```

- [ ] **Step 5: Update string paths in CLAUDE.md, skills, agents**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|scripts/resolve-node\.sh|scripts/lib/resolve-node.sh|g' \
  -e 's|scripts/shared-constants\.js|scripts/lib/shared-constants.js|g' \
  -e 's|scripts/resolve-unit\.js|scripts/lib/resolve-unit.js|g' \
  -e 's|scripts/snapshot-store\.js|scripts/lib/snapshot-store.js|g' \
  -e 's|scripts/derive-scope\.js|scripts/lib/derive-scope.js|g' \
  plugins/actian-design-system/CLAUDE.md \
  plugins/actian-design-system/agents/screen-generator.md \
  plugins/actian-design-system/skills/convert-to-hifi/SKILL.md \
  plugins/actian-design-system/skills/component-brief/SKILL.md \
  plugins/actian-design-system/skills/generate-presentation/SKILL.md \
  plugins/actian-design-system/skills/generate-flow/SKILL.md
```

- [ ] **Step 6: Verify path references**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
echo "--- stale flat refs to lib files ---"
for f in shared-constants intent-resolver resolve-unit derive-scope scope-aware-runner screen-id snapshot-store resolve-node; do
  grep -rnE "scripts/$f\.(js|sh)" plugins/actian-design-system 2>/dev/null | grep -v "scripts/lib/" | grep -v "docs/superpowers/" | grep -v "release-notes/"
done
echo "--- done ---"
```

Expected: `--- done ---` only.

- [ ] **Step 7: Run tests (and the path-validation test specifically)**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/lib/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); echo "FAIL: $f"; fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`. **Note** the source path changed: `scripts/lib/resolve-node.sh` not `scripts/resolve-node.sh`.

- [ ] **Step 8: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
refactor(scripts): move shared utilities into scripts/lib/

Moves 8 foundational utilities (shared-constants, intent-resolver,
resolve-unit, derive-scope, scope-aware-runner, screen-id,
snapshot-store, resolve-node.sh) into scripts/lib/. Updates require()
paths in 3 importing scripts (transform-to-hifi, fm-tree-to-flow-data,
validate-flow-data), 7 importing tests, and string-path consumers in
CLAUDE.md, screen-generator agent, and 4 SKILL.md files.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

---

### Task 4: Move `changelog/` and `foundations/` (small self-contained groups)

**Files:**
- Move: 2 files into `scripts/changelog/`, 1 file + 1 subdir into `scripts/foundations/`
- Update CLAUDE.md (`changelog.js`)
- Update `sync/sync-from-figma.js` `require("./changelog-classifier")` (file moves to changelog/)
- Update tests/ requires (changelog, changelog-classifier, derive-foundations × 2)

- [ ] **Step 1: Move files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
mkdir -p scripts/changelog scripts/foundations
git mv scripts/changelog.js              scripts/changelog/changelog.js
git mv scripts/changelog-classifier.js   scripts/changelog/changelog-classifier.js
git mv scripts/derive-foundations.js     scripts/foundations/derive-foundations.js
git mv scripts/foundations.parser.json   scripts/foundations/foundations.parser.json
git mv scripts/foundations-parser        scripts/foundations/foundations-parser
git status
```

Expected: 4 file renames + 1 directory rename.

- [ ] **Step 2: Update require() paths in scripts**

`sync-from-figma.js` (still at `scripts/` root) imports `./changelog-classifier.js`. The file now lives at `scripts/changelog/changelog-classifier.js`, so from `scripts/sync-from-figma.js` the path is `./changelog/changelog-classifier.js`:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\./changelog-classifier|require("./changelog/changelog-classifier|g' \
  plugins/actian-design-system/scripts/sync-from-figma.js
```

`derive-foundations.js` references `./foundations-parser/X` — that subdir moved alongside it, so internal requires stay the same.

Verify:

```bash
grep -nE "require\(['\"]\./foundations-parser/" plugins/actian-design-system/scripts/foundations/derive-foundations.js
```

Expected: 3 lines (ast-walk, extractors, status-emoji), unchanged.

- [ ] **Step 3: Update tests/ require()**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\.\./scripts/changelog\.js|require("../scripts/changelog/changelog.js|g' \
  -e 's|require("\.\./scripts/changelog-classifier|require("../scripts/changelog/changelog-classifier|g' \
  -e 's|require("\.\./scripts/derive-foundations|require("../scripts/foundations/derive-foundations|g' \
  -e 's|require("\.\./scripts/foundations-parser/|require("../scripts/foundations/foundations-parser/|g' \
  plugins/actian-design-system/tests/*.test.js
```

- [ ] **Step 4: Update CLAUDE.md**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|scripts/changelog\.js|scripts/changelog/changelog.js|g' \
  plugins/actian-design-system/CLAUDE.md
```

(`derive-foundations.js` is referenced in `package.json` `derive:foundations` script — also update.)

```bash
sed -i '' \
  -e 's|scripts/derive-foundations|scripts/foundations/derive-foundations|g' \
  plugins/actian-design-system/package.json
```

- [ ] **Step 5: Run tests**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/lib/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); echo "FAIL: $f"; fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`.

- [ ] **Step 6: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
refactor(scripts): move changelog/ and foundations/ groups

Moves changelog.js + changelog-classifier.js into scripts/changelog/.
Moves derive-foundations.js, foundations.parser.json, and the
foundations-parser/ subdir into scripts/foundations/. Updates
require() paths in sync-from-figma.js, 4 tests, CLAUDE.md, and
package.json.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

---

### Task 5: Move `validation/` and `sync/` groups

**Files:**
- Move 3 files to `scripts/validation/`, 5 files to `scripts/sync/`
- Update internal requires inside moved files (depth +1: `./lib/X` → `../lib/X`, `./figma-rest` → `./figma-rest` (sibling), `./changelog/changelog-classifier` → `../changelog/changelog-classifier`, `./transformers/transform-X` → `../transformers/transformers/transform-X` — note transformers/transformers/ quirk)
- Update tests/ requires (5 files)
- Update CLAUDE.md (`validate-flow-data.js`)
- Update `agents/screen-generator.md` (`component-property-rules.js`, `validate-flow-data.js`)
- Update `skills/{component-brief,generate-flow}/SKILL.md` (`validate-schema.js`, `validate-flow-data.js`, `fingerprint-schema.js`, `sync-check.sh`)
- Update `hooks/hooks.json` (`sync-check.sh`)

- [ ] **Step 1: Move files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
mkdir -p scripts/validation scripts/sync
git mv scripts/validate-flow-data.js          scripts/validation/validate-flow-data.js
git mv scripts/validate-schema.js             scripts/validation/validate-schema.js
git mv scripts/component-property-rules.js    scripts/validation/component-property-rules.js
git mv scripts/sync-from-figma.js             scripts/sync/sync-from-figma.js
git mv scripts/sync-fm-to-ds-map.js           scripts/sync/sync-fm-to-ds-map.js
git mv scripts/figma-rest.js                  scripts/sync/figma-rest.js
git mv scripts/sync-check.sh                  scripts/sync/sync-check.sh
git mv scripts/fingerprint-schema.js          scripts/sync/fingerprint-schema.js
git status
```

Expected: 8 renames.

- [ ] **Step 2: Update internal requires inside moved files**

`scripts/validation/validate-flow-data.js` was set in Task 3 step 3 to `require("./lib/X")`. Now that this file moved deeper, those become `require("../lib/X")`:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\./lib/|require("../lib/|g' \
  plugins/actian-design-system/scripts/validation/validate-flow-data.js
```

`scripts/sync/sync-from-figma.js` references siblings (`./figma-rest`) and other buckets:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\./changelog/changelog-classifier|require("../changelog/changelog-classifier|g' \
  -e 's|require("\./transformers/transform-registry|require("../transformers/transformers/transform-registry|g' \
  -e 's|require("\./transformers/transform-styles|require("../transformers/transformers/transform-styles|g' \
  plugins/actian-design-system/scripts/sync/sync-from-figma.js
```

(The `./transformers/transformers/` looks duplicated. The bucket is `transformers/`, the existing subdir kept its name `transformers/` inside that bucket. So `scripts/transformers/transformers/transform-registry.js`. Will be flattened in a follow-up cleanup if desired.)

Verify:

```bash
grep -nE "require\(['\"]" plugins/actian-design-system/scripts/sync/*.js plugins/actian-design-system/scripts/validation/*.js
```

Each path should resolve. Spot-check by running the file-resolves test in Step 5.

- [ ] **Step 3: Update tests/**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\.\./scripts/validate-flow-data|require("../scripts/validation/validate-flow-data|g' \
  -e 's|require("\.\./scripts/validate-schema|require("../scripts/validation/validate-schema|g' \
  -e 's|require("\.\./scripts/component-property-rules|require("../scripts/validation/component-property-rules|g' \
  -e 's|require("\.\./scripts/sync-from-figma|require("../scripts/sync/sync-from-figma|g' \
  -e 's|require("\.\./scripts/sync-fm-to-ds-map|require("../scripts/sync/sync-fm-to-ds-map|g' \
  -e 's|require("\.\./scripts/figma-rest|require("../scripts/sync/figma-rest|g' \
  -e 's|require("\.\./scripts/fingerprint-schema|require("../scripts/sync/fingerprint-schema|g' \
  plugins/actian-design-system/tests/*.test.js
```

- [ ] **Step 4: Update string consumers**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|scripts/validate-flow-data\.js|scripts/validation/validate-flow-data.js|g' \
  -e 's|scripts/validate-schema\.js|scripts/validation/validate-schema.js|g' \
  -e 's|scripts/component-property-rules\.js|scripts/validation/component-property-rules.js|g' \
  -e 's|scripts/sync-from-figma\.js|scripts/sync/sync-from-figma.js|g' \
  -e 's|scripts/sync-fm-to-ds-map\.js|scripts/sync/sync-fm-to-ds-map.js|g' \
  -e 's|scripts/figma-rest\.js|scripts/sync/figma-rest.js|g' \
  -e 's|scripts/sync-check\.sh|scripts/sync/sync-check.sh|g' \
  -e 's|scripts/fingerprint-schema\.js|scripts/sync/fingerprint-schema.js|g' \
  plugins/actian-design-system/CLAUDE.md \
  plugins/actian-design-system/agents/screen-generator.md \
  plugins/actian-design-system/skills/component-brief/SKILL.md \
  plugins/actian-design-system/skills/generate-flow/SKILL.md \
  plugins/actian-design-system/skills/sync-design-system/sync-phases.md \
  plugins/actian-design-system/hooks/hooks.json
```

- [ ] **Step 5: Run tests**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/lib/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); echo "FAIL: $f"; fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`.

- [ ] **Step 6: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
refactor(scripts): move validation/ and sync/ groups

Moves 3 files into scripts/validation/ and 5 files into scripts/sync/.
Updates require() paths within moved files (now ../lib/, etc.),
across tests/, CLAUDE.md, screen-generator agent, 3 SKILL.md files,
and hooks/hooks.json (sync-check.sh path).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

---

### Task 6: Move `transformers/` and `renderers/` groups

**Files:**
- Move 4 .js files + 1 subdir + 1 .json into `scripts/transformers/`
- Move 4 .js + 1 .sh + 1 subdir into `scripts/renderers/`
- Update internal requires (depth +1)
- Update tests/ (~7 test files)
- Update CLAUDE.md, skills/, agents/

- [ ] **Step 1: Move files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system

# transformers/
mkdir -p scripts/transformers-new
git mv scripts/transformers/transform-registry.js scripts/transformers-new/transform-registry.js 2>/dev/null || true
git mv scripts/transformers/transform-styles.js   scripts/transformers-new/transform-styles.js   2>/dev/null || true

# Need to handle the existing transformers/ subdir collision. Simpler:
# 1. Move existing subdir to a temporary name
# 2. Create the new transformers/ bucket dir
# 3. Move things in
# 4. Restore the inner subdir
git mv scripts/transformers scripts/_inner_transformers
mkdir -p scripts/transformers
git mv scripts/_inner_transformers scripts/transformers/transformers

# Now move the standalone files
git mv scripts/transform-to-hifi.js       scripts/transformers/transform-to-hifi.js
git mv scripts/fm-tree-to-flow-data.js    scripts/transformers/fm-tree-to-flow-data.js
git mv scripts/brief-sourcing.js          scripts/transformers/brief-sourcing.js
git mv scripts/merge-partials.js          scripts/transformers/merge-partials.js
git mv scripts/templates.json             scripts/transformers/templates.json

# renderers/
mkdir -p scripts/renderers
git mv scripts/html-renderers             scripts/renderers/html-renderers
git mv scripts/assemble-preview.js        scripts/renderers/assemble-preview.js
git mv scripts/preview-server.js          scripts/renderers/preview-server.js
git mv scripts/ensure-server.sh           scripts/renderers/ensure-server.sh
git mv scripts/render-component-reference.js  scripts/renderers/render-component-reference.js
git status
```

- [ ] **Step 2: Update internal requires**

`scripts/transformers/transform-to-hifi.js` was set to `require("./lib/X")` in Task 3. Update to `../lib/X`:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\./lib/|require("../lib/|g' \
  plugins/actian-design-system/scripts/transformers/transform-to-hifi.js \
  plugins/actian-design-system/scripts/transformers/fm-tree-to-flow-data.js
```

`scripts/transformers/brief-sourcing.js` is self-contained — no edit.
`scripts/transformers/merge-partials.js` is self-contained — verify with `grep`.

`scripts/renderers/html-renderers/{brief,flow,presentation}-renderer.js` reference `./fm-html-map` (sibling) — unchanged.

- [ ] **Step 3: Update tests/**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|require("\.\./scripts/transform-to-hifi|require("../scripts/transformers/transform-to-hifi|g' \
  -e 's|require("\.\./scripts/fm-tree-to-flow-data|require("../scripts/transformers/fm-tree-to-flow-data|g' \
  -e 's|require("\.\./scripts/brief-sourcing|require("../scripts/transformers/brief-sourcing|g' \
  -e 's|require("\.\./scripts/merge-partials|require("../scripts/transformers/merge-partials|g' \
  -e 's|require("\.\./scripts/transformers/transform-registry|require("../scripts/transformers/transformers/transform-registry|g' \
  -e 's|require("\.\./scripts/transformers/transform-styles|require("../scripts/transformers/transformers/transform-styles|g' \
  -e 's|require("\.\./scripts/assemble-preview|require("../scripts/renderers/assemble-preview|g' \
  -e 's|require("\.\./scripts/preview-server|require("../scripts/renderers/preview-server|g' \
  -e 's|require("\.\./scripts/render-component-reference|require("../scripts/renderers/render-component-reference|g' \
  -e 's|require("\.\./scripts/html-renderers/|require("../scripts/renderers/html-renderers/|g' \
  plugins/actian-design-system/tests/*.test.js
```

- [ ] **Step 4: Update string consumers**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|scripts/transform-to-hifi\.js|scripts/transformers/transform-to-hifi.js|g' \
  -e 's|scripts/fm-tree-to-flow-data\.js|scripts/transformers/fm-tree-to-flow-data.js|g' \
  -e 's|scripts/brief-sourcing\.js|scripts/transformers/brief-sourcing.js|g' \
  -e 's|scripts/merge-partials\.js|scripts/transformers/merge-partials.js|g' \
  -e 's|scripts/assemble-preview\.js|scripts/renderers/assemble-preview.js|g' \
  -e 's|scripts/ensure-server\.sh|scripts/renderers/ensure-server.sh|g' \
  -e 's|scripts/preview-server\.js|scripts/renderers/preview-server.js|g' \
  plugins/actian-design-system/CLAUDE.md \
  plugins/actian-design-system/skills/component-brief/SKILL.md \
  plugins/actian-design-system/skills/generate-flow/SKILL.md \
  plugins/actian-design-system/skills/generate-presentation/SKILL.md \
  plugins/actian-design-system/skills/convert-to-hifi/SKILL.md \
  plugins/actian-design-system/skills/sync-design-system/sync-phases.md
```

- [ ] **Step 5: Run tests**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/lib/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); echo "FAIL: $f"; fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`. Investigate any FAIL output before committing.

- [ ] **Step 6: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
refactor(scripts): move transformers/ and renderers/ groups

Final-bucket moves: 6 transformer-related files into scripts/transformers/
(incl. existing transformers/ subdir nested as transformers/transformers/),
and 5 renderer-related items into scripts/renderers/ (incl. existing
html-renderers/ subdir). Updates require() paths within moved files,
across tests/, CLAUDE.md, 5 SKILL.md files, and 1 sync-phases ref.

scripts/ root is now empty of code — only the 8 bucket dirs remain.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

- [ ] **Step 7: Confirm `scripts/` root is clean**

```bash
ls plugins/actian-design-system/scripts/
```

Expected output (alphabetical, dirs only):

```
changelog
foundations
hooks
lib
renderers
sync
transformers
validation
```

If any file remains at the root, investigate before continuing.

---

### Task 7: Update ARCHITECTURE.md + ride-along bare-ref fix

**Files:**
- Modify: `plugins/actian-design-system/ARCHITECTURE.md` (fill in scripts/ conventions in Section 3)
- Modify: `plugins/actian-design-system/references/figma/figma-output.md` (fix bare `library-gap-detection.md` ref)
- Sweep for any other bare-shorthand refs to moved reference files

- [ ] **Step 1: Fill in ARCHITECTURE.md Section 3 — scripts/ conventions**

Open `plugins/actian-design-system/ARCHITECTURE.md` and replace the placeholder line under "### `scripts/` and `tests/`" (currently reading "These will be filled in by PRs 2 and 3 of the reorg.") with this content:

```markdown
### `scripts/` subdirs

- `hooks/` — PreToolUse / PostToolUse shell guards (one `.sh` each). Wired in `hooks/hooks.json`. New PreToolUse guards go here.
- `sync/` — Figma ↔ registry sync. `sync-from-figma.js` is the entrypoint. New code that talks to Figma (REST or write-side) goes here.
- `validation/` — Pipeline validators (banned text, tokens, terminology, schema). New validators go here.
- `renderers/` — HTML/preview output. `assemble-preview.js`, the local preview server, and the `html-renderers/` adapters. New preview/render code goes here.
- `transformers/` — Data shape transformations between source formats (Figma → flow-data, flow-data → hifi, recipe partials → final). New transforms go here.
- `foundations/` — Foundations.md → JSON registries derivation. Owned by the MD-as-SoT pipeline.
- `changelog/` — Push-to-push design changelog generator and classifier.
- `lib/` — Shared utilities used by 2+ scripts (constants, ID stamping, scope derivation, snapshot store, intent resolver, unit resolver, Node binary resolver). New shared utilities go here.

### `tests/` subdirs

(Will be filled in by PR-3 once tests/ is mirrored to scripts/ structure.)
```

- [ ] **Step 2: Fix bare-shorthand ref in `figma-output.md`**

Find the bare `library-gap-detection.md` reference:

```bash
grep -n "library-gap-detection\.md" plugins/actian-design-system/references/figma/figma-output.md
```

Use Edit tool to change the bare backtick-quoted `library-gap-detection.md` to `../ds-rules/library-gap-detection.md` (relative to `references/figma/figma-output.md`'s location).

- [ ] **Step 3: Sweep for other bare-shorthand refs to moved reference files**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in annotation-reference figma-output figma-push-patterns parity-check prototype-reference prototype-wiring component-instance-rules fm-css-reference layout-patterns library-gap-detection quality-checklist quality-tiers app-context companion-context ux-patterns; do
  hits=$(grep -rln "\`$f\.md\`" plugins/actian-design-system 2>/dev/null | grep -v "docs/superpowers/" | grep -v "release-notes/")
  if [ -n "$hits" ]; then
    echo "BARE REF $f.md found in:"
    echo "$hits"
  fi
done
```

For each bare reference found, use Edit to qualify it with the correct subdir path (relative to the consuming file's location).

- [ ] **Step 4: Run path-validation test**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/lib/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
"$NODE_BIN" tests/path-validation.test.js 2>&1 | tail -10
```

Expected: 2/2 subtests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
docs: fill ARCHITECTURE.md scripts/ section + fix bare-shorthand ref

- ARCHITECTURE.md Section 3 scripts/ conventions now reflect the 8
  buckets created in this PR
- Fix bare `library-gap-detection.md` reference in
  references/figma/figma-output.md (now `../ds-rules/library-gap-detection.md`)
- Sweep for other bare-shorthand cross-refs to moved files

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```

---

### Task 8: Bump version + final verify + hand back

**Files:**
- Modify: `plugins/actian-design-system/.claude-plugin/plugin.json` (1.62.1 → 1.62.2)

- [ ] **Step 1: Bump version**

Use Edit tool to change `"version": "1.62.1"` → `"version": "1.62.2"`.

- [ ] **Step 2: Verify**

```bash
grep '"version"' plugins/actian-design-system/.claude-plugin/plugin.json
```

Expected: `"version": "1.62.2",`

- [ ] **Step 3: Run full test suite as final sanity check**

```bash
source /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system/scripts/lib/resolve-node.sh
cd /Users/volivari/Developer/Actian/actian-design-system-plugin/plugins/actian-design-system
passed=0; failed=0; for f in tests/*.test.js; do
  if "$NODE_BIN" "$f" >/dev/null 2>&1; then passed=$((passed+1)); else failed=$((failed+1)); echo "FAIL: $f"; fi
done
echo "passed=$passed failed=$failed"
```

Expected: `passed=38 failed=0`.

- [ ] **Step 4: Review the full PR diff**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD | tail -3
```

Expected: 7 commits (this plan's tasks 2-8 each → 1 commit). Approximately ~50 files changed.

- [ ] **Step 5: Confirm `scripts/` root is clean**

```bash
ls plugins/actian-design-system/scripts/
```

Expected: 8 directories (changelog, foundations, hooks, lib, renderers, sync, transformers, validation), 0 files.

- [ ] **Step 6: Commit version bump**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add plugins/actian-design-system/.claude-plugin/plugin.json
git commit -m "$(cat <<'EOF'
chore: bump version to 1.62.2 (PR-2 of repo reorg)

PR-2: scripts/ split into 8 purpose buckets — hooks/, sync/,
validation/, renderers/, transformers/, foundations/, changelog/, lib/.
ARCHITECTURE.md Section 3 filled in. Bare-shorthand reference fixes
ride along.

PR-3 (tests/ reorg) follows.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Hand back**

Do NOT push. Report:

> "PR-2 implementation complete on `refactor/scripts-reorg`. N commits, M files changed. Tests 38/38 green. Ready for review and push approval."

---

## Self-review checklist

- [ ] `scripts/` root contains only 8 directories (no `.js`/`.sh`/`.json` files at root)
- [ ] All 8 expected subdirs present: changelog, foundations, hooks, lib, renderers, sync, transformers, validation
- [ ] No grep hits for old flat `scripts/<basename>.<ext>` paths in active areas (excluding `docs/superpowers/`, `release-notes/`)
- [ ] `hooks/hooks.json` paths all resolve to existing files
- [ ] All 38 tests pass (in particular `path-validation.test.js`)
- [ ] `plugin.json` shows `1.62.2`
- [ ] `ARCHITECTURE.md` Section 3 has scripts/ subsection content (no longer placeholder)
- [ ] Git log shows 7 logical commits (one per task 2-8)

If any item fails, investigate and fix before reporting completion.

## Out of scope for PR-2

- `tests/` directory reorg → PR-3
- Flattening the nested `scripts/transformers/transformers/` quirk → defer to a cleanup follow-up
- File renames (e.g., `intent-resolver.js`) → still deferred per spec
- GitHub PR creation → user handles after push approval
