# Create Component — Figma Spec Builder

Transforms a component build plan into `figma-spec.json` for the JSON Spec Interpreter. The interpreter (`scripts/figma-interpreter.js`) builds the component tree directly in Figma using `createComponent`, `combineAsVariants`, `addComponentProperty`, and `componentPropertyReferences`.

## Purpose

The AI designs the component (variants, properties, layout, children) and encodes it as a declarative JSON spec. The interpreter handles all Plugin API calls. This replaces the legacy micro-task checklist pattern for component creation.

## Rule

**AI produces JSON data only, never Plugin API code.** The interpreter handles `figma.createComponent()`, `figma.combineAsVariants()`, `comp.addComponentProperty()`, `textNode.componentPropertyReferences`, font loading, variable binding, and child appending. The AI's job is to map the build plan to the correct spec tree structure.

---

## Two Patterns

### 1. Single component

Use `{ type: "COMPONENT", ... }` in the spec tree for standalone components that do not need variants.

### 2. Variant set

Use `{ type: "COMPONENT_SET", variants: [...] }` for multi-variant components. The interpreter builds each variant as a separate Component, then calls `combineAsVariants()` to group them.

---

## COMPONENT Node Spec

A single reusable component. Place this as a node in the spec `tree` array.

```json
{
  "type": "COMPONENT",
  "name": "Type=Success",
  "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [12, 16, 12, 16] },
  "fills": ["#FFFFFF"],
  "cornerRadius": 8,
  "properties": [
    { "name": "Title", "type": "TEXT", "default": "Alert title" },
    { "name": "Description", "type": "TEXT", "default": "Description text" },
    { "name": "Show Icon", "type": "BOOLEAN", "default": true },
    { "name": "Show Close", "type": "BOOLEAN", "default": true }
  ],
  "propertyLinks": [
    { "layer": "Title", "property": "Title" },
    { "layer": "Description", "property": "Description" }
  ],
  "children": [
    {
      "type": "TEXT",
      "name": "Title",
      "text": "Alert title",
      "font": "Inter:Semi Bold",
      "fontSize": 14,
      "fills": ["#1A1A1A"]
    }
  ]
}
```

### Property fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Component name. For variants inside a set, use `Axis=Value` format. |
| `layout` | object | Yes | Auto-layout config (see Layout below). |
| `fills` | array | No | Background fills. Hex strings or gradient objects. |
| `cornerRadius` | number | No | Border radius in px. |
| `stroke` | object | No | Border stroke config. |
| `properties` | array | No | Component properties (TEXT, BOOLEAN, INSTANCE_SWAP). |
| `propertyLinks` | array | No | Maps text layer names to TEXT properties. |
| `children` | array | No | Child nodes (FRAME, TEXT, RECT, INSTANCE, etc.). |
| `variableScopes` | array | No | Variable scope overrides for bound variables. |
| `width` / `height` | number | No | Fixed dimensions. Omit to use auto-layout sizing. |

---

## Property Types

| Type | Default value | Description |
|------|---------------|-------------|
| `TEXT` | String (e.g., `"Button label"`) | Editable text. The default populates the text node. |
| `BOOLEAN` | `true` or `false` | Toggles layer visibility. |
| `INSTANCE_SWAP` | Component key string | Swaps a nested instance. Default is the key of the default component. |
| `VARIANT` | N/A | Managed automatically by Figma for variant axes. Do not declare manually. |

---

## propertyLinks — CRITICAL

**Every TEXT property MUST have a corresponding propertyLink.** Without this, Figma shows "unused property" publish errors because the property is defined but no text node references it.

The interpreter finds the text node by `name` and sets:
```
textNode.componentPropertyReferences = { characters: propertyKey }
```

The `layer` value must exactly match the `name` field of a TEXT node in `children`. The `property` value must exactly match the `name` field of a property in `properties`.

```json
"propertyLinks": [
  { "layer": "Title", "property": "Title" },
  { "layer": "Description", "property": "Description" }
]
```

**Common mistake:** naming the text node "Alert Title" but the property link says `"layer": "Title"`. These must match exactly.

---

## COMPONENT_SET Node Spec

A variant group. The interpreter builds each variant as a Component, appends them to the page, then calls `figma.combineAsVariants()`.

```json
{
  "type": "COMPONENT_SET",
  "name": "FM Alert",
  "description": "Alert component with 4 type variants",
  "variants": [
    {
      "name": "Type=Success",
      "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [12, 16, 12, 16] },
      "fills": ["#FFFFFF"],
      "properties": [
        { "name": "Title", "type": "TEXT", "default": "Alert title" },
        { "name": "Description", "type": "TEXT", "default": "Description text" }
      ],
      "propertyLinks": [
        { "layer": "Title", "property": "Title" },
        { "layer": "Description", "property": "Description" }
      ],
      "children": [...]
    },
    {
      "name": "Type=Error",
      "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [12, 16, 12, 16] },
      "fills": ["#FFFFFF"],
      "properties": [
        { "name": "Title", "type": "TEXT", "default": "Alert title" },
        { "name": "Description", "type": "TEXT", "default": "Description text" }
      ],
      "propertyLinks": [
        { "layer": "Title", "property": "Title" },
        { "layer": "Description", "property": "Description" }
      ],
      "children": [...]
    }
  ]
}
```

### Variant naming

Variant names **MUST** follow Figma's `Axis=Value` format. For multi-axis variants, comma-separate: `"Type=Success, Size=Large"`.

Each variant in the `variants` array is a full COMPONENT spec (layout, properties, propertyLinks, children). The interpreter sets `type: "COMPONENT"` automatically.

### COMPONENT_SET fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Component set name (e.g., "FM Alert"). |
| `description` | string | No | Component description shown in Figma. |
| `variants` | array | Yes | Array of COMPONENT specs. Minimum 1. |

---

## Variable Binding and Scopes

When binding design tokens as variables to component nodes, declare them in the top-level `spec.variables` section and bind them per-node. Additionally, set correct scopes so variables are only available in appropriate contexts.

**NEVER leave variables as `ALL_SCOPES`.** Always specify the correct scope:

```json
"variableScopes": [
  { "ref": "bgDefault", "scopes": ["FRAME_FILL"] },
  { "ref": "textPrimary", "scopes": ["TEXT_FILL"] },
  { "ref": "borderDefault", "scopes": ["STROKE_COLOR"] },
  { "ref": "spacingMd", "scopes": ["GAP"] },
  { "ref": "radiusSm", "scopes": ["CORNER_RADIUS"] }
]
```

### Scope reference

| Scope | Use for |
|-------|---------|
| `FRAME_FILL` | Frame/component background fills |
| `SHAPE_FILL` | Rectangle, ellipse, vector fills |
| `TEXT_FILL` | Text node fills |
| `STROKE_COLOR` | Border/stroke colors |
| `GAP` | Auto-layout spacing (`itemSpacing`) |
| `CORNER_RADIUS` | Border radius |

The `ref` value must match a key in the top-level `spec.variables` object.

---

## Nested Component Imports

When a component contains instances of other library components (buttons, icons, badges), declare them in `spec.imports` as usual:

```json
"imports": {
  "fmButton": { "method": "set", "key": "abc123..." },
  "fmIcon": { "method": "component", "key": "def456..." },
  "genLog": { "method": "component", "key": "a9653f30925367e96dea90093d750bfe70849571" }
}
```

Then reference them in the COMPONENT's children as INSTANCE nodes:

```json
{
  "type": "INSTANCE",
  "name": "Close Button",
  "ref": "fmButton",
  "variant": "Type=Ghost, Size=Small",
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

The generation log (`genLog`) import is required for all outputs per CLAUDE.md rules.

---

## Layout Format

```json
{
  "mode": "HORIZONTAL",
  "spacing": 12,
  "padding": [12, 16, 12, 16],
  "primaryAxisAlign": "MIN",
  "counterAxisAlign": "MIN",
  "counterAxisSpacing": 8,
  "wrap": true
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `mode` | string | `"HORIZONTAL"`, `"VERTICAL"`, `"NONE"` | Auto-layout direction. |
| `spacing` | number | px | Gap between children (`itemSpacing`). |
| `padding` | array | `[top, right, bottom, left]` | Padding in px. |
| `primaryAxisAlign` | string | `"MIN"`, `"MAX"`, `"CENTER"`, `"SPACE_BETWEEN"` | Main axis alignment. |
| `counterAxisAlign` | string | `"MIN"`, `"MAX"`, `"CENTER"`, `"BASELINE"` | Cross axis alignment. |
| `counterAxisSpacing` | number | px | Wrap spacing (only when `wrap: true`). |
| `wrap` | boolean | `true` | Enable layout wrapping. |

The interpreter always sets `primaryAxisSizingMode` and `counterAxisSizingMode` to `AUTO` (hug contents). Override with `sizing` on the node after it is appended to its parent.

## Sizing Format

```json
{
  "horizontal": "FILL",
  "vertical": "HUG",
  "minWidth": 200,
  "maxWidth": 480
}
```

| Value | Effect |
|-------|--------|
| `"FILL"` | Stretch to fill parent |
| `"HUG"` | Shrink to fit contents |
| number | Fixed px width/height |

Sizing is applied **after** the node is appended to its parent (the interpreter handles this).

---

## Spacing Scale Reminder

Use only these values for `spacing`, `padding`, and `itemSpacing`:

**4, 8, 12, 16, 24, 28, 32** px

Do not use 6, 10, 14, 18, 20, or other values outside this scale.

---

## Complete Example — FM Alert Component Set

An FM Alert with 3 type variants (Success, Error, Warning). Each variant has an icon frame, title, description, and close button. TEXT properties are linked to text nodes.

```json
{
  "meta": {
    "targetNodeId": "123:456",
    "skill": "create-component",
    "component": "FM Alert"
  },
  "fonts": [
    "Inter:Regular",
    "Inter:Semi Bold"
  ],
  "imports": {
    "genLog": { "method": "component", "key": "a9653f30925367e96dea90093d750bfe70849571" }
  },
  "variables": {},
  "styles": {},
  "tree": [
    {
      "type": "COMPONENT_SET",
      "name": "FM Alert",
      "description": "Alert banner with icon, title, description, and dismiss action",
      "variants": [
        {
          "name": "Type=Success",
          "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [12, 16, 12, 16] },
          "fills": ["#F0FDF4"],
          "cornerRadius": 8,
          "properties": [
            { "name": "Title", "type": "TEXT", "default": "Success" },
            { "name": "Description", "type": "TEXT", "default": "Operation completed successfully." },
            { "name": "Show Close", "type": "BOOLEAN", "default": true }
          ],
          "propertyLinks": [
            { "layer": "Title", "property": "Title" },
            { "layer": "Description", "property": "Description" }
          ],
          "children": [
            {
              "type": "FRAME",
              "name": "Icon Container",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [2, 0, 0, 0] },
              "children": [
                {
                  "type": "RECT",
                  "name": "Icon Placeholder",
                  "width": 20,
                  "height": 20,
                  "cornerRadius": 10,
                  "fills": ["#16A34A"]
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Content",
              "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [0, 0, 0, 0] },
              "sizing": { "horizontal": "FILL" },
              "children": [
                {
                  "type": "TEXT",
                  "name": "Title",
                  "text": "Success",
                  "font": "Inter:Semi Bold",
                  "fontSize": 14,
                  "fills": ["#1A1A1A"]
                },
                {
                  "type": "TEXT",
                  "name": "Description",
                  "text": "Operation completed successfully.",
                  "font": "Inter:Regular",
                  "fontSize": 13,
                  "fills": ["#525252"],
                  "sizing": { "horizontal": "FILL" }
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Close Button",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [4, 4, 4, 4] },
              "children": [
                {
                  "type": "TEXT",
                  "name": "Close Icon",
                  "text": "\u2715",
                  "font": "Inter:Regular",
                  "fontSize": 14,
                  "fills": ["#737373"]
                }
              ]
            }
          ]
        },
        {
          "name": "Type=Error",
          "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [12, 16, 12, 16] },
          "fills": ["#FEF2F2"],
          "cornerRadius": 8,
          "properties": [
            { "name": "Title", "type": "TEXT", "default": "Error" },
            { "name": "Description", "type": "TEXT", "default": "Something went wrong." },
            { "name": "Show Close", "type": "BOOLEAN", "default": true }
          ],
          "propertyLinks": [
            { "layer": "Title", "property": "Title" },
            { "layer": "Description", "property": "Description" }
          ],
          "children": [
            {
              "type": "FRAME",
              "name": "Icon Container",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [2, 0, 0, 0] },
              "children": [
                {
                  "type": "RECT",
                  "name": "Icon Placeholder",
                  "width": 20,
                  "height": 20,
                  "cornerRadius": 10,
                  "fills": ["#DC2626"]
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Content",
              "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [0, 0, 0, 0] },
              "sizing": { "horizontal": "FILL" },
              "children": [
                {
                  "type": "TEXT",
                  "name": "Title",
                  "text": "Error",
                  "font": "Inter:Semi Bold",
                  "fontSize": 14,
                  "fills": ["#1A1A1A"]
                },
                {
                  "type": "TEXT",
                  "name": "Description",
                  "text": "Something went wrong.",
                  "font": "Inter:Regular",
                  "fontSize": 13,
                  "fills": ["#525252"],
                  "sizing": { "horizontal": "FILL" }
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Close Button",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [4, 4, 4, 4] },
              "children": [
                {
                  "type": "TEXT",
                  "name": "Close Icon",
                  "text": "\u2715",
                  "font": "Inter:Regular",
                  "fontSize": 14,
                  "fills": ["#737373"]
                }
              ]
            }
          ]
        },
        {
          "name": "Type=Warning",
          "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [12, 16, 12, 16] },
          "fills": ["#FFFBEB"],
          "cornerRadius": 8,
          "properties": [
            { "name": "Title", "type": "TEXT", "default": "Warning" },
            { "name": "Description", "type": "TEXT", "default": "Please review before proceeding." },
            { "name": "Show Close", "type": "BOOLEAN", "default": true }
          ],
          "propertyLinks": [
            { "layer": "Title", "property": "Title" },
            { "layer": "Description", "property": "Description" }
          ],
          "children": [
            {
              "type": "FRAME",
              "name": "Icon Container",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [2, 0, 0, 0] },
              "children": [
                {
                  "type": "RECT",
                  "name": "Icon Placeholder",
                  "width": 20,
                  "height": 20,
                  "cornerRadius": 10,
                  "fills": ["#D97706"]
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Content",
              "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [0, 0, 0, 0] },
              "sizing": { "horizontal": "FILL" },
              "children": [
                {
                  "type": "TEXT",
                  "name": "Title",
                  "text": "Warning",
                  "font": "Inter:Semi Bold",
                  "fontSize": 14,
                  "fills": ["#1A1A1A"]
                },
                {
                  "type": "TEXT",
                  "name": "Description",
                  "text": "Please review before proceeding.",
                  "font": "Inter:Regular",
                  "fontSize": 13,
                  "fills": ["#525252"],
                  "sizing": { "horizontal": "FILL" }
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Close Button",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [4, 4, 4, 4] },
              "children": [
                {
                  "type": "TEXT",
                  "name": "Close Icon",
                  "text": "\u2715",
                  "font": "Inter:Regular",
                  "fontSize": 14,
                  "fills": ["#737373"]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### What this produces

1. Three COMPONENT nodes are created: `Type=Success`, `Type=Error`, `Type=Warning`
2. Each component gets `Title` (TEXT) and `Description` (TEXT) and `Show Close` (BOOLEAN) properties
3. `propertyLinks` connects the "Title" text node to the `Title` property and "Description" text node to the `Description` property
4. `combineAsVariants()` groups all three into a COMPONENT_SET named "FM Alert"
5. The component set gets the description string for Figma's component panel

### Key details in the example

- **Spacing values** use only the allowed scale: 4, 8, 12, 16 px
- **Padding** uses `[top, right, bottom, left]` array format
- **Content frame** uses `sizing: { horizontal: "FILL" }` to stretch within the horizontal parent
- **Text node names match propertyLink layer names exactly** (e.g., `"name": "Title"` matches `"layer": "Title"`)
- **Each variant declares its own properties and propertyLinks** (the interpreter adds properties per-component before combining)
