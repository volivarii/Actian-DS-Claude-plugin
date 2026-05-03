# Sync Phases — Implementation Reference

Full extraction procedures for each phase of `/sync-design-system`. Read this file for the phase you are executing — do not load all phases at once.

## DS Kit component page structure

Each component page in the DS Kit library has consistently named top-level frames:

| Frame name | Present | Content type |
|---|---|---|
| `.local - page header with body` | Always | Component name, description |
| `Content guidelines` | Always | Copy rules, terminology, do/don't examples |
| `Components` | Always | Variant state grid |
| `ready made examples` | Always | Pre-built usage patterns |
| `Design guidelines` | Most | Visual rules, spacing, layout guidance |
| `Screenshots of use cases` | Some | Real product screenshots |
| `Behavior demo` | Some | Interaction/animation documentation |

### Internal frame structure

Each named frame follows the same pattern:
1. An `.local - section header` instance (title bar — skip during extraction)
2. A `Body` or `Guidelines` sub-frame containing the actual content:
   - Text nodes (headings, body text, rules)
   - Table structures (`.Row` frames with `Cell`/`Content` sub-frames)
   - Inline component instances (note variant names)
   - Do/don't pairs (check/cancel icon + text)

---

## Phase 1 — Components

> **⚙️ AUTO-HANDLED — manual fallback only.** This phase runs nightly via `.github/workflows/sync-from-figma.yml` (Sprint 1 v1.59.0+). The orchestrator at `scripts/sync/sync-from-figma.js` regenerates `docs/generated/dskit.json`, `docs/generated/fmkit.json`, `docs/generated/metakit.json` from the Figma REST API and opens an auto-merging PR for additive diffs. Run the steps below only if the workflow is broken, you need to write the human-readable markdown mirrors (`dskit-components.md` etc.), or you're debugging locally.

Extract component sets, variant axes, properties, and keys from DS Kit, FM Kit, and Meta Kit libraries.

**Two modes:** full sync (rewrites entire file) or incremental sync (patches only changed entries). Default to incremental for DS Kit (77+ components); use full sync for FM Kit and Meta Kit (small enough for one call).

### Mode selection

| User says | Mode | When to use |
|-----------|------|-------------|
| "Sync components" | Incremental | Default — only fetches changed/new/removed components |
| "Sync components full" | Full | Force full rewrite (e.g., after file corruption or format change) |
| "Sync all" | Incremental | Incremental by default across all phases |
| "Sync all full" | Full | Force full rewrite across all phases |

### Incremental sync (default for Phase 1)

#### Step I1: Extract lightweight manifest from Figma

One MCP call per library. Returns component manifest + page catalog (reused by Phase 5):

```js
// Lightweight manifest — fits in one call even for DS Kit
const sets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
const standalones = figma.root.findAll(n =>
  n.type === 'COMPONENT' &&
  n.parent?.type !== 'COMPONENT_SET' &&
  !n.name.startsWith('.')
);

// Page catalog — reused by Phase 5 (avoids separate discovery call)
const pageCatalog = figma.root.children.map(p => ({
  name: p.name.trim(),
  id: p.id,
  isComponentPage: p.name.startsWith('        '), // double-indented = component page
  childCount: p.children.length,
}));

const manifest = [
  ...sets.map(cs => ({
    name: cs.name,
    key: cs.key,
    nodeId: cs.id,
    type: 'component_set',
    page: cs.parent?.parent?.name || cs.parent?.name || 'unknown',
    variantCount: cs.children.length,
    variantHash: cs.children.map(v => v.name).sort().join('|'),
    textOverrideCount: Object.values(cs.componentPropertyDefinitions || {})
      .filter(d => d.type === 'TEXT').length,
    booleanPropertyCount: Object.values(cs.componentPropertyDefinitions || {})
      .filter(d => d.type === 'BOOLEAN').length,
    description: (cs.description || '').slice(0, 80),
  })),
  ...standalones.map(c => ({
    name: c.name,
    key: c.key,
    nodeId: c.id,
    type: 'component',
    page: c.parent?.parent?.name || c.parent?.name || 'unknown',
    variantCount: 0,
    variantHash: '',
    textOverrideCount: Object.values(c.componentPropertyDefinitions || {})
      .filter(d => d.type === 'TEXT').length,
    booleanPropertyCount: Object.values(c.componentPropertyDefinitions || {})
      .filter(d => d.type === 'BOOLEAN').length,
    description: (c.description || '').slice(0, 80),
  })),
];
return JSON.stringify({ manifest, pageCatalog }, null, 2);
```

**Phase 5 reuse:** When running Phases 1+5 together, Phase 5 reads the `pageCatalog` from Phase 1 output instead of making a separate discovery call (saves 1 `use_figma` call).

#### Step I1.5: Page discovery — detect new pages

After extracting the `pageCatalog`, compare against the known page list below. Report any new pages to the user before proceeding.

**Known pages** (synced by existing phases):

| Page pattern | Synced by | Purpose |
|-------------|-----------|---------|
| Component pages (double-indented names) | Phases 1-5 | DS Kit / FM Kit / Meta Kit component docs |
| `Foundations/*` or foundation-related | Phase 6 | Accessibility, typography, color, spacing docs |
| `Cover`, `---` (divider pages) | Ignored | Figma organizational pages |

**Discovery logic** (no extra MCP call — uses `pageCatalog` from Step I1):

```js
const knownPatterns = [
  p => p.name.startsWith('        '),           // component pages (double-indented)
  p => p.name.match(/cover|---|divider/i),       // organizational
  p => p.name.match(/foundation|guideline/i),    // foundation pages
];
const newPages = pageCatalog.filter(p =>
  !knownPatterns.some(fn => fn(p)) && p.childCount > 0
);
```

**If new pages are found**, report them after Phase 1 diff:

> **New pages detected in {library}:**
> - "{page name}" ({N} frames) — not synced by any phase
>
> These may contain templates, mockups, or reference layouts. To sync them, describe what's on the page and I'll extract it.

The AI does NOT auto-sync new pages. It reports them and waits for user direction. Possible actions:
- **"sync as templates"** — extract frame names, sizes, and structure into `templates.json`
- **"sync as reference"** — extract content as markdown docs
- **"ignore"** — add to the known patterns list

#### Step I2: Parse local file into comparable format

Read the existing `docs/generated/dskit-components.md` (or `fm-components.md` / `meta-kit/components.md`). For each `### Component Name` entry, extract:

- `name` — from the heading
- `key` — from the `Key: \`...\`` line
- `nodeId` — from the `Node: \`...\`` line
- `page` — from the parent `## Page Name` heading
- `type` — `component_set` if it has `Variants:` line, `component` if `Single component`
- `variantSummary` — the full `Variants:` line text (used for modification detection)
- `textOverrides` — from `Text overrides:` line

#### Step I3: Diff manifest against local

Compare by `key` (stable identifier across renames):

| Condition | Classification |
|-----------|---------------|
| Key in Figma manifest, not in local file | **New** — needs full extraction |
| Key in both, but `variantHash`, `textOverrideCount`, `booleanPropertyCount`, `name`, or `description` changed | **Modified** — needs full extraction |
| Key in local file, not in Figma manifest | **Removed** — delete from local file |
| Key in both, all fields match | **Unchanged** — skip |

Report the diff summary to the user before proceeding:
```
Incremental sync diff:
  New: 3 (ComponentA, ComponentB, ComponentC)
  Modified: 2 (Button, Toggle)
  Removed: 1 (OldComponent)
  Unchanged: 72
```

If everything is unchanged, report "Already up to date" and skip Steps I4-I5.

#### Step I4: Extract full details for changed or new components only

For each **new** or **modified** component, extract full variant axes, text overrides, and description. Group by page to minimize MCP calls:

```js
// Extract specific components by node ID (one call per page batch)
const targetIds = ['7206:2643', '14000:4395']; // node IDs of changed components
const results = [];
for (const id of targetIds) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) continue;
  if (node.type === 'COMPONENT_SET') {
    results.push({
      name: node.name,
      key: node.key,
      nodeId: node.id,
      type: 'component_set',
      page: node.parent?.parent?.name || node.parent?.name || 'unknown',
      description: node.description || '',
      variantAxes: Object.entries(node.variantGroupProperties || {}).map(([axis, prop]) => ({
        axis, values: prop.values
      })),
      properties: Object.fromEntries(
        Object.entries(node.componentPropertyDefinitions || {})
          .filter(([_, def]) => def.type !== 'VARIANT')
          .map(([name, def]) => [name, { type: def.type, default: def.defaultValue }])
      ),
      variants: node.children.map(v => ({ name: v.name, key: v.key })),
    });
  } else if (node.type === 'COMPONENT') {
    results.push({
      name: node.name,
      key: node.key,
      nodeId: node.id,
      type: 'component',
      page: node.parent?.parent?.name || node.parent?.name || 'unknown',
      description: node.description || '',
      variantAxes: [],
      properties: Object.fromEntries(
        Object.entries(node.componentPropertyDefinitions || {})
          .filter(([_, def]) => def.type !== 'VARIANT')
          .map(([name, def]) => [name, { type: def.type, default: def.defaultValue }])
      ),
      variants: [],
    });
  }
}
return JSON.stringify(results, null, 2);
```

**Batch by 20KB limit:** If more than ~15 components changed, split across multiple calls (each call handles a batch of node IDs).

#### Step I5: Patch local file

For each changed component:

- **New:** Format as markdown entry (see formatting rules below) and insert under the correct `## Page Name` section. If the page section doesn't exist, create it at the correct position.
- **Modified:** Find the existing entry by key and replace it entirely with the new formatted entry.
- **Removed:** Delete the entry (from `### Name` heading to the next `###` or `##` heading).

Update the header line counts (component sets, standalone components) after patching.

---

### Full sync (fallback)

Use when incremental is not appropriate (format change, file corruption, or "sync all").

#### Step 1: Extract page structure

For each library, call `use_figma` to retrieve the page tree with component counts:

```js
const pages = figma.root.children.map(p => ({
  name: p.name,
  id: p.id,
  componentSets: p.findAll(n => n.type === 'COMPONENT_SET').length,
  standaloneComponents: p.findAll(n => n.type === 'COMPONENT' && n.parent?.type !== 'COMPONENT_SET').length
}));
return JSON.stringify(pages, null, 2);
```

#### Step 2: Extract component sets AND standalone components

Extract both component sets (multi-variant) and standalone components (single, no variants). Standalone components are top-level `COMPONENT` nodes whose parent is NOT a `COMPONENT_SET`.

**Filter out internal/sub-components:** Skip components whose name starts with `.` (e.g., `.Checkbox`, `.Radio button`, `.Table column`) — these are internal building blocks, not public components.

```js
// Component sets (multi-variant)
const sets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
const setData = sets.map(cs => ({
  name: cs.name,
  key: cs.key,
  nodeId: cs.id,
  type: 'component_set',
  page: cs.parent?.parent?.name || cs.parent?.name || 'unknown',
  description: cs.description || '',
  variantAxes: Object.entries(cs.variantGroupProperties || {}).map(([axis, prop]) => ({
    axis,
    values: prop.values
  })),
  properties: Object.fromEntries(
    Object.entries(cs.componentPropertyDefinitions || {})
      .filter(([_, def]) => def.type !== 'VARIANT')
      .map(([name, def]) => [name, { type: def.type, default: def.defaultValue }])
  ),
  variants: cs.children.map(v => ({ name: v.name, key: v.key })),
}));

// Standalone components (no variants, not inside a component set)
const standalones = figma.root.findAll(n =>
  n.type === 'COMPONENT' &&
  n.parent?.type !== 'COMPONENT_SET' &&
  !n.name.startsWith('.')
);
const standaloneData = standalones.map(c => ({
  name: c.name,
  key: c.key,
  nodeId: c.id,
  type: 'component',
  page: c.parent?.parent?.name || c.parent?.name || 'unknown',
  description: c.description || '',
  variantAxes: [],
  properties: Object.fromEntries(
    Object.entries(c.componentPropertyDefinitions || {})
      .filter(([_, def]) => def.type !== 'VARIANT')
      .map(([name, def]) => [name, { type: def.type, default: def.defaultValue }])
  ),
  variants: [],
}));

return JSON.stringify([...setData, ...standaloneData], null, 2);
```

**Chunking strategy:** If a library has many component sets and the JSON response exceeds 20KB, split extraction by page:

```js
// Extract one page at a time
const page = figma.root.children.find(p => p.name === 'Button');
const sets = page.findAll(n => n.type === 'COMPONENT_SET');
const standalones = page.findAll(n => n.type === 'COMPONENT' && n.parent?.type !== 'COMPONENT_SET' && !n.name.startsWith('.'));
// ... same mapping as above
```

Use page counts from Step 1 to decide: DS Kit (77 sets) needs chunking. FM Kit (29) and Meta Kit (6) may fit in one call.

### Step 3: Format output

> **Auto-regenerated from JSON registries.** After Phase 1 writes the JSON registries, run:
>
> ```bash
> source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/renderers/render-component-reference.js" --kit all
> ```
>
> This rewrites `docs/generated/fm-components.md`, `docs/generated/dskit-components.md`, `docs/generated/meta-kit/components.md` from the JSON. The Markdown is a human-readable mirror; JSON registries remain the source of truth. The formatting rules below describe the renderer's output format.

**DS Kit format** (`docs/generated/dskit-components.md`):

```markdown
# Actian Design System 2026 — Component Reference

Auto-generated from Figma MCP on YYYY-MM-DD.
77 component sets, NNN individual components.

Source: [Actian Design System v1.1.0](https://www.figma.com/design/<DS Kit_FILE_KEY>)

---

## Button

### Button
Primary trigger for a specific action...

- Variants: **Type:** `Primary` · `Secondary` · ... | **Size:** `Default` · `Small` | **State:** `Default` · `Hovered` · ...
- Text overrides: `Label`
- Node: `7206:2643` | Key: `5a6d10d26bef3cc83955bf32a318c6b4682f25d3`
```

**FM Kit format** (`docs/generated/fm-components.md`): Same structure, adapted for FM Kit names.
**Meta Kit format** (`docs/generated/meta-kit/components.md`): Same structure, adapted for Meta Kit names.

Formatting rules:
- Group components by page using `## Page Name` headings
- Each component set gets a `### Component Name` heading
- **Standalone components** (type=`component`): use `- Single component (no variants)` instead of variant axes
- Variant axes: `**Axis:** \`Value1\` · \`Value2\``; multiple axes separated by ` | `
- Text overrides listed only if TEXT entries exist
- Boolean properties listed only if BOOLEAN entries exist: `- Boolean properties: \`Name\` (default: true) · \`Name2\` (default: false)`
- Node ID and Key on the last bullet
- Description on the line after the heading (if available)

### Error handling

- If a library is inaccessible, log a warning and skip it
- If a single page extraction fails, log the page name and continue
- After writing, report total component set count + standalone component count per library

#### Registry generation

Generate JSON registries from the extracted data. This step runs at the end of both incremental and full sync. **JSON registries are the sole output** of Phase 1.

**Registry schema:**

```json
{
  "library": "fm",
  "fileKey": "...",
  "lastSynced": "2026-04-08T...",
  "componentCount": 40,
  "components": {
    "fm-button": {
      "name": "FM Button",
      "key": "...",
      "nodeId": "...",
      "importMethod": "set",
      "page": "...",
      "description": "...",
      "lastSynced": "...",
      "variants": { "Size": ["md", "sm"], "Type": ["Primary", "Secondary"] },
      "properties": {
        "Label#1411:32": { "type": "TEXT", "default": "Button label" },
        "👁 Leading Icon#1410:3": { "type": "BOOLEAN", "default": true }
      },
      "nestedComponents": [],
      "guidelinesFile": null
    }
  }
}
```

Key fields:
- `importMethod`: `"set"` for component sets, `"single"` for standalone components
- `variants`: map of axis name to values array (from `variantGroupProperties`)
- `properties`: unified field with full hash-suffixed keys, type (`TEXT`, `BOOLEAN`, `INSTANCE_SWAP`), and default value (replaces old `componentPropertyDefinitions` + `booleanPropertyDefinitions`)
- `guidelinesFile`: pointer to component-guidelines JSON (DS Kit only, `null` for FM/Meta)
- Per-component `lastSynced` for incremental tracking

**For each library (DS Kit, FM, Meta Kit):**

1. Read the component data already extracted in earlier steps (manifest for incremental, full extraction for full sync)
2. Transform into registry schema:

```js
function toRegistryEntry(comp) {
  const entry = {
    name: comp.name,
    key: comp.key,
    nodeId: comp.nodeId,
    importMethod: comp.type === 'component_set' ? 'set' : 'single',
    description: comp.description || '',
    lastSynced: new Date().toISOString(),
  };
  if (comp.page) entry.page = comp.page;
  if (comp.variantAxes && comp.variantAxes.length > 0) {
    entry.variants = {};
    for (const axis of comp.variantAxes) {
      entry.variants[axis.axis] = axis.values;
    }
  }
  entry.properties = comp.properties || {};
  entry.nestedComponents = [];
  entry.guidelinesFile = null; // populated by DS Kit guidelines sync
  return entry;
}
```

3. Write the JSON registry file with metadata:
   - `library`: library identifier (`"dsKit"`, `"fm"`, or `"meta-kit"`)
   - `fileKey`: Figma file key
   - `lastSynced`: current ISO 8601 timestamp
   - `componentCount`: total number of components
   - `components`: object keyed by slug (lowercase, hyphenated component name)

4. **Meta Kit special handling:** Preserve the `templates` section from the existing `metakit.json` — do not overwrite template keys during sync. Read the existing file first, merge: keep all template entries unchanged, update only the `components` section from extraction.

5. Generate `docs/generated/meta-kit/meta-kit-reference.md` as auto-generated human-readable table:

```markdown
# Meta Kit Registry Reference

> Auto-generated from `metakit.json` — do not edit manually.

## Templates

| Name | Key | Node | Category | Text Slots |
|------|-----|------|----------|------------|
| table-header-row | `abc...` | `66:42` | table | label |
| ... | ... | ... | ... | ... |

## Components

| Name | Key | Node | Type |
|------|-----|------|------|
| brief-card | `3dbb...` | `7:2` | component_set |
| ... | ... | ... | ... |
```

**Output files per library:**
- DS Kit: `docs/generated/dskit.json` (full registry with keys, variants, properties)
- FM Kit: `docs/generated/fmkit.json` (full registry with keys, variants, properties)
- Meta Kit: `docs/generated/metakit.json` (full registry with keys, templates, properties)

#### Step 4: Regenerate component reference Markdown

Run `source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/renderers/render-component-reference.js" --kit all`. Three files are rewritten: `docs/generated/fm-components.md`, `docs/generated/dskit-components.md`, `docs/generated/meta-kit/components.md`. If the script exits non-zero, report the failure and do not proceed to Phase 2.

#### Step 5: Reconcile fm-to-ds-map.json

After `dskit.json` is rewritten, reconcile the FM→DS mapping table. The script backfills missing `dsKey` fields (one-time migration for legacy entries) and refreshes any `dsSlug` value that drifted from the immutable `dsKey`:

```bash
source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/sync/sync-fm-to-ds-map.js"
```

The script prints a per-entry report (`backfilled`, `refreshed`, `warnings`). It exits with code 1 if any warnings are emitted — typical causes:

- `dsKey` no longer resolves in `dskit.json` — the DS component was hidden from publishing or renamed without a key match. Surface this to the designer; they should move the entry to `unmappable` with a composition note (see existing precedent on `fmNavItem`, `fmTab`, `fmMenuItem`, `fmTableCell`).
- Entry has neither `dsKey` nor `dsSlug` — schema violation; investigate.

Exit code 0 with no warnings means `fm-to-ds-map.json` is in sync with the freshly-written `dskit.json`. If the script wrote any changes, commit `fm-to-ds-map.json` as part of the sync output.

---

## Phase 2 — Variables

Extract all DS Kit variables with keys, types, scopes, and resolved per-mode values across 3 themes.

**Optimized to 2 MCP calls** (down from 3-5): one for non-color collections, one for color with inline alias resolution.

### Step 1: Extract non-color variables (1 call)

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();

// Non-color collections: Spacing, Border, Size, Breakpoint (29 vars, single mode, no aliases)
const nonColor = collections
  .filter(c => c.name !== 'Color')
  .map(c => {
    const collVars = vars.filter(v => v.variableCollectionId === c.id);
    return {
      collection: c.name,
      modes: c.modes.map(m => ({ name: m.name, modeId: m.modeId })),
      variables: collVars.map(v => ({
        name: v.name, key: v.key, resolvedType: v.resolvedType,
        scopes: v.scopes, description: v.description,
        value: v.valuesByMode[c.modes[0].modeId], // single mode → direct value
      })),
    };
  });
return JSON.stringify(nonColor, null, 2);
```

Expected: Spacing (6), Border (12), Size (7), Breakpoint (4) = 29 vars. Fits in one call (~3KB).

### Step 2: Extract color variables with cross-collection alias resolution (1 call)

DS Kit color variables are aliases into a remote primitive palette (the "Zen colors" library). The resolver uses `figma.variables.getVariableByIdAsync` which transparently fetches remote-library variables when DS Kit subscribes to them, returning the resolved variable's full `valuesByMode`.

**Critical fix (2026-04-30):** the resolver must use **first-mode fallback** when the source-mode key isn't in the resolved target's `valuesByMode`. DS Kit's modes are `Actian/Studio/Explorer` (modeIds `7195:0`, `13617:0`, `14007:0`), but Zen-colors primitives are single-mode (`2003:0`). Indexing the target's `valuesByMode[modeId]` with DS Kit's modeId returns undefined → the original resolver hit a dead end and reported `UNRESOLVED`. The fix is one line: when the source mode isn't present, take the first available mode's value. Verified end-to-end against real DS Kit data: 88/88 colors × 3 modes = 264/264 resolved with zero UNRESOLVED.

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCol = collections.find(c => c.name === 'Color');
const vars = await figma.variables.getLocalVariablesAsync();
const colorVars = vars.filter(v => v.variableCollectionId === colorCol.id);

function rgbaToHex(rgba) {
  const r = Math.round(rgba.r * 255), g = Math.round(rgba.g * 255), b = Math.round(rgba.b * 255);
  let hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
  if (rgba.a !== undefined && rgba.a < 1) hex += Math.round(rgba.a * 255).toString(16).padStart(2,'0').toUpperCase();
  return hex;
}

async function resolveAlias(value, modeId, depth) {
  if (depth > 8) return null;
  if (!value) return null;
  if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const target = await figma.variables.getVariableByIdAsync(value.id);
    if (!target || !target.valuesByMode) return null;
    // Critical: source-mode fallback. DS Kit's modeId may not exist in remote-library
    // primitive variables (which are typically single-mode). Fall back to first mode.
    const targetValue = target.valuesByMode[modeId] !== undefined
      ? target.valuesByMode[modeId]
      : Object.values(target.valuesByMode)[0];
    return resolveAlias(targetValue, modeId, depth + 1);
  }
  return value;
}

const result = [];
for (const v of colorVars) {
  const resolved = {};
  for (const mode of colorCol.modes) {
    const val = await resolveAlias(v.valuesByMode[mode.modeId], mode.modeId, 0);
    resolved[mode.name] = (val && typeof val === 'object' && 'r' in val) ? rgbaToHex(val) : 'UNRESOLVED';
  }
  result.push({ name: v.name, key: v.key, scopes: v.scopes, description: v.description, values: resolved });
}
return JSON.stringify(result);
```

Expected: 88 color variables × 3 modes = 264 resolved hex values. Output ~12-15KB. Fits in 20KB.

**Validation:** the skill MUST check the response for any `"UNRESOLVED"` strings. If any are present: log them, abort the sync (do NOT proceed to write token files), report which variables/modes failed. With the modeId fallback in place, UNRESOLVED should never occur on a healthy Figma library.

### Step 3: Format output

Write `docs/generated/meta-kit/variables.md` with ALL 115 variables by collection:

```markdown
# Meta Kit Variable Keys

## Color Variables

| Variable | Key | Actian | Studio | Explorer | Purpose |
|----------|-----|--------|--------|----------|---------|
| background-bg-default | `805af...` | #FFFFFF | #FFFFFF | #FFFFFF | Card backgrounds |

## Spacing Variables

| Variable | Key | Value | Purpose |
|----------|-----|-------|---------|
```

Formatting: color table has per-mode columns; non-color has single Value column. Sort alphabetically within sections.

### Error handling

- Circular/missing alias → use `"UNRESOLVED"` as hex
- Collection extraction failure → log and continue
- After writing, report counts and flag unresolved aliases

---

## Phase 3 — Styles

> **⚙️ AUTO-HANDLED — manual fallback only.** Text + effect styles auto-sync nightly via `.github/workflows/sync-from-figma.yml`; the orchestrator writes `docs/generated/meta-kit/styles.json`. The steps below regenerate the human-readable markdown mirrors (`text-styles.md` + `effect-styles.md`); run them when you need the markdown form or the workflow is broken.

Extract text styles and effect styles from DS Kit.

### Step 1: Extract text styles

```js
const textStyles = await figma.getLocalTextStylesAsync();
return JSON.stringify(textStyles.map(s => ({
  name: s.name,
  key: s.key,
  fontFamily: s.fontName.family,
  fontStyle: s.fontName.style,
  fontSize: s.fontSize,
  lineHeight: s.lineHeight,
  letterSpacing: s.letterSpacing,
  textDecoration: s.textDecoration,
  textCase: s.textCase,
})), null, 2);
```

Expected: 12 text styles, all Roboto.

### Step 2: Extract effect styles

```js
const effectStyles = await figma.getLocalEffectStylesAsync();
return JSON.stringify(effectStyles.map(s => ({
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
})), null, 2);
```

Expected: 5 effect styles (shadow-xs through shadow-xl), each with 2 DROP_SHADOW effects.

### Step 3: Format text styles output

Write `docs/generated/meta-kit/text-styles.md`:

```markdown
# Meta Kit — Text Styles

| Style | Key | Font | Weight | Size | Line Height | Letter Spacing |
|-------|-----|------|--------|------|-------------|----------------|
```

Formatting: `lineHeight` as `Npx` or `Auto`, `letterSpacing` as `Npx` or `N%`. Sort by fontSize descending.

### Step 4: Format effect styles output

Write `docs/generated/meta-kit/effect-styles.md`:

Summary table: `TYPE(x,y,blur,spread,rgba(...))` notation, multiple effects joined with ` + `.
Detail sub-tables: one row per effect per style.
Convert RGBA floats to CSS `rgba(R,G,B,A)`. Sort xs → xl.

### Error handling

- Empty arrays → log warning, continue
- Report total counts after writing

---

## Phase 4 — Token files

Transform Phase 2 variable data into 3 output formats. No Figma MCP calls — transforms already-extracted data.

### Token naming convention

- Prefix: `--zen-color-` / `--zen-spacing-` / `--zen-border-` / `--zen-size-` / `--zen-breakpoint-`
- Path separator: `/` → `-` (e.g., `Status/success-primary` → `--zen-color-status-success-primary`)
- Case: lowercase

### Step 1: token-reference.md

```markdown
# Token Reference — Actian Design System 2026

## Color Tokens

| Token | CSS Variable | Actian | Studio | Explorer |
|-------|-------------|--------|--------|----------|

## Spacing Tokens

| Token | CSS Variable | Value |
|-------|-------------|-------|
```

Color table has per-mode columns. Non-color has single Value. Sort alphabetically.

### Step 2: tokens.css

```css
:root, [data-theme="actian"] {
  --zen-color-theme-primary: #0550DC;
}
[data-theme="studio"] {
  --zen-color-theme-primary: #7B2FBE;
}
[data-theme="explorer"] {
  --zen-color-theme-primary: #00875A;
}
:root {
  --zen-spacing-2xs: 4px;
}
```

Studio/Explorer blocks only include tokens that differ from Actian. Non-color tokens under plain `:root`. Add `px` suffix to non-color values. Sort alphabetically within blocks.

### Step 3: actian-ds.tokens.json

W3C DTCG format:

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "$metadata": { "source": "Actian Design System 2026", "extractedOn": "YYYY-MM-DD", "figmaFileKey": "<DS Kit_FILE_KEY>" },
  "color": {
    "theme": {
      "primary": {
        "$type": "color",
        "$value": "#0550DC",
        "$extensions": {
          "com.figma": { "variableKey": "a256...", "collection": "Color", "scopes": ["ALL_FILLS"] },
          "modes": { "actian": "#0550DC", "studio": "#7B2FBE", "explorer": "#00875A" }
        }
      }
    }
  }
}
```

`$type`: `"color"` for color, `"dimension"` for others. `$value`: Actian mode. `$extensions.modes` only for color. Sort keys alphabetically.

### Error handling

- Missing Phase 2 data → abort with error message
- `UNRESOLVED` values → carry through with CSS comment and `$status` field

#### Drift detection (after token files are generated)

After generating the new `actian-ds.tokens.json` from fresh Figma data, compare against the previously existing local file to detect drift.

**Procedure:**

1. Before overwriting, read the **existing** `tokens/actian-ds.tokens.json` into memory
2. Generate the **new** token file from Phase 2 extraction data
3. Compare every token value across all 3 themes:
   - Walk both JSON trees in parallel
   - For each token path (e.g., `color.background-bg-default`):
     - Compare `$value` fields
     - Compare each theme value in `$extensions.com.actian.themes` (actian, studio, explorer)
     - If any value differs → add to drift list with both old and new values
4. Write `token-drift.json` to the project working directory (not the plugin directory):

```json
{
  "generated": "2026-03-29T10:00:00Z",
  "previousSyncDate": "2026-03-26T00:00:00Z",
  "summary": {
    "total": 115,
    "matched": 112,
    "drifted": 3,
    "added": 0,
    "removed": 0
  },
  "drifted": [
    {
      "path": "color.background-bg-disabled",
      "category": "color",
      "themes": {
        "actian": { "previous": "#F5F5F9", "current": "#F5F5FA" },
        "studio": { "previous": "#EBEBEB", "current": "#EBEBEB" },
        "explorer": { "previous": "#EBEBEB", "current": "#EBEBEB" }
      }
    }
  ],
  "added": [],
  "removed": []
}
```

5. Report drift summary to user:
   > "Drift detection: 3 tokens changed since last sync. See `token-drift.json` for details."
   > - 2 color tokens changed (actian theme)
   > - 1 spacing token changed (all themes)

6. If no drift detected: report "No token drift detected — local files match Figma." and skip writing `token-drift.json`.

7. Then proceed to overwrite the token files as usual.

**Note:** Drift detection is informational only. It does not block the sync or require user approval. The DS team reviews the report manually.

#### CSS custom properties generation

The `tokens/tokens.css` file is generated with:
- Default theme (Actian) values in `:root`
- Theme overrides in `[data-theme="studio"]` and `[data-theme="explorer"]` selectors (only tokens that differ from Actian default)
- `--zen-*` prefix on all custom properties
- Comment headers per token category (Color, Spacing, Border, Typography, Effects)
- Generation metadata comment at top (source file, date, version)

An additional `tokens/actian-ds.tokens.css` file is generated as an alias with identical content, following the naming convention of `actian-ds.tokens.json`.

---

## Phase 5 — Component guidelines

Extract per-component design and content guidelines from DS Kit guideline pages.

**Two modes:** incremental (default — extract only changed pages) or full (re-extract everything).

### Single-component mode

When user specifies a name (e.g., "sync Button"):
1. Match name against page list
2. Extract guideline frames for that page only
3. Update only that component's JSON
4. Update `_index.json`
5. Typically 2-4 MCP calls

---

### Incremental sync (default for Phase 5)

#### Step I1: Extract page manifest with frame signatures

**If Phase 1 ran in this session:** Read the `pageCatalog` from Phase 1 output to get the component page list (saves this discovery call). Filter to `isComponentPage: true` pages, then extract frame signatures for those pages only.

**Otherwise:** One `use_figma` call to get all component pages with their frame names and child counts (acts as a change signature):

```js
const pages = figma.root.children;
const componentPages = pages.filter(p => p.name.trim().startsWith('  '));
const manifest = componentPages.map(p => ({
  name: p.name.trim(),
  id: p.id,
  frameSignature: p.children
    .filter(c => !c.name.startsWith('.local'))
    .map(c => c.name + ':' + c.children.length)
    .sort()
    .join('|'),
  frameCount: p.children.filter(c => !c.name.startsWith('.local')).length,
}));
return JSON.stringify(manifest, null, 2);
```

**Why frame signatures work:** When a designer edits a guideline frame (adds a do/don't pair, rewrites a section), the child count changes. The signature `frameName:childCount` catches structural edits. It won't catch text-only edits within a fixed number of children — accept this trade-off for 80%+ call savings.

#### Step I2: Compare against cached `_index.json`

Read `docs/component-guidelines/_index.json`. For each page:

| Condition | Classification |
|-----------|---------------|
| Page ID in manifest but not in `_index.json` | **New** — extract all frames |
| Page ID in both, but `frameSignature` differs | **Modified** — re-extract all frames for this page |
| Page ID in both, `frameSignature` matches, `status` = `"complete"` | **Unchanged** — skip |
| Page ID in `_index.json` but not in manifest | **Removed** — delete JSON file |
| Page in `_index.json` with `status` = `"partial"` or `"error"` | **Retry** — re-extract regardless of signature |

Report diff summary before proceeding:
```
Phase 5 incremental diff:
  New: 2 (Stepper, Traffic light)
  Modified: 3 (Button, Modal, Dropdown)
  Retry: 1 (Table — previous partial)
  Removed: 0
  Unchanged: 38
  Extracting: 6 pages (~18 get_design_context calls)
```

If all unchanged: report "Guidelines up to date" and skip Steps I3-I4.

#### Step I3: Extract changed pages only

For each new/modified/retry page:

1. **Discover frames** — batch 5-6 pages per `use_figma` call:
```js
const pageIds = ['PAGE_ID_1', 'PAGE_ID_2', ...];
const results = [];
for (const pid of pageIds) {
  const page = figma.root.children.find(p => p.id === pid);
  if (!page) continue;
  results.push({
    pageId: pid,
    pageName: page.name.trim(),
    frames: page.children
      .filter(c => !c.name.startsWith('.local') && c.name !== 'Components')
      .map(c => ({ name: c.name, id: c.id }))
  });
}
return JSON.stringify(results, null, 2);
```

2. **Extract content** — call `get_design_context` per guideline frame (same as full sync Step 3)
3. **Transform to JSON** — same as full sync Step 4

#### Step I4: Update `_index.json`

After extracting, update each page's entry:
```json
{
  "pageName": "Button",
  "pageId": "9085:24375",
  "frameSignature": "Content guidelines:12|Design guidelines:8|ready made examples:4",
  "status": "complete",
  "extractedOn": "2026-03-27T15:00:00Z",
  "frameCount": 3,
  "jsonFile": "button.json"
}
```

**Call budget:** Typically 1 manifest call + 1-2 frame discovery calls + ~15-20 `get_design_context` calls = **~20-25 total** (vs ~147 for full).

---

### Full sync (fallback)

Use when `_index.json` is missing/corrupt, or user appends "full".

### Step 1: Discover component pages

```js
const pages = figma.root.children;
const componentPages = pages.filter(p => p.name.trim().startsWith('  '));
return JSON.stringify(componentPages.map(p => ({
  name: p.name.trim(),
  id: p.id,
  childCount: p.children.length
})), null, 2);
```

Expected: ~44 component pages.

### Step 2: Find guideline frames per page

```js
const page = figma.root.children.find(p => p.id === 'PAGE_ID');
return JSON.stringify(page.children.map(c => ({
  name: c.name,
  id: c.id,
  type: c.type
})), null, 2);
```

Batch 3-4 pages per call.

### Step 3: Extract text content

Call `get_design_context` with `excludeScreenshot: true` per guideline frame. Extract:
- Content guidelines: Do/Don't pairs, writing rules, label recommendations
- Design guidelines: Spacing rules, variant usage, when-to-use guidance
- Behavior demo: Interaction descriptions
- Screenshots of use cases: Context descriptions (skip images)

### Step 4: Transform to JSON

Match existing `docs/component-guidelines/*.json` schema. Read 1-2 existing files first. Each JSON includes: `name`, `extractedOn`, `sourcePageId`, `contentGuidelines`, `designGuidelines`, `behaviorNotes`, `useCases`.

Output `_index.json` with per-component extraction status and date.

### Rate limit strategy

~44 pages x ~3 frames = ~132 `get_design_context` calls. Strategy:
- Use `use_figma` for frame discovery (batch = ~15 calls)
- Skip "Components" frames (already in Phase 1)
- Support incremental sync via `_index.json`
- If rate limit reached, save progress with `"status": "partial"`

### Error handling

- No guideline frames → empty arrays + `"status": "no-guidelines"`
- Frame extraction fails → `"status": "error"` in index, continue
- Report totals and errors after completion

---

## Phase 6 — Foundations + Content + Accessibility

**Two modes:** incremental (default — extract only changed pages) or full (re-extract everything).

### Foundation pages

| Page | Node ID | Expected children |
|------|---------|-------------------|
| Accessibility | `12685:19373` | 23 |
| Borders | `13321:12804` | — |
| Breakpoint/grid/structure | `12217:457` | — |
| Color | `12054:27511` | — |
| Content guidelines | `7397:3249` | 2 |
| Elevation | `12054:27514` | — |
| Icons | `7370:3775` | — |
| Interaction & motion | `12054:27512` | — |
| Spacing | `12054:27513` | — |
| Typography | `12054:26789` | — |
| Usage example | `12957:2843` | — |

---

### Incremental sync (default for Phase 6)

#### Step I1: Extract foundation page manifest

One `use_figma` call to get all foundation pages with frame signatures:

```js
const foundationPageIds = [
  '12685:19373', '13321:12804', '12217:457', '12054:27511',
  '7397:3249', '12054:27514', '7370:3775', '12054:27512',
  '12054:27513', '12054:26789', '12957:2843'
];
const manifest = [];
for (const pid of foundationPageIds) {
  const page = figma.root.children.find(p => p.id === pid);
  if (!page) continue;
  manifest.push({
    name: page.name.trim(),
    id: page.id,
    frameSignature: page.children
      .filter(c => !c.name.startsWith('.local'))
      .map(c => c.name + ':' + c.children.length)
      .sort()
      .join('|'),
    frameCount: page.children.filter(c => !c.name.startsWith('.local')).length,
  });
}
return JSON.stringify(manifest, null, 2);
```

#### Step I2: Compare against cached `_index.json`

Read `docs/foundations/_index.json`. Same diff logic as Phase 5:

| Condition | Classification |
|-----------|---------------|
| Page in manifest but not in `_index.json` | **New** |
| `frameSignature` differs | **Modified** |
| Signature matches + `status: "complete"` | **Unchanged** — skip |
| In `_index.json` but not manifest | **Removed** |
| `status: "partial"` or `"error"` | **Retry** |

Report diff summary. If all unchanged: "Foundations up to date", skip extraction.

#### Step I3: Extract changed pages only

Same pattern as Phase 5 Step I3:
1. Discover frames via `use_figma` (batch changed pages)
2. Extract content via `get_design_context` per frame
3. Transform to JSON / Markdown

**Special handling:**
- **Accessibility** (23 frames, all named "Design guidelines"): Always compare by `frameCount`. If count changed, re-extract all 23 frames. If unchanged, skip entirely.
- **Content guidelines** (2 frames): Lightweight; re-extract on any signature change.

#### Step I4: Update `_index.json`

Same schema as Phase 5 index. Track `status`, `extractedOn`, `frameSignature` per page.

**Call budget:** 1 manifest call + 1-2 frame discovery + ~8-15 `get_design_context` = **~12-18 total** (vs ~56 for full).

---

### Full sync (fallback)

### Step 1: Extract foundation page content

For each page (except Accessibility and Content guidelines):
1. List top-level frames via `use_figma`
2. Extract via `get_design_context` with `excludeScreenshot: true`
3. Transform to JSON → `docs/generated/foundations/*.json`

### Step 2: Extract content guidelines

Page `7397:3249` (2 children). Extract both frames, transform to Markdown, write to `docs/content-guidelines.md`.

### Step 3: Extract accessibility guidelines

Page `12685:19373` (23 children, all named "Design guidelines"). Differentiate by heading text within each frame. Group by topic, write to `docs/accessibility-guidelines.md` (Wave 2 candidate for MD-as-SoT pipeline).

### Rate limit strategy

~56 calls for Phase 6. Combined with Phase 5: ~188 total (near Pro limit of 200).
Priority order: Content guidelines → Accessibility → Color → Typography → Spacing → rest.
Track progress in `docs/foundations/_index.json`. Support resumption.

### Error handling

- Inaccessible page → `"status": "error"`, empty sections, continue
- Accessibility ambiguity fallback → number sections, flag for manual review
- Report per-page status after completion

---

## Phase 7 — Validation + Changelog

Diff local files against current Figma state, generate a semantic changelog, and present for approval.

### Step 1: Diff

```bash
git diff --stat docs/ tokens/
```

Count new, modified, and deleted files.

### Step 2: Generate semantic changelog

Parse the git diff content (not just `--stat`) to produce a human-readable changelog organized by category. This step transforms file-level diffs into design-system-meaningful changes.

**How to generate each section:**

#### Tokens
Parse `git diff tokens/actian-ds.tokens.json` and `git diff docs/generated/token-reference.md`:
- **Changed:** Compare old vs new `$value` for each token. Report: token name, old value → new value, per-theme if color.
- **Added:** Tokens present in new file but not old.
- **Removed:** Tokens present in old file but not new.

```markdown
#### Tokens
- **Changed:** `theme-primary` Actian #0550DC → #0446B8, Studio #7B2FBE → #6A28A3
- **Added:** `status-info-tertiary` (#4A90D9 / #6B5CE7 / #3D9970)
- **Removed:** none
```

#### Components
Parse `git diff docs/generated/dskit-components.md` and `git diff docs/generated/fm-components.md`:
- **New component:** Component heading exists in new but not old.
- **Removed component:** Component heading exists in old but not new.
- **New variant:** Variant axis values differ (more values in new).
- **Changed properties:** Text overrides or variant axes differ.

```markdown
#### Components
- **New component:** Stepper (DS Kit, 3 variants: Size × State × Orientation)
- **New variant:** Button → added Destructive=True axis
- **Changed:** Dropdown — added `Placeholder Text` text override
```

#### Guidelines
Parse `git diff docs/component-guidelines/*.json`:
- For each changed JSON file, compare `contentGuidelines` and `designGuidelines` arrays.
- Report added/removed/changed entries at a summary level (count of rules changed, not full text).

```markdown
#### Guidelines
- **Updated:** Modal — 2 new content do/don't pairs, 1 design guideline added
- **Updated:** Button — destructive variant usage guidance added
- **New:** Stepper — initial guidelines extracted
```

#### Foundations
Parse `git diff docs/foundations/*.json`, `docs/content-guidelines.md`, `docs/accessibility-guidelines.md`:
- Report which foundation topics had changes and a brief summary.

```markdown
#### Foundations
- **Updated:** Accessibility — keyboard navigation section rewritten (23 → 25 frames)
- **Updated:** Color — 2 new category colors documented
- No changes to content guidelines
```

#### Styles
Parse `git diff docs/generated/meta-kit/text-styles.md` and `docs/generated/meta-kit/effect-styles.md`:
- Report added/changed/removed styles with key properties.

```markdown
#### Styles
- **Changed:** `shadow-md` blur 8 → 10, spread 2 → 3
- No text style changes
```

**If a section has no changes, include it with "No changes" so the changelog is always complete.**

### Step 3: Sync report with changelog

Present the file-level diff table AND the semantic changelog together:

```markdown
## Sync Report — YYYY-MM-DD

### Changelog

#### Tokens
- ...

#### Components
- ...

#### Guidelines
- ...

#### Foundations
- ...

#### Styles
- ...

### Files changed

| File | Status | Lines |
|------|--------|-------|
| ... | ... | ... |

### Warnings
- ⚠ [any issues from earlier phases]
```

### Step 4: Save changelog

Save the changelog section to `release-notes/sync-YYYY-MM-DD.md` for historical tracking. This file is gitignored but available for `/release-notes` or manual reference.

```markdown
# Sync Changelog — YYYY-MM-DD

Synced from Figma via `/sync-design-system`.

[changelog sections from Step 2]
```

### Step 5: Approval gate

Present report and ask for approval. **Do NOT commit automatically.**
If user requests reverts: `git checkout -- <file>`, re-diff, regenerate changelog, re-present.

### Step 6: Post-approval

```bash
git add docs/ tokens/
git commit -m "sync: update design system data from Figma (YYYY-MM-DD)"
```

Do NOT push. User pushes when ready.

### Error handling

- No changes → report "up to date" with empty changelog, skip approval
- Uncommitted changes before sync → warn user to commit/stash first
- Diff parsing fails for a file → fall back to file-level summary for that section, flag for manual review
