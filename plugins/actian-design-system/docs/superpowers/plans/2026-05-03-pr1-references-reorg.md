# PR-1 Implementation Plan — `references/` reorg + ARCHITECTURE.md scaffold + CLAUDE.md update

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `plugins/actian-design-system/references/` into 3 cross-cutting subdirs (`figma/`, `ds-rules/`, `context/`), update all 15 consumer files, scaffold a new `ARCHITECTURE.md` at the plugin root, and add a "Where things go" section to `CLAUDE.md`. Pure docs PR — no code paths affected.

**Architecture:** This is a structural refactor. Each task moves a group of files with `git mv` (preserves blame), then mechanically updates every consumer in the same commit so no intermediate state is broken. There are no new tests written; verification is the existing test suite plus a grep that no stale paths remain.

**Tech Stack:** Bash (`git mv`, `grep`, `sed`), markdown.

---

## Spec reference

Source spec: `plugins/actian-design-system/docs/superpowers/specs/2026-05-03-scripts-references-tests-reorg-design.md`

This plan covers PR-1 only (rows 1 of the PR sequence). PR-2 (`scripts/`) and PR-3 (`tests/`) get their own plans after PR-1 merges.

## File structure produced by this PR

```
plugins/actian-design-system/
  ARCHITECTURE.md                  ← NEW (scaffold)
  CLAUDE.md                        ← MODIFIED (new "Where things go" section)
  .claude-plugin/plugin.json       ← MODIFIED (1.62.0 → 1.62.1)
  references/
    figma/                         ← NEW DIR
      annotation-reference.md      ← MOVED
      figma-output.md              ← MOVED
      figma-push-patterns.md       ← MOVED
      parity-check.md              ← MOVED
      prototype-reference.md       ← MOVED
      prototype-wiring.md          ← MOVED
    ds-rules/                      ← NEW DIR
      component-instance-rules.md  ← MOVED
      fm-css-reference.md          ← MOVED
      layout-patterns.md           ← MOVED
      library-gap-detection.md     ← MOVED
      quality-checklist.md         ← MOVED
      quality-tiers.md             ← MOVED
    context/                       ← NEW DIR
      app-context.md               ← MOVED
      companion-context.md         ← MOVED
      ux-patterns.md               ← MOVED
    component-brief/               (unchanged)
    create-component/              (unchanged)
    design-audit/                  (unchanged)
    generate-flow/                 (unchanged)
    generate-presentation/         (unchanged)
```

## Path-update map (authoritative — every consumer that must change)

This is the complete list, derived from `grep -rln "references/<basename>"` across `skills/`, `agents/`, `CLAUDE.md`, `docs/`. There are no other consumers.

### figma/ group

| Old path | New path | Consumers |
|---|---|---|
| `references/annotation-reference.md` | `references/figma/annotation-reference.md` | `CLAUDE.md` |
| `references/figma-output.md` | `references/figma/figma-output.md` | `CLAUDE.md`; `skills/{convert-to-hifi,design-audit,component-brief,compare-flows,create-component,sync-design-system,companion}/SKILL.md` |
| `references/figma-push-patterns.md` | `references/figma/figma-push-patterns.md` | `CLAUDE.md`; `skills/{convert-to-hifi,component-brief,create-component,generate-presentation,generate-flow}/SKILL.md` |
| `references/parity-check.md` | `references/figma/parity-check.md` | `CLAUDE.md`; `skills/{design-audit,component-brief,create-component,generate-presentation,generate-flow}/SKILL.md` |
| `references/prototype-reference.md` | `references/figma/prototype-reference.md` | `CLAUDE.md`; `skills/generate-flow/SKILL.md` |
| `references/prototype-wiring.md` | `references/figma/prototype-wiring.md` | `skills/generate-flow/SKILL.md`; `agents/wiring-analyzer.md` |

### ds-rules/ group

| Old path | New path | Consumers |
|---|---|---|
| `references/component-instance-rules.md` | `references/ds-rules/component-instance-rules.md` | `CLAUDE.md`; `skills/convert-to-hifi/SKILL.md` |
| `references/fm-css-reference.md` | `references/ds-rules/fm-css-reference.md` | `skills/create-component/SKILL.md` |
| `references/layout-patterns.md` | `references/ds-rules/layout-patterns.md` | `CLAUDE.md`; `skills/generate-flow/SKILL.md` |
| `references/library-gap-detection.md` | `references/ds-rules/library-gap-detection.md` | `CLAUDE.md` |
| `references/quality-checklist.md` | `references/ds-rules/quality-checklist.md` | `CLAUDE.md`; `skills/{design-audit,compare-flows,create-component,generate-presentation,generate-flow}/SKILL.md` |
| `references/quality-tiers.md` | `references/ds-rules/quality-tiers.md` | `skills/{component-brief,create-component,generate-presentation,generate-flow}/SKILL.md`; `scripts/validate-flow-data.js` (code comment, line 584) |

### context/ group

| Old path | New path | Consumers |
|---|---|---|
| `references/app-context.md` | `references/context/app-context.md` | `skills/{generate-presentation,generate-flow}/SKILL.md`; `agents/{flow-consistency,flow-researcher}.md` |
| `references/companion-context.md` | `references/context/companion-context.md` | `skills/companion/SKILL.md` |
| `references/ux-patterns.md` | `references/context/ux-patterns.md` | `skills/{generate-flow,companion}/SKILL.md`; `agents/{flow-consistency,flow-researcher}.md` |

---

## Tasks

### Task 1: Pre-flight — verify clean state and capture baseline

**Files:** none modified. Read-only inventory.

- [ ] **Step 1: Confirm branch and clean tree**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git status
git branch --show-current
```

Expected: branch is `refactor/repo-organization`; working tree clean (the spec doc was committed in `a7bfa1a`).

- [ ] **Step 2: Run baseline test suite to capture green state**

```bash
cd plugins/actian-design-system
bun test 2>&1 | tail -20
```

Expected: all tests pass. Record the test count (e.g., "37 files | 663+ assertions"). If any test fails before any change, stop and investigate — do not proceed.

- [ ] **Step 3: Re-verify the path-update map is still accurate**

Some files may have been touched between spec time and now. Re-run the inventory:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in annotation-reference app-context companion-context component-instance-rules figma-output figma-push-patterns fm-css-reference layout-patterns library-gap-detection parity-check prototype-reference prototype-wiring quality-checklist quality-tiers ux-patterns; do
  hits=$(grep -rln "references/$f" plugins/actian-design-system/skills plugins/actian-design-system/agents plugins/actian-design-system/CLAUDE.md plugins/actian-design-system/docs 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "=== $f ==="
    echo "$hits"
  fi
done
```

Expected: matches the path-update map above. If any file appears that's not in the map (e.g., a new doc was added), add it to the relevant group's update list before proceeding.

---

### Task 2: Move `figma/` group (6 files) and update consumers

**Files:**
- Move (git mv): `plugins/actian-design-system/references/{annotation-reference,figma-output,figma-push-patterns,parity-check,prototype-reference,prototype-wiring}.md` → `plugins/actian-design-system/references/figma/`
- Modify: every consumer in the figma/ group table above

- [ ] **Step 1: Create the directory and move files with git mv**

```bash
cd plugins/actian-design-system
mkdir -p references/figma
git mv references/annotation-reference.md   references/figma/annotation-reference.md
git mv references/figma-output.md           references/figma/figma-output.md
git mv references/figma-push-patterns.md    references/figma/figma-push-patterns.md
git mv references/parity-check.md           references/figma/parity-check.md
git mv references/prototype-reference.md    references/figma/prototype-reference.md
git mv references/prototype-wiring.md       references/figma/prototype-wiring.md
git status
```

Expected output: 6 renames staged, 0 modifications.

- [ ] **Step 2: Update every consumer with one-shot sed**

Each substitution rewrites `references/<basename>.md` → `references/figma/<basename>.md`. Use a single Bash invocation so the format-on-save hook doesn't churn the diff:

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|references/annotation-reference\.md|references/figma/annotation-reference.md|g' \
  -e 's|references/figma-output\.md|references/figma/figma-output.md|g' \
  -e 's|references/figma-push-patterns\.md|references/figma/figma-push-patterns.md|g' \
  -e 's|references/parity-check\.md|references/figma/parity-check.md|g' \
  -e 's|references/prototype-reference\.md|references/figma/prototype-reference.md|g' \
  -e 's|references/prototype-wiring\.md|references/figma/prototype-wiring.md|g' \
  plugins/actian-design-system/CLAUDE.md \
  plugins/actian-design-system/skills/convert-to-hifi/SKILL.md \
  plugins/actian-design-system/skills/design-audit/SKILL.md \
  plugins/actian-design-system/skills/component-brief/SKILL.md \
  plugins/actian-design-system/skills/compare-flows/SKILL.md \
  plugins/actian-design-system/skills/create-component/SKILL.md \
  plugins/actian-design-system/skills/sync-design-system/SKILL.md \
  plugins/actian-design-system/skills/companion/SKILL.md \
  plugins/actian-design-system/skills/generate-presentation/SKILL.md \
  plugins/actian-design-system/skills/generate-flow/SKILL.md \
  plugins/actian-design-system/agents/wiring-analyzer.md
```

Note: macOS `sed` requires `-i ''` (empty backup suffix). The escape `\.md` matches a literal `.md` only. Each pattern is anchored to `references/<basename>.md` so it cannot partial-match an already-moved path.

- [ ] **Step 3: Verify no stale references remain**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in annotation-reference figma-output figma-push-patterns parity-check prototype-reference prototype-wiring; do
  hits=$(grep -rln "references/$f\.md" plugins/actian-design-system/skills plugins/actian-design-system/agents plugins/actian-design-system/CLAUDE.md plugins/actian-design-system/docs 2>/dev/null | grep -v 'references/figma/')
  if [ -n "$hits" ]; then
    echo "STALE: $f still referenced without figma/ prefix in:"
    echo "$hits"
  fi
done
echo "verification complete"
```

Expected output: only `verification complete`. Any "STALE:" line means a sed pattern missed; investigate before moving on.

- [ ] **Step 4: Run tests to confirm nothing broke**

```bash
cd plugins/actian-design-system
bun test 2>&1 | tail -10
```

Expected: same green count as Task 1 step 2. Test discovery does not depend on `references/` paths, so this should pass identically.

- [ ] **Step 5: Stage modifications and review the diff**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
```

Expected: ~6 renames + ~11 modified files (CLAUDE.md + 9 SKILL.md + 1 agent). All modifications should be small (each consumer changes 1-N lines, no other content).

Spot-check one consumer:

```bash
git diff --staged plugins/actian-design-system/skills/generate-flow/SKILL.md | head -40
```

Expected: only `references/<old>` → `references/figma/<old>` substitutions, nothing else.

- [ ] **Step 6: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git commit -m "$(cat <<'EOF'
refactor(references): move figma workflow docs into references/figma/

Moves annotation-reference, figma-output, figma-push-patterns,
parity-check, prototype-reference, prototype-wiring (6 files) into
a new references/figma/ subdir. Updates all 11 consumers (CLAUDE.md,
9 SKILL.md files, wiring-analyzer agent) atomically.

Pure relocation — no content changes; existing tests pass identically.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, working tree clean.

---

### Task 3: Move `ds-rules/` group (6 files) and update consumers

**Files:**
- Move (git mv): `plugins/actian-design-system/references/{component-instance-rules,fm-css-reference,layout-patterns,library-gap-detection,quality-checklist,quality-tiers}.md` → `plugins/actian-design-system/references/ds-rules/`
- Modify: every consumer in the ds-rules/ group table above

- [ ] **Step 1: Create the directory and move files with git mv**

```bash
cd plugins/actian-design-system
mkdir -p references/ds-rules
git mv references/component-instance-rules.md  references/ds-rules/component-instance-rules.md
git mv references/fm-css-reference.md          references/ds-rules/fm-css-reference.md
git mv references/layout-patterns.md           references/ds-rules/layout-patterns.md
git mv references/library-gap-detection.md     references/ds-rules/library-gap-detection.md
git mv references/quality-checklist.md         references/ds-rules/quality-checklist.md
git mv references/quality-tiers.md             references/ds-rules/quality-tiers.md
git status
```

Expected: 6 renames staged.

- [ ] **Step 2: Update every consumer with one-shot sed**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|references/component-instance-rules\.md|references/ds-rules/component-instance-rules.md|g' \
  -e 's|references/fm-css-reference\.md|references/ds-rules/fm-css-reference.md|g' \
  -e 's|references/layout-patterns\.md|references/ds-rules/layout-patterns.md|g' \
  -e 's|references/library-gap-detection\.md|references/ds-rules/library-gap-detection.md|g' \
  -e 's|references/quality-checklist\.md|references/ds-rules/quality-checklist.md|g' \
  -e 's|references/quality-tiers\.md|references/ds-rules/quality-tiers.md|g' \
  plugins/actian-design-system/CLAUDE.md \
  plugins/actian-design-system/skills/convert-to-hifi/SKILL.md \
  plugins/actian-design-system/skills/design-audit/SKILL.md \
  plugins/actian-design-system/skills/component-brief/SKILL.md \
  plugins/actian-design-system/skills/compare-flows/SKILL.md \
  plugins/actian-design-system/skills/create-component/SKILL.md \
  plugins/actian-design-system/skills/generate-presentation/SKILL.md \
  plugins/actian-design-system/skills/generate-flow/SKILL.md \
  plugins/actian-design-system/scripts/validate-flow-data.js
```

Note: `scripts/validate-flow-data.js` line 584 has a code comment referencing `references/quality-tiers.md:14`. The sed pattern updates it.

- [ ] **Step 3: Verify no stale references remain**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in component-instance-rules fm-css-reference layout-patterns library-gap-detection quality-checklist quality-tiers; do
  hits=$(grep -rln "references/$f\.md" plugins/actian-design-system/skills plugins/actian-design-system/agents plugins/actian-design-system/CLAUDE.md plugins/actian-design-system/docs 2>/dev/null | grep -v 'references/ds-rules/')
  if [ -n "$hits" ]; then
    echo "STALE: $f still referenced without ds-rules/ prefix in:"
    echo "$hits"
  fi
done
echo "verification complete"
```

Expected: only `verification complete`.

- [ ] **Step 4: Run tests**

```bash
cd plugins/actian-design-system
bun test 2>&1 | tail -10
```

Expected: same green count.

- [ ] **Step 5: Stage and review**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
```

Expected: 6 renames + ~8 modified files.

- [ ] **Step 6: Commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git commit -m "$(cat <<'EOF'
refactor(references): move DS rules docs into references/ds-rules/

Moves component-instance-rules, fm-css-reference, layout-patterns,
library-gap-detection, quality-checklist, quality-tiers (6 files)
into a new references/ds-rules/ subdir. Updates 8 consumers
(CLAUDE.md + 7 SKILL.md files) atomically.

Pure relocation — no content changes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Move `context/` group (3 files) and update consumers

**Files:**
- Move (git mv): `plugins/actian-design-system/references/{app-context,companion-context,ux-patterns}.md` → `plugins/actian-design-system/references/context/`
- Modify: every consumer in the context/ group table above

- [ ] **Step 1: Create the directory and move files**

```bash
cd plugins/actian-design-system
mkdir -p references/context
git mv references/app-context.md       references/context/app-context.md
git mv references/companion-context.md references/context/companion-context.md
git mv references/ux-patterns.md       references/context/ux-patterns.md
git status
```

- [ ] **Step 2: Update consumers**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
sed -i '' \
  -e 's|references/app-context\.md|references/context/app-context.md|g' \
  -e 's|references/companion-context\.md|references/context/companion-context.md|g' \
  -e 's|references/ux-patterns\.md|references/context/ux-patterns.md|g' \
  plugins/actian-design-system/skills/generate-presentation/SKILL.md \
  plugins/actian-design-system/skills/generate-flow/SKILL.md \
  plugins/actian-design-system/skills/companion/SKILL.md \
  plugins/actian-design-system/agents/flow-consistency.md \
  plugins/actian-design-system/agents/flow-researcher.md
```

- [ ] **Step 3: Verify no stale references**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in app-context companion-context ux-patterns; do
  hits=$(grep -rln "references/$f\.md" plugins/actian-design-system/skills plugins/actian-design-system/agents plugins/actian-design-system/CLAUDE.md plugins/actian-design-system/docs 2>/dev/null | grep -v 'references/context/')
  if [ -n "$hits" ]; then
    echo "STALE: $f still referenced without context/ prefix in:"
    echo "$hits"
  fi
done
echo "verification complete"
```

Expected: only `verification complete`.

- [ ] **Step 4: Run tests**

```bash
cd plugins/actian-design-system
bun test 2>&1 | tail -10
```

- [ ] **Step 5: Stage, review, commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add -A
git diff --staged --stat
git commit -m "$(cat <<'EOF'
refactor(references): move knowledge bases into references/context/

Moves app-context, companion-context, ux-patterns (3 files) into a
new references/context/ subdir. Updates 5 consumers (skills +
agents) atomically.

Pure relocation — no content changes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Confirm `references/` root is clean

**Files:** read-only inventory.

- [ ] **Step 1: List `references/` root**

```bash
ls plugins/actian-design-system/references/
```

Expected output (alphabetical, dirs only):

```
component-brief
context
create-component
design-audit
ds-rules
figma
generate-flow
generate-presentation
```

If any `.md` file remains at the root of `references/`, it was missed by the move plan. Investigate which subdir it belongs in (figma/ ds-rules/ context/ or a skill subdir) and add a follow-up task before continuing.

- [ ] **Step 2: Final stale-reference sweep across the whole project**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
for f in annotation-reference app-context companion-context component-instance-rules figma-output figma-push-patterns fm-css-reference layout-patterns library-gap-detection parity-check prototype-reference prototype-wiring quality-checklist quality-tiers ux-patterns; do
  hits=$(grep -rln "references/$f\.md" plugins/actian-design-system 2>/dev/null | grep -v 'references/figma/' | grep -v 'references/ds-rules/' | grep -v 'references/context/' | grep -v 'docs/superpowers/')
  if [ -n "$hits" ]; then
    echo "STALE $f:"
    echo "$hits"
  fi
done
echo "final sweep complete"
```

Expected: only `final sweep complete`. The `docs/superpowers/` exclusion is intentional — the spec and this plan reference the old paths in their text and that's fine; they are historical records.

---

### Task 6: Create `ARCHITECTURE.md` scaffold

**Files:**
- Create: `plugins/actian-design-system/ARCHITECTURE.md`

The scaffold has 4 sections per the spec. PRs 2 and 3 will fill in scripts/ and tests/ details; this PR establishes the shape.

- [ ] **Step 1: Create the file**

Write the following content to `plugins/actian-design-system/ARCHITECTURE.md`:

```markdown
# Actian Design System Plugin — Architecture

This document is the canonical map of the plugin. If you're onboarding,
debugging, or adding a new artifact, start here.

Structure conventions (`scripts/`, `tests/`) will be filled in as PRs 2
and 3 of the reorganization sprint land. The `references/` and skill
sections below are authoritative as of v1.62.1.

---

## 1. Top-down map

| Directory | Purpose |
|---|---|
| `.claude-plugin/` | Plugin manifest (`plugin.json`) — name, version, marketplace metadata. |
| `agents/` | Subagents dispatched by skills. One `.md` per agent. |
| `commands/` | (none currently — slash commands are co-located with skills) |
| `docs/` | Source-of-truth design docs. `foundations.md`, `content-guidelines.md`, `accessibility-guidelines.md`, plus `component-guidelines/` (per-component MDs) and `generated/` (auto-derived JSON registries). |
| `examples/` | Reference outputs for skills (sample flows, briefs, presentations). |
| `evals/` | Eval suites for skills. |
| `hooks/` | `hooks.json` — PreToolUse/PostToolUse hooks wired to scripts under `scripts/` (will move to `scripts/hooks/` in PR-2). |
| `recipes/` | Per-skill JSON recipes (`brief/`, `flow/`, `presentation/`). |
| `references/` | Reference docs split into cross-cutting subdirs (`figma/`, `ds-rules/`, `context/`) and per-skill subdirs. |
| `release-notes/` | Per-version markdown release notes (gitignored). |
| `schemas/` | JSON Schemas (`brief-data.schema.json`, etc.). |
| `scripts/` | Node + shell scripts. PR-2 will reorganize into purpose buckets. |
| `skills/` | One subdir per user-facing skill, each with a `SKILL.md`. |
| `templates/` | Per-skill HTML/JSON templates. |
| `tests/` | Bun test suite. PR-3 will mirror `scripts/` structure. |
| `tokens/` | DTCG design tokens (`actian-ds.tokens.json`). |

---

## 2. Skill → artifacts

Each row is a user-facing skill (slash command). Use this table to find every file related to a skill.

| Skill | SKILL.md | Agents | Recipes | Templates | Schemas | References (skill-specific) | Cross-cutting refs used |
|---|---|---|---|---|---|---|---|
| `/component-brief` | `skills/component-brief/SKILL.md` | `agents/{card-generator,brief-researcher,brief-data-validator,parity-analyzer}.md` | `recipes/brief/` | (none) | `schemas/brief-data.schema.json` | `references/component-brief/` | `references/figma/{figma-output,figma-push-patterns,parity-check}.md`, `references/ds-rules/quality-tiers.md` |
| `/generate-flow` | `skills/generate-flow/SKILL.md` | `agents/{screen-generator,flow-consistency,flow-researcher,wiring-analyzer,parity-analyzer}.md` | `recipes/flow/` | `templates/flow-*.html` | (none) | `references/generate-flow/` | `references/figma/*`, `references/ds-rules/{layout-patterns,quality-checklist,quality-tiers}.md`, `references/context/{app-context,ux-patterns}.md` |
| `/generate-presentation` | `skills/generate-presentation/SKILL.md` | `agents/{slide-generator,parity-analyzer}.md` | `recipes/presentation/` | `templates/presentation-*.html` | (none) | `references/generate-presentation/` | `references/figma/{figma-push-patterns,parity-check,figma-output}.md`, `references/ds-rules/{quality-checklist,quality-tiers}.md`, `references/context/app-context.md` |
| `/create-component` | `skills/create-component/SKILL.md` | (none) | (none) | (none) | (none) | `references/create-component/` | `references/figma/{figma-output,figma-push-patterns,parity-check}.md`, `references/ds-rules/{fm-css-reference,quality-checklist,quality-tiers}.md` |
| `/design-audit` | `skills/design-audit/SKILL.md` | `agents/parity-analyzer.md` | (none) | (none) | (none) | `references/design-audit/` | `references/figma/{figma-output,parity-check}.md`, `references/ds-rules/quality-checklist.md` |
| `/companion` | `skills/companion/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md`, `references/context/{companion-context,ux-patterns}.md` |
| `/convert-to-hifi` | `skills/convert-to-hifi/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/{figma-output,figma-push-patterns}.md`, `references/ds-rules/component-instance-rules.md` |
| `/compare-flows` | `skills/compare-flows/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md`, `references/ds-rules/quality-checklist.md` |
| `/sync-design-system` | `skills/sync-design-system/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md` |

---

## 3. Directory conventions

### `references/` subdirs

- `figma/` — Workflow docs about reading from / writing to Figma. Push patterns, screenshot rules, prototype wiring, parity checks. New "how to talk to Figma" docs go here.
- `ds-rules/` — Design system constraints. Component instance rules, layout grids, quality gates, FM-Kit CSS variables. New rules-of-the-system docs go here.
- `context/` — Knowledge bases consumed by multiple skills as background. Apps + entities + terminology, UX pattern catalogs. New "what does the user know" docs go here.
- `<skill-name>/` — Skill-specific reference docs. Schema docs, push patterns unique to that skill, playgrounds. One subdir per skill that has its own reference material.

### When to add a new skill subdir under `references/`

- Skill has ≥1 .md of skill-specific reference material → add `references/<skill-name>/`
- Skill only consumes cross-cutting docs → no subdir needed
- Don't preempt: only create the subdir when there's a file to put in it.

### `scripts/` and `tests/`

These will be filled in by PRs 2 and 3 of the reorg.

---

## 4. How to add a new skill

1. `mkdir skills/<name>`; create `skills/<name>/SKILL.md` (use an existing skill as a template).
2. If it needs an agent, add `agents/<agent-name>.md`.
3. If it needs reference docs, add `references/<name>/`.
4. If it has structured data outputs, add a JSON Schema to `schemas/<name>-data.schema.json`.
5. If it has recipes, add `recipes/<name>/`.
6. If it has HTML/JSON templates, add files under `templates/`.
7. Add tests under `tests/` (PR-3 will create the integration/ subdir for cross-cutting tests).
8. Update this `ARCHITECTURE.md` Section 2 with the new row.
9. Bump version in `.claude-plugin/plugin.json`.
```

- [ ] **Step 2: Verify the file looks right**

```bash
ls -la plugins/actian-design-system/ARCHITECTURE.md
wc -l plugins/actian-design-system/ARCHITECTURE.md
head -20 plugins/actian-design-system/ARCHITECTURE.md
```

Expected: file exists, ~80-90 lines, header reads correctly.

- [ ] **Step 3: Stage and commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add plugins/actian-design-system/ARCHITECTURE.md
git commit -m "$(cat <<'EOF'
docs: add ARCHITECTURE.md scaffold mapping skills to artifacts

Top-down map of the plugin's directory layout, a skill-to-artifacts
table covering all 9 user-facing skills, directory conventions for
references/ subdirs, and a checklist for adding new skills.

scripts/ and tests/ conventions will be filled in by PRs 2 and 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Add "Where things go" section to `CLAUDE.md`

**Files:**
- Modify: `plugins/actian-design-system/CLAUDE.md`

- [ ] **Step 1: Read current CLAUDE.md to find an insertion anchor**

```bash
cat plugins/actian-design-system/CLAUDE.md
```

The new section should sit between "File Organization" and "Versioning". Find the heading `## Versioning` — the new section goes immediately above it.

- [ ] **Step 2: Insert the new section**

Use Edit tool to insert this content immediately before the `## Versioning` heading in `plugins/actian-design-system/CLAUDE.md`:

```markdown
## Where things go

`ARCHITECTURE.md` (plugin root) is the canonical map. When unsure where a new artifact belongs, consult it first. Quick rules:

- **Reference doc that's used by ≥2 skills?** Goes in `references/figma/`, `references/ds-rules/`, or `references/context/` depending on subject. Workflow → `figma/`, system constraints → `ds-rules/`, knowledge base → `context/`.
- **Reference doc specific to one skill?** Goes in `references/<skill-name>/`.
- **New skill?** Follow the checklist in `ARCHITECTURE.md` Section 4. New skill = new `skills/<name>/`, new `references/<name>/` (only if it has skill-specific docs), entry added to `ARCHITECTURE.md` Section 2.
- **Script bucketing** (`scripts/sync/`, `scripts/validation/`, etc.) and **test bucketing** are described in `ARCHITECTURE.md` Section 3 once PRs 2 and 3 land.

When generating code or docs in this plugin, consult `ARCHITECTURE.md` for placement and update Section 2 if you add a new artifact.

---

```

- [ ] **Step 3: Verify the edit**

```bash
grep -A 2 "## Where things go" plugins/actian-design-system/CLAUDE.md | head -5
grep -B 2 "## Versioning" plugins/actian-design-system/CLAUDE.md | head -5
```

Expected: "Where things go" section exists, immediately precedes "Versioning".

- [ ] **Step 4: Stage and commit**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add plugins/actian-design-system/CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude.md): add 'Where things go' section pointing at ARCHITECTURE.md

Establishes the rule that ARCHITECTURE.md is the canonical map for
artifact placement, with quick decision rules for the most common
'where does this file go?' question.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Bump version, final verification, ready for push

**Files:**
- Modify: `plugins/actian-design-system/.claude-plugin/plugin.json` (version bump 1.62.0 → 1.62.1)

- [ ] **Step 1: Bump version**

Use Edit tool to change `"version": "1.62.0"` → `"version": "1.62.1"` in `plugins/actian-design-system/.claude-plugin/plugin.json`.

- [ ] **Step 2: Verify**

```bash
grep '"version"' plugins/actian-design-system/.claude-plugin/plugin.json
```

Expected: `"version": "1.62.1",`

- [ ] **Step 3: Run full test suite as final sanity check**

```bash
cd plugins/actian-design-system
bun test 2>&1 | tail -10
```

Expected: same green count as Task 1 step 2. No new failures, no skips.

- [ ] **Step 4: Review the full PR diff**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

Expected: 6-7 commits (spec doc + 3 reorg moves + ARCHITECTURE.md + CLAUDE.md + version bump). Stat shows ~16 files moved (15 .md + 1 spec), 3 new files created (ARCHITECTURE.md, plan, spec), and ~14 modified consumers.

- [ ] **Step 5: Commit version bump**

```bash
cd /Users/volivari/Developer/Actian/actian-design-system-plugin
git add plugins/actian-design-system/.claude-plugin/plugin.json
git commit -m "$(cat <<'EOF'
chore: bump version to 1.62.1 (PR-1 of repo reorg)

PR-1 of the scripts/references/tests reorganization sprint:
references/ split into figma/ ds-rules/ context/ subdirs,
ARCHITECTURE.md scaffold, CLAUDE.md 'Where things go' section.

PRs 2 (scripts/) and 3 (tests/) follow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Hand back to user for push approval**

Do NOT push. Report:

> "PR-1 implementation complete on `refactor/repo-organization`. N commits, M files changed. Tests green. Ready for your review and push approval."

User decides whether to push and open the PR.

---

## Self-review checklist (run by implementer after Task 8)

- [ ] `references/` root contains only directories — no `.md` files
- [ ] All 8 expected subdirs present in `references/`: `figma/`, `ds-rules/`, `context/`, `component-brief/`, `create-component/`, `design-audit/`, `generate-flow/`, `generate-presentation/`
- [ ] No grep hits for old paths (Task 5 step 2 final sweep is clean)
- [ ] Test count matches baseline from Task 1 step 2
- [ ] `ARCHITECTURE.md` exists at plugin root
- [ ] `CLAUDE.md` has new "Where things go" section preceding "Versioning"
- [ ] `plugin.json` shows version `1.62.1`
- [ ] Git log shows logical commit history (one per task)

If any item fails, investigate and fix before reporting completion.

## Out of scope for PR-1

- `scripts/` reorg → PR-2
- `tests/` reorg → PR-3
- File renames (e.g., `intent-resolver.js`) → deferred per spec
- Per-subdir READMEs and structure-enforcement tests → explicitly not in spec
- Updates to PR description / GitHub PR creation → user handles after push approval
