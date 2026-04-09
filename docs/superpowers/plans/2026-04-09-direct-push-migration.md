# Direct Push Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 24KB interpreter pipeline with small direct `use_figma` calls (200-6000 bytes each) for all Figma push skills, and remove ~5,800 lines of dead codegen code.

**Architecture:** Agent reads data model JSON, emits small direct Plugin API calls using documented push patterns. No interpreter, no codegen scripts, no generated files at push time. Anatomy diagram uses a single ~4-6KB inline call with spatial math.

**Tech Stack:** Figma Plugin API via `use_figma` MCP tool, Markdown reference docs, Node.js for remaining utility scripts.

---

### Task 1: Write brief-push-patterns.md

**Files:**
- Create: `plugins/actian-design-system/references/brief-push-patterns.md`

- [ ] **Step 1: Create the brief push patterns reference**

This file documents every pattern the agent needs to push a component brief to Figma. The agent reads this + the data model and emits direct `use_figma` calls. Write the file with these sections:

```markdown
# Brief Push Patterns

Direct Figma Plugin API patterns for pushing component briefs. Each pattern is a standalone `use_figma` call. Read your `brief-data.json` and translate each card to these patterns.

All calls MUST include `skillNames: "figma-use"`.

---

## 1. Card Shell Pattern

Every card (except GenLog) uses the Brief Card component. Import it, set variant, set title/subtitle, detach, find content slot.

```js
// Import briefCard set and create variant instance
const set = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
let variant = set.findChild(n => n.name === "Mode=DS, Type=Standard");
if (!variant) variant = set.defaultVariant || set.children[0];
const card = variant.createInstance();
card.name = "Card Title";
card.setProperties({
  "Title#7:0": "Card Title",
  "Subtitle#7:1": "Card subtitle description"
});
card.detachInstance();
card.resize(1200, card.height);

// Find content slot for child injection
const contentSlot = card.findOne(n => n.name === "Content");
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
wrapper.appendChild(card);

return { cardId: card.id, contentSlotId: contentSlot?.id || card.id };
```

For Page Header variant, use `"Mode=DS, Type=Page Header"` and set `"Component Name#7:2"` and `"Description#7:3"` instead of Title/Subtitle.

---

## 2. Section Header Pattern

```js
const comp = await figma.importComponentByKeyAsync("f4fd576001f4f1f4606a4efb051d1e4492e378c4");
const header = comp.createInstance();
header.detachInstance();
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
const titleText = header.findOne(n => n.type === "TEXT" && n.name === "title");
if (titleText) titleText.characters = "Section Title";

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(header);
header.layoutSizingHorizontal = "FILL";
return { headerId: header.id };
```

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

## 4. Color Swatch Cell Pattern

```js
const set = await figma.importComponentSetByKeyAsync("da3369932f710386b76ca91a40ebd48d94e3f2e0");
let variant = set.findChild(n => n.name === "Size=Small");
if (!variant) variant = set.defaultVariant || set.children[0];
const swatch = variant.createInstance();

// Set fill color from hex
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}
const dot = swatch.findOne(n => n.name === "Dot" || n.name === "Color");
if (dot) dot.fills = [{ type: "SOLID", color: hexToRgb("#0550DC") }];

return { swatchId: swatch.id };
```

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

```js
const set = await figma.importComponentSetByKeyAsync("b4779a13f4097d682413a669eaaf9ead1b49f115");
let variant = set.findChild(n => n.name === "Mode=DS");
if (!variant) variant = set.defaultVariant || set.children[0];
const card = variant.createInstance();
card.setProperties({ "Title#47:0": "Role & semantics" });
card.detachInstance();

// Find content area and add body text
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const body = figma.createText();
body.characters = "Use native HTML <input> element...";
body.fontSize = 13;
body.fills = [{ type: "SOLID", color: hexToRgb("#3A3A4A") }];
const content = card.findOne(n => n.name === "Content");
if (content) content.appendChild(body);

// Code block (monochrome)
await figma.loadFontAsync({ family: "Fira Code", style: "Regular" });
const codeComp = await figma.importComponentByKeyAsync("1bf10eee1751a46da5f90a9671be6c9abf0073b7");
const codeInst = codeComp.createInstance();
codeInst.detachInstance();
const codeText = codeInst.findOne(n => n.type === "TEXT");
if (codeText) {
  codeText.fontName = { family: "Fira Code", style: "Regular" };
  codeText.characters = '<label for="name">Name</label>';
  codeText.fills = [{ type: "SOLID", color: hexToRgb("#BABED8") }];
}
if (content) content.appendChild(codeInst);

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
row.detachInstance();

await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const slots = { element: "Input field", role: "textbox", label: "aria-labelledby", "focus-order": "1", keyboard: "Tab to focus", announcement: "Name, edit text" };
for (const [name, value] of Object.entries(slots)) {
  const txt = row.findOne(n => n.type === "TEXT" && n.name === name);
  if (txt) txt.characters = value;
}

return { rowId: row.id };
```

---

## 12. Code Block Pattern (monochrome)

```js
const comp = await figma.importComponentByKeyAsync("1bf10eee1751a46da5f90a9671be6c9abf0073b7");
const block = comp.createInstance();
block.detachInstance();

await figma.loadFontAsync({ family: "Fira Code", style: "Regular" });
const codeText = block.findOne(n => n.type === "TEXT");
if (codeText) {
  codeText.fontName = { family: "Fira Code", style: "Regular" };
  codeText.characters = ".zen-text-input {\n  height: var(--zen-size-3xl);\n}";
  codeText.fills = [{ type: "SOLID", color: hexToRgb("#BABED8") }];
  codeText.fontSize = 12;
}

return { blockId: block.id };
```

---

## Push Rules

1. **Each `use_figma` call creates 1-3 nodes max** — keep calls small (200-2000 bytes typical, up to 6KB for anatomy diagram).
2. **Return IDs from every call** — use them in subsequent calls to append children.
3. **Fonts before text** — always `loadFontAsync` before setting `.characters`.
4. **No interpreter, no codegen scripts** — push directly from data model.
5. **Detach before content injection** — briefCard and a11yCard must be detached before appending children to content slots.
6. **Set ALL properties** — never leave default placeholder text. Check `docs/metakit.json` for exact property names with `#hash` suffixes.
```

- [ ] **Step 2: Verify file was written correctly**

Run: `wc -l plugins/actian-design-system/references/brief-push-patterns.md`
Expected: ~350-400 lines

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/references/brief-push-patterns.md
git commit -m "docs: add brief-push-patterns.md for direct push migration"
```

---

### Task 2: Write create-component push patterns

**Files:**
- Create: `plugins/actian-design-system/references/create-component/push-patterns.md`

- [ ] **Step 1: Create the create-component push patterns reference**

```markdown
# Create Component — Direct Push Patterns

Direct Figma Plugin API patterns for creating components. The agent writes these calls directly instead of using `assembleCall()` + interpreter.

All calls MUST include `skillNames: "figma-use"`.

---

## 1. Create a Single Component

```js
const comp = figma.createComponent();
comp.name = "Size=Small, State=Default";

// Layout
comp.layoutMode = "HORIZONTAL";
comp.itemSpacing = 8;
comp.paddingTop = 8;
comp.paddingBottom = 8;
comp.paddingLeft = 16;
comp.paddingRight = 16;
comp.primaryAxisSizingMode = "AUTO";
comp.counterAxisSizingMode = "AUTO";

// Visual
comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
comp.cornerRadius = 4;

// Add children (text, frames, etc.) before adding properties
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const label = figma.createText();
label.name = "Label";
label.characters = "Button";
label.fontSize = 14;
comp.appendChild(label);

return { compId: comp.id };
```

---

## 2. Add Component Properties

After creating the component and its children:

```js
const comp = await figma.getNodeByIdAsync("<compId>");

// Text property
comp.addComponentProperty("Label", "TEXT", "Button");

// Boolean property
comp.addComponentProperty("Show Icon", "BOOLEAN", true);

// Get the hash-suffixed key for property linking
const keys = Object.keys(comp.componentPropertyDefinitions);
const labelKey = keys.find(k => k.split("#")[0] === "Label");

return { labelKey };
```

---

## 3. Link Properties to Text Layers

```js
const comp = await figma.getNodeByIdAsync("<compId>");
const labelKey = "<labelKey>"; // from previous call

const textNode = comp.findOne(n => n.type === "TEXT" && n.name === "Label");
if (textNode) {
  textNode.componentPropertyReferences = { characters: labelKey };
}

return "linked";
```

---

## 4. Combine as Variant Set

After creating all variant components on the page:

```js
const compIds = ["<comp1Id>", "<comp2Id>", "<comp3Id>"];
const components = [];
for (const id of compIds) {
  components.push(await figma.getNodeByIdAsync(id));
}

const set = figma.combineAsVariants(components, figma.currentPage);
set.name = "My Component";
set.description = "Component description for the library.";

return { setId: set.id };
```

---

## 5. Variable Scoping (optional)

```js
const set = await figma.getNodeByIdAsync("<setId>");
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCol = collections.find(c => c.name === "Color");
if (colorCol) {
  set.setExplicitVariableModeForCollection(colorCol, colorCol.modes[0].modeId);
}
return "scoped";
```

---

## Push Sequence

1. Create each variant component (1 call each)
2. Add properties to each component (1 call each)
3. Link properties to text layers (1 call each, can batch)
4. Combine as variant set (1 call)
5. Set description and variable scoping (1 call)
6. Add GenLog instance as sibling (1 call)
```

- [ ] **Step 2: Commit**

```bash
git add plugins/actian-design-system/references/create-component/push-patterns.md
git commit -m "docs: add create-component push patterns for direct push"
```

---

### Task 3: Update component-brief SKILL.md

**Files:**
- Modify: `plugins/actian-design-system/skills/component-brief/SKILL.md:110-176`

- [ ] **Step 1: Replace Step 3 with direct push instructions**

Replace everything from `## Step 3 — Push to Figma` through `## Step 4 — Parity check` (exclusive) with:

```markdown
## Step 3 — Push to Figma (direct calls)

Read your `brief-data.json` and push directly to Figma using small `use_figma` calls. Read `../../references/brief-push-patterns.md` for all patterns. Read `../../references/figma-push-patterns.md` for core patterns (wrapper frame, hexToRgb, etc.). Always pass `skillNames: "figma-use"` to every call.

**Push sequence** (each step is one small `use_figma` call, ~200-2000 bytes; anatomy diagram ~4-6KB):

1. Navigate to target page + create wrapper frame (Pattern 1 from figma-push-patterns.md)
2. Create GenLog instance (import by key, set 6 meta props, append to wrapper)
3. For each card in the data model:
   a. Create card shell (import briefCard set, set variant + title + subtitle, detach, find content slot)
   b. Populate content: translate data model fields to Plugin API calls using brief-push-patterns.md
   c. Card 3 anatomy: use the anatomy diagram pattern (~4-6KB inline call)
4. After all cards pushed, report to user with count

**Rules:**
- Each `use_figma` call creates 1-3 nodes max — keep calls small
- Return IDs from every call — use them in subsequent calls to append children
- If a call fails, skip that element and continue
- Do NOT run `brief-to-figma.js` — push directly from your data model
- Do NOT read any `.js` files, manifests, or scaffolds
- Code blocks (Cards 8, 9) render as monochrome — single color `#BABED8`, no per-token coloring

### Pushing specific cards only

Read only the relevant card keys from `brief-data.json` and push those cards. Skip the rest.

### Incremental update

To fix a specific card: edit the data model, then re-push just that card using the same patterns. Use `figma.getNodeByIdAsync` to find and remove the old card frame before pushing the replacement.
```

- [ ] **Step 2: Run contract test to verify skill file is still valid**

Run: `cd plugins/actian-design-system && source scripts/resolve-node.sh && "$NODE_BIN" tests/contract.test.js 2>&1 | tail -5`
Expected: All tests pass (contract tests check script existence, not skill content)

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/skills/component-brief/SKILL.md
git commit -m "docs: rewrite brief Step 3 for direct push (no interpreter)"
```

---

### Task 4: Update create-component SKILL.md

**Files:**
- Modify: `plugins/actian-design-system/skills/create-component/SKILL.md:40-52`

- [ ] **Step 1: Replace Step 5 (Figma build) with direct push instructions**

Replace lines 40-52 (the numbered list items 1-7) with:

```markdown
1. Read `../../references/create-component/push-patterns.md` — direct push patterns
2. Read `../../references/figma-push-patterns.md` — core patterns (wrapper frame, hexToRgb, etc.)
3. Resolve dependencies per `../../references/create-component/research-and-dependencies.md`
4. Push to Figma using small direct `use_figma` calls. Always pass `skillNames: "figma-use"`.

   **Push sequence:**
   a. For each variant: create component, set name, apply layout/fills, add children (1-2 calls each)
   b. Add component properties to each variant (1 call each)
   c. Link properties to text layers (1 call per component)
   d. Combine as variant set: `figma.combineAsVariants(components, page)` (1 call)
   e. Set name, description, variable scoping (1 call)
   f. Add GenLog instance as sibling (1 call)

   **Rules:**
   - Do NOT run any codegen scripts or `assembleCall()` — push directly
   - Do NOT read any `.js` files, manifests, or scaffolds
   - Return IDs from every call — use them in subsequent calls
```

- [ ] **Step 2: Commit**

```bash
git add plugins/actian-design-system/skills/create-component/SKILL.md
git commit -m "docs: rewrite create-component Step 5 for direct push"
```

---

### Task 5: Remove dead codegen scripts and interpreter

**Files:**
- Remove: `plugins/actian-design-system/scripts/brief-to-figma.js`
- Remove: `plugins/actian-design-system/scripts/flow-to-figma.js`
- Remove: `plugins/actian-design-system/scripts/slide-to-figma.js`
- Remove: `plugins/actian-design-system/scripts/figma-interpreter.js`
- Remove: `plugins/actian-design-system/scripts/figma-interpreter.min.js`
- Remove: `plugins/actian-design-system/scripts/minify-interpreter.sh`

- [ ] **Step 1: Remove the files**

```bash
cd plugins/actian-design-system
git rm scripts/brief-to-figma.js scripts/flow-to-figma.js scripts/slide-to-figma.js scripts/figma-interpreter.js scripts/figma-interpreter.min.js scripts/minify-interpreter.sh
```

- [ ] **Step 2: Verify remaining scripts still work**

Run: `source scripts/resolve-node.sh && "$NODE_BIN" scripts/assemble-preview.js --help 2>&1 | head -3`
Expected: Usage help output (not an import error)

Run: `"$NODE_BIN" -e "require('./scripts/shared-constants.js')" 2>&1`
Expected: No error (shared-constants.js should still load even though it references the interpreter — we'll clean that in Task 7)

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove dead codegen scripts and interpreter

Removes brief-to-figma.js, flow-to-figma.js, slide-to-figma.js,
figma-interpreter.js, figma-interpreter.min.js, minify-interpreter.sh.
All skills now push directly via use_figma — no interpreter needed."
```

---

### Task 6: Remove dead reference docs

**Files:**
- Remove: `plugins/actian-design-system/references/generate-flow/figma-spec-builder.md`
- Remove: `plugins/actian-design-system/references/generate-presentation/figma-spec-builder.md`
- Remove: `plugins/actian-design-system/references/create-component/figma-spec-builder.md`

- [ ] **Step 1: Remove the files**

```bash
cd plugins/actian-design-system
git rm references/generate-flow/figma-spec-builder.md references/generate-presentation/figma-spec-builder.md references/create-component/figma-spec-builder.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove figma-spec-builder.md references (superseded by push-patterns)"
```

---

### Task 7: Clean shared-constants.js

**Files:**
- Modify: `plugins/actian-design-system/scripts/shared-constants.js:260-598`

- [ ] **Step 1: Remove codegen functions and their exports**

Remove these sections (lines 260-566):
- `_interpreterCache` variable + `getInterpreterSource()` function (lines 265-274)
- `getRuntimeSize()` function (lines 277-279)
- `getMaxBinSize()` function (lines 281-291)
- `assembleCall()` function (lines 293-311)
- `writeCallFiles()` function (lines 313-358)
- `writeCallFilesV2()` function (lines 360-521)
- `reassembleCall()` function (lines 523-539)
- `binPack()` function (lines 541-566)

Also remove their section header comment (line 260-262):
```
// ---------------------------------------------------------------------------
// Interpreter call assembly
// ---------------------------------------------------------------------------
```

Remove from module.exports:
- `assembleCall`
- `writeCallFiles`
- `writeCallFilesV2`
- `reassembleCall`
- `getRuntimeSize`
- `getMaxBinSize`
- `binPack`

Keep these exports:
- `META_KEYS`, `BRIEF_KEYS`, `TEMPLATE_KEYS`, `SLIDE_KEYS`, `FM_FALLBACK_KEYS`, `DS_KEYS`
- `META_SLUGS`, `BRIEF_SLUGS`, `TEMPLATE_SLUGS`, `SLIDE_SLUGS`, `FM_SLUGS`, `DS_SLUGS`
- `loadRegistry`, `getProperties`
- `TOKEN_COLORS`, `PALETTE`
- `buildGenLog`
- `compactSize`

- [ ] **Step 2: Verify shared-constants.js still loads**

Run: `cd plugins/actian-design-system && source scripts/resolve-node.sh && "$NODE_BIN" -e "const s = require('./scripts/shared-constants.js'); console.log('Keys:', Object.keys(s).length, '| loadRegistry:', typeof s.loadRegistry, '| buildGenLog:', typeof s.buildGenLog)"`
Expected: `Keys: <N> | loadRegistry: function | buildGenLog: function`

- [ ] **Step 3: Verify assemble-preview still works**

Run: `"$NODE_BIN" scripts/assemble-preview.js --help 2>&1 | head -3`
Expected: Usage help (assemble-preview doesn't use codegen functions)

- [ ] **Step 4: Commit**

```bash
git add plugins/actian-design-system/scripts/shared-constants.js
git commit -m "chore: remove codegen functions from shared-constants.js

Removes assembleCall, writeCallFiles, writeCallFilesV2, reassembleCall,
getInterpreterSource, getRuntimeSize, getMaxBinSize, binPack.
Keeps registry loaders, key maps, buildGenLog, palette, compactSize."
```

---

### Task 8: Remove dead tests and snapshots

**Files:**
- Remove: `plugins/actian-design-system/tests/codegen-snapshots.test.js`
- Remove: `plugins/actian-design-system/tests/snapshots/` (entire directory)

- [ ] **Step 1: Remove test files**

```bash
cd plugins/actian-design-system
git rm tests/codegen-snapshots.test.js
git rm -r tests/snapshots/
```

- [ ] **Step 2: Update contract.test.js — remove --help contracts for removed scripts**

In `plugins/actian-design-system/tests/contract.test.js`, find the `helpScripts` array in "Part 4: --help output contracts" and remove the entries for `flow-to-figma.js`, `brief-to-figma.js`, and `slide-to-figma.js`. Keep only `assemble-preview.js`.

The array should go from:
```javascript
var helpScripts = [
  { script: path.join(SCRIPTS_DIR, "flow-to-figma.js"), expectedName: "flow-to-figma" },
  { script: path.join(SCRIPTS_DIR, "brief-to-figma.js"), expectedName: "brief-to-figma" },
  { script: path.join(SCRIPTS_DIR, "slide-to-figma.js"), expectedName: "slide-to-figma" },
  { script: path.join(SCRIPTS_DIR, "assemble-preview.js"), expectedName: "assemble-preview" },
];
```

To:
```javascript
var helpScripts = [
  { script: path.join(SCRIPTS_DIR, "assemble-preview.js"), expectedName: "assemble-preview" },
];
```

- [ ] **Step 3: Run remaining tests**

Run: `cd plugins/actian-design-system && source scripts/resolve-node.sh && "$NODE_BIN" tests/contract.test.js 2>&1 | tail -5`
Expected: All tests pass

Run: `"$NODE_BIN" tests/schema.test.js 2>&1 | tail -5`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -A tests/
git commit -m "chore: remove codegen snapshot tests, update contract tests

Removes codegen-snapshots.test.js and tests/snapshots/ directory.
Removes --help contracts for removed scripts (brief/flow/slide-to-figma)."
```

---

### Task 9: Update reference docs

**Files:**
- Modify: `plugins/actian-design-system/CLAUDE.md:40-44`
- Modify: `plugins/actian-design-system/references/figma-output.md:112-150`
- Modify: `plugins/actian-design-system/references/companion-context.md:115-123`
- Modify: `plugins/actian-design-system/references/component-brief/data-schema.md` (add monochrome note)

- [ ] **Step 1: Update CLAUDE.md**

Replace the Scripts section (lines 40-44):
```markdown
**Scripts** (deterministic: data.json -> interpreter + JSON spec):
- `scripts/flow-to-figma.js`, `scripts/brief-to-figma.js`, `scripts/slide-to-figma.js`
- Each call file = `figma-interpreter.min.js` + JSON spec. Self-contained, no wrapper ID replacement.
```

With:
```markdown
**Scripts** (utilities — NOT used for Figma push):
- `scripts/assemble-preview.js` — generates HTML previews from data models
- `scripts/shared-constants.js` — registry loaders, key maps, palette, buildGenLog
- `scripts/fm-tree-to-flow-data.js` — converts FM Figma tree to flow-data.json
```

- [ ] **Step 2: Update figma-output.md**

Replace the "JSON Spec Interpreter" section (lines 112-150) with:

```markdown
## Direct Push Pattern (all skills)

All output skills push to Figma using **small direct `use_figma` calls** (200-2000 bytes each). The agent reads its data model JSON and translates each element to Plugin API code using documented push patterns.

```
data-model.json → AI reads JSON → AI emits small use_figma calls → Figma nodes
```

### Push pattern references

| Skill | Push patterns | Data model |
|-------|--------------|------------|
| component-brief | `references/brief-push-patterns.md` | brief-data.json |
| generate-flow | `references/figma-push-patterns.md` | flow-data.json |
| generate-presentation | `references/figma-push-patterns.md` | slide-data.json |
| create-component | `references/create-component/push-patterns.md` | component-spec.json |

### Benefits

- **Small calls** — each 200-2000 bytes, well within the 50KB `use_figma` limit
- **No generated files** — agent reads data model directly, no codegen step
- **Resilient** — if one call fails, skip and continue
- **Debuggable** — each call is simple, self-contained Plugin API code

### When to use direct calls vs. other patterns

- **Output skills** (brief, flow, presentation, create-component): direct push from data model
- **design-audit**: reads existing Figma nodes, doesn't build from a data model
- **One-off operations**: direct Plugin API code (no data model needed)
```

- [ ] **Step 3: Update companion-context.md**

Replace the "Figma Output Scripts" table (lines 115-123) with:

```markdown
## Figma Output

All skills push to Figma using direct `use_figma` calls. No codegen scripts at push time.

| Skill | Push patterns reference | Data model |
|-------|----------------------|------------|
| component-brief | `references/brief-push-patterns.md` | brief-data.json |
| generate-flow | `references/figma-push-patterns.md` | flow-data.json |
| generate-presentation | `references/figma-push-patterns.md` | slide-data.json |
| create-component | `references/create-component/push-patterns.md` | component-spec.json |
```

- [ ] **Step 4: Update data-schema.md — add monochrome note**

After the syntax token color map table (around line 296), add:

```markdown
**Figma rendering note:** Code tokens in Cards 8 and 9 render as monochrome text (`#BABED8`) in Figma output. The HTML preview retains per-token syntax coloring via CSS classes.
```

- [ ] **Step 5: Commit**

```bash
git add plugins/actian-design-system/CLAUDE.md plugins/actian-design-system/references/figma-output.md plugins/actian-design-system/references/companion-context.md plugins/actian-design-system/references/component-brief/data-schema.md
git commit -m "docs: update references for direct push architecture"
```

---

### Task 10: Version bump + final verification

**Files:**
- Modify: `plugins/actian-design-system/.claude-plugin/plugin.json`

- [ ] **Step 1: Bump version to 2.0.0**

This is a breaking change (interpreter pipeline removed). Update `plugin.json`:
```json
"version": "2.0.0"
```

- [ ] **Step 2: Run all remaining tests**

```bash
cd plugins/actian-design-system && source scripts/resolve-node.sh
"$NODE_BIN" tests/contract.test.js 2>&1 | tail -5
"$NODE_BIN" tests/schema.test.js 2>&1 | tail -5
"$NODE_BIN" tests/path-validation.test.js 2>&1 | tail -5
"$NODE_BIN" tests/css-staleness.test.js 2>&1 | tail -5
```

Expected: All tests pass.

- [ ] **Step 3: Verify file count reduction**

```bash
git diff --stat HEAD~9 -- plugins/actian-design-system/scripts/ plugins/actian-design-system/tests/ | tail -3
```

Expected: Significant line deletion (~5,800+ lines removed).

- [ ] **Step 4: Commit + push**

```bash
git add plugins/actian-design-system/.claude-plugin/plugin.json
git commit -m "feat: v2.0.0 — direct push migration, remove interpreter pipeline

BREAKING: Removes figma-interpreter, brief/flow/slide-to-figma.js,
and all codegen functions. All skills now push to Figma using small
direct use_figma calls (200-6000 bytes each). Eliminates 25-minute
agent hangs caused by 33-45KB fill files.

Removes ~5,800 lines of dead codegen code."
git push
```
