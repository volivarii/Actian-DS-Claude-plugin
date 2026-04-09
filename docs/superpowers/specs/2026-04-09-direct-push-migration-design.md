# Direct Push Migration — Remove Interpreter Pipeline

**Date:** 2026-04-09
**Status:** Approved
**Scope:** All Figma push skills (component-brief, generate-flow, generate-presentation, create-component)

## Problem

The current Figma push pipeline bundles a 24KB JavaScript interpreter (`figma-interpreter.min.js`) with JSON specs into monolithic call files (33-45KB each). Agents cannot reliably read, transmit, or execute these files, causing 25+ minute hangs on desktop.

Meanwhile, the generate-flow and generate-presentation skills already bypass this pipeline entirely — their SKILL.md files say "Do NOT run X-to-figma.js — push directly from your data model." They use small direct `use_figma` calls (200-2000 bytes each) and work reliably.

## Solution

Migrate all skills to the direct-push pattern. The agent reads its data model JSON and emits small `use_figma` calls directly. No interpreter, no codegen scripts, no generated files at push time.

## Architecture

**Before:** `data.json` → `X-to-figma.js` → `fill-N.js` (24KB interpreter + spec) → agent reads file → `use_figma`

**After:** `data.json` → agent reads JSON → agent emits 30-50 small `use_figma` calls (200-6000 bytes each)

Push patterns are documented in reference files. The agent constructs each call from the data model + patterns.

## Design Decisions

### Syntax highlighting dropped (Cards 8, 9)
Code blocks render as monochrome text (single color). Eliminates `setRangeFills()` and token-range computation. The HTML preview retains syntax coloring since it uses CSS classes, not Plugin API calls.

### Anatomy diagram kept (Card 3)
The closest-edge badge placement algorithm runs as a single ~4-6KB inline `use_figma` call. All bounding-box reads and node creation happen in one execution context. Documented as a dedicated push pattern.

### create-component also migrates
The interpreter's `buildComponent`/`buildComponentSet` functions are straightforward `createComponent()` → `addComponentProperty()` → `combineAsVariants()` sequences with no complex algorithms. The agent can write these directly in 3-5 small calls.

## What Changes

### New files

| File | Purpose |
|------|---------|
| `references/brief-push-patterns.md` | Brief-specific push patterns: card shell, tables, anatomy diagram, bullet rows, swatch cells, a11y cards, code blocks |
| `references/create-component/push-patterns.md` | Component creation push patterns: createComponent, addComponentProperty, combineAsVariants, propertyLinks |

### Modified files

| File | Change |
|------|--------|
| `skills/component-brief/SKILL.md` | Step 3 rewritten: direct push from data model using `references/brief-push-patterns.md`. No codegen step. |
| `skills/create-component/SKILL.md` | Step 5 rewritten: direct `use_figma` calls instead of `assembleCall()` one-liner |
| `references/figma-output.md` | Remove interpreter pipeline description, document direct-push as the architecture |
| `references/companion-context.md` | Remove X-to-figma.js references |
| `CLAUDE.md` | Remove script references, update pipeline description |
| `references/component-brief/data-schema.md` | Note that Card 8/9 code tokens render as monochrome in Figma |
| `shared-constants.js` | Remove codegen functions (see removal list below) |

### Removed files

| File | Reason |
|------|--------|
| `scripts/brief-to-figma.js` | Dead — brief skill uses direct push |
| `scripts/flow-to-figma.js` | Dead — flow skill says "Do NOT run" |
| `scripts/slide-to-figma.js` | Dead — slide skill says "Do NOT run" |
| `scripts/figma-interpreter.js` | No longer bundled into any call files |
| `scripts/figma-interpreter.min.js` | No longer bundled into any call files |
| `scripts/minify-interpreter.sh` | Maintained the removed interpreter |
| `tests/codegen-snapshots.test.js` | Tested the removed scripts |
| `tests/snapshots/` (entire directory) | Baselines for removed scripts |
| `references/generate-flow/figma-spec-builder.md` | Documented removed flow-to-figma pipeline |
| `references/generate-presentation/figma-spec-builder.md` | Documented removed slide-to-figma pipeline |
| `references/create-component/figma-spec-builder.md` | Documented removed assembleCall pipeline |
**Keep:** `examples/*.json` — referenced by skills as structural examples for data model generation.

### Removed from shared-constants.js

These functions are only used by the removed `-to-figma.js` scripts:

- `getInterpreterSource()` + `_interpreterCache`
- `getRuntimeSize()`
- `getMaxBinSize()`
- `assembleCall()`
- `writeCallFiles()` (V1)
- `writeCallFilesV2()` (V2 + store-and-execute)
- `reassembleCall()`
- `binPack()`

### Kept in shared-constants.js

Used by skills at data-model generation time (not push time):

- Registry loading: `loadRegistry()`, `getProperties()`
- Key maps: `META_KEYS`, `BRIEF_KEYS`, `TEMPLATE_KEYS`, `SLIDE_KEYS`, `FM_FALLBACK_KEYS`, `DS_KEYS`
- Slug maps: `META_SLUGS`, `BRIEF_SLUGS`, `TEMPLATE_SLUGS`, `SLIDE_SLUGS`, `FM_SLUGS`, `DS_SLUGS`
- Colors/palette: `TOKEN_COLORS`, `PALETTE`
- Generation log: `buildGenLog()`
- Utility: `compactSize()`

## Brief Push Sequence (component-brief)

~35-45 total `use_figma` calls, each 200-6000 bytes:

1. **Wrapper** (1 call) — Create wrapper frame, position below existing content
2. **GenLog** (1 call) — Import genLog by key, set 6 text props
3. **Card 1: Header** (1 call) — Import briefCard `Mode=DS, Type=Page Header`, set name + description
4. **Card 2: Component** (3-5 calls) — Shell + variant matrix rows (LOCAL_INSTANCE from target) + theme comparison (3 frames with variableMode)
5. **Card 3: Anatomy** (3 calls) — Shell + anatomy diagram (~4-6KB inline, spatial math for badge placement) + parts legend table
6. **Card 4: Tokens** (3-4 calls) — Shell + color swatch table (colorSwatch instances per cell) + sizing table + typography table
7. **Card 5: API** (2 calls) — Shell + table with REQ/OPT badge frames + text rows
8. **Card 6: Usage** (2-3 calls) — Shell + bullet rows + doDontPair instances
9. **Card 7: Content** (2-3 calls) — Shell + rule sections with doDontPair + terminology table
10. **Card 8: Accessibility** (3-4 calls) — Shell + 6 a11yCard instances (monochrome code) + ARIA table (a11ySpecRow instances) + contrast table (colorSwatch + contrastBadge)
11. **Card 9: Code** (2 calls) — Shell + codeBlock instance with monochrome text

Each call returns node IDs used by subsequent calls to append children.

## Card Shell Pattern

Every card (except GenLog) follows the same shell:

```js
// 1. Import briefCard set
const set = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
let variant = set.findChild(n => n.name === "Mode=DS, Type=Standard");
if (!variant) variant = set.defaultVariant;
const card = variant.createInstance();
card.name = "Tokens";
card.setProperties({
  "Title#7:0": "Design Tokens",
  "Subtitle#7:1": "Color, sizing, and typography token mapping"
});

// 2. Detach to allow content injection
card.detachInstance();

// 3. Find content slot
const contentSlot = card.findOne(n => n.name === "Content");

// 4. Return IDs for subsequent calls
return { cardId: card.id, contentSlotId: contentSlot?.id || card.id };
```

Subsequent calls append children to `contentSlotId`.

## Anatomy Diagram Pattern (Card 3)

Single ~4-6KB call with inline spatial math:

```
1. Import target component by nodeId, create instance
2. For each part in data.card3_anatomy.parts:
   - findOne(layer by figmaLayerName) on the instance
   - read absoluteBoundingBox → {x, y, width, height}
3. Compute instance center point
4. For each part, calculate closest edge (top/right/bottom/left)
5. Assign badges to sides (max 3 per side, redistribute overflow)
6. For each badge:
   - Create circle frame (22×22, dark fill, letter text)
   - Create line from badge to part's edge midpoint
   - Position badge offset from component edge
7. Wrap instance + badges + lines in a containing frame
8. Return containing frame ID
```

This is the only call that exceeds the typical 200-2000 byte range. At ~4-6KB it's well within the 50KB `use_figma` limit.

## create-component Push Sequence

3-5 small `use_figma` calls:

1. **Create variant components** — For each variant: `figma.createComponent()`, set name (e.g. `"Size=Small, State=Default"`), apply layout/fills/children
2. **Combine as variant set** — `figma.combineAsVariants(components, page)`, set name + description
3. **Add properties** — `set.addComponentProperty(name, type, default)` for each exposed property
4. **Link properties to layers** — Find text layers, set `componentPropertyReferences`
5. **GenLog** — Import genLog, set props, position as sibling

## Tests

### Removed
- `codegen-snapshots.test.js` + `tests/snapshots/` — tested removed scripts

### Updated
- `contract.test.js` — remove `flow-to-figma.js` --help contract (script no longer exists). Keep contracts for `assemble-preview.js` and other scripts.

### Unchanged
- `schema.test.js` — validates data model schemas (still needed)
- `fm-html-map.test.js`, `flow-renderer.test.js`, etc. — HTML renderers unchanged
- All other tests — unaffected

## Migration Order

1. Write `references/brief-push-patterns.md` (new patterns)
2. Write `references/create-component/push-patterns.md` (new patterns)
3. Update skill SKILL.md files (brief, create-component)
4. Remove dead scripts and interpreter files
5. Clean `shared-constants.js` (remove codegen functions)
6. Update reference docs (figma-output.md, companion-context.md, CLAUDE.md)
7. Update/remove affected tests
8. Version bump + commit
