# Figma MCP Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Assembler-based sync pipeline with direct Figma MCP extraction, harden all skills with community-learned patterns, and expand Meta Kit to full coverage.

**Architecture:** Four phases — Phase 0 hardens existing code with community learnings and validates MCP tool reliability. Phase 1 builds the `/sync-design-system` skill that replaces the Assembler pipeline. Phase 2 enhances design-audit with confidence scores and a fix-finding companion. Phase 3 expands Meta Kit with 12 remaining components.

**Tech Stack:** Figma MCP tools (`use_figma`, `search_design_system`, `get_design_context`, `get_metadata`), Figma Plugin API JS, Markdown/JSON docs, bash scripts.

**Source spec:** [`docs/figma-mcp-architecture-plan.md`](../../figma-mcp-architecture-plan.md)

---

## Phase 0 — Quick Wins & Investigation

These tasks can run in parallel. They harden existing code and validate assumptions needed for Phase 1.

---

### Task 0.1: Add community learnings to figma-output.md

**Files:**
- Modify: `plugins/actian-design-system/references/figma-output.md`

- [ ] **Step 1: Read the current file**

Read `references/figma-output.md` to find the correct insertion points.

- [ ] **Step 2: Add "Sequential use_figma constraint" section**

After the existing "Critical rules" section (near the end of the file), add:

```markdown
## Sequential Execution Constraint

**Never run `use_figma` calls in parallel.** Concurrent writes cause silent corruption in Figma — nodes get misplaced, properties get dropped, or entire frames disappear. This applies to:

- Multiple `use_figma` calls in the same skill step
- Subagent fan-out patterns where agents share a file
- Parallel task execution touching the same Figma file

Always execute `use_figma` calls sequentially. If a skill needs multiple calls (e.g., one per card), await each before starting the next.

Source: Augment Multi-Agent skills (AugmentedAJ/skills), confirmed by Figma MCP documentation.
```

- [ ] **Step 3: Add "HUG sizing" section**

After the sequential constraint section, add:

```markdown
## HUG Sizing Default

Figma defaults new frames to `FIXED` width of 100px. Every frame created via `use_figma` must explicitly set sizing:

```js
frame.layoutSizingHorizontal = 'HUG';  // or 'FILL'
frame.layoutSizingVertical = 'HUG';    // or 'FILL'
```

Never rely on Figma's default. A frame left as FIXED 100px will clip content or leave whitespace.

Source: Component Contracts (nvillapiano/component-contracts-figma).
```

- [ ] **Step 4: Add "Ghost mode prevention" section**

```markdown
## Ghost Mode Prevention

After binding a variable to a node, call `setExplicitVariableModeForCollection` on the nearest ancestor that defines the mode. Without this, Figma may resolve the variable in the wrong mode (e.g., showing Explorer theme values when Actian is intended).

```js
// After binding variables to a frame:
const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
frame.setExplicitVariableModeForCollection(collection.id, modeId);
```

Source: Component Contracts (nvillapiano/component-contracts-figma).
```

- [ ] **Step 5: Add "Rate limits" section**

```markdown
## Rate Limits

Figma MCP enforces daily call limits:

| Plan | Limit |
|------|-------|
| Pro | 200 calls/day |
| Enterprise | 600 calls/day |

Each `use_figma`, `get_design_context`, `search_design_system`, etc. counts as one call. Plan skill implementations to minimize total calls:
- Batch multiple operations into a single `use_figma` call (up to 20KB)
- Cache `search_design_system` results — don't re-query for the same component/variable
- Use `get_metadata` for structure discovery, `get_design_context` only for content extraction
```

- [ ] **Step 6: Commit**

```bash
git add plugins/actian-design-system/references/figma-output.md
git commit -m "docs: add sequential constraint, HUG sizing, ghost mode, rate limits to figma-output"
```

---

### Task 0.2: Add HUG sizing to quality-checklist.md

**Files:**
- Modify: `plugins/actian-design-system/references/quality-checklist.md`

- [ ] **Step 1: Read the current file**

Read `references/quality-checklist.md` to find the Universal section.

- [ ] **Step 2: Add HUG sizing check**

In the Universal section, after item 1 (Auto-layout on every frame), add a new item:

```markdown
2. **HUG/Fill sizing explicit** — Every frame created via `use_figma` has `layoutSizingHorizontal` and `layoutSizingVertical` explicitly set to `'HUG'` or `'FILL'`. Never rely on Figma's default (FIXED 100px).
```

Renumber subsequent items (old 2 becomes 3, etc.).

- [ ] **Step 3: Add ghost mode prevention check**

After the "Style check" item, add:

```markdown
N. **Variable mode set** — After binding DS2026 variables, `setExplicitVariableModeForCollection` is called on the nearest ancestor frame. No ghost mode resolution.
```

Renumber subsequent items.

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/references/quality-checklist.md
git commit -m "docs: add HUG sizing and ghost mode prevention to quality checklist"
```

---

### Task 0.3: Test `get_metadata` reliability

**Files:**
- No files modified — investigation only

This task validates whether `get_metadata` works reliably in a fresh session. It broke in the previous session after extended use.

- [ ] **Step 1: Call `get_metadata` on DS2026 library root**

```
get_metadata(file_key: "l8biHxfarNi1I2RMvVxVOK")
```

Expected: Returns sparse XML with page names, node IDs, and component structure. Record whether it succeeds or fails.

- [ ] **Step 2: Call `get_metadata` on a specific component page**

Pick a known component page (e.g., Button). Call:

```
get_metadata(file_key: "l8biHxfarNi1I2RMvVxVOK", node_id: "<button-page-node-id>")
```

Expected: Returns XML structure of the Button page with frame names.

- [ ] **Step 3: Call `get_metadata` on the Accessibility page**

```
get_metadata(file_key: "l8biHxfarNi1I2RMvVxVOK", node_id: "12685:19373")
```

Expected: Returns XML with 23 frame names for the Accessibility page.

- [ ] **Step 4: Document results**

If all 3 calls succeed → `get_metadata` is reliable in fresh sessions (previous failure was context-length related).
If any fail → `get_metadata` is unreliable and Phase 1 must use `get_design_context` + `get_screenshot` instead.

Record findings in a comment on this task or in the plan doc.

---

### Task 0.4: Test `use_figma` variable extraction on DS2026 library

**Files:**
- No files modified — investigation only

This task validates whether we can call Plugin API read methods on the library file.

- [ ] **Step 1: Test `getLocalVariablesAsync()` on DS2026 library**

```
use_figma(file_key: "l8biHxfarNi1I2RMvVxVOK", code: `
  const vars = await figma.variables.getLocalVariablesAsync();
  return { count: vars.length, sample: vars.slice(0, 3).map(v => ({ name: v.name, key: v.key, resolvedType: v.resolvedType })) };
`)
```

Expected: Returns variable count and 3 sample variables with names matching `variables.md` (e.g., "background-bg-default", "Brand/primary").

- [ ] **Step 2: Test `getLocalTextStylesAsync()`**

```
use_figma(file_key: "l8biHxfarNi1I2RMvVxVOK", code: `
  const styles = await figma.getLocalTextStylesAsync();
  return { count: styles.length, sample: styles.slice(0, 3).map(s => ({ name: s.name, key: s.key, fontSize: s.fontSize, fontName: s.fontName })) };
`)
```

Expected: Returns text style count and 3 samples with font specs (Roboto family, various sizes/weights).

- [ ] **Step 3: Test `getLocalEffectStylesAsync()`**

```
use_figma(file_key: "l8biHxfarNi1I2RMvVxVOK", code: `
  const styles = await figma.getLocalEffectStylesAsync();
  return { count: styles.length, sample: styles.slice(0, 3).map(s => ({ name: s.name, key: s.key, effects: s.effects })) };
`)
```

Expected: Returns effect style count and 3 samples with shadow parameters (type, color, offset, radius, spread).

- [ ] **Step 4: Test variable value resolution per mode**

```
use_figma(file_key: "l8biHxfarNi1I2RMvVxVOK", code: `
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const colorCollection = collections.find(c => c.name === 'Color');
  if (!colorCollection) return { error: 'No Color collection found', collections: collections.map(c => c.name) };

  const modes = colorCollection.modes;
  const vars = await figma.variables.getLocalVariablesAsync();
  const themePrimary = vars.find(v => v.name.includes('theme-primary') || v.name.includes('Brand/primary'));
  if (!themePrimary) return { error: 'theme-primary not found' };

  const values = {};
  for (const mode of modes) {
    values[mode.name] = themePrimary.valuesByMode[mode.modeId];
  }
  return { variable: themePrimary.name, key: themePrimary.key, modes: modes.map(m => m.name), values };
`)
```

Expected: Returns 3 mode names (Actian, Studio, Explorer) with different RGBA values for `theme-primary`. This confirms per-mode value extraction works.

- [ ] **Step 5: Document results**

Record: total variable count, total text style count, total effect style count, mode names, and whether per-mode values are accessible. This data is needed to design the sync skill's extraction phase.

---

### Task 0.5: Test content extraction on complex guideline frames

**Files:**
- No files modified — investigation only

- [ ] **Step 1: Test on a table-heavy frame**

Find a component guidelines page with tabular content (e.g., Button design guidelines). Call `get_design_context` on it.

Expected: Headings, body text, and table rows extracted as structured text.

- [ ] **Step 2: Test on a do/don't frame**

Find a component page with do/don't examples. Call `get_design_context` on the frame.

Expected: Do/don't pairs extracted with their labels and descriptions.

- [ ] **Step 3: Test on the Accessibility page (12685:19373)**

Call `get_design_context` on 2-3 of the 23 frames (pick one general checklist frame and one component-specific P0/P1/P2 frame).

Expected: Checklist items extracted with bullet structure, sub-items preserved, priority labels visible.

- [ ] **Step 4: Test on a Foundation page (e.g., Typography)**

Call `get_design_context` on a foundation page frame.

Expected: Foundation specifications (scale, weights, line heights) extracted as structured text.

- [ ] **Step 5: Document extraction quality**

For each test, rate: Complete / Partial / Broken. Note any content types that don't survive extraction (images, nested components, color swatches). This determines whether `get_design_context` alone is sufficient or if `get_screenshot` supplements are needed.

---

## Phase 1 — Build `/sync-design-system` Skill

**Depends on:** Phase 0 Tasks 0.3, 0.4, 0.5 (investigation results inform extraction approach)

This phase builds the new sync skill that replaces the Assembler pipeline. The skill has 7 internal phases, implemented as tasks below.

---

### Task 1.1: Create sync-design-system skill scaffold

**Files:**
- Create: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p plugins/actian-design-system/skills/sync-design-system
```

- [ ] **Step 2: Write the SKILL.md frontmatter and overview**

```markdown
---
name: sync-design-system
description: Extract components, variables, styles, guidelines, and foundations from DS2026 and FM Kit Figma libraries directly via MCP tools. Replaces the Assembler-based sync pipeline. Produces static reference files (Markdown, JSON, CSS) consumed by all other skills. Triggers when the user asks to sync, refresh, or update design system data, tokens, or guidelines.
argument-hint: "[phase name, 'all', or 'validate']"
---

# Sync Design System from Figma

Extract design system data directly from Figma libraries via MCP tools, replacing the Assembler intermediary.

> **Mode: Extract + Transform.** Read-only on Figma. Writes static files to `docs/` and `tokens/`. Never modifies the Figma library.

## Why this skill exists

The Assembler repo was a sync intermediary: Figma → Assembler (npm run sync) → GitHub → Plugin (sync-from-upstream.sh). This added latency, a maintenance burden, and a second repo to keep in sync. Figma MCP now provides direct access to everything the Assembler extracted.

## Input

The user specifies what to sync:

- **Single phase:** "Sync components" / "Sync variables" / "Sync styles" / "Sync guidelines" / "Sync foundations"
- **All phases:** "Sync design system" or "Sync all"
- **Validate only:** "Validate sync" — diffs current files against Figma without overwriting

## Source libraries

| Library | File key | What it contains |
|---------|----------|-----------------|
| DS2026 | `l8biHxfarNi1I2RMvVxVOK` | 77 components, variables (3 themes), text styles, effect styles, guidelines, foundations |
| FM Kit | `X2JSEUyLvxyNCx22ucOexn` | 29 wireframe components |
| Meta Kit | `osoeCLcrWqfoq8TvLQoyh0` | 6 skill-output components |

## Output files

| File | Phase | Description |
|------|-------|-------------|
| `docs/ds2026-components.md` | 1 | 77 DS2026 component sets with variant axes, properties, keys |
| `docs/fm-components.md` | 1 | 29 FM Kit component sets |
| `docs/meta-kit/components.md` | 1 | Meta Kit component catalog |
| `docs/meta-kit/variables.md` | 2 | All DS2026 variables with keys, types, scopes, per-mode values |
| `docs/meta-kit/text-styles.md` | 3 | All text styles with font specs |
| `docs/meta-kit/effect-styles.md` | 3 | All effect styles with shadow params |
| `docs/token-reference.md` | 4 | Human-readable token reference (3 themes) |
| `tokens/tokens.css` | 4 | CSS custom properties `--zen-*` |
| `tokens/actian-ds.tokens.json` | 4 | W3C DTCG format |
| `docs/component-guidelines/*.json` | 5 | Per-component guidelines (44+) |
| `docs/foundations/*.json` | 6 | Foundation docs (11 pages) |
| `docs/content-guidelines.md` | 6 | Content guidelines (replaces hand-authored) |
| `docs/accessibility-guidelines.md` | 6 | Accessibility guidelines (replaces hand-authored) |

## Phases

Run phases sequentially. Each phase reads from Figma, transforms data, and writes output files.

### Phase 1 — Components
### Phase 2 — Variables
### Phase 3 — Styles
### Phase 4 — Token files
### Phase 5 — Component guidelines
### Phase 6 — Foundations + Content + Accessibility
### Phase 7 — Validation
```

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: scaffold sync-design-system skill"
```

---

### Task 1.2: Implement Phase 1 — Component extraction

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

This phase extracts component sets from all 3 libraries and writes the component catalog files.

- [ ] **Step 1: Design the extraction approach**

For each library, use `search_design_system` to discover all components, then use `use_figma` to get detailed variant axes and properties:

```js
// In use_figma call on the library file:
const componentSets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
return componentSets.map(cs => ({
  name: cs.name,
  key: cs.key,
  description: cs.description,
  variantAxes: Object.keys(cs.variantGroupProperties || {}),
  variants: cs.children.map(v => ({
    name: v.name,
    key: v.key,
  })),
  properties: Object.entries(cs.componentPropertyDefinitions || {}).map(([name, def]) => ({
    name,
    type: def.type,
    defaultValue: def.defaultValue,
  })),
}));
```

- [ ] **Step 2: Write Phase 1 instructions in SKILL.md**

Add detailed instructions under the "Phase 1 — Components" heading. Include:
- The `use_figma` code to extract component sets from DS2026 library
- The `use_figma` code to extract from FM Kit library
- The `use_figma` code to extract from Meta Kit library
- The Markdown template for each output file (matching existing format in `ds2026-components.md`)
- Error handling: if a library file is inaccessible, log warning and continue

- [ ] **Step 3: Verify output format matches existing files**

Read current `docs/ds2026-components.md` and `docs/fm-components.md` to capture the exact Markdown format. The new extraction must produce identical structure so downstream skills don't break.

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: implement Phase 1 component extraction in sync-design-system"
```

---

### Task 1.3: Implement Phase 2 — Variable extraction

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

- [ ] **Step 1: Write the extraction code**

```js
// In use_figma call on DS2026 library:
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();

const result = [];
for (const collection of collections) {
  const collectionVars = vars.filter(v => v.variableCollectionId === collection.id);
  result.push({
    collection: collection.name,
    modes: collection.modes.map(m => ({ name: m.name, modeId: m.modeId })),
    variables: collectionVars.map(v => ({
      name: v.name,
      key: v.key,
      resolvedType: v.resolvedType,
      scopes: v.scopes,
      valuesByMode: Object.fromEntries(
        collection.modes.map(m => [m.name, v.valuesByMode[m.modeId]])
      ),
    })),
  });
}
return result;
```

- [ ] **Step 2: Write Phase 2 instructions in SKILL.md**

Add under "Phase 2 — Variables":
- The `use_figma` extraction code
- Transform logic: convert RGBA objects to hex strings, resolve aliases to final values
- Output template for expanded `docs/meta-kit/variables.md` — must include ALL variables (not just the current 15), with columns: Variable, Key, Actian, Studio, Explorer, Purpose
- Group by collection (Color, Spacing, Border, Size, etc.)

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: implement Phase 2 variable extraction in sync-design-system"
```

---

### Task 1.4: Implement Phase 3 — Style extraction

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`
- Create: `plugins/actian-design-system/docs/meta-kit/text-styles.md` (template — actual content generated by skill)
- Create: `plugins/actian-design-system/docs/meta-kit/effect-styles.md` (template — actual content generated by skill)

- [ ] **Step 1: Write text style extraction code**

```js
const textStyles = await figma.getLocalTextStylesAsync();
return textStyles.map(s => ({
  name: s.name,
  key: s.key,
  fontFamily: s.fontName.family,
  fontWeight: s.fontName.style,
  fontSize: s.fontSize,
  lineHeight: s.lineHeight,
  letterSpacing: s.letterSpacing,
  textDecoration: s.textDecoration,
  textCase: s.textCase,
}));
```

- [ ] **Step 2: Write effect style extraction code**

```js
const effectStyles = await figma.getLocalEffectStylesAsync();
return effectStyles.map(s => ({
  name: s.name,
  key: s.key,
  effects: s.effects.map(e => ({
    type: e.type,
    color: e.color,
    offset: e.offset,
    radius: e.radius,
    spread: e.spread,
    visible: e.visible,
  })),
}));
```

- [ ] **Step 3: Write Phase 3 instructions in SKILL.md**

Include extraction code, transform logic, and output templates for both new files:

`docs/meta-kit/text-styles.md` format:
```markdown
# Meta Kit — Text Styles

DS2026 text styles for binding via `figma.importStyleByKeyAsync(key)`.

| Style | Key | Font | Size | Weight | Line Height | Letter Spacing |
|-------|-----|------|------|--------|-------------|----------------|
| heading-1 | `abc...` | Roboto | 32 | Bold | 40 | 0 |
```

`docs/meta-kit/effect-styles.md` format:
```markdown
# Meta Kit — Effect Styles

DS2026 effect styles for binding via `figma.importStyleByKeyAsync(key)`.

| Style | Key | Type | Color | X | Y | Blur | Spread |
|-------|-----|------|-------|---|---|------|--------|
| shadow-xs | `def...` | DROP_SHADOW | rgba(0,0,0,0.08) | 0 | 1 | 2 | 0 |
```

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git add plugins/actian-design-system/docs/meta-kit/text-styles.md
git add plugins/actian-design-system/docs/meta-kit/effect-styles.md
git commit -m "feat: implement Phase 3 style extraction in sync-design-system"
```

---

### Task 1.5: Implement Phase 4 — Token file generation

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

- [ ] **Step 1: Write Phase 4 instructions**

Phase 4 transforms the extracted variables (from Phase 2) into 3 output formats:

1. **`docs/token-reference.md`** — Human-readable Markdown with 3-column theme table
2. **`tokens/tokens.css`** — CSS custom properties with `--zen-*` prefix, `[data-theme="actian"]` / `[data-theme="studio"]` / `[data-theme="explorer"]` selectors
3. **`tokens/actian-ds.tokens.json`** — W3C DTCG format

Include the exact template for each format, referencing the current file structure. The skill reads Phase 2's variable data and generates all 3 files.

- [ ] **Step 2: Document the CSS generation template**

```css
/* Generated by /sync-design-system Phase 4 — do not edit manually */
/* Source: Actian Design System v1.1.0 (l8biHxfarNi1I2RMvVxVOK) */

:root,
[data-theme="actian"] {
  --zen-color-theme-primary: #0550DC;
  /* ... all color variables ... */
  --zen-spacing-2xs: 4px;
  /* ... all spacing variables ... */
}

[data-theme="studio"] {
  --zen-color-theme-primary: #7B2FBE;
  /* ... overrides only ... */
}

[data-theme="explorer"] {
  --zen-color-theme-primary: #00875A;
  /* ... overrides only ... */
}
```

- [ ] **Step 3: Document the DTCG JSON template**

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "theme": {
      "primary": {
        "$type": "color",
        "$value": "#0550DC",
        "$extensions": {
          "com.figma": {
            "variableKey": "a256...",
            "scopes": ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"]
          },
          "modes": {
            "actian": "#0550DC",
            "studio": "#7B2FBE",
            "explorer": "#00875A"
          }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: implement Phase 4 token file generation in sync-design-system"
```

---

### Task 1.6: Implement Phase 5 — Component guidelines extraction

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

- [ ] **Step 1: Design the page discovery approach**

Use `get_metadata` (if reliable per Task 0.3) or `use_figma` to enumerate all pages in the DS2026 file, then identify component pages by naming convention.

```js
// In use_figma on DS2026:
const pages = figma.root.children.map(p => ({ name: p.name, id: p.id }));
return pages;
```

- [ ] **Step 2: Design per-component extraction**

For each component page, find the named frames (Content guidelines, Design guidelines, Components, ready made examples, Screenshots, Behavior demo) and extract text content via `get_design_context`:

```
get_design_context(file_key: "l8biHxfarNi1I2RMvVxVOK", node_id: "<frame-node-id>")
```

- [ ] **Step 3: Write Phase 5 instructions**

Include:
- Page discovery code
- Frame name matching logic (same as existing `sync-guidelines` skill — reference its frame name table)
- `get_design_context` extraction per frame
- Transform: parse React+Tailwind output into structured JSON matching existing `component-guidelines/*.json` format
- Output: one JSON file per component, plus `_index.json`
- Error handling: skip pages with no matching frames, log warnings

- [ ] **Step 4: Verify JSON format matches existing guidelines**

Read 2-3 existing `docs/component-guidelines/*.json` files to capture the exact JSON schema. New extraction must produce identical structure.

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: implement Phase 5 component guidelines extraction in sync-design-system"
```

---

### Task 1.7: Implement Phase 6 — Foundations + Content + Accessibility

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

- [ ] **Step 1: Map foundation page node IDs**

Use `use_figma` on DS2026 to discover all foundation pages:

```js
const pages = figma.root.children;
const foundationPages = pages.filter(p =>
  ['Accessibility', 'Borders', 'Breakpoint, Grid & Structure', 'Color',
   'Content guidelines', 'Elevation', 'Icons', 'Interaction & motion',
   'Spacing', 'Typography', 'Usage example'].some(name =>
    p.name.toLowerCase().includes(name.toLowerCase())
  )
);
return foundationPages.map(p => ({ name: p.name, id: p.id, childCount: p.children.length }));
```

- [ ] **Step 2: Write foundation extraction instructions**

For each foundation page:
1. Get top-level frames via `use_figma` (name + id)
2. Extract content from each frame via `get_design_context`
3. Transform into JSON matching existing `foundations/*.json` format

- [ ] **Step 3: Write Content guidelines extraction**

Target page node ID: `7397:3249` (10 frames).

```
get_design_context(file_key: "l8biHxfarNi1I2RMvVxVOK", node_id: "7397:3249")
```

Transform extracted text into Markdown format replacing hand-authored `docs/content-guidelines.md`. Preserve all sections: words to avoid, capitalization, writing style, numerical formatting, punctuation, prepositions, acronyms, plurals, abbreviations.

- [ ] **Step 4: Write Accessibility guidelines extraction**

Target page node ID: `12685:19373` (23 frames covering WCAG principles, general checklist, ARIA guidance, component-specific P0/P1/P2 checklists).

Extract frame-by-frame, transform into Markdown replacing hand-authored `docs/accessibility-guidelines.md`.

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: implement Phase 6 foundations and guidelines extraction in sync-design-system"
```

---

### Task 1.8: Implement Phase 7 — Validation

**Files:**
- Modify: `plugins/actian-design-system/skills/sync-design-system/SKILL.md`

- [ ] **Step 1: Write validation logic**

Phase 7 runs after all extraction phases. It:
1. Diffs each output file against its previous version (using `git diff`)
2. Counts additions, deletions, and modifications
3. Presents a summary to the user for approval before committing

```markdown
### Phase 7 — Validation

After all phases complete, present a sync report:

1. Run `git diff --stat docs/ tokens/` to see all changed files
2. For each changed file, summarize: lines added, lines removed, key changes
3. Flag any unexpected changes (e.g., component count decreased, variable removed)
4. Ask user to review and approve before committing

Output format:
\```
## Sync Report

| File | Status | Changes |
|------|--------|---------|
| docs/ds2026-components.md | Updated | +3 components, -0 |
| docs/meta-kit/variables.md | Updated | +45 variables (was 15, now 60) |
| docs/content-guidelines.md | Replaced | Hand-authored → Figma-extracted |
| tokens/tokens.css | Updated | +12 new tokens |

### Warnings
- ⚠ Button component missing "Destructive" variant axis (previously present)
- ⚠ 2 variables removed: old-deprecated-1, old-deprecated-2

Approve? [y/n]
\```
```

- [ ] **Step 2: Commit**

```bash
git add plugins/actian-design-system/skills/sync-design-system/SKILL.md
git commit -m "feat: implement Phase 7 validation in sync-design-system"
```

---

### Task 1.9: Update CLAUDE.md data flow documentation

**Files:**
- Modify: `plugins/actian-design-system/CLAUDE.md`

- [ ] **Step 1: Update the data flow diagram**

Replace the current data flow:

```
Figma libraries → Assembler (npm run sync) → Plugin (scripts/sync-from-upstream.sh)
```

With:

```
Figma libraries → /sync-design-system skill (MCP tools) → Plugin docs/tokens/
```

- [ ] **Step 2: Update the reference files table**

Change "Source" column for all files that were "Synced from Assembler" to "Extracted via /sync-design-system". Add new files:
- `docs/meta-kit/text-styles.md` — Extracted via `/sync-design-system`
- `docs/meta-kit/effect-styles.md` — Extracted via `/sync-design-system`

- [ ] **Step 3: Add note about legacy sync script**

```markdown
### Legacy sync (deprecated)

`scripts/sync-from-upstream.sh` syncs from the Assembler GitHub repo. This is being replaced by `/sync-design-system` which extracts directly from Figma. The script remains available as a fallback.
```

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/CLAUDE.md
git commit -m "docs: update CLAUDE.md data flow to reflect direct Figma MCP extraction"
```

---

### Task 1.10: First full sync test run

**Files:**
- Multiple docs and token files will be overwritten

- [ ] **Step 1: Run `/sync-design-system all`**

Execute the full skill end-to-end. This will call Figma MCP tools across all 7 phases.

- [ ] **Step 2: Review the validation report (Phase 7)**

Check:
- Component counts match expected (77 DS2026, 29 FM, 6 Meta Kit)
- Variable count is significantly higher than current 15
- Text styles and effect styles files are populated
- Guidelines JSON files match existing structure
- Content and accessibility Markdown is comprehensive

- [ ] **Step 3: Spot-check extracted data**

Compare 2-3 variables against `search_design_system` results to verify keys match. Compare 1 component's guidelines JSON against the Figma page visually.

- [ ] **Step 4: Estimate rate limit usage**

Count total MCP calls made during the full sync. Verify it fits within the daily limit (200 Pro / 600 Enterprise).

- [ ] **Step 5: Commit if approved**

```bash
git add docs/ tokens/
git commit -m "feat: first full sync via /sync-design-system skill (v1.13.0)"
```

---

## Phase 2 — Design-Audit Enhancements

**Depends on:** Phase 0 complete (community learnings applied). Independent of Phase 1.

---

### Task 2.1: Add confidence scores to design-audit

**Files:**
- Modify: `plugins/actian-design-system/skills/design-audit/SKILL.md`

- [ ] **Step 1: Read the current design-audit skill**

Read `skills/design-audit/SKILL.md` fully to understand the current output format.

- [ ] **Step 2: Add confidence scoring system**

After the "Output format" section, add a confidence scoring system inspired by Edenspiekermann:

```markdown
### Confidence scores

Every finding must include a confidence score (0.0–1.0):

| Score | Meaning | When to use |
|-------|---------|------------|
| 0.9–1.0 | Certain | Token value directly visible in `get_design_context` output, contrast ratio calculated |
| 0.7–0.8 | High | Structure strongly suggests violation (e.g., frame without auto-layout, text without style) |
| 0.5–0.6 | Medium | Inferred from screenshot or partial data (e.g., color looks off but hex not extractable) |
| 0.3–0.4 | Low | Based on naming conventions or indirect evidence only |
| 0.0–0.2 | Speculative | Flagged for manual review, insufficient data to confirm |

Include confidence in every finding row:

| # | Severity | Confidence | Finding | Rule | Fix |
|---|----------|------------|---------|------|-----|
| 1 | P0 | 0.95 | Button uses hardcoded #0550DC | Style check: zero hardcoded hex | Bind `theme-primary` variable |
```

- [ ] **Step 3: Add evidence standard**

```markdown
### Evidence standard

Every finding must cite what structure in the design proves the violation:

- **What:** The specific node/layer name where the issue exists
- **Expected:** What the design system rule requires
- **Actual:** What was observed (include hex values, pixel values, or node properties)
- **Why it matters:** Impact on users, consistency, or maintenance
```

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/skills/design-audit/SKILL.md
git commit -m "feat: add confidence scores and evidence standard to design-audit"
```

---

### Task 2.2: Add JSON output format to design-audit

**Files:**
- Modify: `plugins/actian-design-system/skills/design-audit/SKILL.md`

- [ ] **Step 1: Add JSON output option**

After the existing Markdown output format section, add:

```markdown
### JSON output (for programmatic consumption)

When the user requests JSON output or when the audit is consumed by another skill (e.g., `/fix-finding`), produce structured JSON:

\```json
{
  "audit": {
    "file": "Design Consistency 2026",
    "fileKey": "Z82GkL5d9Eu1HS5hMiEBBw",
    "nodeId": "10939-12809",
    "timestamp": "2026-03-26T14:30:00Z",
    "summary": {
      "total": 12,
      "p0": 3,
      "p1": 5,
      "p2": 4,
      "tokenCompliance": 0.78,
      "componentCount": { "library": 14, "adHoc": 3 }
    },
    "findings": [
      {
        "id": 1,
        "severity": "P0",
        "confidence": 0.95,
        "category": "token-usage",
        "finding": "Button uses hardcoded #0550DC instead of theme-primary variable",
        "node": "Frame 1 > Button > Fill",
        "nodeId": "1234:5678",
        "expected": "Bound to variable theme-primary (key: a256...)",
        "actual": "Hardcoded fill #0550DC",
        "rule": "Style check: zero hardcoded hex values",
        "fix": "Bind theme-primary variable to fill property",
        "fixType": "bind-tokens",
        "autoFixable": true
      }
    ]
  }
}
\```

The `fixType` field classifies fixes (matching Edenspiekermann's taxonomy):
- `swap-instance` — Replace ad-hoc element with library component
- `bind-tokens` — Bind variable/style to property
- `align-variant` — Switch to correct variant
- `compose-from-primitives` — Build from library primitives
- `blocked` — Cannot be auto-fixed (needs design decision)
```

- [ ] **Step 2: Commit**

```bash
git add plugins/actian-design-system/skills/design-audit/SKILL.md
git commit -m "feat: add JSON output format with fix taxonomy to design-audit"
```

---

### Task 2.3: Build fix-finding companion skill

**Files:**
- Create: `plugins/actian-design-system/skills/fix-finding/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p plugins/actian-design-system/skills/fix-finding
```

- [ ] **Step 2: Write the SKILL.md**

```markdown
---
name: fix-finding
description: Fix a single design-audit finding in Figma. Takes a finding from the design-audit JSON output and applies the fix via use_figma. Supports fix types: swap-instance (replace with library component), bind-tokens (bind variable/style), align-variant (switch variant), compose-from-primitives (build from library). Triggers when the user asks to fix a specific audit finding, apply a fix, or resolve a design system violation.
argument-hint: "[finding ID or description from audit report]"
---

# Fix Design System Finding

Apply a single fix from a `/design-audit` report to a Figma file.

> **Mode: Write.** This skill modifies the Figma file via `use_figma`. Each fix is atomic — one finding, one fix, one verification.

## Why this skill exists

`/design-audit` identifies problems. This skill fixes them. Together they form an audit→fix pipeline that progressively brings designs into compliance with DS2026.

## Input

The user provides either:
- A finding ID from a previous audit report (e.g., "Fix finding #3")
- A description of the issue (e.g., "Fix the hardcoded blue on the login button")
- A Figma URL + description of what to fix

## Fix types

### swap-instance
Replace an ad-hoc element with the correct library component.

1. Identify the target node via `get_design_context` or node ID from audit
2. Find the correct library component via `search_design_system`
3. Import component: `figma.importComponentByKeyAsync(key)`
4. Create instance and position at the same location as the original
5. Copy over any text content from the original
6. Delete the original node

### bind-tokens
Bind a variable or style to a node property.

1. Identify the target node
2. Import the correct variable: `figma.variables.importVariableByKeyAsync(key)`
3. Bind: `node.setBoundVariable('fills', 0, variable)` (for fills)
4. Or import style: `figma.importStyleByKeyAsync(key)` and assign `node.fillStyleId = style.id`
5. Call `setExplicitVariableModeForCollection` on nearest ancestor

### align-variant
Switch a component instance to the correct variant.

1. Identify the instance node
2. Set the correct variant properties: `instance.setProperties({ "Property": "Value" })`

### compose-from-primitives
Build a complex element from library primitives when no single component matches.

1. Import required primitive components
2. Create a container frame with auto-layout
3. Compose primitives inside the container
4. Position at the original element's location
5. Delete the original

### blocked
Cannot be auto-fixed. Present the finding details and explain why manual intervention is needed.

## Verification

After every fix:
1. Call `get_screenshot` on the fixed node
2. Verify the fix visually
3. Report: "Fixed finding #N: [description]. Confidence: [score]"

## Output

Single-line confirmation per fix:
```
✓ Finding #3 fixed (bind-tokens, confidence 0.95): Bound theme-primary to Button fill
```

If the fix fails or produces unexpected results:
```
✗ Finding #3 failed: [reason]. Manual review needed.
```
```

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/skills/fix-finding/SKILL.md
git commit -m "feat: add fix-finding companion skill for design-audit pipeline"
```

---

### Task 2.4: Update plugin metadata

**Files:**
- Modify: `plugins/actian-design-system/.claude-plugin/plugin.json`
- Modify: `plugins/actian-design-system/.claude-plugin/marketplace.json` (if exists)

- [ ] **Step 1: Bump version to 1.13.0**

This is a MINOR bump — new skills (`sync-design-system`, `fix-finding`) and new features (confidence scores, JSON output).

Update `plugin.json`:
```json
"version": "1.13.0"
```

- [ ] **Step 2: Update description to mention new skills**

Update the `description` field to include sync and fix capabilities.

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/.claude-plugin/plugin.json plugins/actian-design-system/.claude-plugin/marketplace.json
git commit -m "chore: bump version to 1.13.0 for sync-design-system and fix-finding skills"
```

---

## Phase 3 — Meta Kit Phase 2

**Depends on:** Phase 1 Task 1.10 (full sync provides complete variable/style data needed for components).

This phase builds the remaining 12 Meta Kit components. Each task creates 2-3 components to keep `use_figma` calls manageable.

---

### Task 3.1: Build Pointer Badge + Dimension Annotation

**Files:**
- Modify: `plugins/actian-design-system/docs/meta-kit/components.md` (add new component entries)
- The actual Figma components are built via `use_figma` on the Meta Kit library file

- [ ] **Step 1: Design Pointer Badge component**

Used by component-brief Card 3 (Anatomy — pink dimension lines and callout labels).

Properties:
- `Label` (text) — e.g., "24px", "spacing-md"
- `Direction` (variant) — Left, Right, Up, Down
- Color: status-error-primary (#C10C0D) for the line, white bg for label

Build via `use_figma` on Meta Kit file (`osoeCLcrWqfoq8TvLQoyh0`):
```js
// Create component set with 4 direction variants
// Each variant: auto-layout frame with line + label
// Line: 1px stroke, status-error-primary color
// Label: Inter 10px, background-bg-default fill, 4px padding
```

- [ ] **Step 2: Design Dimension Annotation component**

Used by component-brief Card 3 for dimension callouts between elements.

Properties:
- `Value` (text) — e.g., "16px", "spacing-sm"
- `Orientation` (variant) — Horizontal, Vertical

Build via `use_figma`.

- [ ] **Step 3: Publish and record keys**

After creating both components:
1. Publish the Meta Kit library in Figma
2. Record the component keys
3. Update `docs/meta-kit/components.md` with new entries

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/docs/meta-kit/components.md
git commit -m "feat: add Pointer Badge and Dimension Annotation to Meta Kit"
```

---

### Task 3.2: Build Color Swatch + Contrast Badge

**Files:**
- Modify: `plugins/actian-design-system/docs/meta-kit/components.md`

- [ ] **Step 1: Design Color Swatch component**

Used by component-brief Card 4 (Design tokens — 12px color dots) and Card 8 (Accessibility — contrast table swatches).

Properties:
- `Color` (fill) — bound to variable at runtime
- `Size` (variant) — Small (12px), Medium (24px), Large (40px)
- Shape: circle (corner radius 9999)

- [ ] **Step 2: Design Contrast Badge component**

Used by component-brief Card 8 (Accessibility — Pass/Exempt badges in contrast table).

Properties:
- `Label` (text) — "Pass", "Exempt", "Fail"
- `Status` (variant) — Pass (green), Exempt (gray), Fail (red)

- [ ] **Step 3: Build both in Meta Kit, publish, record keys, update docs**

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/docs/meta-kit/components.md
git commit -m "feat: add Color Swatch and Contrast Badge to Meta Kit"
```

---

### Task 3.3: Build Accessibility Card + Theme Card + Stat Card

**Files:**
- Modify: `plugins/actian-design-system/docs/meta-kit/components.md`

- [ ] **Step 1: Design Accessibility Card**

Used by component-brief Card 7/8. Container for WCAG requirements with P0/P1/P2 severity badges.

Properties:
- `Title` (text)
- `Content` (slot — detach to append)
- `Mode` (variant) — DS, FM

- [ ] **Step 2: Design Theme Card**

Used by component-brief for theme comparison views.

Properties:
- `Theme` (variant) — Actian, Studio, Explorer
- `Content` (slot)

- [ ] **Step 3: Design Stat Card**

Used by presentations for data visualization callouts.

Properties:
- `Value` (text) — e.g., "94%"
- `Label` (text) — e.g., "WCAG AA compliance"
- `Trend` (variant) — Up, Down, Neutral

- [ ] **Step 4: Build all 3, publish, record keys, update docs**

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/docs/meta-kit/components.md
git commit -m "feat: add Accessibility Card, Theme Card, and Stat Card to Meta Kit"
```

---

### Task 3.4: Build Slide Frame + Flow Cover Card

**Files:**
- Modify: `plugins/actian-design-system/docs/meta-kit/components.md`

- [ ] **Step 1: Design Slide Frame**

Used by generate-presentation as the container for each slide.

Properties:
- `Type` (variant) — Cover, Body, Section, Back Cover
- `Title` (text)
- `Subtitle` (text)
- `Content` (slot)
- Dimensions: 1920×1080px

- [ ] **Step 2: Design Flow Cover Card**

Used by generate-flow as the dark cover card at the start of each sub-flow.

Properties:
- `Feature` (text)
- `Flow` (text)
- `User` (text)
- Dimensions: 400×300px, dark background (background-bg-reverse)

- [ ] **Step 3: Build both, publish, record keys, update docs**

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/docs/meta-kit/components.md
git commit -m "feat: add Slide Frame and Flow Cover Card to Meta Kit"
```

---

### Task 3.5: Build Research Frame + Actian Pyramid + Geometric Overlay

**Files:**
- Modify: `plugins/actian-design-system/docs/meta-kit/components.md`

- [ ] **Step 1: Design Research Frame**

Used by presentations for research findings layouts.

Properties:
- `Title` (text)
- `Source` (text)
- `Content` (slot)

- [ ] **Step 2: Design Actian Pyramid**

Brand element used on cover slides and section dividers.

Properties:
- `Size` (variant) — Small, Medium, Large
- `Color` (fill) — theme-primary

- [ ] **Step 3: Design Geometric Overlay**

Background decoration used on cover and divider slides.

Properties:
- `Style` (variant) — Gradient, Solid, Transparent
- `Position` (variant) — TopRight, BottomLeft, Center

- [ ] **Step 4: Build all 3, publish, record keys, update docs**

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/docs/meta-kit/components.md
git commit -m "feat: add Research Frame, Actian Pyramid, and Geometric Overlay to Meta Kit"
```

---

### Task 3.6: Run /sync-design-system to capture new Meta Kit components

**Files:**
- Modify: `plugins/actian-design-system/docs/meta-kit/components.md` (via sync)

- [ ] **Step 1: Run `/sync-design-system components`**

Extract updated component catalog from Meta Kit library to verify all 18 components (6 original + 12 new) are captured.

- [ ] **Step 2: Verify component count and keys**

Check that `docs/meta-kit/components.md` now lists all 18 components with correct keys and properties.

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/docs/meta-kit/components.md
git commit -m "docs: sync Meta Kit component catalog after Phase 2 build"
```

---

## Phase 4 — Cleanup & Cutover

**Depends on:** Phase 1 and Phase 3 complete.

---

### Task 4.1: Deprecate sync-from-upstream.sh

**Files:**
- Modify: `plugins/actian-design-system/scripts/sync-from-upstream.sh`

- [ ] **Step 1: Add deprecation notice**

Add to the top of the script (after the shebang):

```bash
echo ""
echo -e "${YELLOW}⚠  DEPRECATED: This script syncs from the Assembler repo.${NC}"
echo -e "${YELLOW}   Use '/sync-design-system' skill instead for direct Figma extraction.${NC}"
echo -e "${YELLOW}   This script will be removed in a future version.${NC}"
echo ""
```

- [ ] **Step 2: Commit**

```bash
git add plugins/actian-design-system/scripts/sync-from-upstream.sh
git commit -m "chore: add deprecation notice to sync-from-upstream.sh"
```

---

### Task 4.2: Update memory files

**Files:**
- Modify: memory files in `.claude/projects/.../memory/`

- [ ] **Step 1: Update project_overview.md**

Reflect new data flow: Figma → /sync-design-system → Plugin (not Assembler).

- [ ] **Step 2: Update project_status.md**

Mark completed: sync-design-system skill, fix-finding skill, design-audit enhancements, Meta Kit Phase 2.

- [ ] **Step 3: Update reference_registry.md**

Note that the Assembler repo is now deprecated as sync intermediary.

---

## Dependency Graph

```
Phase 0 (parallel):
  Task 0.1 (figma-output.md)     ─┐
  Task 0.2 (quality-checklist)    ─┤
  Task 0.3 (test get_metadata)    ─┼─→ Phase 1 (sequential)
  Task 0.4 (test use_figma)       ─┤     Task 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 1.10
  Task 0.5 (test extraction)      ─┘

Phase 2 (parallel with Phase 1, depends on Phase 0):
  Task 2.1 (confidence scores)  ─┐
  Task 2.2 (JSON output)        ─┼─→ Task 2.3 (fix-finding) → Task 2.4 (version bump)
                                 ─┘

Phase 3 (depends on Phase 1.10):
  Task 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6

Phase 4 (depends on Phase 1 + Phase 3):
  Task 4.1 (deprecate script)
  Task 4.2 (update memory)
```

## Estimated MCP Call Budget

| Phase | Estimated calls | Notes |
|-------|----------------|-------|
| Phase 0 investigation | ~15 | 3× get_metadata + 3× use_figma + ~9× get_design_context |
| Phase 1 full sync | ~60-80 | 3× use_figma (components) + 3× use_figma (vars/styles) + ~50× get_design_context (guidelines/foundations) |
| Phase 2 | ~5 | Testing audit on sample file |
| Phase 3 | ~15 | 5× use_figma batches for 12 components |
| **Total** | **~95-115** | Fits within Pro limit (200/day) if spread across 1-2 days |
