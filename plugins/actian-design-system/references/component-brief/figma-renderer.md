# Brief Figma Renderer

Mechanical process that converts `brief-data.json` into Figma frames via `use_figma`. No AI interpretation — only data → recipe → clone-and-fill.

## Prerequisites

Before any `use_figma` call, the skill must:
1. Read `brief-data.json` (generated in Step 1.5)
2. Read `docs/meta-kit/meta-kit-registry.json` (template keys)
3. Read `docs/meta-kit/components.md` (component keys for Brief Card, Do-Don't Pair, etc.)

## Component keys (hardcoded — from components.md)

```js
const KEYS = {
  briefCard: '3dbb732730af0754210cde7af35e5236a2502843',
  doDontPair: '28edfacf13e50706586172bd48f8a3ad84d7c263',
  colorSwatch: 'da3369932f710386b76ca91a40ebd48d94e3f2e0',
  contrastBadge: '941756541adc6ce21e32e848c2039c64fece0fcf',
  pointerBadge: '7e066fc21d9a2bbbcd1149113787cf59140162d4',
  dimensionAnnotation: '49bf6a1b210a403ba145a3fdee9b1994eb54069a',
  accessibilityCard: 'b4779a13f4097d682413a669eaaf9ead1b49f115',
  codeBlock: '1bf10eee1751a46da5f90a9671be6c9abf0073b7',
  generationLog: 'a9653f30925367e96dea90093d750bfe70849571',
};
```

## Template keys (from registry)

```js
const TEMPLATES = {
  tableHeaderRow: '0754accfc4bc79ce9a68ff8fe7a108f1b41b9b2e',
  tableDataRow: '3a1fae22dd85936f81565122888efd8a50e37180',
  stateColumn: '4f782d1a8541b4474858767209f99dce1428784b',
  sectionHeader: 'f4fd576001f4f1f4606a4efb051d1e4492e378c4',
  swatchRow: '96647364b6cb5c55b7ced72106708daaa33afb7f',
};
```

## Shared helpers (include at top of every use_figma call)

```js
function setProp(instance, prefix, value) {
  const key = Object.keys(instance.componentProperties).find(k => k.startsWith(prefix));
  if (key) instance.setProperties({ [key]: value });
}

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

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

## Card recipes

### Recipe: Wrapper + Generation Log

```js
// Navigate to target page
const targetNode = await figma.getNodeByIdAsync(NODE_ID);
let page = targetNode;
while (page && page.type !== 'PAGE') page = page.parent;
await figma.setCurrentPageAsync(page);

// Create wrapper
const wrapper = figma.createFrame();
wrapper.name = 'Component Spec: ' + DATA.meta.component;
wrapper.layoutMode = 'HORIZONTAL';
wrapper.itemSpacing = 32;
wrapper.primaryAxisSizingMode = 'AUTO';
wrapper.counterAxisSizingMode = 'AUTO';
wrapper.fills = [];
wrapper.x = targetNode.x + targetNode.width + 200;
wrapper.y = targetNode.y;

// Generation log
const genLog = await figma.importComponentByKeyAsync(KEYS.generationLog);
const logInstance = genLog.createInstance();
setProp(logInstance, 'Skill', DATA.meta.skill);
setProp(logInstance, 'Prompt', 'component-brief ' + DATA.meta.component);
setProp(logInstance, 'Date', DATA.meta.generatedAt);
setProp(logInstance, 'Duration', DATA.meta.duration);
setProp(logInstance, 'Model', DATA.meta.model);
setProp(logInstance, 'Plugin Version', 'v' + DATA.meta.pluginVersion);
wrapper.appendChild(logInstance);
```

### Recipe: Card 1 — Page header

```js
const briefCardSet = await figma.importComponentSetByKeyAsync(KEYS.briefCard);
const phVariant = briefCardSet.children.find(c => c.name === 'Mode=DS, Type=Page Header');
const phInstance = phVariant.createInstance();
setProp(phInstance, 'Component Name', DATA.card1_header.name);
setProp(phInstance, 'Description', DATA.card1_header.description);
const card1 = phInstance.detachInstance();
card1.name = 'Page header';
wrapper.appendChild(card1);
card1.layoutSizingVertical = 'HUG';
```

### Recipe: Card 2 — Actual component

```js
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

const stdVariant = briefCardSet.children.find(c => c.name === 'Mode=DS, Type=Standard');
const c2Inst = stdVariant.createInstance();
setProp(c2Inst, 'Title', 'Actual component');
setProp(c2Inst, 'Subtitle', 'Live component across all states and theme modes');
const card2 = c2Inst.detachInstance();
card2.name = 'Components';
const content2 = card2.findOne(n => n.name === 'Content');

// Get the local component set
const componentSet = await figma.getNodeByIdAsync(DATA.meta.nodeId);

// Variant matrix — one row per variantMatrix entry
for (const matrixRow of DATA.card2_component.variantMatrix) {
  const row = figma.createFrame();
  row.name = 'Row: ' + matrixRow.row;
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.itemSpacing = 32;
  row.fills = [];

  // Row label
  const labelNode = figma.createText();
  labelNode.characters = matrixRow.row;
  labelNode.fontName = { family: 'Inter', style: 'Semi Bold' };
  labelNode.fontSize = 13;
  row.appendChild(labelNode);

  // One instance per column
  for (const col of matrixRow.columns) {
    const column = figma.createFrame();
    column.name = col.label;
    column.layoutMode = 'VERTICAL';
    column.primaryAxisSizingMode = 'AUTO';
    column.counterAxisSizingMode = 'AUTO';
    column.itemSpacing = 8;
    column.fills = [];

    // State label
    const stateLabel = figma.createText();
    stateLabel.characters = col.label;
    stateLabel.fontName = { family: 'Inter', style: 'Medium' };
    stateLabel.fontSize = 11;
    stateLabel.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
    column.appendChild(stateLabel);

    // Real component instance
    const variant = componentSet.children.find(c => c.name.includes(col.variantName) || c.name === col.variantName);
    if (variant) {
      const inst = variant.createInstance();
      column.appendChild(inst);
    }

    row.appendChild(column);
  }

  content2.appendChild(row);
  row.layoutSizingHorizontal = 'FILL';
  row.layoutSizingVertical = 'HUG';
}

wrapper.appendChild(card2);
card2.layoutSizingVertical = 'HUG';
```

### Recipe: Card 5 — Component API (example of buildSpecTable usage)

```js
const c5Inst = stdVariant.createInstance();
setProp(c5Inst, 'Title', 'Component API');
setProp(c5Inst, 'Subtitle', 'Configurable properties, types, defaults, and allowed values');
const card5 = c5Inst.detachInstance();
card5.name = 'Component API';
const content5 = card5.findOne(n => n.name === 'Content');

// Build table headers
const headers = ['', 'Property', 'Type', 'Default', 'Values', 'Notes'];
const rows = DATA.card5_api.props.map(p => [
  p.required ? 'REQ' : 'OPT',
  p.name,
  p.type,
  p.default,
  p.values,
  p.notes
]);

// Use buildSpecTable (include the template-based version from builders.md)
const table = await buildSpecTable(content5, headers, rows, {
  columnWidths: [50, 140, 100, 120, 200, 350],
  registry: { templates: { 'table-header-row': { key: TEMPLATES.tableHeaderRow }, 'table-data-row': { key: TEMPLATES.tableDataRow } } }
});

wrapper.appendChild(card5);
card5.layoutSizingVertical = 'HUG';
```

### Recipe: Card 6 — Usage guidelines (example of Do-Don't Pair usage)

```js
const c6Inst = stdVariant.createInstance();
setProp(c6Inst, 'Title', 'Usage guidelines');
setProp(c6Inst, 'Subtitle', 'When and how to use ' + DATA.card1_header.name);
const card6 = c6Inst.detachInstance();
card6.name = 'Usage guidelines';
const content6 = card6.findOne(n => n.name === 'Content');

// When to use section
const whenSection = figma.createFrame();
whenSection.name = 'When to use';
whenSection.layoutMode = 'VERTICAL';
whenSection.primaryAxisSizingMode = 'AUTO';
whenSection.counterAxisSizingMode = 'AUTO';
whenSection.itemSpacing = 8;
whenSection.fills = [];

for (const item of DATA.card6_usage.whenToUse) {
  const row = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  row.characters = '+ ' + item;
  row.fontName = { family: 'Inter', style: 'Regular' };
  row.fontSize = 14;
  whenSection.appendChild(row);
}
content6.appendChild(whenSection);
whenSection.layoutSizingHorizontal = 'FILL';
whenSection.layoutSizingVertical = 'HUG';

// Do/Don't pairs using Meta Kit component
const doDontSet = await figma.importComponentSetByKeyAsync(KEYS.doDontPair);
const dsDoDont = doDontSet.children.find(c => c.name === 'Mode=DS');

for (const pair of DATA.card6_usage.doDont) {
  const inst = dsDoDont.createInstance();
  setProp(inst, 'Do Label', pair.doLabel);
  setProp(inst, 'Don\'t Label', pair.dontLabel);
  setProp(inst, 'Do Example', pair.doDetail);
  setProp(inst, 'Don\'t Example', pair.dontDetail);
  content6.appendChild(inst);
  inst.layoutSizingHorizontal = 'FILL';
}

wrapper.appendChild(card6);
card6.layoutSizingVertical = 'HUG';
```

### Recipe: Card 9 — Code specification (example of tokenized code)

```js
const c9Inst = stdVariant.createInstance();
setProp(c9Inst, 'Title', 'Code specification');
setProp(c9Inst, 'Subtitle', 'CSS custom properties for ' + DATA.card1_header.name);
const card9 = c9Inst.detachInstance();
card9.name = 'Code specification';
const content9 = card9.findOne(n => n.name === 'Content');

// Import Code Block
const codeComp = await figma.importComponentByKeyAsync(KEYS.codeBlock);
const codeInst = codeComp.createInstance();
setProp(codeInst, 'Show Header', true);
setProp(codeInst, 'Header Text', DATA.card9_code.language.toUpperCase());

// Build plain text first
const plainText = DATA.card9_code.tokens
  .map(t => t.type === 'newline' ? '\n' : t.text)
  .join('');
setProp(codeInst, 'Code', plainText);

// Detach to apply syntax colors
const codeFrame = codeInst.detachInstance();
const codeText = codeFrame.findOne(n => n.type === 'TEXT' && n.name === 'Code');

if (codeText) {
  const TOKEN_COLORS = {
    selector: '#FF79C6', property: '#82AAFF', value: '#C3E88D',
    comment: '#676E95', keyword: '#C792EA', string: '#C3E88D',
    punctuation: '#BABED8', tag: '#FF5370', attribute: '#FFCB6B',
    function: '#82AAFF', text: '#BABED8'
  };

  let offset = 0;
  for (const token of DATA.card9_code.tokens) {
    if (token.type === 'newline') { offset += 1; continue; }
    const color = TOKEN_COLORS[token.type] || '#BABED8';
    const rgb = hexToRgb(color);
    const end = offset + token.text.length;
    codeText.setRangeFills(offset, end, [{ type: 'SOLID', color: rgb }]);
    offset = end;
  }
}

content9.appendChild(codeFrame);
codeFrame.layoutSizingHorizontal = 'FILL';

wrapper.appendChild(card9);
card9.layoutSizingVertical = 'HUG';
```

## Execution order

Push cards in this order (one `use_figma` call per group to stay under 20KB):

1. **Call 1:** Wrapper + Generation Log + Card 1 (Page header)
2. **Call 2:** Card 2 (Actual component — most complex, needs full variant matrix)
3. **Call 3:** Card 3 (Anatomy — Pointer Badges, Dimension Annotations, State Grid, Parts tables)
4. **Call 4:** Cards 4 + 5 (Design tokens + Component API — both table-heavy)
5. **Call 5:** Cards 6 + 7 (Usage + Content guidelines — Do-Don't Pairs)
6. **Call 6:** Cards 8 + 9 (Accessibility + Code specification)

## Parity validation

After all calls, the skill checks:
- Card count: wrapper has 10 children (gen log + 9 cards)
- Card 2: `variantMatrix.length` rows × first row's `columns.length` columns = total instances
- Card 3: `parts.length` pointer badges, `specs.length` dimension annotations, `states.length` state columns
- Card 4: `colorTokens.length` rows in color table, each with swatch dot
- Card 6/7: `doDont.length` Do-Don't Pair instances
- Card 8: `requirements.length` a11y cards, `contrastTable.length` contrast rows

All counts come from the data model — not from AI judgment.
