# Skill Migration to Meta Kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 4 output skills to use Meta Kit components, variable binding, builder functions, and quality tiers — replacing inline token tables, hexToRgb patterns, and generation card specs with single-source-of-truth references.

**Architecture:** Each skill gets the same 4 changes: (1) add Meta Kit component imports for chrome elements, (2) replace inline token hex tables with variable catalog references, (3) add quality tier detection, (4) replace inline generation card specs with Generation Log component import. The shared `figma-output.md` already documents the patterns — skills just need to reference them and use them.

**Tech Stack:** Markdown skill files, Meta Kit Figma components, DS2026 Figma variables.

**Prerequisites:**
- Meta Kit Foundation plan is complete (6 components published, catalogs created)
- Read these files before starting any task:
  - `plugins/actian-design-system/docs/meta-kit-components.md` — component keys and detachInstance pattern
  - `plugins/actian-design-system/docs/meta-kit-variables.md` — variable keys
  - `plugins/actian-design-system/references/meta-kit-builders.md` — builder functions
  - `plugins/actian-design-system/references/figma-output.md` — shared output patterns

All paths below are relative to `plugins/actian-design-system/`.

---

## File Structure

### Files to modify

| File | What changes |
|------|-------------|
| `skills/component-brief/SKILL.md` (269 lines) | Add Meta Kit Brief Card import to Step 3, add quality tier detection, add variable binding reference, reference builders for tables |
| `skills/generate-flow/SKILL.md` (394 lines) | Replace inline FM token table (lines 308-331) with meta-kit-variables reference, add Meta Kit Flow Screen import, add quality tier detection, add Generation Log import |
| `skills/generate-presentation/SKILL.md` (281 lines) | Replace inline slide token section (lines 209-228) with meta-kit references, add quality tier detection, add Generation Log import |
| `skills/create-component/SKILL.md` (333 lines) | Replace inline token tables (lines 243-287) with meta-kit-variables reference, replace inline gen card code (lines 213-225) with Generation Log import, add quality tier detection |

### Files NOT modified (already updated in Foundation plan)

- `references/figma-output.md` — already has Meta Kit, variable binding, and builder sections
- `CLAUDE.md` — already has Meta Kit files in the organization table
- `docs/meta-kit-components.md` — already has detachInstance pattern
- `docs/meta-kit-variables.md` — complete
- `references/meta-kit-builders.md` — complete

---

## Task 1: Migrate component-brief to Meta Kit

**Files:**
- Modify: `skills/component-brief/SKILL.md`

The component-brief already references `figma-output.md` in Step 3 and has card structure specs. We need to: replace the card structure specs with Meta Kit component imports, add quality tiers, and reference variable binding.

- [ ] **Step 1: Read the full file**

Read `skills/component-brief/SKILL.md` to understand current structure.

- [ ] **Step 2: Add quality tier detection**

After the execution model blockquote (around line 16), add:

```markdown
### Quality tier detection

| Signal in user prompt | Tier | Effect |
|----------------------|------|--------|
| "quick", "rough", "draft", "sketch" | Draft | Cards 1-5 only, simplified tables (5 rows max), no variant matrices |
| No qualifier (default) | Standard | All cards, full Meta Kit components, proper token tables |
| "production", "final", "publish-ready" | Production | Standard + variable binding on all scaffolding + golden reference comparison |
| Re-generation after feedback | Production | Auto-upgrade to production tier |
```

- [ ] **Step 3: Replace card structure section with Meta Kit reference**

Replace the "Card structure" section (lines ~165-189, the dimensional specs) with:

```markdown
### Card structure (Meta Kit)

Card shells are Meta Kit components — do not construct inline. Import `Meta / Chrome / Brief Card` and detach before adding content.

```js
// Import and configure card
const briefCardSet = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
const variant = briefCardSet.children.find(c => c.name === "Mode=DS, Type=Standard");
const instance = variant.createInstance();
setProp(instance, "Title", "Design tokens");
setProp(instance, "Subtitle", "Color, sizing, and typography tokens");
const card = instance.detachInstance();  // Detach to allow content insertion
const content = card.findOne(n => n.name === "Content");
// Now append tables, text, and visual elements to `content`
```

For component keys, properties, and the `setProp` helper, see `../../docs/meta-kit-components.md`.
For builder functions (`buildSpecTable`, `buildStateGrid`), see `../../references/meta-kit-builders.md`.
```

- [ ] **Step 4: Add variable binding note to the output step**

After the Meta Kit card structure section, add:

```markdown
### Variable binding (DS2026 mode)

For DS2026 output, bind scaffolding colors to Figma variables for theme switching. See `../../docs/meta-kit-variables.md` for keys and the `bindFill`/`bindStroke` pattern. FM output continues using hex.
```

- [ ] **Step 5: Add Generation Log import to execution steps**

In the "Execution steps" section, update step 1:

Old: "Build generation metadata frame first — follow the generation metadata pattern in `../../references/figma-output.md`"

New: "Import `Meta / Chrome / Generation Log` component (key: `a9653f30925367e96dea90093d750bfe70849571`), set all 6 text properties, append as first child of the wrapper."

- [ ] **Step 6: Verify no stale patterns remain**

```bash
grep -n "hexToRgb\|#2D3648\|#F5F5FA\|280px.*hug\|cornerRadius.*12" skills/component-brief/SKILL.md
```

Should return zero results (all hex values and dimensional specs should be replaced by Meta Kit references).

Exception: the "Per-card content requirements" section may still reference hex for pink dimension annotations (#E91E8C) — this is correct since that's a content element, not chrome.

- [ ] **Step 7: Commit**

```bash
git add plugins/actian-design-system/skills/component-brief/SKILL.md
git commit -m "refactor: migrate component-brief to Meta Kit components and variable binding"
```

---

## Task 2: Migrate generate-flow to Meta Kit

**Files:**
- Modify: `skills/generate-flow/SKILL.md`

Generate-flow already references `figma-output.md`. We need to: replace the inline FM token table, add Flow Screen component import, add Generation Log import, add quality tiers.

- [ ] **Step 1: Read the full file**

- [ ] **Step 2: Add quality tier detection**

After the execution model section, add the same quality tier table as Task 1, but with flow-specific effects:

```markdown
### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | Happy path only (3-5 screens), minimal text overrides |
| No qualifier (default) | Standard | Happy path + error/empty states, full FM component overrides |
| "production", "final" | Production | All paths + loading states + edge cases, variable binding |
```

- [ ] **Step 3: Replace inline FM token table with reference**

Delete lines 308-331 (the "FM Token Reference" table with hex values). Replace with:

```markdown
### Token reference

For FM scaffolding hex values, see the FM token palette in `../../references/fm-css-reference.md`.
For DS2026 variable binding, see `../../docs/meta-kit-variables.md`.
```

- [ ] **Step 4: Add Meta Kit Flow Screen import to the use_figma section**

In the `use_figma` output section, add before the current screen construction instructions:

```markdown
### Screen scaffolding (Meta Kit)

Import `Meta / Chrome / Flow Screen` instead of building header + sidebar + content manually:

```js
const flowScreenSet = await figma.importComponentSetByKeyAsync("2ca7c756ad54e81219104d3a270ba8eb9eeffcf6");
const stdVariant = flowScreenSet.children.find(c => c.name === "Size=Standard");
const screen = stdVariant.createInstance();
// The screen arrives with FM App_header (top) + FM Sidebar (left) + Content Area
// Find the content area and add screen content:
const contentArea = screen.findOne(n => n.name === "Content Area");
// Note: Flow Screen instances do NOT need detaching — use text overrides on
// the sidebar and header directly, and find Content Area for layout
```

**Note:** Per `meta-kit-components.md`, Flow Screen does NOT need detaching — `contentArea.appendChild()` works because Content Area is a plain frame (not a component slot). This differs from Brief Card which requires detaching.
```

- [ ] **Step 5: Add Generation Log import**

In the output section, replace any inline generation card construction with:

```markdown
Import `Meta / Chrome / Generation Log` (key: `a9653f30925367e96dea90093d750bfe70849571`) as the first element before the flow cover card. Set all 6 text properties.
```

- [ ] **Step 6: Remove inline hexToRgb reference**

The skill shouldn't need to tell Claude to use `hexToRgb` for chrome — Meta Kit components handle that. Keep hex for custom content elements (e.g., flow cover card dark background) but remove the general instruction to use hexToRgb on scaffolding.

- [ ] **Step 7: Verify**

```bash
grep -n "FM Token Reference\|hexToRgb.*scaffolding\|generation metadata frame" skills/generate-flow/SKILL.md
```

Should return zero results.

- [ ] **Step 8: Commit**

```bash
git add plugins/actian-design-system/skills/generate-flow/SKILL.md
git commit -m "refactor: migrate generate-flow to Meta Kit components and variable references"
```

---

## Task 3: Migrate generate-presentation to Meta Kit

**Files:**
- Modify: `skills/generate-presentation/SKILL.md`

- [ ] **Step 1: Read the full file**

- [ ] **Step 2: Add quality tier detection**

After the execution model section, add:

```markdown
### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | 5-8 slides, stat cards only (no complex charts) |
| No qualifier (default) | Standard | 8-15 slides, full chart selection |
| "production", "final" | Production | 8-20 slides with speaker notes, slide-by-slide quality check |
```

- [ ] **Step 3: Replace inline slide token values with Meta Kit references**

Delete the inline hex color values in the slide types section (lines ~209-228). Replace token hex values with references:

```markdown
For slide token values and DS2026 variable binding, see `../../docs/meta-kit-variables.md`.
For the shared Do-Don't Pair and Code Block components, see `../../docs/meta-kit-components.md`.
For buildSpecTable (data tables in slides), see `../../references/meta-kit-builders.md`.
```

Keep the slide TYPE descriptions (Cover, Body, Section, Back Cover) but remove the inline hex values — reference the variable catalog instead.

- [ ] **Step 4: Add Generation Log import**

Add to the execution steps: import `Meta / Chrome / Generation Log` as the first element.

- [ ] **Step 5: Add Do-Don't and Code Block references**

In the slide content section, add:

```markdown
For best-practice slides, import `Meta / Content / Do-Don't Pair` (key: `28edfacf13e50706586172bd48f8a3ad84d7c263`).
For code example slides, import `Meta / Content / Code Block` (key: `1bf10eee1751a46da5f90a9671be6c9abf0073b7`).
```

- [ ] **Step 6: Verify**

```bash
grep -n "#0550DC\|#FFFFFF.*background\|hexToRgb" skills/generate-presentation/SKILL.md
```

Inline hex values for slide backgrounds should be replaced with variable references.
Exception: gradient colors (#090952, #1414B8) cannot be variable-bound — these may remain as hex.

- [ ] **Step 7: Commit**

```bash
git add plugins/actian-design-system/skills/generate-presentation/SKILL.md
git commit -m "refactor: migrate generate-presentation to Meta Kit components and variable references"
```

---

## Task 4: Migrate create-component to Meta Kit

**Files:**
- Modify: `skills/create-component/SKILL.md`

- [ ] **Step 1: Read the full file**

- [ ] **Step 2: Add quality tier detection**

After the execution model section, add:

```markdown
### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | Component only, no generation log, minimal cleanup |
| No qualifier (default) | Standard | Component + generation log + standard cleanup pass |
| "production", "final" | Production | Standard + variable binding on all scaffolding + research step |
```

- [ ] **Step 3: Replace inline token tables with references**

Delete lines 243-287 (the "Token Reference" section with FM and DS2026 hex tables). Replace with:

```markdown
## Token Reference

For FM token hex values, see `../../references/fm-css-reference.md`.
For DS2026 variable keys (preferred for Plugin API), see `../../docs/meta-kit-variables.md`.
For the full token list, see `../../docs/token-reference.md` or `../../tokens/tokens.css`.

When using `use_figma` for DS2026 components, prefer variable binding over hex:
```js
// Import variable and bind (see meta-kit-variables.md for all keys)
const themePrimary = await figma.variables.importVariableByKeyAsync("a256595115f6048a1e1c843e3099a79a5c259288");
bindFill(frame, themePrimary);
```

For FM components, use hex from `fm-css-reference.md` (FM Kit does not publish variables).
```

- [ ] **Step 4: Replace inline generation card code with component import**

Replace the generation metadata frame code (lines 213-225) with:

```markdown
5. **Include generation metadata** — import `Meta / Chrome / Generation Log` component (key: `a9653f30925367e96dea90093d750bfe70849571`) as the first sibling before the component set. Set all 6 text properties using `setProp()` from `../../docs/meta-kit-components.md`.
```

- [ ] **Step 5: Update the Plugin API capabilities statement**

The statement at line 200 says "Because the Plugin API can't bind CSS variables, you must resolve tokens to hex values manually." This is no longer true — update to:

```markdown
The Plugin API supports variable binding via `importVariableByKeyAsync` + `setBoundVariableForPaint`. For DS2026 output, bind scaffolding colors to Figma variables (see `../../docs/meta-kit-variables.md`). For FM output, use hex from the FM token palette.
```

- [ ] **Step 6: Add figma-output.md reference**

This skill doesn't currently reference `figma-output.md`. Add at the top of Step 5B:

```markdown
Follow the shared `use_figma` pattern in `../../references/figma-output.md`.
```

- [ ] **Step 7: Verify**

```bash
grep -n "hexToRgb.*2D3648\|FM Token Reference\|DS2026 Token\|can't bind CSS" skills/create-component/SKILL.md
```

Should return zero results.

- [ ] **Step 8: Commit**

```bash
git add plugins/actian-design-system/skills/create-component/SKILL.md
git commit -m "refactor: migrate create-component to Meta Kit variable binding and references"
```

---

## Task 5: Create unified quality checklist

**Files:**
- Create: `references/quality-checklist.md`
- Modify: All 4 SKILL.md files (replace inline checklists with reference)

Currently generate-flow has 25 checklist items, create-component has 15, and the other two reference CLAUDE.md generically. Consolidate into one file.

- [ ] **Step 1: Read the generate-flow checklist (lines 347-394)**

- [ ] **Step 2: Read the create-component checklist (lines 295-326)**

- [ ] **Step 3: Read the CLAUDE.md Quality & Hygiene section**

- [ ] **Step 4: Write the unified checklist**

Create `references/quality-checklist.md` with:
- A "Universal" section (applies to all skills): auto-layout, layer naming, token compliance, generation log, style check
- A "Component Brief" section: card structure, per-card completeness, content guidelines compliance
- A "Generate Flow" section: screen naming, cover cards, component consistency, forms layout, missing states
- A "Generate Presentation" section: slide structure, chart quality, content guidelines
- A "Create Component" section: property naming, variant completeness, description field

- [ ] **Step 5: Update all 4 SKILL.md files**

In each skill's cleanup/quality section, replace the inline checklist with:

```markdown
### Cleanup pass

Run through the checklist in `../../references/quality-checklist.md` — check the Universal section plus the skill-specific section for this skill.
```

- [ ] **Step 6: Commit**

```bash
git add plugins/actian-design-system/references/quality-checklist.md
git add plugins/actian-design-system/skills/*/SKILL.md
git commit -m "refactor: consolidate quality checklists into single reference file"
```

---

## Task 6: Version bump and final verification

**Files:**
- Modify: `.claude-plugin/plugin.json`

- [ ] **Step 1: Full grep for stale patterns**

```bash
grep -rn "FM Token Reference\|DS2026 Token Reference\|hexToRgb.*scaffolding\|generation metadata frame.*code\|can't bind CSS" plugins/actian-design-system/skills/
```

Must return zero results.

- [ ] **Step 2: Verify all skills reference Meta Kit**

```bash
grep -rn "meta-kit-components\|meta-kit-variables\|meta-kit-builders" plugins/actian-design-system/skills/
```

All 4 skills should reference at least one meta-kit file.

- [ ] **Step 3: Verify quality checklist references**

```bash
grep -rn "quality-checklist" plugins/actian-design-system/skills/
```

All 4 skills should reference the shared checklist.

- [ ] **Step 4: Bump version to 1.12.0**

Edit `plugins/actian-design-system/.claude-plugin/plugin.json`: change version to `"1.12.0"`.

This is a minor version bump — new feature (Meta Kit integration across all skills).

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/.claude-plugin/plugin.json
git commit -m "chore: bump to 1.12.0 — Meta Kit integration across all skills"
```

- [ ] **Step 6: Present to user for review before push**

Show summary of all changes and `git log --oneline` of new commits. Ask for approval.

---

## Verification checklist

After all tasks are complete:

- [ ] All 4 skills reference `meta-kit-components.md` for component imports
- [ ] All 4 skills reference `meta-kit-variables.md` or `fm-css-reference.md` for tokens (not inline tables)
- [ ] All 4 skills have quality tier detection
- [ ] All 4 skills reference `quality-checklist.md` for cleanup
- [ ] All 4 skills import Generation Log from Meta Kit (not inline construction)
- [ ] No inline FM Token Reference or DS2026 Token Reference tables remain in SKILL.md files
- [ ] No inline generation card construction code remains in SKILL.md files
- [ ] Plugin version is 1.12.0
