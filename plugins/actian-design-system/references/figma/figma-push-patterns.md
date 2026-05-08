# Figma Push Patterns

Direct Figma Plugin API patterns for pushing content to Figma. Each pattern is a standalone `use_figma` call (200-2000 bytes). No interpreter, no JSON specs, no Node scripts at push time.

---

## 1. Component Keys

**Source of truth: registry JSON files** (synced from Figma via `/sync-design-system`).

| Registry | File | Contents |
|----------|------|----------|
| FM Kit | `docs/generated/fmkit.json` | 33 wireframe components with keys, variants, and properties |
| Meta Kit | `docs/generated/metakit.json` | 25 components + 3 templates |
| DS Kit | `docs/generated/dskit.json` | 107 design system components with keys, variants, and properties |

Each registry entry contains: `key`, `importMethod` ("set" for `importComponentSetByKeyAsync`, "single" for `importComponentByKeyAsync`), `variants`, and `properties` (with exact hash-suffixed names for `setProperties()`).

**Codegen scripts** (`shared-constants.js`) read these registries at load time via ref-name-to-slug mappings. The key maps (META_KEYS, BRIEF_KEYS, TEMPLATE_KEYS, SLIDE_KEYS, FM_KEYS) are built from the registries automatically.

**For direct push** (non-interpreter), look up the component key and method from the registry JSON before writing `use_figma` calls.

---

## 2. Core Patterns

## 0. Auto-Layout Defaults

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

const wrapper = figma.createFrame();
wrapper.name = "My Output";
wrapper.layoutMode = "HORIZONTAL";
wrapper.itemSpacing = 32;
wrapper.primaryAxisSizingMode = "AUTO";
wrapper.counterAxisSizingMode = "AUTO";
wrapper.fills = [];
wrapper.x = 0;
wrapper.y = maxY + 200;

// Store the wrapper ID so subsequent calls can append to it
wrapper.setSharedPluginData("ds", "wrapperId", wrapper.id);

return { wrapperId: wrapper.id };
```

### Pattern 2: Import single component + create instance

```js
// Import a single component by key and create an instance.
const comp = await figma.importComponentByKeyAsync("a9653f30925367e96dea90093d750bfe70849571");
const inst = comp.createInstance();
inst.name = "Generation Log";

// Set component properties (text, booleans, instance swaps).
// IMPORTANT: GenLog property keys are hash-suffixed (`Skill#3:0` etc.).
// Bare keys silently fail. Look up exact suffixes in `docs/generated/metakit.json`
// for any imported component before calling setProperties.
inst.setProperties({
  "Skill#3:0": "Skill: generate-flow",
  "Date#3:2": "2026-04-08T00:00:00Z"
});

return { instanceId: inst.id };
```

### Pattern 3: Import component set + create variant instance

```js
// Import a component set and create a specific variant.
const set = await figma.importComponentSetByKeyAsync("368b62312ca941c80ea8eeed84a57d33bb470b09");

// Find the desired variant by name (comma-separated property=value pairs)
let variant = set.findChild(n =>
  n.type === "COMPONENT" && n.name === "Type=Primary, Size=md"
);
// Fallback: defaultVariant or first child
if (!variant) variant = set.defaultVariant || set.children[0];

const inst = variant.createInstance();
inst.name = "Primary Button";

return { instanceId: inst.id };
```

### Pattern 4: Append children to frame by ID

```js
// Append previously-created nodes into a parent frame.
const parent = await figma.getNodeByIdAsync("1234:5678");
const child1 = await figma.getNodeByIdAsync("1234:5679");
const child2 = await figma.getNodeByIdAsync("1234:5680");
parent.appendChild(child1);
parent.appendChild(child2);

return { parentId: parent.id, childCount: parent.children.length };
```

### Pattern 5: Create text node

```js
// Create a text node. Always load the font before setting characters.
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const text = figma.createText();
text.characters = "Hello, world";
text.fontSize = 14;
text.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.18 } }];

// For slides, use Roboto instead:
// await figma.loadFontAsync({ family: "Roboto", style: "Regular" });

return { textId: text.id };
```

### Pattern 6: Create auto-layout frame

```js
// Create a frame with auto-layout for containing child elements.
const frame = figma.createFrame();
frame.name = "Card Container";
frame.layoutMode = "VERTICAL";
frame.itemSpacing = 16;
frame.paddingTop = 24;
frame.paddingBottom = 24;
frame.paddingLeft = 24;
frame.paddingRight = 24;
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "AUTO";
frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
frame.cornerRadius = 8;

return { frameId: frame.id };
```

### Pattern 7: Set ALL instance properties (CRITICAL — never leave defaults)

After creating any component instance, you MUST override every text and boolean property with real content from your data model. Default values like "Button label", "Nav Item", "Tag", "Page Title" are NEVER acceptable in output.

```js
// STEP 1: Create the instance (see Patterns 2 or 3)
const set = await figma.importComponentSetByKeyAsync("KEY");
let variant = set.findChild(n => n.name === "Type=Primary, Size=md, State=Default");
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
const titleText = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
if (titleText) titleText.characters = "User Management";

const subtitleText = inst.findOne(n => n.type === "TEXT" && n.name === "Subtitle");
if (subtitleText) subtitleText.characters = "Manage team members and permissions";
```

**FM Kit property reference** (exact `#hash` property names are in `docs/generated/fmkit.json` — use `setProperties()`):

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

**Rule: Use `setProperties()` with exact hash-suffixed names for exposed properties. Use `findOne(n => n.type === "TEXT" && n.name === "LayerName")` for nested text. Load the correct font before setting `.characters`. NEVER leave default placeholder text.**

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
2. **NEVER leave default property values (P0 BLOCKER)** -- scan your data model for banned defaults BEFORE pushing. These strings must NEVER appear in Figma output: `"Page Title"`, `"Description text"`, `"Button label"`, `"Label"` (standalone), `"Nav Item"`, `"Tag"`, `"Header"` (standalone), `"Feature Name"`, `"Flow Description"`, `"User Persona"`. Replace every one with real contextual content. Use `setProperties()` and `findOne()` per Pattern 7.
3. **One operation per call** -- create a frame OR import components OR populate content. Not all three.
4. **Return IDs from every call** -- use them in subsequent calls to append children.
5. **Keep calls under 2KB** -- if code is longer, split into multiple calls.
6. **Fonts before text** -- call `loadFontAsync` before setting `.characters`.
7. **Colors are 0-1 range** -- `{ r: 0.1, g: 0.1, b: 0.18 }` not `{ r: 26, g: 26, b: 46 }`.
8. **No interpreter, no JSON specs, no Node scripts at push time** -- write direct Plugin API code.
9. **Read your data model** -- the JSON you generated has all the content. Translate each node to Plugin API calls. Every text value in the data model must appear in the Figma output.
10. **If a call fails, skip that element and continue** -- don't retry in a loop.
11. **See `references/ds-rules/component-instance-rules.md`** for full property override rules, nested component patterns, and token mapping.
