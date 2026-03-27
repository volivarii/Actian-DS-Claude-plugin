# Figma Output Flow

Shared procedure for outputting skill results to Figma. Used by all skills that produce Figma deliverables.

## Output mode

All Figma output uses `use_figma` — build directly in Figma via Plugin API JavaScript.

**HTML is for local preview only** — never use HTML as a Figma output path. Skills that generate HTML (component-brief, generate-presentation) do so for browser preview and archival, not for Figma delivery.

## `use_figma` pattern

Every `use_figma` call must follow these rules:

### 1. Import library components — never recreate

```js
// FM Kit components
const buttonKey = "COMPONENT_KEY_FROM_CATALOG";
const button = await figma.teamLibrary.getComponentByKeyAsync(buttonKey);
const instance = button.createInstance();
```

Imported instances arrive with all Figma variables and styles intact. No hex values needed for library components.

Look up component keys in `../../docs/fm-components.md` (FM Kit) or `../../docs/ds2026-components.md` (DS2026).

### 2. Auto-layout on every frame

```js
frame.layoutMode = "VERTICAL"; // or "HORIZONTAL"
frame.primaryAxisSizingMode = "AUTO"; // hug content
frame.counterAxisSizingMode = "FIXED"; // or "AUTO"
frame.itemSpacing = 16;
frame.paddingTop = frame.paddingBottom = 16;
frame.paddingLeft = frame.paddingRight = 20;
```

No absolute positioning. No fixed sizes unless the spec requires it (e.g., screen frames at 1440x960).

### 3. Token hex values for scaffolding only

Library component instances get automatic token binding. Only custom scaffolding (wrapper frames, backgrounds, generation log, content areas) needs hex values. Always comment the token name:

```js
frame.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }]; // --fm-base-100
```

Use values from the Token Reference tables in the skill file or `../../docs/token-reference.md`.

### 4. Descriptive layer names

Every node must have a meaningful name. No "Frame 1", "Rectangle 2", "Text 3".

```js
frame.name = "Card: Anatomy";
textNode.name = "Card title";
```

### 5. Load fonts before setting text

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });  // FM Kit
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
await figma.loadFontAsync({ family: "Roboto", style: "Regular" }); // DS2026
await figma.loadFontAsync({ family: "Roboto", style: "Medium" });
```

### 6. `hexToRgb` helper

Include this at the top of every `use_figma` code block:

```js
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

## Generation metadata frame

Every output must include a visible generation metadata frame as the **first sibling** before the main content. This is required by CLAUDE.md. The metadata frame is shared across all skills — follow this spec exactly.

### Required fields

| Field | Value | How to get it |
|-------|-------|---------------|
| **GENERATED** | Static label | Hardcoded |
| **Skill** | Skill name from SKILL.md frontmatter | e.g., "component-brief", "generate-flow" |
| **Prompt** | User's exact input, truncated to 200 chars | The message that triggered this skill |
| **Date** | ISO 8601 date+time when output is written | `new Date().toISOString()` |
| **Duration** | Time from prompt to output completion | e.g., "2m 34s" — measure from when the user's message was received to when the last `use_figma` call finishes |
| **Model** | Model powering the session | e.g., "claude-opus-4-6" |
| **Plugin** | Plugin version | Read from `../../.claude-plugin/plugin.json` |

### Timing guidelines

Skills run in two phases. Track time across both:

1. **Research + planning** — reading files, fetching Figma context, planning the output. This phase starts when the user's prompt is received.
2. **Generation + output** — building HTML/Figma content, making `use_figma` calls. This phase ends when the last output call completes.

**Duration** = end of phase 2 − start of phase 1. Report as `Xm Ys` (e.g., "1m 42s").

### `use_figma` code pattern

```js
const genCard = figma.createFrame();
genCard.name = "Generation log";
genCard.layoutMode = "VERTICAL";
genCard.itemSpacing = 4;
genCard.paddingTop = genCard.paddingBottom = 16;
genCard.paddingLeft = genCard.paddingRight = 20;
genCard.cornerRadius = 8;
genCard.primaryAxisSizingMode = "AUTO";
genCard.counterAxisSizingMode = "FIXED";
genCard.resize(280, 1); // width fixed, height hugs

genCard.fills = [{ type: 'SOLID', color: hexToRgb('#2D3648') }]; // --fm-base-800

// Add text children
async function addGenText(parent, content, size, color) {
  const t = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  t.characters = content;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color: hexToRgb(color) }];
  t.name = content.split(":")[0] || content;
  parent.appendChild(t);
  return t;
}

await addGenText(genCard, "GENERATED", 10, "#A0ABC0");                   // --fm-base-500
await addGenText(genCard, "Skill: {{skill-name}}", 12, "#CBD2E0");       // --fm-base-400
await addGenText(genCard, "Prompt: {{prompt}}", 12, "#CBD2E0");          // truncated to 200 chars
await addGenText(genCard, "{{ISO 8601 date}}", 12, "#CBD2E0");
await addGenText(genCard, "Duration: {{duration}}", 12, "#CBD2E0");
await addGenText(genCard, "{{model}} · v{{version}}", 12, "#CBD2E0");
```

Replace all `{{...}}` placeholders with actual values.

## Meta Kit components

For shared visual elements (card chrome, code blocks, do/don't pairs, generation cards), import Meta Kit library components instead of building inline. See `../../docs/meta-kit/components.md` for component keys and properties.

### Import pattern

```js
// Single component
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

When a Meta Kit component exists for an element, **always import it** instead of building inline. The component IS the spec — its dimensions, colors, and typography are the single source of truth.

## Token binding — DS2026 and FM libraries

**NEVER hardcode hex colors, pixel font sizes, or raw shadow values.** Both libraries publish reusable assets. Bind them.

### What each library publishes

| Asset type | DS2026 | FM Kit | Binding API |
|------------|--------|--------|-------------|
| **Color variables** | Yes (theme-switching) | No | `importVariableByKeyAsync` + `setBoundVariableForPaint` |
| **Color styles** | Yes | Yes (`Fatmarker Base/*`) | `importStyleByKeyAsync` + `node.fillStyleId` |
| **Text styles** | Yes (`body-standard`, etc.) | Yes (`Fatmarker/*`) | `importStyleByKeyAsync` + `node.textStyleId` |
| **Effect styles** | Yes (`shadow-xs`, etc.) | No | `importStyleByKeyAsync` + `node.effectStyleId` |

### DS2026 output — bind variables AND styles

DS2026 publishes **color variables** (for theme switching), **text styles** (typography), and **effect styles** (shadows). Use all three:

**Step 1 — Color variables** (see `../../docs/meta-kit/variables.md` for keys):

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

**Step 2 — Text styles** (discover via `search_design_system`):

```js
// Search for DS2026 text styles (e.g., "body-standard", "heading-display", "label-subtle")
// Use search_design_system with query: "body-standard" or "heading" etc.
const textStyle = await figma.importStyleByKeyAsync("TEXT_STYLE_KEY_FROM_SEARCH");
textNode.textStyleId = textStyle.id;
```

**Step 3 — Effect styles** (discover via `search_design_system`):

```js
// Search for DS2026 effect styles (e.g., "shadow-xs", "shadow-sm", "shadow-xl")
const effectStyle = await figma.importStyleByKeyAsync("EFFECT_STYLE_KEY_FROM_SEARCH");
frame.effectStyleId = effectStyle.id;
```

### FM output — bind published color and text styles

FM Kit does not publish Figma **variables**, but it publishes **color styles** and **text styles**. Always bind these instead of hardcoding:

```js
// Discover FM styles via search_design_system (query: "Fatmarker Base" for colors, "Fatmarker" for text)
const colorStyle = await figma.importStyleByKeyAsync("COLOR_STYLE_KEY");
node.fillStyleId = colorStyle.id;

const textStyle = await figma.importStyleByKeyAsync("TEXT_STYLE_KEY");
textNode.textStyleId = textStyle.id;
```

### Discovery pattern — `search_design_system`

Before writing any `use_figma` code, call `search_design_system` to discover the style/variable keys you need. Useful queries:

| Query | Returns |
|-------|---------|
| `"body-standard"` | DS2026 text style key |
| `"heading-display"` | DS2026 text style key |
| `"shadow-xs"` | DS2026 effect style key |
| `"Fatmarker Base"` | FM color style keys |
| `"Fatmarker"` | FM text + color style keys |

Cache the keys within a single `use_figma` call — import once, apply to many nodes.

### Fallback

If `search_design_system` returns no results (file not connected to a library), fall back to:
- DS2026: hex from `../../docs/token-reference.md` with token name comments
- FM: hex from `../../references/fm-css-reference.md` with token name comments

## Builder functions

For dynamic content (tables with variable rows, state grids with variable columns), use the builder functions in `../../references/meta-kit/builders.md`. Copy the needed function into your `use_figma` call and invoke it.

Available builders:
- `buildSpecTable(parent, headers, rows, options)` — data tables with header row + N data rows
- `buildStateGrid(parent, states)` — horizontal row of labeled state columns

## Rules

- **`use_figma` is the only output path.** All Figma output goes through `use_figma`.
- **Never use `generate_figma_design`** — it produces raw geometry without design system awareness and is unreliably available.
- **Never delegate Figma output to a subagent.** Subagents do NOT have MCP tools.
- **HTML is local preview only.** Open in browser with `open $URL` if the user wants to see it, but never treat HTML as a Figma delivery mechanism.
- **One `use_figma` call per logical unit.** Don't split a single card or slide across multiple calls. Group related content.
- **Keep code under 20KB per call.** Split into multiple calls if needed (e.g., one call per card, one call per slide).

## Sequential Execution Constraint

**Never run `use_figma` calls in parallel.** Concurrent writes cause silent corruption in Figma — nodes get misplaced, properties get dropped, or entire frames disappear. This applies to:

- Multiple `use_figma` calls in the same skill step
- Subagent fan-out patterns where agents share a file
- Parallel task execution touching the same Figma file

Always execute `use_figma` calls sequentially. If a skill needs multiple calls (e.g., one per card), await each before starting the next.

Source: Augment Multi-Agent skills (AugmentedAJ/skills), confirmed by Figma MCP documentation.

## HUG Sizing Default

Figma defaults new frames to `FIXED` width of 100px. Every frame created via `use_figma` must explicitly set sizing:

```js
frame.layoutSizingHorizontal = 'HUG';  // or 'FILL'
frame.layoutSizingVertical = 'HUG';    // or 'FILL'
```

Never rely on Figma's default. A frame left as FIXED 100px will clip content or leave whitespace.

Source: Component Contracts (nvillapiano/component-contracts-figma).

## Ghost Mode Prevention

After binding a variable to a node, call `setExplicitVariableModeForCollection` on the nearest ancestor that defines the mode. Without this, Figma may resolve the variable in the wrong mode (e.g., showing Explorer theme values when Actian is intended).

```js
// After binding variables to a frame:
const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
frame.setExplicitVariableModeForCollection(collection.id, modeId);
```

Source: Component Contracts (nvillapiano/component-contracts-figma).

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
