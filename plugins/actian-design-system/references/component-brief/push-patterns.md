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

**Title/subtitle are data-driven** — read `cardTitle` and `cardSubtitle` from the card object in `brief-data.json`. Never hardcode card titles in the push step (regression risk: "Anatomy" leaking across all 9 cards). Recipe titles in `recipes/brief/cardN-*.json` are the canonical source — Step 2 propagates them into the data model.

```js
// Inputs from your data model — e.g., briefData.card3_anatomy
const cardTitle = card.cardTitle;       // "Anatomy"
const cardSubtitle = card.cardSubtitle; // "Component structure, dimensions, ..."

// Import briefCard set and create variant instance
const set = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
let variant = set.findChild(n => n.name === "Mode=DS, Type=Standard");
if (!variant) variant = set.defaultVariant || set.children[0];
const inst = variant.createInstance();
inst.name = cardTitle;
const cardFrame = inst.detachInstance();

// Card Header stays as a live instance — set properties on it
const cardHeader = cardFrame.findOne(n => n.name === "Card Header" && n.type === "INSTANCE");
if (cardHeader) {
  cardHeader.setProperties({
    "Title#140:0": cardTitle,
    "Subtitle#140:1": cardSubtitle,
    "Show Subtitle#140:2": Boolean(cardSubtitle)
  });
}

// Find content slot for child injection
const contentSlot = cardFrame.findOne(n => n.name === "Content");
if (contentSlot) {
  contentSlot.layoutMode = "VERTICAL";
  contentSlot.itemSpacing = 16;
  contentSlot.paddingTop = 48;
  contentSlot.paddingBottom = 48;
  contentSlot.paddingLeft = 80;
  contentSlot.paddingRight = 80;
}

// Append to wrapper
const wrapper = await figma.getNodeByIdAsync("<wrapperId>");
wrapper.appendChild(cardFrame);

return { cardId: cardFrame.id, contentSlotId: contentSlot?.id || cardFrame.id };
```

**Card Header stays live after detach.** Use `setProperties` with `Title#140:0`, `Subtitle#140:1`, `Show Subtitle#140:2`. For the Page Header variant (card1), use `"Mode=DS, Type=Page Header"` and set `"Component Name#7:2"` (= `card.name`) and `"Description#7:3"` (= `card.description`) instead. The `cardTitle`/`cardSubtitle` fields still apply but are not surfaced visually on Page Header.

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

**Layout:** The 6 a11y requirement cards MUST be arranged in a **2×3 grid** (2 columns, 3 rows). Create a grid container frame first, then add cards to it.

```js
// First: create the 2-column grid container
const grid = figma.createFrame();
grid.name = "Requirements grid";
grid.layoutMode = "HORIZONTAL";
grid.layoutWrap = "WRAP";
grid.itemSpacing = 16;
grid.counterAxisSpacing = 16;
grid.primaryAxisSizingMode = "FIXED";
grid.counterAxisSizingMode = "AUTO";
grid.resize(1040, 10);
grid.fills = [];

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(grid);
grid.layoutSizingHorizontal = "FILL";
grid.layoutSizingVertical = "HUG";  // ← auto-grow to fit rows

return { gridId: grid.id };
```

Then for each of the 6 requirement cards, create and append to the grid. **CRITICAL: resize each card to 512px wide** so two fit per row in the 1040px grid (512 + 16 gap + 512 = 1040).

```js
const set = await figma.importComponentSetByKeyAsync("b4779a13f4097d682413a669eaaf9ead1b49f115");
let variant = set.findChild(n => n.name === "Mode=DS");
if (!variant) variant = set.defaultVariant || set.children[0];
const inst = variant.createInstance();
inst.setProperties({ "Title#47:2": "Role & semantics" });
const card = inst.detachInstance();
card.layoutSizingHorizontal = "FIXED";
card.resize(512, card.height);  // ← MUST be 512px for 2-column grid
card.clipsContent = false;

// Remove placeholder text, find content area
const content = card.findOne(n => n.name === "Content");
if (content) {
  const ph = content.findOne(n => n.type === "TEXT" && n.characters && n.characters.includes("Content goes here"));
  if (ph) ph.remove();
}

// Body text
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const body = figma.createText();
body.characters = "Use native HTML <input> element...";
body.fontSize = 13;
body.fontName = { family: "Inter", style: "Regular" };
body.fills = [{ type: "SOLID", color: hexToRgb("#3A3A4A") }];
if (content) { content.appendChild(body); body.layoutSizingHorizontal = "FILL"; }

// Code block via setProperties (do NOT detach)
const codeComp = await figma.importComponentByKeyAsync("1bf10eee1751a46da5f90a9671be6c9abf0073b7");
const codeInst = codeComp.createInstance();
codeInst.setProperties({
  "Show Header#8:0": false,
  "Code#8:2": '<label for="name">Name</label>'
});
if (content) { content.appendChild(codeInst); codeInst.layoutSizingHorizontal = "FILL"; }

const grid = await figma.getNodeByIdAsync("<gridId>");
grid.appendChild(card);

return { a11yCardId: card.id };
```

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

## Push Rules

1. **Each `use_figma` call creates 1-3 nodes max** — keep calls small (200-2000 bytes typical, up to 6KB for anatomy diagram).
2. **Return IDs from every call** — use them in subsequent calls to append children.
3. **Prefer `setProperties` over detach+findOne** — use hash-suffixed property names from `docs/metakit.json`. Only detach when you need to append children into content slots (briefCard, a11yCard). Templates like Swatch Row, A11y Spec Row, Code Block work best as live instances.
4. **No interpreter, no codegen scripts** — push directly from data model.
5. **Detach only when needed** — briefCard and a11yCard must be detached before appending children to content slots. Do NOT detach Swatch Row, A11y Spec Row, Contrast Badge, or Code Block.
6. **Set ALL properties** — never leave default placeholder text. Check `docs/metakit.json` for exact property names with `#hash` suffixes.
