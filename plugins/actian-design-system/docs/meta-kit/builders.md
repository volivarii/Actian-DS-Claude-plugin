# Meta Kit Builder Functions

Copy-paste-ready JavaScript functions for skills to include in `use_figma` calls when generating dynamic content that cannot be a pre-built Figma component — tables with variable rows, state grids with variable columns, and similar structures.

## How to use

1. Copy the **Helpers** block into the top of your `use_figma` code string.
2. Copy the builder function you need (`buildSpecTable`, `buildStateGrid`, or both).
3. Call the builder inside your `use_figma` logic, passing a parent frame and your data.

All builders are `async` because they load fonts. Await them before continuing.

---

## Helpers

Include these at the top of any `use_figma` call that uses builder functions.

```js
// Helper: set a text property on a component instance by prefix
function setProp(instance, prefix, value) {
  const key = Object.keys(instance.componentProperties).find(k => k.startsWith(prefix));
  if (key) instance.setProperties({ [key]: value });
}

// Helper: import a Figma variable by key
async function importVar(name, key, vars) {
  vars[name] = await figma.variables.importVariableByKeyAsync(key);
}

// Helper: bind a fill to a Figma variable
function bindFill(node, variable) {
  const fills = JSON.parse(JSON.stringify(node.fills));
  fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
  node.fills = fills;
}

// Helper: bind a stroke to a Figma variable
function bindStroke(node, variable) {
  const strokes = JSON.parse(JSON.stringify(node.strokes));
  strokes[0] = figma.variables.setBoundVariableForPaint(strokes[0], 'color', variable);
  node.strokes = strokes;
}

// Helper: convert hex to Figma RGB (fallback for FM scaffolding)
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

---

## Clone-and-Fill Helpers

Include these when using template-based builders. The skill must read `meta-kit-registry.json` before the `use_figma` call and pass the relevant template keys.

```js
// Helper: clone a template component from the registry
// templateKey = the component key from meta-kit-registry.json
async function cloneTemplate(templateKey) {
  const comp = await figma.importComponentByKeyAsync(templateKey);
  const instance = comp.createInstance();
  const detached = instance.detachInstance();
  detached.visible = true;
  return detached;
}

// Helper: fill text slots in a cloned template by matching layer names
function fillSlots(frame, slots) {
  for (const [slotName, value] of Object.entries(slots)) {
    const textNode = frame.findOne(n => n.type === 'TEXT' && n.name === slotName);
    if (textNode) {
      textNode.characters = value;
    }
  }
}
```

---

## `buildSpecTable(parent, headers, rows, options)`

Builds a fully styled specification table with header row and data rows, appended into the given parent frame.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `parent` | `FrameNode` | Parent auto-layout frame to append the table into |
| `headers` | `string[]` | Column header labels |
| `rows` | `string[][]` | 2D array of cell content |
| `options` | `object` | Optional settings (see below) |

**Options object:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `columnWidths` | `number[]` | equal distribution | Fixed widths per column |
| `mode` | `'ds' \| 'fm'` | `'ds'` | Styling mode |

### Token values

| Element | Value | Token |
|---------|-------|-------|
| Header background | `#F5F5FA` | `--zen-color-background-bg-grey-2` |
| Header text color | `#3F3F4A` | `--zen-color-text-secondary` |
| Header font | Inter 13px Semi Bold | — |
| Cell text color | `#2D3648` | — |
| Cell font | Inter 14px Regular | — |
| Row border bottom | `#F0F0F5`, 1px | — |
| Cell padding | 12px vertical, 16px horizontal | — |

### Code

```js
async function buildSpecTable(parent, headers, rows, options = {}) {
  const { columnWidths, mode = 'ds' } = options;

  // Load required fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  const colCount = headers.length;
  const parentWidth = parent.width || 800;
  const widths = columnWidths || headers.map(() => Math.floor(parentWidth / colCount));

  // Colors
  const headerBg = hexToRgb('#F5F5FA');
  const headerTextColor = hexToRgb('#3F3F4A');
  const cellTextColor = hexToRgb('#2D3648');
  const borderColor = hexToRgb('#F0F0F5');

  // Table container — vertical auto-layout
  const table = figma.createFrame();
  table.name = 'Spec Table';
  table.layoutMode = 'VERTICAL';
  table.primaryAxisSizingMode = 'AUTO';
  table.counterAxisSizingMode = 'AUTO';
  table.itemSpacing = 0;
  table.fills = [];

  // --- Header row ---
  const headerRow = figma.createFrame();
  headerRow.name = 'Header Row';
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.primaryAxisSizingMode = 'AUTO';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.itemSpacing = 0;
  headerRow.fills = [{ type: 'SOLID', color: headerBg }];
  headerRow.cornerRadius = 4;

  for (let i = 0; i < colCount; i++) {
    const cell = figma.createFrame();
    cell.name = `Header: ${headers[i]}`;
    cell.layoutMode = 'HORIZONTAL';
    cell.primaryAxisSizingMode = 'FIXED';
    cell.counterAxisSizingMode = 'AUTO';
    cell.resize(widths[i], 1);
    cell.paddingTop = 12;
    cell.paddingBottom = 12;
    cell.paddingLeft = 16;
    cell.paddingRight = 16;
    cell.fills = [];

    const text = figma.createText();
    text.characters = headers[i];
    text.fontName = { family: 'Inter', style: 'Semi Bold' };
    text.fontSize = 13;
    text.fills = [{ type: 'SOLID', color: headerTextColor }];

    cell.appendChild(text);
    text.layoutSizingHorizontal = 'FILL';

    headerRow.appendChild(cell);
  }

  table.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = 'FILL';

  // --- Data rows ---
  for (let r = 0; r < rows.length; r++) {
    const row = figma.createFrame();
    row.name = `Row ${r + 1}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 0;
    row.fills = [];
    row.strokes = [{ type: 'SOLID', color: borderColor }];
    row.strokeWeight = 1;
    row.strokeAlign = 'INSIDE';
    row.strokeBottomWeight = 1;
    row.strokeTopWeight = 0;
    row.strokeLeftWeight = 0;
    row.strokeRightWeight = 0;

    for (let c = 0; c < colCount; c++) {
      const cell = figma.createFrame();
      cell.name = `Cell [${r},${c}]`;
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisSizingMode = 'FIXED';
      cell.counterAxisSizingMode = 'AUTO';
      cell.resize(widths[c], 1);
      cell.paddingTop = 12;
      cell.paddingBottom = 12;
      cell.paddingLeft = 16;
      cell.paddingRight = 16;
      cell.fills = [];

      const text = figma.createText();
      text.characters = rows[r][c] || '';
      text.fontName = { family: 'Inter', style: 'Regular' };
      text.fontSize = 14;
      text.fills = [{ type: 'SOLID', color: cellTextColor }];

      cell.appendChild(text);
      text.layoutSizingHorizontal = 'FILL';

      row.appendChild(cell);
    }

    table.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  // Append to parent and set sizing
  parent.appendChild(table);
  table.layoutSizingHorizontal = 'FILL';
  table.layoutSizingVertical = 'HUG';

  // Ensure all rows hug their content vertically
  for (const child of table.children) {
    child.layoutSizingVertical = 'HUG';
  }

  return table;
}
```

### Usage example

```js
const section = figma.createFrame();
section.name = 'Props Section';
section.layoutMode = 'VERTICAL';
section.resize(960, 1);
section.primaryAxisSizingMode = 'AUTO';

const table = await buildSpecTable(
  section,
  ['Property', 'Type', 'Default', 'Description'],
  [
    ['variant', 'string', '"primary"', 'Visual style of the button'],
    ['size',    'string', '"md"',      'Button size: sm, md, lg'],
    ['disabled','boolean','false',     'Disables the button'],
  ],
  { columnWidths: [160, 120, 120, 560] }
);
```

---

## `buildSpecTable` — Template-based (preferred)

Uses clone-and-fill with Meta Kit template components. Requires `cloneTemplate` and `fillSlots` helpers above, plus the registry data.

### Prerequisites

The skill reads `meta-kit-registry.json` before the `use_figma` call and includes the registry's `templates` object in the code string.

### Code

```js
async function buildSpecTable(parent, headers, rows, options = {}) {
  const { columnWidths, registry } = options;

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

  const colCount = headers.length;
  const parentWidth = parent.width || 800;
  const widths = columnWidths || headers.map(() => Math.floor(parentWidth / colCount));

  // Table container
  const table = figma.createFrame();
  table.name = 'Spec Table';
  table.layoutMode = 'VERTICAL';
  table.primaryAxisSizingMode = 'AUTO';
  table.counterAxisSizingMode = 'AUTO';
  table.itemSpacing = 0;
  table.fills = [];

  // --- Header row (clone from template) ---
  const headerRow = figma.createFrame();
  headerRow.name = 'Header Row';
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.primaryAxisSizingMode = 'AUTO';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.itemSpacing = 0;
  headerRow.fills = [];

  for (let i = 0; i < colCount; i++) {
    const cell = await cloneTemplate(registry.templates['table-header-row'].key);
    cell.name = 'Header: ' + headers[i];
    cell.resize(widths[i], 1);
    cell.primaryAxisSizingMode = 'FIXED';
    cell.counterAxisSizingMode = 'AUTO';
    fillSlots(cell, { label: headers[i] });
    headerRow.appendChild(cell);
  }

  table.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = 'FILL';

  // --- Data rows (clone from template) ---
  for (let r = 0; r < rows.length; r++) {
    const row = figma.createFrame();
    row.name = 'Row ' + (r + 1);
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 0;
    row.fills = [];

    for (let c = 0; c < colCount; c++) {
      const cell = await cloneTemplate(registry.templates['table-data-row'].key);
      cell.name = 'Cell [' + r + ',' + c + ']';
      cell.resize(widths[c], 1);
      cell.primaryAxisSizingMode = 'FIXED';
      cell.counterAxisSizingMode = 'AUTO';
      fillSlots(cell, { label: rows[r][c] || '' });
      // Remove the 'value' text node (single-value cell)
      const valueNode = cell.findOne(n => n.type === 'TEXT' && n.name === 'value');
      if (valueNode) valueNode.remove();
      row.appendChild(cell);
    }

    table.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }

  parent.appendChild(table);
  table.layoutSizingHorizontal = 'FILL';
  table.layoutSizingVertical = 'HUG';

  for (const child of table.children) {
    child.layoutSizingVertical = 'HUG';
  }

  return table;
}
```

### Usage example

```js
// Skill reads registry before use_figma call, then passes template keys
const registry = { templates: { 'table-header-row': { key: 'KEY_FROM_REGISTRY' }, 'table-data-row': { key: 'KEY_FROM_REGISTRY' } } };

const table = await buildSpecTable(
  section,
  ['Property', 'Type', 'Default', 'Description'],
  [
    ['variant', 'string', '"primary"', 'Visual style of the button'],
    ['size',    'string', '"md"',      'Button size: sm, md, lg'],
  ],
  { columnWidths: [160, 120, 120, 560], registry }
);
```

---

## `buildStateGrid(parent, states)`

Builds a horizontal grid of labeled states — each column has a label on top and a content node (component instance or frame) below.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `parent` | `FrameNode` | Parent auto-layout frame to append the grid into |
| `states` | `Array<{ label: string, content: FrameNode \| InstanceNode }>` | State entries |

### Token values

| Element | Value |
|---------|-------|
| Label font | Inter 12px Medium |
| Label color | `#888888` |
| Column gap (between columns) | 48px |
| Inner gap (label to content) | 10px |

### Code

```js
async function buildStateGrid(parent, states) {
  // Load required font
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  const labelColor = hexToRgb('#888888');

  // Grid container — horizontal auto-layout
  const grid = figma.createFrame();
  grid.name = 'State Grid';
  grid.layoutMode = 'HORIZONTAL';
  grid.primaryAxisSizingMode = 'AUTO';
  grid.counterAxisSizingMode = 'AUTO';
  grid.itemSpacing = 48;
  grid.fills = [];

  for (const state of states) {
    // Column — vertical auto-layout
    const column = figma.createFrame();
    column.name = `State: ${state.label}`;
    column.layoutMode = 'VERTICAL';
    column.primaryAxisSizingMode = 'AUTO';
    column.counterAxisSizingMode = 'AUTO';
    column.itemSpacing = 10;
    column.fills = [];

    // Label
    const label = figma.createText();
    label.characters = state.label;
    label.fontName = { family: 'Inter', style: 'Medium' };
    label.fontSize = 12;
    label.fills = [{ type: 'SOLID', color: labelColor }];

    column.appendChild(label);

    // Content node (passed in from caller)
    column.appendChild(state.content);

    grid.appendChild(column);
  }

  // Append to parent and set sizing
  parent.appendChild(grid);
  grid.layoutSizingHorizontal = 'FILL';
  grid.layoutSizingVertical = 'HUG';

  return grid;
}
```

### Usage example

```js
// Assume buttonComponent is already imported via importComponentByKeyAsync
const defaultInstance = buttonComponent.createInstance();
setProp(defaultInstance, 'Label', 'Click me');

const hoverInstance = buttonComponent.createInstance();
setProp(hoverInstance, 'Label', 'Click me');
// apply hover styling overrides here

const disabledInstance = buttonComponent.createInstance();
setProp(disabledInstance, 'Label', 'Click me');
setProp(disabledInstance, 'Disabled', true);

const stateGrid = await buildStateGrid(section, [
  { label: 'Default',  content: defaultInstance },
  { label: 'Hover',    content: hoverInstance },
  { label: 'Disabled', content: disabledInstance },
]);
```

---

## `buildStateGrid` — Template-based (preferred)

Uses clone-and-fill with Meta Kit template components.

### Code

```js
async function buildStateGrid(parent, states) {
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  const grid = figma.createFrame();
  grid.name = 'State Grid';
  grid.layoutMode = 'HORIZONTAL';
  grid.primaryAxisSizingMode = 'AUTO';
  grid.counterAxisSizingMode = 'AUTO';
  grid.itemSpacing = 48;
  grid.fills = [];

  for (const state of states) {
    const column = await cloneTemplate(registry.templates['state-column'].key);
    column.name = 'State: ' + state.label;
    fillSlots(column, { title: state.label });

    // Replace the placeholder content frame with the actual content
    const placeholder = column.findOne(n => n.name === 'content');
    if (placeholder) {
      const idx = column.children.indexOf(placeholder);
      column.insertChild(idx, state.content);
      placeholder.remove();
    } else {
      column.appendChild(state.content);
    }

    grid.appendChild(column);
  }

  parent.appendChild(grid);
  grid.layoutSizingHorizontal = 'FILL';
  grid.layoutSizingVertical = 'HUG';

  return grid;
}
```

---

## Fallback

When Meta Kit template components are not yet published (registry has `"PENDING"` keys), use the original non-template versions of `buildSpecTable` and `buildStateGrid` above. The template-based versions are preferred when available.
