# Brief Push Patterns

Direct Figma Plugin API patterns for pushing component briefs. Each pattern is a standalone `use_figma` call. Read your `brief-data.json` and translate each card to these patterns.

All calls MUST include `skillNames: "figma-use"`.

---

## 0. Wrapper Frame (FIRST CALL — copy exactly)

```js
const page = figma.currentPage;
let maxY = 0;
for (const child of page.children) {
  const bottom = child.y + child.height;
  if (bottom > maxY) maxY = bottom;
}

const wrapper = figma.createFrame();
wrapper.name = "Component Name — Component Brief";
wrapper.layoutMode = "HORIZONTAL";  // ← MUST be HORIZONTAL, cards go side by side
wrapper.itemSpacing = 32;
wrapper.primaryAxisSizingMode = "AUTO";
wrapper.counterAxisSizingMode = "AUTO";
wrapper.fills = [];
wrapper.x = 0;
wrapper.y = maxY + 200;
wrapper.setSharedPluginData("ds", "wrapperId", wrapper.id);

return { wrapperId: wrapper.id };
```

**DO NOT use VERTICAL. Brief cards display in a HORIZONTAL row.**

---

## 0b. Generation Log (SECOND CALL — always include)

Every brief MUST start with a GenLog card as the first child of the wrapper. Import by key, set all 6 properties from `meta`.

**Source values from `brief-data.json.meta`, never from this example.** The values shown below are placeholders — using them literally produces wrong GenLog content (e.g., a stale plugin version). The data-model values were sourced in Step 2 from authoritative inputs (`plugin.json`, the runtime model name, etc.) — pass them through verbatim.

```js
// IMPORTANT: read these from your brief-data.json `meta` block, not from the example below.
const meta = briefData.meta;

const comp = await figma.importComponentByKeyAsync("a9653f30925367e96dea90093d750bfe70849571");
const inst = comp.createInstance();
inst.name = "Generation Log";
inst.setProperties({
  "Skill": "Skill: " + meta.skill,                         // "component-brief"
  "Prompt": "Prompt: component-brief " + meta.component,   // "Prompt: component-brief Button"
  "Date": meta.generatedAt,                                // ISO 8601
  "Duration": "Duration: " + meta.duration,
  "Model": meta.model,
  "Plugin Version": "v" + meta.pluginVersion              // e.g. "v1.57.2" — MUST come from project plugin.json, never invented
});

const wrapper = await figma.getNodeByIdAsync("<wrapperId>");
wrapper.appendChild(inst);

return { genLogId: inst.id };
```

**Fill all 6 properties from `brief-data.json.meta`.** Do NOT skip this card. Do NOT type any value as a literal — every value must originate in the data model.

---

## 1. Card Shell Pattern

Every card (except GenLog) uses the Brief Card component. Import it, select variant, detach, then set title/subtitle on the **nested Card Header instance** (which stays live after detach).

**Title/subtitle are data-driven** — read `cardTitle` and `cardSubtitle` from the card object in `brief-data.json`. Never hardcode card titles in the push step. Recipe titles in `recipes/brief/cardN-*.json` are the canonical source — Step 2 propagates them into the data model.

**Detecting silent setProperties failures (post-v1.66.0).** Meta Kit defaults for the Card Header are now the neutral placeholders `"Card title"` / `"Subtitle text"`. Earlier defaults were real strings (e.g. `"Anatomy"`) which masked failed `setProperties` calls — one failed card looked indistinguishable from a real Anatomy card. With the new neutral defaults, any leak is obvious and identifies the failure precisely. If a pushed card shows `"Card title"` or `"Subtitle text"` verbatim, the failure is upstream — investigate before continuing.

```js
// Inputs from your data model — e.g., briefData.card_anatomy
const cardTitle = card.cardTitle;       // "Anatomy"
const cardSubtitle = card.cardSubtitle; // "Component structure, dimensions, ..."

// Import briefCard set and create variant instance
const set = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
let variant = set.findChild(n => n.name === "Mode=DS, Type=Standard");
if (!variant) variant = set.defaultVariant || set.children[0];
const inst = variant.createInstance();
inst.name = cardTitle;
const cardFrame = inst.detachInstance();

// Card Header stays as a live instance — set properties on it.
// IMPORTANT (v1.66.4+): match the Card Header instance by NAME SUBSTRING, not
// exact equality. Depending on Meta Kit publish state, the instance may be
// named "Card Header", "Brief Card Header", or "Meta / Chrome / Brief Card
// Header" (full library path). An exact-match selector silently fails, the
// `if (cardHeader)` branch is skipped, no setProperties call runs, and the
// neutral Meta Kit defaults ("Card title" / "Subtitle text") leak into the
// brief.
const cardHeader = cardFrame.findOne(n =>
  n.type === "INSTANCE" && /Card Header/i.test(n.name)
);
if (!cardHeader) {
  // Loud fail rather than silent leak — Meta Kit structure may have changed.
  throw new Error(
    "Card Shell push: no nested Card Header instance found in detached " +
    "frame. Expected name to contain 'Card Header'. Inspect the variant " +
    "structure and update this selector."
  );
}
cardHeader.setProperties({
  "Title#140:0": cardTitle,
  "Subtitle#140:1": cardSubtitle,
  "Show Subtitle#140:2": Boolean(cardSubtitle)
});

// Read-back verification — catch silent setProperties failures (e.g. property
// IDs renamed in a future Meta Kit publish). If the title still equals the
// neutral default, the property assignment didn't take effect.
const titleNode = cardHeader.findOne(n => n.type === "TEXT" && /^Title$/i.test(n.name));
if (titleNode && titleNode.characters === "Card title") {
  throw new Error(
    "Card Header title shows the Meta Kit default ('Card title') after " +
    "setProperties — the assignment didn't apply. Check property IDs " +
    "(#140:0 / #140:1) against the current Meta Kit publish."
  );
}

// Find content slot for child injection.
// IMPORTANT (v1.66.2+): do NOT override padding / itemSpacing / layoutMode
// here. The detached frame inherits Meta Kit's auto-layout values, and
// those are the source of truth — overriding them in code makes Meta Kit
// edits invisible (the "Card padding doesn't pick up" symptom).
// If a content slot lands without auto-layout (rare, only on legacy
// instances), fix the Meta Kit component rather than re-introducing
// hardcoded values here.
const contentSlot = cardFrame.findOne(n => n.name === "Content");

// Append to wrapper
const wrapper = await figma.getNodeByIdAsync("<wrapperId>");
wrapper.appendChild(cardFrame);

return { cardId: cardFrame.id, contentSlotId: contentSlot?.id || cardFrame.id };
```

**Card Header stays live after detach.** Use `setProperties` with `Title#140:0`, `Subtitle#140:1`, `Show Subtitle#140:2`. For the Page Header variant (card1), use `"Mode=DS, Type=Page Header"` and set `"Component Name#7:2"` (= `card.name`) and `"Description#7:3"` (= `card.description`) instead. The `cardTitle`/`cardSubtitle` fields still apply but are not surfaced visually on Page Header.

### 1d. Section 1 supercard (v1.67.0+)

Section 1 is ONE card with four nested sub-frames inside, not three separate cards. After Pattern 1 creates the card and contentSlot, build sub-frames in the slot:

```js
// Inputs from data: briefData.card_component, .card_anatomy, .card_tokens
// Use cardTitle "Anatomy, variation, tokens & specs" (default in renderer; recipe-overridable).

await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Semibold" });

const slot = await figma.getNodeByIdAsync("<contentSlotId>");

async function appendSubFrame(label, sourceCard) {
  const sub = figma.createFrame();
  sub.name = label;
  sub.layoutMode = "VERTICAL";
  sub.itemSpacing = 12;
  sub.primaryAxisSizingMode = "AUTO";
  sub.counterAxisSizingMode = "AUTO";
  sub.fills = [];

  // Heading row — label + optional Draft badge
  const heading = figma.createText();
  heading.fontName = { family: "Inter", style: "Semibold" };
  heading.fontSize = 16;
  heading.characters = label;

  if (sourceCard && sourceCard._source === "generated" && sourceCard._authored !== true) {
    // Append a small "DRAFT" tag next to the heading.
    // Wrap heading + tag in a HORIZONTAL frame so they sit on the same row.
    // Note: Pattern 1b's badge construction lives in a separate use_figma
    // call scope and cannot be copy-pasted here — build the tag inline:
    const headerRow = figma.createFrame();
    headerRow.layoutMode = "HORIZONTAL";
    headerRow.itemSpacing = 8;
    headerRow.primaryAxisSizingMode = "AUTO";
    headerRow.counterAxisSizingMode = "AUTO";
    headerRow.counterAxisAlignItems = "CENTER";
    headerRow.fills = [];
    headerRow.appendChild(heading);
    const tag = figma.createText();
    tag.fontName = { family: "Inter", style: "Semibold" };
    tag.fontSize = 10;
    tag.characters = "DRAFT";
    tag.fills = [{ type: "SOLID", color: { r: 0.44, g: 0.49, b: 0.59 } }];
    headerRow.appendChild(tag);
    sub.appendChild(headerRow);
  } else {
    sub.appendChild(heading);
  }

  // Append body content per sub-section type:
  // label === "Anatomy"   → Pattern 9 (Anatomy Diagram with badges + leader lines) + Pattern 3 (parts table)
  // label === "Variation" → variant matrix push (see Pattern 8 — Variant Instance)
  // label === "Tokens"    → color swatch grid + sizing/typography tables (see Pattern 4 + Pattern 3)
  // label === "Specs"     → Pattern 14 (Specs Redline — auto-extracted from instance, with optional card_anatomy.specs override)

  slot.appendChild(sub);
  return sub;
}

// Order matches HTML renderer:
const anatomyFrame = await appendSubFrame("Anatomy", briefData.card_anatomy);
const divider1 = figma.createLine();  // horizontal divider; or reuse cardDivider styling
slot.appendChild(divider1);

const variationFrame = await appendSubFrame("Variation", briefData.card_component);
slot.appendChild(figma.createLine());

const tokensFrame = await appendSubFrame("Tokens", briefData.card_tokens);
if (briefData.card_anatomy && briefData.card_anatomy.specs && briefData.card_anatomy.specs.length) {
  slot.appendChild(figma.createLine());
  await appendSubFrame("Specs", briefData.card_anatomy);
}
```

The supercard's outer Card Header (Title #140:0 / Subtitle #140:1) is set on the cardHeader instance once via Pattern 1, using "Anatomy, variation, tokens & specs" / "Structural breakdown, variants, token bindings, and dimension specs" — or the recipe overrides if specified.

Pattern 1b (Source Badge) applies to the supercard as a whole, derived using the same "most permissive wins" logic the HTML renderer uses (see `pickSection1Provenance` in brief-renderer.js).

---

## 1b. Source Badge Pattern

Every card shell push gains a small text node bound to `card._source`. Add this AFTER Pattern 1 (Card Shell), inside the card title row:

```js
// After card shell created (Pattern 1), inside the card title row:
mcp_use_figma({
  skillNames: "figma-use",
  message: `
    var titleRow = await figma.getNodeByIdAsync('<TITLE_ROW_ID>');
    var badge = figma.createText();
    badge.fontName = { family: "Inter", style: "Medium" };
    badge.characters = card._source === "figma" ? "Source: Figma" :
                        (card._fallback ? "Source: Claude (placeholder)" : "Source: Claude");
    badge.fontSize = 10;
    var color = card._source === "figma" ?
      { r: 0.10, g: 0.36, b: 0.13 } :       // green-700
      (card._fallback ? { r: 0.90, g: 0.32, b: 0 } : { r: 0.42, g: 0.42, b: 0.42 });
    badge.fills = [{ type: 'SOLID', color: color }];
    titleRow.appendChild(badge);
  `
});
```

The badge is informational, not interactive. Renders inline next to card title.

---

## 2. Section Header Pattern

```js
const comp = await figma.importComponentByKeyAsync("f4fd576001f4f1f4606a4efb051d1e4492e378c4");
const header = comp.createInstance();
header.setProperties({
  "title#86:0": "Section Title",
  "subtitle#86:1": "Optional subtitle",
  "Show Subtitle#138:0": false
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(header);
header.layoutSizingHorizontal = "FILL";
return { headerId: header.id };
```

**Do NOT detach.** Use `setProperties` with hash-suffixed names. Set `"Show Subtitle#138:0": false` to hide the subtitle, `true` to show it.

---

## 3. Table Pattern (API, Sizing, Typography, ARIA, Contrast)

Build tables row-by-row. Each row is an auto-layout frame with text cells.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Fira Code", style: "Regular" });

const parent = await figma.getNodeByIdAsync("<contentSlotId>");

// Header row
const headerRow = figma.createFrame();
headerRow.name = "Header Row";
headerRow.layoutMode = "HORIZONTAL";
headerRow.itemSpacing = 0;
headerRow.fills = [{ type: "SOLID", color: hexToRgb("#F5F5FA") }];
headerRow.primaryAxisSizingMode = "AUTO";
headerRow.counterAxisSizingMode = "AUTO";

const headers = ["", "Property", "Type", "Default", "Values", "Notes"];
const widths = [50, 140, 100, 120, 200, 350];
for (let i = 0; i < headers.length; i++) {
  const cell = figma.createText();
  cell.characters = headers[i];
  cell.fontName = { family: "Inter", style: "Semi Bold" };
  cell.fontSize = 12;
  cell.fills = [{ type: "SOLID", color: hexToRgb("#595968") }];
  cell.resize(widths[i], cell.height);
  headerRow.appendChild(cell);
}
parent.appendChild(headerRow);
headerRow.layoutSizingHorizontal = "FILL";

// Data rows — one call per row or batch
// Each row: same layout, different text content, "Inter:Regular" font
// REQ/OPT badge: small frame with colored fill + text
return { tableId: headerRow.id };
```

**Token Tag styling (v1.69.0+):** When a table cell contains a `--zen-*` token name, render the cell as a Token Tag pill instead of plain text. Use the same construction as Pattern 14's `tokenTagSpec`:

```js
async function appendTokenTagCell(parentRow, tokenText) {
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  const labelFrame = figma.createFrame();
  labelFrame.name = "Token: " + tokenText;
  labelFrame.layoutMode = "HORIZONTAL";
  labelFrame.primaryAxisSizingMode = "AUTO";
  labelFrame.counterAxisSizingMode = "AUTO";
  labelFrame.paddingLeft = 5;
  labelFrame.paddingRight = 5;
  labelFrame.paddingTop = 2;
  labelFrame.paddingBottom = 2;
  labelFrame.cornerRadius = 3;
  labelFrame.fills = [{ type: "SOLID", color: { r: 0.941, g: 0.949, b: 0.984 } }]; // ~#F0F2FA

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.fontSize = 12;
  text.characters = tokenText;
  text.fills = [{ type: "SOLID", color: { r: 0.020, g: 0.314, b: 0.863 } }]; // ~#0550DC
  labelFrame.appendChild(text);

  parentRow.appendChild(labelFrame);
  return labelFrame;
}
```

Use this for token-name cells in: parts table (Pattern 9 anatomy parts table), sizing table (Card 1 supercard Tokens sub-frame), typography table (same), contrast row token columns. Plain-text cells remain for non-token columns (Element name, Notes, Value).

---

## 4. Color Swatch Cell Pattern (Card 4 Color Token Grid)

**MANDATORY for Card 4 (Design Tokens) color table.** Build a compact grid: one row per state, one Color Swatch + token name per column. This keeps the table dense and readable.

Each color cell is a small frame containing: Color Swatch instance (colored dot) + token name text.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

const set = await figma.importComponentSetByKeyAsync("da3369932f710386b76ca91a40ebd48d94e3f2e0");
let variant = set.findChild(n => n.name === "Size=Small");
if (!variant) variant = set.defaultVariant || set.children[0];
const swatch = variant.createInstance();

// Set fill color — the swatch IS the dot (flat 12×12 instance, NO children)
swatch.fills = [{ type: "SOLID", color: hexToRgb("#0550DC") }];

return { swatchId: swatch.id };
```

**CRITICAL:** The Color Swatch component is a flat 12×12 instance with NO children — set `.fills` directly on the swatch instance itself. Do NOT use `findOne` to look for a "Dot" or "Color" child — it will return null and the fill will never be set.

**Cell sizing (REQUIRED — prevents hex clipping):** The swatch cell wraps a 12px swatch + a stacked text block (token name 15px + hex 13px ≈ 30px tall). The cell must Hug its content vertically — never fix the height to the swatch dot. Each cell MUST set:

```js
const cell = figma.createFrame();
cell.layoutMode = "HORIZONTAL";
cell.itemSpacing = 8;
cell.counterAxisAlignItems = "CENTER";          // vertically center swatch + text block
cell.primaryAxisSizingMode = "AUTO";            // Hug width
cell.counterAxisSizingMode = "AUTO";            // Hug height — fits the 30px text stack
cell.fills = [];

// Swatch (12×12 instance, fills set per above)
cell.appendChild(swatch);

// Text stack (token name on top, hex below)
const textStack = figma.createFrame();
textStack.layoutMode = "VERTICAL";
textStack.itemSpacing = 2;
textStack.primaryAxisSizingMode = "AUTO";
textStack.counterAxisSizingMode = "AUTO";
textStack.fills = [];
// ... append token-name text node + hex text node ...
cell.appendChild(textStack);
```

Regression guard: if the cell or its parent row uses `counterAxisSizingMode = "FIXED"` or sets a hard `cell.resize(_, 20)`, the second line clips. Always Hug.

**Token Tag styling (v1.69.0+):** The token-name text below the swatch dot must use the Token Tag pill style — same construction as Pattern 3's `appendTokenTagCell`. The hex value text below the token name stays as plain monospace text (it's not a token reference). Replace the `// token-name text node` placeholder with a call to `appendTokenTagCell(textStack, tokenName)` or the inline equivalent.

**Table layout:** Build as a header row (state + column names) + data rows. Each data row: state label text + N swatch cells. The data row frame should use `layoutMode = "HORIZONTAL"`, `counterAxisAlignItems = "CENTER"`, and `counterAxisSizingMode = "AUTO"` so it grows to the tallest cell. Batch 2-3 rows per `use_figma` call.

---

## 5. Do/Don't Pair Pattern

```js
const set = await figma.importComponentSetByKeyAsync("28edfacf13e50706586172bd48f8a3ad84d7c263");
let variant = set.findChild(n => n.name === "Mode=DS");
if (!variant) variant = set.defaultVariant || set.children[0];
const pair = variant.createInstance();
pair.setProperties({
  "Do Label#9:8": "Do — Use sentence case",
  "Don't Label#9:9": "Don't — Use ALL CAPS",
  "Do Example#9:10": "Save changes",
  "Don't Example#9:11": "SAVE CHANGES"
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(pair);
pair.layoutSizingHorizontal = "FILL";
return { pairId: pair.id };
```

---

## 6. Accessibility Card Pattern

**Layout (v1.66.3+):** Requirements render as a **simple vertical bulleted list** — bold title + plain body, one per row. The previous 2×3 a11y-card grid is retired (visual noise without proportional information density). This matches the simplified HTML renderer (Brief Refresh v2 Phase 1).

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Semibold" });

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0,2),16)/255,
    g: parseInt(h.substring(2,4),16)/255,
    b: parseInt(h.substring(4,6),16)/255
  };
}

const list = figma.createFrame();
list.name = "Requirements";
list.layoutMode = "VERTICAL";
list.itemSpacing = 8;
list.primaryAxisSizingMode = "AUTO";
list.counterAxisSizingMode = "AUTO";
list.fills = [];

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(list);
list.layoutSizingHorizontal = "FILL";

// One row per requirement: "Title — body description". The title portion
// is bold; the rest is regular body weight.
for (const req of requirements) {
  const t = figma.createText();
  t.fontName = { family: "Inter", style: "Regular" };
  t.fontSize = 14;
  t.lineHeight = { unit: "PERCENT", value: 160 };
  t.fills = [{ type: "SOLID", color: hexToRgb("#2d3648") }];
  const sep = " — ";
  t.characters = req.title + sep + req.body;
  // Bold + darker color for the title portion only.
  t.setRangeFontName(0, req.title.length, { family: "Inter", style: "Semibold" });
  t.setRangeFills(0, req.title.length, [{ type: "SOLID", color: hexToRgb("#101828") }]);
  list.appendChild(t);
  t.layoutSizingHorizontal = "FILL";
}

return { listId: list.id };
```

**No more 6-card grid, no per-card code blocks.** The `code` field on each requirement (still in the data schema for back-compat) is ignored by this pattern. If a requirement genuinely needs a code example, surface it in the body text or move it to the ARIA table — don't bring back the grid.

After the requirements list, render the Contrast and ARIA tables (unchanged — Patterns 4 / 8 etc.).

---

## 7. Bullet Row Pattern (Usage: When to use / When not to use)

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

const parent = await figma.getNodeByIdAsync("<contentSlotId>");

// Green "+" bullet for "when to use"
const row = figma.createFrame();
row.layoutMode = "HORIZONTAL";
row.itemSpacing = 8;
row.primaryAxisSizingMode = "AUTO";
row.counterAxisSizingMode = "AUTO";
row.fills = [];

const prefix = figma.createText();
prefix.characters = "+";
prefix.fontSize = 14;
prefix.fontName = { family: "Inter", style: "Regular" };
prefix.fills = [{ type: "SOLID", color: hexToRgb("#16A34A") }]; // green
row.appendChild(prefix);

const label = figma.createText();
label.characters = "Single-line text entry (names, emails, search queries)";
label.fontSize = 14;
label.fontName = { family: "Inter", style: "Regular" };
label.fills = [{ type: "SOLID", color: hexToRgb("#3A3A4A") }];
row.appendChild(label);

parent.appendChild(row);
row.layoutSizingHorizontal = "FILL";

// For "when NOT to use", use "−" prefix with hexToRgb("#DC2626") (red)
return { rowId: row.id };
```

---

## 8. Variant Instance Pattern (Card 2: Component)

```js
// Import the TARGET component (the one being documented) by node ID
const targetNode = await figma.getNodeByIdAsync("<targetNodeId>");

// For component sets: find specific variant
let variantComp;
if (targetNode.type === "COMPONENT_SET") {
  variantComp = targetNode.findChild(n => n.name === "Type=Standard, State=Default");
  if (!variantComp) variantComp = targetNode.defaultVariant || targetNode.children[0];
} else {
  variantComp = targetNode;
}

const inst = variantComp.createInstance();
inst.name = "Default variant";

return { instanceId: inst.id };
```

For theme comparison frames, set `variableMode` after creating the frame:

```js
const frame = figma.createFrame();
frame.name = "Theme: Actian";
// ... add instance as child ...

// Set variable mode for this frame's scope
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCol = collections.find(c => c.name === "Color");
if (colorCol) {
  const actianMode = colorCol.modes.find(m => m.name === "Actian");
  if (actianMode) frame.setExplicitVariableModeForCollection(colorCol, actianMode.modeId);
}
```

---

## 9. Anatomy Diagram Pattern (Card 3)

Single ~4-6KB call. Creates component instance, reads bounding boxes, computes badge positions, draws badges + leader lines.

**CRITICAL: `figmaLayerName` accuracy.** The badge placement algorithm uses `findOne(n => n.name === figmaLayerName)` to locate each part within the component instance. If a layer name doesn't match, the badge won't be positioned correctly. Before building the data model, use `get_metadata` or `get_design_context` on the target component to read the actual layer names. Common patterns: "Label", "Container", "Icon", "Helper text" — but ALWAYS verify against the real Figma structure.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

// Config
const BADGE_SIZE = 22;
const LINE_WEIGHT = 1.5;
const BADGE_COLOR = hexToRgb("#1A1A2E");
const PADDING = 48;

// 1. Create container
const container = figma.createFrame();
container.name = "Anatomy diagram";
container.fills = [{ type: "SOLID", color: hexToRgb("#FAFAFF") }];

// 2. Create target component instance
const targetNode = await figma.getNodeByIdAsync("<targetNodeId>");
let variantComp;
if (targetNode.type === "COMPONENT_SET") {
  variantComp = targetNode.findChild(n => n.name === "<diagramVariant>");
  if (!variantComp) variantComp = targetNode.defaultVariant || targetNode.children[0];
} else {
  variantComp = targetNode;
}
const inst = variantComp.createInstance();
container.appendChild(inst);
inst.x = PADDING;
inst.y = PADDING;
const iw = inst.width;
const ih = inst.height;
container.resize(iw + PADDING * 2, ih + PADDING * 2);

// 3. Read bounding boxes for each part
const parts = [/* from data model: {letter, figmaLayerName} */];
const partData = [];
for (const p of parts) {
  const layer = inst.findOne(n => n.name === p.figmaLayerName);
  if (!layer) continue;
  const bb = layer.absoluteBoundingBox;
  const cbb = container.absoluteBoundingBox;
  const relX = bb.x - cbb.x;
  const relY = bb.y - cbb.y;
  const cx = relX + bb.width / 2;
  const cy = relY + bb.height / 2;
  // Closest edge
  const distTop = relY;
  const distBottom = (PADDING + ih) - (relY + bb.height);
  const distLeft = relX;
  const distRight = (PADDING + iw) - (relX + bb.width);
  const minDist = Math.min(distTop, distBottom, distLeft, distRight);
  let side = "top";
  if (minDist === distRight) side = "right";
  else if (minDist === distBottom) side = "bottom";
  else if (minDist === distLeft) side = "left";
  partData.push({ ...p, cx, cy, relX, relY, w: bb.width, h: bb.height, side });
}

// 4. Redistribute overflow (max 3 per side)
const sides = { top: [], right: [], bottom: [], left: [] };
for (const pd of partData) sides[pd.side].push(pd);
const sideNames = ["top", "right", "bottom", "left"];
for (let iter = 0; iter < 10; iter++) {
  let moved = false;
  for (const s of sideNames) {
    while (sides[s].length > 3) {
      const overflow = sides[s].pop();
      const target = sideNames.reduce((a, b) => sides[a].length <= sides[b].length ? a : b);
      sides[target].push(overflow);
      moved = true;
    }
  }
  if (!moved) break;
}

// 5. Sort each side by position
sides.top.sort((a, b) => a.cx - b.cx);
sides.bottom.sort((a, b) => a.cx - b.cx);
sides.left.sort((a, b) => a.cy - b.cy);
sides.right.sort((a, b) => a.cy - b.cy);

// 6. Create badges + lines
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
const offset = BADGE_SIZE / 2 + 8;

function createBadge(pd, bx, by, lx, ly) {
  const badge = figma.createEllipse();
  badge.resize(BADGE_SIZE, BADGE_SIZE);
  badge.x = bx - BADGE_SIZE / 2;
  badge.y = by - BADGE_SIZE / 2;
  badge.fills = [{ type: "SOLID", color: BADGE_COLOR }];
  container.appendChild(badge);

  const txt = figma.createText();
  txt.characters = pd.letter;
  txt.fontSize = 11;
  txt.fontName = { family: "Inter", style: "Semi Bold" };
  txt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  txt.textAlignHorizontal = "CENTER";
  txt.resize(BADGE_SIZE, BADGE_SIZE);
  txt.x = bx - BADGE_SIZE / 2;
  txt.y = by - BADGE_SIZE / 2;
  container.appendChild(txt);

  // Leader line
  const dx = lx - bx;
  const dy = ly - by;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > BADGE_SIZE / 2) {
    const line = figma.createLine();
    line.x = bx;
    line.y = by;
    line.resize(dist, 0);
    line.rotation = -Math.atan2(dy, dx) * 180 / Math.PI;
    line.strokes = [{ type: "SOLID", color: BADGE_COLOR }];
    line.strokeWeight = LINE_WEIGHT;
    container.appendChild(line);
  }
}

for (const pd of sides.top) {
  createBadge(pd, pd.cx, PADDING - offset, pd.cx, pd.relY);
}
for (const pd of sides.right) {
  createBadge(pd, PADDING + iw + offset, pd.cy, pd.relX + pd.w, pd.cy);
}
for (const pd of sides.bottom) {
  createBadge(pd, pd.cx, PADDING + ih + offset, pd.cx, pd.relY + pd.h);
}
for (const pd of sides.left) {
  createBadge(pd, PADDING - offset, pd.cy, pd.relX, pd.cy);
}

// Append container to content slot
const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(container);

return { diagramId: container.id };
```

Fill in `parts` array and `<targetNodeId>` / `<diagramVariant>` from `brief-data.json.card3_anatomy`.

---

## 10. Contrast Table Row Pattern

```js
// Each row: element name + foreground swatch + background swatch + ratio text + WCAG badge
const badgeSet = await figma.importComponentSetByKeyAsync("941756541adc6ce21e32e848c2039c64fece0fcf");
let badgeVariant = badgeSet.findChild(n => n.name === "Status=Pass");
if (!badgeVariant) badgeVariant = badgeSet.defaultVariant || badgeSet.children[0];
const badge = badgeVariant.createInstance();
badge.setProperties({ "Label#44:3": "Pass" });

return { badgeId: badge.id };
```

---

## 11. ARIA Spec Row Pattern

```js
const comp = await figma.importComponentByKeyAsync("92ed7bc88cf229782c4b42238aacba1d15f8fd06");
const row = comp.createInstance();
row.setProperties({
  "element#105:0": "Input field",
  "role#105:1": "textbox",
  "label#105:2": "aria-labelledby",
  "focus-order#105:3": "1",
  "keyboard#105:4": "Tab to focus",
  "announcement#105:5": "Name, edit text"
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(row);
row.layoutSizingHorizontal = "FILL";
return { rowId: row.id };
```

**Do NOT detach** — use `setProperties` with hash-suffixed property names. No font loading needed.

---

## 12. Code Block Pattern (monochrome)

```js
const comp = await figma.importComponentByKeyAsync("1bf10eee1751a46da5f90a9671be6c9abf0073b7");
const block = comp.createInstance();
block.setProperties({
  "Show Header#8:0": true,
  "Header Text#8:1": "radio-group.html",
  "Code#8:2": '<fieldset role="radiogroup">\n  <legend>Options</legend>\n  <input type="radio" name="opt" />\n</fieldset>'
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(block);
block.layoutSizingHorizontal = "FILL";
return { blockId: block.id };
```

**Do NOT detach** — use `setProperties` with hash-suffixed names. Set `"Show Header#8:0": false` to hide the filename bar. Code text renders monochrome automatically.

---

## 13. Research Insights Sub-section Pattern

When `card._research_applied === true`, push a research insights frame INSIDE the card body, AFTER the primary content.

Frame structure:
```
ResearchInsights (Frame, AUTO_LAYOUT vertical, 12px gap, 12px padding)
├── "Cross-DS research" Title (Text, 13px, weight 600)
├── PatternsObserved (Frame, vertical, 4px gap)
│   ├── "Patterns observed" Subtitle
│   └── Bullet list (one Text per pattern)
├── Recommendations (Frame, vertical, 4px gap)
│   └── (same shape as PatternsObserved)
├── Divergences (Frame, AUTO_LAYOUT vertical, amber bg, 8px padding) — only if non-empty
│   ├── "Designer review needed" Subtitle
│   └── For each divergence: "{field}: existing — {existing}; research — {research} ({note})"
└── Sources (Text, 11px, gray) — comma-separated DS names
```

Use Pattern 0 (wrapper frame) approach: small individual `use_figma` calls (~200-2000 bytes each).

```js
// 1. Create the ResearchInsights container
const researchFrame = figma.createFrame();
researchFrame.name = "ResearchInsights";
researchFrame.layoutMode = "VERTICAL";
researchFrame.itemSpacing = 12;
researchFrame.paddingTop = 12;
researchFrame.paddingBottom = 12;
researchFrame.paddingLeft = 12;
researchFrame.paddingRight = 12;
researchFrame.primaryAxisSizingMode = "AUTO";
researchFrame.counterAxisSizingMode = "AUTO";
researchFrame.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 1.0 } }]; // light blue-tinted bg
researchFrame.cornerRadius = 6;

await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const title = figma.createText();
title.characters = "Cross-DS research";
title.fontSize = 13;
title.fontName = { family: "Inter", style: "Semi Bold" };
title.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.29 } }];
researchFrame.appendChild(title);

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(researchFrame);
researchFrame.layoutSizingHorizontal = "FILL";

return { researchFrameId: researchFrame.id };
```

```js
// 2. Patterns observed sub-frame (one call per sub-section)
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const insights = card.research_insights; // from brief-data.json
const researchFrame = await figma.getNodeByIdAsync("<researchFrameId>");

function buildSubSection(label, items) {
  const frame = figma.createFrame();
  frame.name = label;
  frame.layoutMode = "VERTICAL";
  frame.itemSpacing = 4;
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.fills = [];
  const sub = figma.createText();
  sub.characters = label;
  sub.fontSize = 11;
  sub.fontName = { family: "Inter", style: "Semi Bold" };
  sub.fills = [{ type: "SOLID", color: hexToRgb("#595968") }];
  frame.appendChild(sub);
  for (const item of items) {
    const bullet = figma.createText();
    bullet.characters = "• " + item;
    bullet.fontSize = 12;
    bullet.fontName = { family: "Inter", style: "Regular" };
    bullet.fills = [{ type: "SOLID", color: hexToRgb("#3A3A4A") }];
    frame.appendChild(bullet);
    bullet.layoutSizingHorizontal = "FILL";
  }
  return frame;
}

if (insights.patterns_observed?.length) {
  const pf = buildSubSection("Patterns observed", insights.patterns_observed);
  researchFrame.appendChild(pf);
  pf.layoutSizingHorizontal = "FILL";
}
if (insights.recommendations?.length) {
  const rf = buildSubSection("Recommendations", insights.recommendations);
  researchFrame.appendChild(rf);
  rf.layoutSizingHorizontal = "FILL";
}

return { subsectionsAdded: true };
```

```js
// 3. Divergences frame (only if non-empty) + Sources line
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const insights = card.research_insights;
const researchFrame = await figma.getNodeByIdAsync("<researchFrameId>");

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

if (insights._divergences?.length) {
  const df = figma.createFrame();
  df.name = "Divergences";
  df.layoutMode = "VERTICAL";
  df.itemSpacing = 4;
  df.paddingTop = 8;
  df.paddingBottom = 8;
  df.paddingLeft = 8;
  df.paddingRight = 8;
  df.primaryAxisSizingMode = "AUTO";
  df.counterAxisSizingMode = "AUTO";
  df.fills = [{ type: "SOLID", color: hexToRgb("#FEF3C7") }]; // amber-100
  df.cornerRadius = 4;
  const dlabel = figma.createText();
  dlabel.characters = "Designer review needed";
  dlabel.fontSize = 11;
  dlabel.fontName = { family: "Inter", style: "Semi Bold" };
  dlabel.fills = [{ type: "SOLID", color: hexToRgb("#92400E") }];
  df.appendChild(dlabel);
  for (const d of insights._divergences) {
    const drow = figma.createText();
    drow.characters = d.field + ": existing — " + d.existing + "; research — " + d.research + " (" + d.note + ")";
    drow.fontSize = 11;
    drow.fontName = { family: "Inter", style: "Regular" };
    drow.fills = [{ type: "SOLID", color: hexToRgb("#78350F") }];
    df.appendChild(drow);
    drow.layoutSizingHorizontal = "FILL";
  }
  researchFrame.appendChild(df);
  df.layoutSizingHorizontal = "FILL";
}

// Sources line
if (insights.sources?.length) {
  const src = figma.createText();
  src.characters = "Sources: " + insights.sources.join(", ");
  src.fontSize = 11;
  src.fontName = { family: "Inter", style: "Regular" };
  src.fills = [{ type: "SOLID", color: { r: 0.60, g: 0.60, b: 0.65 } }];
  researchFrame.appendChild(src);
  src.layoutSizingHorizontal = "FILL";
}

return { divergencesAndSourcesDone: true };
```

---

## 14. Specs Redline Pattern (Section 1 Specs sub-frame, v1.69.0+)

Auto-extracted dimension annotations from the live component instance. Generates dimension lines from Plugin API primitives at runtime — `figma.createVector` for the line, two `figma.createLine` endcaps, `figma.createFrame` + `figma.createText` for the label pill. Replaces the v1.68.0 Meta Kit `Dimension Annotation` component path, which was blocked by the Plugin API's `resize()` limitation on component-instance children. Mirrors figma-measure (https://github.com/ph1p/figma-measure, MIT).

The `card_anatomy.specs[]` field in `brief-data.json` is an **optional override** — if non-empty, those entries drive placement instead of the auto-extracted set. Default flow leaves it empty.

Single ~5-7KB `use_figma` call.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

const PADDING = 64;                              // larger than Pattern 9's 48px to give annotations room
const REDLINE_COLOR = hexToRgb("#FF4D8E");       // pink — industry standard for redlines
const STROKE_WEIGHT = 1;
const ENDCAP_LENGTH = STROKE_WEIGHT + 6;         // figma-measure convention
const LABEL_GAP = 4;                             // gap between line and label

await figma.loadFontAsync({ family: "Inter", style: "Medium" });

// --- Inline pure functions (mirrors scripts/lib/dimension-line.js + token-tag.js) ---

function vectorPathFor(distance, orientation) {
  if (orientation === "horizontal") return "M 0 0 L " + distance + " 0 Z";
  return "M 0 0 L 0 " + distance + " Z";
}

function endcapPositionsFor(distance, orientation) {
  if (orientation === "horizontal") {
    return {
      cap1: { x: 0, y: -ENDCAP_LENGTH / 2, rotation: 90 },
      cap2: { x: distance, y: -ENDCAP_LENGTH / 2, rotation: 90 },
    };
  }
  return {
    cap1: { x: -ENDCAP_LENGTH / 2, y: 0, rotation: 0 },
    cap2: { x: -ENDCAP_LENGTH / 2, y: distance, rotation: 0 },
  };
}

function labelAnchor(distance, orientation, labelW, labelH) {
  if (orientation === "horizontal") {
    return { x: (distance - labelW) / 2, y: -labelH - LABEL_GAP };
  }
  return { x: LABEL_GAP, y: (distance - labelH) / 2 };
}

function tokenTagSpec(text) {
  return {
    text: text,
    bgColor: { r: 0.941, g: 0.949, b: 0.984 }, // ~#F0F2FA
    fgColor: { r: 0.020, g: 0.314, b: 0.863 }, // ~#0550DC
    fontName: { family: "Inter", style: "Medium" },
    fontSize: 12,
    paddingX: 5,
    paddingY: 2,
    cornerRadius: 3,
  };
}

function annotationVariant(prop, autolayout) {
  if (prop === "paddingLeft" || prop === "paddingRight") return "horizontal";
  if (prop === "paddingTop" || prop === "paddingBottom") return "vertical";
  if (prop === "itemSpacing") return autolayout === "HORIZONTAL" ? "horizontal" : "vertical";
  throw new Error("Unknown property: " + prop);
}

function formatLabel(value) {
  return value.token ? `${value.px}px — ${value.token}` : `${value.px}px`;
}

// --- Build a single dimension annotation (line + caps + label pill) ---

function buildDimensionAnnotation(distance, orientation, labelText) {
  const wrapper = figma.createFrame();
  wrapper.layoutMode = "NONE";
  wrapper.fills = [];
  wrapper.clipsContent = false;

  // Line vector
  const line = figma.createVector();
  line.vectorPaths = [{ windingRule: "NONE", data: vectorPathFor(distance, orientation) }];
  line.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
  line.strokeWeight = STROKE_WEIGHT;
  if (orientation === "horizontal") line.resize(distance, STROKE_WEIGHT);
  else line.resize(STROKE_WEIGHT, distance);
  line.x = 0;
  line.y = 0;
  wrapper.appendChild(line);

  // Endcap ticks
  const caps = endcapPositionsFor(distance, orientation);
  function makeCap(c) {
    const cap = figma.createLine();
    cap.resize(ENDCAP_LENGTH, 0);
    cap.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
    cap.strokeWeight = STROKE_WEIGHT;
    cap.rotation = c.rotation;
    cap.x = c.x;
    cap.y = c.y;
    wrapper.appendChild(cap);
  }
  makeCap(caps.cap1);
  makeCap(caps.cap2);

  // Label pill
  const spec = tokenTagSpec(labelText);
  const labelFrame = figma.createFrame();
  labelFrame.layoutMode = "HORIZONTAL";
  labelFrame.primaryAxisSizingMode = "AUTO";
  labelFrame.counterAxisSizingMode = "AUTO";
  labelFrame.paddingLeft = spec.paddingX;
  labelFrame.paddingRight = spec.paddingX;
  labelFrame.paddingTop = spec.paddingY;
  labelFrame.paddingBottom = spec.paddingY;
  labelFrame.cornerRadius = spec.cornerRadius;
  labelFrame.fills = [{ type: "SOLID", color: spec.bgColor }];

  const labelText_ = figma.createText();
  labelText_.fontName = spec.fontName;
  labelText_.fontSize = spec.fontSize;
  labelText_.characters = spec.text;
  labelText_.fills = [{ type: "SOLID", color: spec.fgColor }];
  labelFrame.appendChild(labelText_);
  wrapper.appendChild(labelFrame);

  // Position label after auto-layout has sized it
  const anchor = labelAnchor(distance, orientation, labelFrame.width, labelFrame.height);
  labelFrame.x = anchor.x;
  labelFrame.y = anchor.y;

  // Wrapper sizing — bound the visible area
  if (orientation === "horizontal") {
    wrapper.resize(Math.max(distance, labelFrame.width), labelFrame.height + LABEL_GAP + ENDCAP_LENGTH);
  } else {
    wrapper.resize(labelFrame.width + LABEL_GAP + ENDCAP_LENGTH, Math.max(distance, labelFrame.height));
  }

  return wrapper;
}

// --- Walk the target instance + place annotations ---

const container = figma.createFrame();
container.name = "Specs redline";
container.fills = [{ type: "SOLID", color: hexToRgb("#FAFAFF") }];
container.layoutMode = "NONE";
container.clipsContent = false;

const targetNode = await figma.getNodeByIdAsync("<targetNodeId>");
let variantComp;
if (targetNode.type === "COMPONENT_SET") {
  variantComp = targetNode.findChild(n => n.name === "<diagramVariant>");
  if (!variantComp) variantComp = targetNode.defaultVariant || targetNode.children[0];
} else {
  variantComp = targetNode;
}
const inst = variantComp.createInstance();
container.appendChild(inst);
inst.x = PADDING;
inst.y = PADDING;
container.resize(inst.width + PADDING * 2, inst.height + PADDING * 2);

// Auto-extraction default path (override path described below)
const anatomyParts = card_anatomy.parts || [];
const partNameSet = new Set(anatomyParts.map(p => p.figmaLayerName));

function shouldSurface(node, isTopLevel) {
  if (isTopLevel) return true;
  if (!node.children || node.children.length === 0) return false;
  return node.children.some(c => partNameSet.has(c.name));
}

const surfaces = [];
function walk(node, isTopLevel) {
  if (node.type !== "FRAME" && node.type !== "INSTANCE" && node.type !== "COMPONENT") return;
  if (shouldSurface(node, isTopLevel)) surfaces.push(node);
  for (const c of (node.children || [])) walk(c, false);
}
walk(inst, true);

async function resolveValue(numericPx, boundId) {
  if (!boundId) return { px: numericPx, token: null };
  try {
    const v = await figma.variables.getVariableByIdAsync(boundId);
    if (!v || !v.name) return { px: numericPx, token: null };
    return { px: numericPx, token: v.name };
  } catch (e) {
    return { px: numericPx, token: null };
  }
}

let extractedFrames = 0;
let boundVariablesCount = 0;
let unresolvedVariables = 0;
let tokenTagsRendered = 0;
let annotationCollisions = 0;
const placedAnnotations = []; // for collision detection

for (const surface of surfaces) {
  if (surface.layoutMode === "NONE") continue;
  extractedFrames += 1;

  const props = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "itemSpacing"];
  for (const prop of props) {
    const px = surface[prop];
    if (!px || px === 0) continue;

    const boundId = surface.boundVariables?.[prop]?.id || null;
    const value = await resolveValue(px, boundId);
    if (value.token) boundVariablesCount += 1;
    else if (boundId) unresolvedVariables += 1;

    const orientation = annotationVariant(prop, surface.layoutMode);
    const annotation = buildDimensionAnnotation(px, orientation, formatLabel(value));
    tokenTagsRendered += 1;

    // Position annotation against the surface's bounding box
    const sbb = surface.absoluteBoundingBox;
    const cbb = container.absoluteBoundingBox;
    const sx = sbb.x - cbb.x;
    const sy = sbb.y - cbb.y;
    const GAP = 8;
    if (prop === "paddingLeft") {
      annotation.x = sx - annotation.width - GAP;
      annotation.y = sy + sbb.height / 2 - annotation.height / 2;
    } else if (prop === "paddingRight") {
      annotation.x = sx + sbb.width + GAP;
      annotation.y = sy + sbb.height / 2 - annotation.height / 2;
    } else if (prop === "paddingTop") {
      annotation.x = sx + sbb.width / 2 - annotation.width / 2;
      annotation.y = sy - annotation.height - GAP;
    } else if (prop === "paddingBottom") {
      annotation.x = sx + sbb.width / 2 - annotation.width / 2;
      annotation.y = sy + sbb.height + GAP;
    } else if (prop === "itemSpacing") {
      annotation.x = sx + sbb.width / 2 - annotation.width / 2;
      annotation.y = sy + sbb.height / 2 - annotation.height / 2;
    }

    // Collision detection — increment counter when within 8px of an existing annotation
    for (const placed of placedAnnotations) {
      if (Math.abs(annotation.x - placed.x) < 8 && Math.abs(annotation.y - placed.y) < 8) {
        annotationCollisions += 1;
        break;
      }
    }
    placedAnnotations.push({ x: annotation.x, y: annotation.y });

    container.appendChild(annotation);
  }
}

const parent = await figma.getNodeByIdAsync("<specsSubFrameId>");
parent.appendChild(container);

return {
  redlineId: container.id,
  pattern14: {
    extractedFrames,
    boundVariables: boundVariablesCount,
    unresolvedVariables,
    authorOverrides: 0,
    annotationCollisions,
    tokenTagsRendered,
  },
};
```

**When `card_anatomy.specs[]` is non-empty (author override path):** skip the surface walk above and emit one annotation per `specs[i]` entry instead. For each entry, find the layer named `specs[i].layerName` in the rendered instance via `inst.findOne(n => n.name === specs[i].layerName)`. If the layer is missing, drop the entry and increment a `droppedSpecs` counter for the manifest. Otherwise read the layer's relevant dimension (`specs[i].value`) and call `buildDimensionAnnotation(specs[i].value, specs[i].orientation || "horizontal", formatLabel({ px: specs[i].value, token: specs[i].tokenName || null }))`. Append the annotation to the container at the layer's bounding-box edge per `specs[i].side`. Set `pattern14.authorOverrides` to the placed count.

**Pointer Badge sizing path** — for components with explicit `width` or `height` token bindings on the top-level instance frame, emit a "pointer badge" pill instead of a dimension line. The pointer badge is a single Token Tag pill (no line, no caps) anchored at the instance's closest edge. Build with the same `tokenTagSpec` helper:

```js
const wbid = inst.boundVariables?.width?.id || null;
const hbid = inst.boundVariables?.height?.id || null;
if (wbid || hbid) {
  const wValue = await resolveValue(inst.width, wbid);
  const hValue = await resolveValue(inst.height, hbid);
  // emit pointer-style Token Tag at edge — see Pattern 8 / Pattern 4 for token tag construction details
  // (caller composes the same labelFrame as inside buildDimensionAnnotation, positions at instance edge)
}
```

Skip if both are unbound (most common case).

**Failure modes** (from Phase 2 design spec):

- Component has no autolayout → skip redline render. Emit a primitive text node footnote in the Specs sub-frame: "Auto-extraction unavailable — no autolayout detected on this component."
- `getVariableByIdAsync` returns null → keep raw px, increment `unresolvedVariables`.
- Layer referenced by author-supplied spec doesn't exist → drop spec entry, increment `droppedSpecs` in manifest.
- Two annotations within 8px of each other → increment `annotationCollisions` in manifest. Phase 3 adds proper collision routing.

---

## Push Rules

1. **Each `use_figma` call creates 1-3 nodes max** — keep calls small (200-2000 bytes typical, up to 6KB for anatomy diagram).
2. **Return IDs from every call** — use them in subsequent calls to append children.
3. **Prefer `setProperties` over detach+findOne** — use hash-suffixed property names from `docs/generated/metakit.json`. Only detach when you need to append children into content slots (briefCard, a11yCard). Templates like Swatch Row, A11y Spec Row, Code Block work best as live instances.
4. **No interpreter, no codegen scripts** — push directly from data model.
5. **Detach only when needed** — briefCard and a11yCard must be detached before appending children to content slots. Do NOT detach Swatch Row, A11y Spec Row, Contrast Badge, or Code Block.
6. **Set ALL properties** — never leave default placeholder text. Check `docs/generated/metakit.json` for exact property names with `#hash` suffixes.
