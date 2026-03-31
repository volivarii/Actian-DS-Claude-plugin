# Figma Output Flow

Shared procedure for outputting skill results to Figma. Used by all skills that produce Figma deliverables.

## Figma MCP Skills (load before writing)

The Figma MCP provides official skills that handle generic Plugin API correctness. **Load them before every `use_figma` call:**

- **`figma-use`** — Plugin API rules: return pattern, page navigation, font loading, color range, error handling. Always pass `skillNames: "figma-use"` when calling `use_figma`.
- **`figma-generate-design`** — Screen building: import components by key, bind variables, one section per call, visual validation. Use when building flow screens or presentation slides.
- **`figma-generate-library`** — Design system building: phased workflow, variable scoping, component creation, state ledger. Use when creating components via `/create-component`.

These skills handle: `hexToRgb`, auto-layout basics, font loading, `setCurrentPageAsync`, color 0-1 range, sequential execution, error recovery. **Do not duplicate their rules here.**

This document covers only **Actian DS-specific** patterns that the Figma skills don't know about.

---

## Figma URL Parsing (MANDATORY)

When a user provides a Figma URL, **always extract `fileKey` and `nodeId` and pass them explicitly** to MCP tools. Never rely on "current selection" — it is empty when the user pastes a URL.

### Extraction rules

```
URL: https://www.figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>
     https://www.figma.com/design/<fileKey>/branch/<branchKey>/<fileName>

fileKey: the segment after /design/ (or use branchKey if /branch/ is present)
nodeId:  the node-id query parameter, with dashes converted to colons
```

**Examples:**

| URL | fileKey | nodeId |
|-----|---------|--------|
| `figma.com/design/W3TdaJ.../File?node-id=9085-24375` | `W3TdaJ...` | `9085:24375` |
| `figma.com/design/abc123/branch/def456/File?node-id=1-2` | `def456` | `1:2` |
| `figma.com/design/abc123/File` (no node-id) | `abc123` | _(none — use get_metadata to discover)_ |

### Discovery procedure (MANDATORY — always follow this order)

**Step 1: Always start with `get_metadata(fileKey, nodeId)`.**
This is fast, always works, and reveals the node type (canvas = page, component_set, frame, instance, etc.). Never call `get_design_context` as the first call — it fails on pages and sometimes on nodes without a Figma selection.

**Step 2: Identify the target node from metadata.**
The metadata XML shows the node hierarchy:
- `<canvas>` = page → drill down to find the component set or frame you need
- `<component_set>` = variant group → this is your target for component briefs
- `<component>` = single component → use directly
- `<frame>` = generic frame → use directly
- `<instance>` = component instance → find the source component

**Step 3: Call `get_design_context(fileKey, targetNodeId)` on the specific target node.**
Use the node ID discovered from metadata, not the URL's node ID (which might be a page).

**Example — user pastes a page URL:**
```
URL nodeId: 9085:24375 → get_metadata reveals <canvas name="Button">
  → find <component_set id="7206:2643" name="Button"> inside
  → get_design_context(fileKey, "7206:2643") ← use this ID
```

**Example — user pastes a component URL:**
```
URL nodeId: 7206:2643 → get_metadata reveals <component_set name="Button">
  → get_design_context(fileKey, "7206:2643") ← same ID works
```

### When get_design_context returns "nothing selected"

This means the node ID points to a page or the Figma client doesn't have it selected. Fall back to:
1. `get_metadata(fileKey, nodeId)` to discover the structure
2. Find the actual component/frame node ID from the metadata
3. Retry `get_design_context` with the discovered node ID
4. If it still fails, use `get_screenshot(fileKey, nodeId)` + metadata for visual reference

---

## Output mode

All Figma output uses `use_figma` — build directly in Figma via Plugin API JavaScript.

**HTML is for local preview only** — never use HTML as a Figma output path.

## JSON Spec Interpreter (primary pattern)

For skills that generate structured output (component-brief, generate-flow, generate-presentation), use the **JSON Spec Interpreter** pattern:

```
data-model.json → AI transforms → figma-spec.json → Fixed interpreter → Figma nodes
```

The AI produces a declarative JSON spec. A fixed interpreter function (`scripts/figma-interpreter.js`, ~26KB) builds the Figma tree mechanically. The AI never writes Plugin API code.

### How to use

1. Read the per-skill spec builder reference (e.g., `component-brief/figma-spec-builder.md`)
2. Read `figma-spec-schema.md` for the JSON format
3. Transform data model → `figma-spec.json`
4. Read `scripts/figma-interpreter.js`
5. Assemble `use_figma` call: `${interpreterCode}\nconst spec = ${JSON.stringify(figmaSpec)};\nreturn await buildFromSpec(spec);`

### Benefits

- **Deterministic** — the interpreter is tested, not AI-generated. Zero retry rate.
- **Fast** — font loading, component imports, and variable binding are batched. 2 calls instead of 11+.
- **Correct** — the interpreter handles all Figma API quirks (layoutMode before children, sizing after appendChild, paint variable binding).
- **17 node types** — FRAME, TEXT, RECT, INSTANCE, LOCAL_INSTANCE, DIVIDER, LINE, ELLIPSE, VECTOR, POLYGON, STAR, SVG, GROUP, BOOLEAN, SECTION, COMPONENT, COMPONENT_SET.
- **Variable + style binding** — declare in spec, interpreter binds automatically.

### Skill coverage

All 4 output skills now use the interpreter:

| Skill | Builder reference | Node types used |
|-------|------------------|-----------------|
| component-brief | `component-brief/figma-spec-builder.md` | FRAME, TEXT, RECT, INSTANCE, LOCAL_INSTANCE, DIVIDER |
| generate-flow | `generate-flow/figma-spec-builder.md` | FRAME, TEXT, INSTANCE, DIVIDER |
| generate-presentation | `generate-presentation/figma-spec-builder.md` | FRAME, TEXT, RECT (charts) |
| create-component | `create-component/figma-spec-builder.md` | COMPONENT, COMPONENT_SET + all Tier 1 |

### When to use legacy pattern

The micro-task checklist pattern (see `component-brief/figma-renderer-legacy.md`) is still available for:
- `design-audit` — reads existing Figma nodes, doesn't build from a data model
- One-off Figma operations that don't fit the data model → spec → interpreter flow

## DS-specific import patterns

### Library components — always import, never recreate

```js
// FM Kit components
const comp = await figma.importComponentByKeyAsync("COMPONENT_KEY");
const instance = comp.createInstance();

// Component set (with variants)
const set = await figma.importComponentSetByKeyAsync("COMPONENT_KEY");
const variant = set.children.find(c => c.name === "Mode=DS, Type=Standard");
const instance = variant.createInstance();

// Set text properties (use prefix matching — keys include internal IDs)
function setProp(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find(k => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}
setProp(instance, "Title", "Design tokens");
```

Look up component keys in `../../docs/fm-components.md` (FM Kit), `../../docs/dskit-components.md` (DS Kit), or `../../docs/meta-kit/components.md` (Meta Kit).

### Meta Kit components

For shared visual elements (card chrome, code blocks, do/don't pairs, generation cards), import Meta Kit library components instead of building inline. See `../../docs/meta-kit/components.md` for keys and properties.

When a Meta Kit component exists for an element, **always import it**. The component IS the spec.

## Token binding — DS Kit and FM libraries

**NEVER hardcode hex colors, pixel font sizes, or raw shadow values.** Both libraries publish reusable assets. Bind them.

### What each library publishes

| Asset type | DS Kit | FM Kit | Binding API |
|------------|--------|--------|-------------|
| **Color variables** | Yes (theme-switching) | No | `importVariableByKeyAsync` + `setBoundVariableForPaint` |
| **Color styles** | Yes | Yes (`Fatmarker Base/*`) | `importStyleByKeyAsync` + `node.fillStyleId` |
| **Text styles** | Yes (`body-standard`, etc.) | Yes (`Fatmarker/*`) | `importStyleByKeyAsync` + `node.textStyleId` |
| **Effect styles** | Yes (`shadow-xs`, etc.) | No | `importStyleByKeyAsync` + `node.effectStyleId` |

### DS Kit output — bind variables AND styles

DS Kit publishes **color variables** (for theme switching), **text styles** (typography), and **effect styles** (shadows). Use all three:

**Color variables** (see `../../docs/meta-kit/variables.md` for keys):

```js
const vars = {};
async function importVar(name, key) {
  vars[name] = await figma.variables.importVariableByKeyAsync(key);
}
await importVar('bgDefault', '805afec875092b89deebe685e17992963d603974');
await importVar('borderDefault', '290c868621027b488cbc3b262619959bec52765f');

function bindFill(node, variable) {
  const fills = JSON.parse(JSON.stringify(node.fills));
  fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
  node.fills = fills;
}
```

**Text styles** (discover via `search_design_system`):

```js
const textStyle = await figma.importStyleByKeyAsync("TEXT_STYLE_KEY_FROM_SEARCH");
textNode.textStyleId = textStyle.id;
```

**Effect styles** (discover via `search_design_system`):

```js
const effectStyle = await figma.importStyleByKeyAsync("EFFECT_STYLE_KEY_FROM_SEARCH");
frame.effectStyleId = effectStyle.id;
```

### FM output — bind published color and text styles

FM Kit does not publish Figma **variables**, but it publishes **color styles** and **text styles**. Always bind these instead of hardcoding:

```js
const colorStyle = await figma.importStyleByKeyAsync("COLOR_STYLE_KEY");
node.fillStyleId = colorStyle.id;

const textStyle = await figma.importStyleByKeyAsync("TEXT_STYLE_KEY");
textNode.textStyleId = textStyle.id;
```

### Discovery pattern — `search_design_system`

Before writing any `use_figma` code, call `search_design_system` to discover the style/variable keys you need:

| Query | Returns |
|-------|---------|
| `"body-standard"` | DS Kit text style key |
| `"heading-display"` | DS Kit text style key |
| `"shadow-xs"` | DS Kit effect style key |
| `"Fatmarker Base"` | FM color style keys |
| `"Fatmarker"` | FM text + color style keys |

Cache the keys within a single `use_figma` call — import once, apply to many nodes.

### Fallback

If `search_design_system` returns no results (file not connected to a library), fall back to:
- DS Kit: hex from `../../docs/token-reference.md` with token name comments
- FM: hex from `../../references/fm-css-reference.md` with token name comments

## Generation metadata frame

Every output must include a visible generation metadata frame as the **first sibling** before the main content.

### Required fields

| Field | Value | How to get it |
|-------|-------|---------------|
| **GENERATED** | Static label | Hardcoded |
| **Skill** | Skill name from SKILL.md frontmatter | e.g., "component-brief", "generate-flow" |
| **Prompt** | User's exact input, truncated to 200 chars | The message that triggered this skill |
| **Date** | ISO 8601 date+time when output is written | `new Date().toISOString()` |
| **Duration** | Time from prompt to output completion | e.g., "2m 34s" |
| **Model** | Model powering the session | e.g., "claude-opus-4-6" |
| **Plugin** | Plugin version | Read from `../../.claude-plugin/plugin.json` |

### Timing guidelines

Skills run in two phases. Track time across both:

1. **Research + planning** — reading files, fetching Figma context, planning the output.
2. **Generation + output** — building HTML/Figma content, making `use_figma` calls.

**Duration** = end of phase 2 − start of phase 1. Report as `Xm Ys` (e.g., "1m 42s").

## Builder functions

For dynamic content (tables with variable rows, state grids with variable columns), use the builder functions in `../../references/meta-kit/builders.md`. Copy the needed function into your `use_figma` call and invoke it.

Available builders:
- `buildSpecTable(parent, headers, rows, options)` — data tables with header row + N data rows
- `buildStateGrid(parent, states)` — horizontal row of labeled state columns

## Clone-and-Fill Pattern (preferred over raw builders)

When Meta Kit template components are available, use clone-and-fill instead of constructing frames from scratch. This gives visual consistency with the published Meta Kit style and auto-inherits any style updates.

### How it works

1. **Read registry:** Load `../../docs/meta-kit/meta-kit-registry.json` at the start of the skill (before `use_figma`)
2. **Import template:** `figma.importComponentByKeyAsync(registry.templates['table-header-row'].key)`
3. **Clone and detach:** `comp.createInstance()` → `instance.detachInstance()` — gives a mutable frame
4. **Show:** Set `visible = true` on the detached frame (templates are hidden by default)
5. **Fill slots:** Find child text nodes by `name` property, set `characters`

### Registry loading pattern

```js
// Skills read meta-kit-registry.json before calling use_figma
// Then pass the relevant keys into the code string as a constant:
const HEADER_KEY = 'KEY_FROM_REGISTRY';
const DATA_ROW_KEY = 'KEY_FROM_REGISTRY';

// Inside use_figma code:
async function cloneTemplate(templateKey) {
  const comp = await figma.importComponentByKeyAsync(templateKey);
  const instance = comp.createInstance();
  const detached = instance.detachInstance();
  detached.visible = true;
  return detached;
}

function fillSlots(frame, slots) {
  for (const [slotName, value] of Object.entries(slots)) {
    const textNode = frame.findOne(n => n.type === 'TEXT' && n.name === slotName);
    if (textNode) textNode.characters = value;
  }
}
```

### Template registry

Templates are hidden components in the Meta Kit Figma library. Each has stable, semantic layer names (e.g., `label`, `value`, `title`) that serve as the contract between the registry and builder scripts.

Registry location: `../../docs/meta-kit/meta-kit-registry.json`

Available templates:
- `table-header-row` — table header cells (slots: `label`)
- `table-data-row` — table data cells (slots: `label`, `value`)
- `state-column` — state grid columns (slots: `title`)
- `section-header` — section headings (slots: `title`, `subtitle`)
- `swatch-row` — color swatch rows (slots: `name`, `value`, `hex`)

### Fallback

If `meta-kit-registry.json` has `"PENDING"` keys (templates not yet built in Figma), fall back to the legacy builders in `../../docs/meta-kit/builders.md`.

## Two-Tier Extraction

Separate data extraction from rendering for cleaner, more debuggable `use_figma` calls.

### Pattern

1. **Tier 1 — Extract:** `use_figma` runs a deterministic extraction script → returns JSON string
2. **AI interprets:** Claude reads the JSON, decides which templates to clone, what to fill, how to arrange
3. **Tier 2 — Render:** `use_figma` runs the rendering plan (clone-and-fill)

### When to use

| Scenario | Approach |
|----------|----------|
| Building from text description (no Figma source) | Single-tier (Tier 2 only) |
| Building from existing Figma component | Two-tier |
| Auditing/documenting existing components | Two-tier |
| Syncing data from Figma | Tier 1 only |

### Example flow

```
1. use_figma: extractComponentStructure("7206:2643") → JSON
2. Claude reads JSON: "Button has 5 variant axes, 3 text props, anatomy has icon + label"
3. use_figma: clone section-header, fill title="Button"; clone table rows, fill props...
```

Skills that audit or document existing components (component-brief, design-audit) benefit most from two-tier extraction. Skills that build from scratch (generate-flow) can skip Tier 1.

## Data Model Pattern (recommended for all output skills)

For skills that generate both HTML and Figma output (component-brief, generate-flow, generate-presentation), use a structured JSON data model as the single source of truth:

```
Research (AI) → data-model.json → HTML renderer (mechanical)
                                → Figma renderer (mechanical)
```

**Benefits:**
- HTML and Figma output are guaranteed identical (same data, same arrays, same row counts)
- Feedback edits the data model → both outputs re-render consistently
- Post-push iteration reads the data model to understand what was generated
- Incremental re-rendering: change one card's data → re-render only that card

**Implementation:** See `component-brief/data-schema.md`, `component-brief/html-renderer.md`, and `component-brief/figma-renderer.md` in the `references/` directory. Other skills follow the same pattern with skill-specific schemas.

## Node tracking with `getSharedPluginData`

After creating or pushing nodes, tag them so parity checks and post-push fixes can find them later:

```js
node.setSharedPluginData('actian_ds', 'skill', 'generate-flow');
node.setSharedPluginData('actian_ds', 'screen', 'Screen 3: Login form');
node.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());
```

Read back with `node.getSharedPluginData('actian_ds', 'skill')`. This is more reliable than name-based matching for locating pushed nodes.

Note: `setPluginData` / `getPluginData` are NOT supported — use `setSharedPluginData` / `getSharedPluginData` instead. The namespace `'actian_ds'` is ours.

## `search_design_system` before importing

Before importing any library component, call `search_design_system` to verify it exists and find the correct variant. Don't assume a component key from docs is still valid — the library may have changed.

```js
// Before importing FM Alert:
// 1. search_design_system({ query: "Alert", fileKey: FM_KIT_KEY })
// 2. Confirm the component exists and has the needed variant
// 3. Then import by key
```

This also catches cases where a component was renamed, deprecated, or moved.

## Rules

- **`use_figma` is the only output path.** All Figma output goes through `use_figma`.
- **Load Figma skills.** Always pass `skillNames: "figma-use"` (or `"figma-use,figma-generate-design"` for screens, `"figma-use,figma-generate-library"` for components) when calling `use_figma`.
- **Return all created node IDs** from every `use_figma` call. Store them for parity checks.
- **Tag pushed nodes** with `setSharedPluginData('actian_ds', ...)` for reliable retrieval.
- **Never use `generate_figma_design`** — it produces raw geometry without design system awareness.
- **Never delegate Figma output to a subagent.** Subagents do NOT have MCP tools.
- **HTML is local preview only.**
- **Figma output must match HTML preview exactly.** The Figma push is a 1:1 translation of the approved HTML — not a reinterpretation. If the HTML uses placeholder bars, the Figma uses Placeholder component variants. If the HTML shows only one active nav item, the Figma shows only one active nav item. Do not add detail, color, or content that wasn't in the HTML.
- **One `use_figma` call per logical unit.** Don't split a single card or slide across multiple calls. Group related content.
- **Keep code under 20KB per call.** Split into multiple calls if needed.
- **Check library before building custom.** Before creating any custom frame for a UI element, check `../../docs/fm-components.md` (FM) or `../../docs/dskit-components.md` (DS Kit) for an existing library component. If one exists, import it — even if a variant is missing. See `library-gap-detection.md` for the full detection procedure.

## HUG Sizing Default

Figma defaults new frames to `FIXED` width of 100px. Every frame must explicitly set sizing:

```js
frame.primaryAxisSizingMode = 'AUTO';
frame.counterAxisSizingMode = 'AUTO';

parent.appendChild(frame);
frame.layoutSizingHorizontal = 'FILL';  // or 'HUG'
frame.layoutSizingVertical = 'HUG';     // MUST be set — prevents height=1px clipping
```

**Both layers are required:**
- `primaryAxisSizingMode` / `counterAxisSizingMode` — how the frame sizes itself
- `layoutSizingHorizontal` / `layoutSizingVertical` — how the frame sizes within its parent's auto-layout

## Frame Collapse Prevention

**#1 cause of invisible content in Figma output.** A frame with children but no `layoutMode` set will collapse to its minimum height (often 10px or 0px), hiding all children.

**Rule:** Set `layoutMode` BEFORE appending children:

```js
// CORRECT — layoutMode set first
const form = figma.createFrame();
form.layoutMode = 'VERTICAL';
form.primaryAxisSizingMode = 'AUTO'; // HUG height
form.counterAxisSizingMode = 'FIXED'; // fixed width
form.itemSpacing = 20;
// NOW append children — frame will grow to fit

// WRONG — children added to a frame with no layout
const form = figma.createFrame();
form.appendChild(field1); // frame stays at default 100x100 or collapses
form.appendChild(field2); // children overlap or are invisible
```

**After every frame creation, verify:** `frame.height > 50` (or whatever the minimum expected height is). If height is suspiciously small, `layoutMode` was not set.

## Instance Text Property Prevention

After creating any component instance, set ALL text properties. FM components ship with default placeholder text ("Label", "Caption", "Text", "Nav Item") that MUST be replaced:

```js
const instance = variant.createInstance();

// Set ALL text properties — find them by prefix
function setProp(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find(k => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}
setProp(instance, 'Label', 'Create Term');
setProp(instance, 'Caption', '');  // empty if not needed
setProp(instance, 'Title', 'Glossary');
```

**Never leave defaults.** If a text property isn't needed, set it to empty string — don't leave "Label" or "Caption" visible.

## Ghost Mode Prevention

After binding a variable to a node, call `setExplicitVariableModeForCollection` on the nearest ancestor that defines the mode:

```js
const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
frame.setExplicitVariableModeForCollection(collection.id, modeId);
```

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
