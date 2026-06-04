# Figma Push Patterns

Direct Figma Plugin API patterns for pushing content to Figma. Each pattern is a standalone `use_figma` call (200-2000 bytes). No interpreter, no JSON specs, no Node scripts at push time.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures. This rule supersedes Push Rule #1 below — every code block in this document assumes `skillNames: "figma-use"` is set on the call wrapping it.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

---

## 1. Component Keys

**Source of truth: registry JSON files** (vendored from `volivarii/actian-ds-knowledge`; the knowledge repo's `sync-from-figma.yml` CI keeps them fresh nightly).

| Registry | File | Contents |
|----------|------|----------|
| FM Kit | `vendor/components/dist/registries/fmkit.json` | 287 wireframe components with keys, variants, and properties |
| Meta Kit | `vendor/components/dist/registries/metakit.json` | 28 components with keys, variants, and properties |
| DS Kit | `vendor/components/dist/registries/dskit.json` | 318 design system components with keys, variants, and properties |

Each registry entry contains: `key`, `importMethod` ("set" for `importComponentSetByKeyAsync`, "single" for `importComponentByKeyAsync`), `variants`, and `properties` (with exact hash-suffixed names for `setProperties()`).

**Codegen scripts** (`shared-constants.js`) read these registries at load time via ref-name-to-slug mappings. The key maps (META_KEYS, BRIEF_KEYS, TEMPLATE_KEYS, SLIDE_KEYS, FM_KEYS) are built from the registries automatically.

**For direct push** (non-interpreter), look up the component key and method from the registry JSON before writing `use_figma` calls.

---

## 2. Core Patterns

> **Never reparent across `use_figma` calls.** Build the wrapper first in
> call N, then build each child node directly inside it in call N+1 by
> retrieving the wrapper with `getNodeByIdAsync` and appending the NEW node
> within that same call. Cross-call `appendChild` on a node fetched by ID
> silently fails and produces orphaned frames.
> (Source: figma-generate-design/SKILL.md:203)

> **Critical Rule 15: return ALL created/mutated node IDs as a structured object.**
> Every push pattern MUST end with `return { createdNodeIds: [...], mutatedNodeIds: [...] };`.
> The orchestrating skill uses these IDs to chain subsequent `use_figma` calls.
> Single-ID returns like `{ frameId }` or `{ instanceId }` are a Rule 15 violation.
> (Source: figma-use/SKILL.md "Return IDs (CRITICAL)" [Rule 15 in v2.2.3])

## Critical Rules

These rules come from `figma-use` SKILL.md (v2.2.3, 2026-05-15).
Skipping any of them produces hard-to-debug failures. The rules in `## 2.
Core Patterns` above (skillNames mandatory-load, never-reparent, return
all node IDs) are also Critical Rules and remain in their current position
for prominence; the rules below are the rest of the canonical set.

> **Citation convention (v1.87.1+):** rule citations lead with the upstream
> *topic* (in quotes), with the version-pinned rule number in brackets — e.g.
> `(Source: figma-use/SKILL.md "Font preload before appendChild" [Rule 8 in v2.2.3])`.
> This pattern survives upstream renumbering: the topic remains stable across
> Figma's rule reshuffles, and the bracketed `[Rule N in vX.Y.Z]` records
> exactly where the rule lived at vendor-refresh time. When the next vendor
> refresh lands, refresh the bracketed `[Rule N in vX.Y.Z]` tag and verify the
> topic still matches; the rest of the citation stays untouched.

> **`getSharedPluginData`/`setSharedPluginData` (not `getPluginData`/`setPluginData`) — the unprefixed variants throw inside `use_figma`.**
> The shared variant takes a namespace + key and works inside `use_figma`.
> If you need to persist plugin metadata on a node, always use the shared
> variant.
> (Source: figma-use/SKILL.md "Shared plugin data" [Rule 3a in v2.2.3])

> **Font preload before any operation on text-bearing subtrees.**
> Per the v2.1.26 expansion (2026-04-27): you MUST `loadFontAsync` before
> `appendChild`, `insertChild`, `setBoundVariable`, `setExplicitVariableModeForCollection`,
> `setValueForMode`, AND `findAll` callbacks if any node in the touched
> subtree contains unloaded fonts. Pre-existing component instances often
> carry unloaded fonts. Reference fix shape:
>
> ```js
> // v1.87.0: Set-based dedup keyed by family|style — O(n) vs the prior
> // O(n²) JSON.stringify filter. Same correctness (figma.mixed excluded
> // by the typeof guard), much cheaper on large text-bearing subtrees.
> const seen = new Set();
> const fonts = [];
> subtree.findAll(n => n.type === 'TEXT').forEach(t => {
>   const fn = t.fontName;
>   if (!fn || typeof fn !== 'object') return;  // excludes figma.mixed
>   const key = fn.family + '|' + fn.style;
>   if (seen.has(key)) return;
>   seen.add(key);
>   fonts.push(fn);
> });
> await Promise.all(fonts.map(fn => figma.loadFontAsync(fn)));
> parent.appendChild(subtree);
> ```
>
> The `typeof fn === 'object'` guard excludes `figma.mixed` (a Symbol) which
> is truthy but produces `undefined` from `JSON.stringify`. Without the
> guard, `loadFontAsync(figma.mixed)` throws.
> (Source: figma-use/SKILL.md "Canonical text-edit recipe" [Rule 8 in v2.2.3, expanded v2.1.26])

> **Position new top-level nodes away from (0,0).**
> Top-level nodes (children of `figma.currentPage`) must be positioned at
> non-(0,0) coordinates — Figma reserves the origin region for collapsed
> overlay state. Auto-layout-nested nodes (children of frames with
> `layoutMode = "HORIZONTAL"` or `"VERTICAL"`) are exempt; only page-level
> nodes need explicit positioning. Pattern 0 (wrapper frame) follows this
> already by setting `wrapper.x = currentPage.maxY + 200`.
> (Source: figma-use/SKILL.md "Position new top-level nodes away from (0,0)" [Rule 13 in v2.2.3])

> **Atomic on error: STOP, do not immediately retry.**
> A failed `use_figma` script makes ZERO changes — Figma rolls back the
> entire script. STOP, diagnose the error, then re-issue with the fix.
> Retrying the same script on transient-looking errors is the wrong move:
> if the script failed once it will fail again, and silent retries waste
> tokens. Atomic-on-error is what makes diagnose-then-fix safe.
> (Source: figma-use/SKILL.md "On `use_figma` error, STOP" [Rule 14 in v2.2.3])

> **Always set `variable.scopes` explicitly.**
> The default `ALL_SCOPES` "pollutes every property picker — almost never
> what you want." Set scopes per the variable's intended use:
> - Color tokens: `["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"]`
> - Spacing tokens: `["GAP", "WIDTH_HEIGHT"]`
> - Typography tokens: see `figma-use/references/variable-patterns.md` for
>   the full enumeration.
> (Source: figma-use/SKILL.md "Always set `variable.scopes` explicitly" [Rule 16 in v2.2.3])

> **`await` every Promise.**
> Unawaited `loadFontAsync`, `setCurrentPageAsync`, `importComponentByKeyAsync`,
> `setFillStyleIdAsync`, etc. cause silent failures. Use `await` even when
> you don't read the return value. Promise.all is the right shape when
> loading many things in parallel; never fire-and-forget.
> (Source: figma-use/SKILL.md "`await` every Promise" [Rule 17 in v2.2.3])

### Editor Mode

`use_figma` works in **design mode only**. Figma supports multiple editor
modes (Design, FigJam, Slides, Sites) and our skill cannot author canvas
content in non-design modes. Specifically blocked node types in design
mode:

- `STICKY` (FigJam)
- `CONNECTOR` (FigJam)
- `SHAPE_WITH_TEXT` (FigJam)
- `CODE_BLOCK` (FigJam)
- `SLIDE` (Slides)
- `SLIDE_ROW` (Slides)
- `WEBPAGE` (Sites)

If the user sends a `figma.com/board/`, `figma.com/slides/`, `figma.com/make/`,
or `figma.com/sites/` URL, hand off to the appropriate read-only flow
(`get_figjam`, `get_design_context` with mode warning) — do not attempt
`use_figma` writes.

(Source: figma-use/SKILL.md "Editor Mode" [Section 4 in v2.2.3])

### ToolSearch batch-load

When invoking multiple Figma MCP tools in a single context (e.g.
`use_figma` + `get_metadata` + `get_screenshot` + `create_new_file`),
load ALL their schemas in ONE `ToolSearch` call:

```
ToolSearch query="select:use_figma,get_figjam,get_screenshot,get_metadata,create_new_file"
```

Loading them one at a time is wasteful and fragments the agent's context
window. Load all at the start of the work; each schema costs ~1-2K tokens
once.

(Source: figma-use/SKILL.md v2.2.3)

### Working with Design Systems — start at `wwds.md`

Whenever the work involves an existing DS (which is most of our work —
DS Kit, FM Kit, Meta Kit), Figma's official entry point is:

```
figma-use/references/working-with-design-systems/wwds.md
```

This file routes to per-topic sub-references (creating-with vs using
components, variables, effect styles, text styles). Read it first when
starting any DS-touching push task. Our patterns reflect its guidance
but the upstream is authoritative for any case our patterns don't cover.

(Source: figma-use/SKILL.md line 19)

> **Use `node.set({...})` to batch property updates** — figma-use SKILL.md
> Section 5. Auto-orders `layoutMode` before `width`/`height` (Critical
> Rule 11), routes width/height through `resize()` automatically, and
> chains by returning `this`. Prefer when assigning 3+ properties to a
> single node. Individual setters remain fine for 1-2 properties.
> Combine with `createAutoLayout` for the full efficient form.

## 0. Auto-Layout Defaults

> **Prefer `figma.createAutoLayout(direction, props)` over `figma.createFrame()` + manual `layoutMode` + sizing-mode assignments.**
> Per `figma-use/SKILL.md` Section 5 ("Efficient APIs"), `createAutoLayout`
> collapses 5–7 lines of boilerplate into one call, eliminates the
> "forgot to set `primaryAxisSizingMode` / `counterAxisSizingMode`" class
> of bug, and via Critical Rule 11 auto-orders `layoutMode` BEFORE
> `width`/`height` regardless of object key order. The 1-arg form
> `createAutoLayout({...})` is also valid when direction is set inside
> the props object. Reach for `createFrame()` only when you genuinely
> need `layoutMode = "NONE"` (e.g., absolute-positioned annotation
> containers) or no layout at all. See also
> `references/figma/figma-api-traps.md` for the trap catalogue.

**Any row containing text MUST use `sizing: { horizontal: "FILL" }` with text children at `Hug` sizing.** Never set fixed widths on text-bearing rows.

This prevents the row-clipping symptom seen during the Sprint B1 smoke test (long descriptive text overflowing fixed-width parent frames).

**Correct:**

```js
parentRow.layoutMode = "HORIZONTAL";
parentRow.primaryAxisSizingMode = "FIXED";   // FILL container width
parentRow.counterAxisSizingMode = "AUTO";    // HUG content height
parentRow.layoutAlign = "STRETCH";

textChild.layoutSizingHorizontal = "HUG";    // text hugs its content
textChild.layoutSizingVertical = "HUG";
textChild.textAutoResize = "WIDTH_AND_HEIGHT";
```

**Wrong (causes clipping):**

```js
parentRow.resize(400, 24);                    // fixed 400px width
textChild.resize(380, 20);                    // fixed text width
```

For helper text or descriptions that may wrap, set the parent row to FILL horizontal and the text child to FILL horizontal with `textAutoResize = "HEIGHT"` so multi-line content expands vertically without clipping.

---

## 0b. No Raw RGB — Tokens Only

**Never set `fills` or `strokes` with raw `{ r, g, b }` color objects.** Two correct paths:

1. **Scaffold containers stay transparent.** A wrapper that just provides layout structure does not need a paint at all:
   ```js
   wrapper.fills = [];        // CORRECT — transparent
   wrapper.strokes = [];      // CORRECT — no border
   ```

2. **If you genuinely need a paint, bind a Figma variable.** The Actian DS file ships color variables — look them up via `figma.variables.getLocalVariablesAsync()` or via the published library, then bind:
   ```js
   const fill = { type: "SOLID", color: { r: 0, g: 0, b: 0 } };  // placeholder
   const bound = figma.variables.setBoundVariableForPaint(fill, "color", colorVar);
   sidebar.fills = [bound];
   ```

**Wrong — leaks hardcoded values into the design** (caught during v1.53.0 smoke test):
```js
sidebar.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];                          // ❌ raw white
sidebar.strokes = [{ type: "SOLID", color: { r: 0.886, g: 0.902, b: 0.937 } }];            // ❌ raw gray
```

**Library-gap reminder:** before scaffolding any chrome (sidebar, header, toolbar, page header, action bar) with raw frames, check the registry for an existing component. FM has `fm-app-header`, `fm-nav-bar`, `fm-page-header`, `fm-banner`. DS has Global Header, Side nav, Page header, Sticky footer. **Use components first; only scaffold when the registry has no fit.** See `references/ds-rules/library-gap-detection.md`.

---

### Pattern 1: Create wrapper frame + position on page

```js
// Create the top-level wrapper frame, positioned below existing content.
const page = figma.currentPage;
let maxY = 0;
for (const child of page.children) {
  const bottom = child.y + child.height;
  if (bottom > maxY) maxY = bottom;
}

const wrapper = figma.createAutoLayout('HORIZONTAL', {
  itemSpacing: 32,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
wrapper.name = "My Output";
wrapper.x = 0;
wrapper.y = maxY + 200;

// Store the wrapper ID so subsequent calls can append to it
wrapper.setSharedPluginData("ds", "wrapperId", wrapper.id);

// Return all created/mutated node IDs per Critical Rule 15
return {
  createdNodeIds: [wrapper.id],
  mutatedNodeIds: [],
};
```

### Pattern 2: Import single component + create instance

```js
// Import a single component by key and create an instance.
const comp = await figma.importComponentByKeyAsync("a9653f30925367e96dea90093d750bfe70849571");
const inst = comp.createInstance();
inst.name = "Generation Log";

// Set component properties (text, booleans, instance swaps).
// IMPORTANT: GenLog property keys are hash-suffixed (`Skill#3:0` etc.).
// Bare keys silently fail. Look up exact suffixes in `vendor/components/dist/registries/metakit.json`
// for any imported component before calling setProperties.
inst.setProperties({
  "Skill#3:0": "Skill: generate-flow",
  "Date#3:2": "2026-04-08T00:00:00Z"
});

// Return all created/mutated node IDs per Critical Rule 15
return {
  createdNodeIds: [inst.id],
  mutatedNodeIds: [],
};
```

### Pattern 3: Import component set + create variant instance

```js
// Import a component set and create a specific variant.
const set = await figma.importComponentSetByKeyAsync("368b62312ca941c80ea8eeed84a57d33bb470b09");

// Find the desired variant by name (comma-separated property=value pairs)
let variant = set.query('COMPONENT[name="Type=Primary, Size=md"]').first();
// Fallback: defaultVariant or first child
if (!variant) variant = set.defaultVariant || set.children[0];

const inst = variant.createInstance();
inst.name = "Primary Button";

// Return all created/mutated node IDs per Critical Rule 15
return {
  createdNodeIds: [inst.id],
  mutatedNodeIds: [],
};
```

### Pattern 4: Append new children to a wrapper by ID

> **Never reparent across `use_figma` calls.** Build the wrapper first, then
> build each section directly inside it. Cross-call `appendChild` silently
> fails and produces orphaned frames.
> (Source: figma-generate-design/SKILL.md:203)

**Correct — create new nodes and append them within the same call:**

```js
// Retrieve the wrapper created in the previous call, create new children
// inside it in this call. child1 and child2 are NEW nodes — never fetched
// by getNodeByIdAsync from a prior call.
const parent = await figma.getNodeByIdAsync("1234:5678");

const child1 = figma.createAutoLayout('VERTICAL', {
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
child1.name = "Section A";
parent.appendChild(child1);

const child2 = figma.createAutoLayout('VERTICAL', {
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
child2.name = "Section B";
parent.appendChild(child2);

// Return all created/mutated node IDs per Critical Rule 15
return {
  createdNodeIds: [child1.id, child2.id],
  mutatedNodeIds: [parent.id],
};
```

**Wrong — DO NOT retrieve nodes by ID and reparent them across calls:**

```js
// ❌ FORBIDDEN: previously-created nodes fetched by ID then reparented.
//    appendChild silently fails; both nodes become orphaned frames.
const parent = await figma.getNodeByIdAsync("1234:5678");
const child1 = await figma.getNodeByIdAsync("1234:5679");  // ← created in prior call
const child2 = await figma.getNodeByIdAsync("1234:5680");  // ← created in prior call
parent.appendChild(child1);  // ← silently fails
parent.appendChild(child2);  // ← silently fails
```

### Pattern 5: Create text node

```js
// Create a text node. Always load the font before setting characters.
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const text = figma.createText();
// node.set({...}) batches 3+ property assignments — auto-orders layoutMode,
// routes width/height through resize(). loadFontAsync must precede this call.
text.set({
  characters: "Hello, world",
  fontSize: 14,
  fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.18 } }],
});

// For slides, use Roboto instead:
// await figma.loadFontAsync({ family: "Roboto", style: "Regular" });

// Return all created/mutated node IDs per Critical Rule 15
return {
  createdNodeIds: [text.id],
  mutatedNodeIds: [],
};
```

### Pattern 6: Create auto-layout frame

```js
// Create a frame with auto-layout for containing child elements.
const frame = figma.createAutoLayout('VERTICAL', {
  itemSpacing: 16,
  paddingTop: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  paddingRight: 24,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  cornerRadius: 8,
});
frame.name = "Card Container";

// Return all created/mutated node IDs per Critical Rule 15
return {
  createdNodeIds: [frame.id],
  mutatedNodeIds: [],
};
```

### Pattern 7: Set ALL instance properties (CRITICAL — never leave defaults)

After creating any component instance, you MUST override every text and boolean property with real content from your data model. Default values like "Button label", "Nav Item", "Tag", "Page Title" are NEVER acceptable in output.

```js
// STEP 1: Create the instance (see Patterns 2 or 3)
const set = await figma.importComponentSetByKeyAsync("KEY");
let variant = set.query('[name="Type=Primary, Size=md, State=Default"]').first();
if (!variant) variant = set.defaultVariant || set.children[0];
const inst = variant.createInstance();

// STEP 2: Set exposed component properties (works for explicitly exposed props)
// Use setProperties for properties the component author exposed.
// Property names must match EXACTLY — check the component definition.
inst.setProperties({
  "Label": "Save changes",           // text property
  "👁 Leading Icon": false,           // boolean property
  "👁 Trailing Icon": false,          // boolean property
  "Show label": true,                 // boolean property
  "Caption": true,                    // boolean property
  "Caption Text": "Required field",   // text property
  "Input Text": "john@actian.com",    // text property
  "Label Text": "Email address"       // text property
});

// STEP 3: For text NOT exposed as properties, find the nested text layer and override
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const titleText = inst.query('TEXT[name="Title"]').first();
if (titleText) titleText.characters = "User Management";

const subtitleText = inst.query('TEXT[name="Subtitle"]').first();
if (subtitleText) subtitleText.characters = "Manage team members and permissions";
```

**FM Kit property reference** (exact `#hash` property names are in `vendor/components/dist/registries/fmkit.json` — use `setProperties()`):

- **FM Button** — `"Label#1411:32"`: TEXT (default: "Button label"), `"👁 Leading Icon#1410:3"`: BOOLEAN (default: true → **set false**), `"👁 Trailing Icon#1410:6"`: BOOLEAN (default: true → **set false**). Variants: `Size=md|sm`, `Shape=Regular|Pill`, `Type=Primary|Secondary|Outline|Destructive`, `State=Default|Disabled`
- **FM Text input field** — `"Input Text#1411:57"`: TEXT (default: "Input text"), `"Show label#176:0"`: BOOLEAN, `"👁 Leading Icon#1411:74"`: BOOLEAN (default: false), `"👁 Trailing Icon#1411:76"`: BOOLEAN (default: false). Variants: `Type=Empty|Placeholder|Default|Disabled`. **Nested FM Input Label** exposes: `"Label Text#1555:11"`, `"Caption Text#1555:12"`, `"Caption#1555:9"`: BOOLEAN, `"Required#1555:10"`: BOOLEAN — set on the INPUT instance, not separately.
- **FM Dropdown** — `"Show label#176:13"`: BOOLEAN. Variants: `Type=Placeholder|Open|Filled|Disabled`. Text via nested `findOne` for dropdown display text.
- **FM Multi-select dropdown** — `"Dropdown Text#1411:84"`: TEXT (default: "Select"), `"Show label#176:18"`: BOOLEAN. Variants: `Type=Placeholder|Disabled|Open Multi-select|Filled|User Filled`
- **FM Search input field** — `"Input Text#1411:57"`: TEXT (default: "my search terms"), `"Show label#176:9"`: BOOLEAN. Variants: `Type=Empty|Placeholder|Filled`
- **FM Date input** — `"Input Text#1451:1"`: TEXT (default: "MM / DD / YYYY"). Variants: `State=Default|Open|Placeholder`
- **FM Text Area** — `"Show label#176:5"`: BOOLEAN. Variants: `Content=None|Placeholder|Filled`. Text via nested `findOne`.
- **FM Page Header** — `"Title#979:22"`: TEXT (default: "Page Title"), `"Subtitle#979:23"`: TEXT (default: "Description text"). Variants: `Type=Title only|Title + Subtitle|Title + Actions`
- **FM Side navigation item** — `"Label#1463:4"`: TEXT (default: "Nav Item"), `"Show icon#166:0"`: BOOLEAN, `"Show Label#1020:0"`: BOOLEAN, `"Chevron#1507:0"`: BOOLEAN. Variants: `State=On|Off|Placeholder`
- **FM App_header** — `"Show Context inputs#186:0"`: BOOLEAN. Variants: `Type=Admin|Explorer|Studio|Actian`. App name text via nested `findOne`.
- **FM Input Label** — `"Label Text#1555:11"`: TEXT (default: "Label"), `"Caption Text#1555:12"`: TEXT (default: "Caption"), `"Caption#1555:9"`: BOOLEAN, `"Required#1555:10"`: BOOLEAN. Variants: `Disabled=No|Yes`, `Type=Text|Placeholder`
- **FM Tag** — `"Icon Right#50:0"`: BOOLEAN (default: false), `"Icon Left#163:343"`: BOOLEAN (default: true). Variants: `Style=Filled|Outline|Light`. Label text via nested `findOne`.
- **FM Tab** — `"Show Icon#20:0"`: BOOLEAN. Variants: `State=On|Off|Placeholder`. Label text via nested `findOne`.
- **FM Table Cell** — Variants: `Type=Header|Text|Pill|Placeholder`. Cell text via nested `findOne`.
- **FM Badge** — Variants: `Size=Small|Medium|Large`, `Type=Icon|Number|Number Expand`. Number via nested `findOne`.
- **FM Checkbox** — Variants: `State=On|Off`, `Style=Default|Disabled`. Label text via nested `findOne`.
- **FM Toggle** — Variants: `State=On|Off`, `Style=Default|Disabled`. Label text via nested `findOne`.
- **FM Radio button** — `"Show Label#1072:0"`: BOOLEAN. Variants: `State=On|Off`, `Style=Default|Disabled`. Label text via nested `findOne`.
- **FM Alert** — Variants: `Type=Success|Error|Warning`. Title/description via nested `findOne`.
- **FM Empty State** — Variants: `Type=Default|Compact`. Title/description via nested `findOne`.
- **FM Stepper** — Variants: `State=Active|Complete|Upcoming`. Label via nested `findOne`.
- **FM Toast** — Variants: `Style=Standard|Outline`. Message text via nested `findOne`.
- **FM Tooltip** — `"Icon#163:311"`: BOOLEAN. Variants: `Position=Left|Right|Top|Bottom|...`. Tooltip text via nested `findOne`.
- **FM Chip** — `"Icon#163:337"`: BOOLEAN. Variants: `Outline=True|False`. Label via nested `findOne`.
- **FM Multi-select menu item** — `"Dropdown item text#1428:2"`: TEXT (default: "Dropdown item"). Variants: `State=On|Off|User Off`
- **FM Placeholder** — Variants: `Type=Label+1line|Label+3lines|Label+6lines|Label+avatars|metric`
- **FM Progress bar** — Variants: `Completion=10%|20%|...|100%`
- **FM Icon Buttons** — Variants: `Type=Primary|Secondary|Outline`, `State=Default|Disabled`

**Meta Kit (all skills):**
- **genLog** — `"Skill#3:0"`, `"Prompt#3:1"`, `"Date#3:2"`, `"Duration#3:3"`, `"Model#3:4"`, `"Plugin Version#3:5"` — all TEXT via `setProperties()`. **Plugin Version MUST be read from `plugin.json`** — currently `v1.55.0`. Do NOT hardcode or guess the version.
- **flowCoverCard** — `"Feature#46:8"`, `"Flow#46:9"`, `"User#46:10"` — all TEXT via `setProperties()`. NEVER leave as "Feature Name" / "Flow Description" / "User Persona".
- **divider** — no properties

**Brief Kit (component-brief):**
- **briefCard** — component set, variants by Card Type. All content via nested `findOne` — find text layers by name and override `.characters`
- **doDontPair / contrastBadge / a11yCard / colorSwatch** — all content via nested `findOne`
- **tableHeaderRow / tableDataRow / a11ySpecRow / swatchRow** — all cells via nested `findOne`

**Slide Kit (generate-presentation):** (uses Roboto font, not Inter)
- **slideCover / slideBodyFull / slideBodyTV / slideSection / slideBack** — all single components (not sets). Content via nested `findOne` — find "Title", "Subtitle", "Body" text layers.

**Rule: Use `setProperties()` with exact hash-suffixed names for exposed properties. Use `query('TEXT[name="LayerName"]').first()` for nested text. Load the correct font before setting `.characters`. NEVER leave default placeholder text.**

### Pattern 8: hexToRgb helper

```js
// Convert hex color to Figma's 0-1 RGB format. Inline in any call that needs it.
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}
// Usage: frame.fills = [{ type: "SOLID", color: hexToRgb("#1A1A2E") }];
```

---

## 3. Push Rules

1. **Always pass `skillNames: "figma-use"`** with every `use_figma` call.
2. **NEVER leave default property values (P0 BLOCKER)** -- scan your data model for banned defaults BEFORE pushing. These strings must NEVER appear in Figma output: `"Page Title"`, `"Description text"`, `"Button label"`, `"Label"` (standalone), `"Nav Item"`, `"Tag"`, `"Header"` (standalone), `"Feature Name"`, `"Flow Description"`, `"User Persona"`. Replace every one with real contextual content. Use `setProperties()` and `query()` per Pattern 7.
3. **One operation per call** -- create a frame OR import components OR populate content. Not all three.
4. **Return `{ createdNodeIds, mutatedNodeIds }` from every call (Critical Rule 15)** -- use the IDs in subsequent calls to append children. Single-ID shapes like `{ frameId }` are violations.
5. **Keep calls under 2KB** -- if code is longer, split into multiple calls.
6. **Fonts before text** -- call `loadFontAsync` before setting `.characters`.
7. **Colors are 0-1 range** -- `{ r: 0.1, g: 0.1, b: 0.18 }` not `{ r: 26, g: 26, b: 46 }`.
8. **No interpreter, no JSON specs, no Node scripts at push time** -- write direct Plugin API code.
9. **Read your data model** -- the JSON you generated has all the content. Translate each node to Plugin API calls. Every text value in the data model must appear in the Figma output.
10. **If a call fails, skip that element and continue** -- don't retry in a loop.
11. **See `references/ds-rules/component-instance-rules.md`** for full property override rules, nested component patterns, and token mapping.
