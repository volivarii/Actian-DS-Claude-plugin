# Figma Spec Schema Reference

Schema reference for the JSON Spec Interpreter (`scripts/figma-interpreter.js`). This document defines the complete structure of a `figma-spec.json` file -- the declarative format that the interpreter reads to build Figma node trees inside the Plugin API sandbox.

When generating a spec, every property name and value format must match this document exactly. The interpreter does not validate or coerce -- incorrect shapes silently produce broken output.

---

## Quick-Reference: Node Types

| Type | Creates | Tier | Notes |
|------|---------|------|-------|
| `FRAME` | Auto-layout frame | 1 | Primary container. Layout set before children are appended. |
| `TEXT` | Text node | 1 | Supports mixed-style ranges, alignment, line height, letter spacing. |
| `RECT` | Rectangle | 1 | Simple shape with fills, stroke, corner radius. |
| `INSTANCE` | Component instance | 1 | Imports a library component/set, sets props, optionally detaches. |
| `DIVIDER` | Divider line | 1 | Imports a divider component or falls back to a thin rectangle. |
| `LINE` | Line | 2 | Stroke-only, resized by `length`. Supports `rotation`. |
| `ELLIPSE` | Ellipse / arc | 2 | Supports `arcData` for arcs and donuts. |
| `VECTOR` | Vector path | 2 | SVG-style path data strings. |
| `POLYGON` | Polygon | 2 | Regular polygon with configurable `pointCount`. |
| `STAR` | Star | 2 | Star with `pointCount` and `innerRadius`. |
| `SVG` | Node from SVG | 2 | Raw SVG string, creates a Figma node via `createNodeFromSvg`. |
| `GROUP` | Group | 3 | Wraps children into a group. Children must exist first. |
| `BOOLEAN` | Boolean operation | 3 | Union, subtract, intersect, exclude. Requires 2+ children. |
| `SECTION` | Section | 3 | Top-level organizational container. |
| `LOCAL_INSTANCE` | Instance of same-file component | 1 | Creates instance of a component in the same file, referenced by node ID via `localComponents`. |
| `COMPONENT` | Reusable component | 4 | Single component with properties, property links, variable scopes. |
| `COMPONENT_SET` | Variant group | 4 | Groups multiple COMPONENT variants into a set. |

**Tier 1** -- core building blocks used in 90% of specs.
**Tier 2** -- shapes and vectors for illustrations, icons, decorative elements.
**Tier 3** -- structural containers for advanced compositions.
**Tier 4** -- component authoring (create-component skill).

---

## Top-Level Structure

Every spec has this shape:

```json
{
  "meta": {
    "targetNodeId": "123:456",
    "skill": "component-brief",
    "component": "Button",
    "wrapperName": "component-brief: Button",
    "appendToId": null
  },
  "fonts": [
    "Inter:Regular",
    "Inter:Bold",
    "Inter:Medium",
    "JetBrains Mono:Regular"
  ],
  "imports": {
    "card": { "method": "component", "key": "abc123..." },
    "buttonSet": { "method": "set", "key": "def456..." }
  },
  "localComponents": {
    "targetComponent": { "nodeId": "7206:2643" }
  },
  "variables": {
    "bgDefault": { "key": "805afec875092b89deebe685e17992963d603974" },
    "borderDefault": { "key": "290c868621027b488cbc3b262619959bec52765f" }
  },
  "styles": {
    "bodyStandard": { "key": "STYLE_KEY_HERE" },
    "shadowXs": { "key": "STYLE_KEY_HERE" }
  },
  "tree": [
    { "type": "FRAME", "name": "Card 1", "...": "..." },
    { "type": "FRAME", "name": "Card 2", "...": "..." }
  ]
}
```

### `meta` (required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetNodeId` | string | Yes | Figma node ID to position the output next to. The interpreter navigates to this node's page. |
| `skill` | string | Yes | Skill name. Written to `setSharedPluginData('actian_ds', 'skill', ...)`. |
| `component` | string | No | Component or feature name. Used in default `wrapperName`. |
| `wrapperName` | string | No | Name for the wrapper frame. Defaults to `"{skill}: {component}"`. |
| `appendToId` | string | No | If set, appends tree children to an existing frame instead of creating a new wrapper. Used for multi-call specs (see Call Splitting below). |

### `fonts` (required)

Array of `"Family:Style"` strings. Every font used anywhere in the spec (including `textRanges`) must be listed here. The interpreter loads all fonts up front before building any nodes.

### `imports` (optional)

Object mapping ref names to import definitions. Each import has:

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `method` | string | `"component"` or `"set"` | `"component"` calls `importComponentByKeyAsync`. `"set"` calls `importComponentSetByKeyAsync`. |
| `key` | string | -- | The Figma component key from the library registry. |

Ref names are arbitrary identifiers used later in `INSTANCE` nodes via `spec.ref`.

### `variables` (optional)

Object mapping ref names to variable definitions. Each has a `key` field containing the Figma variable key. Ref names are used later in node-level `variables` bindings.

### `styles` (optional)

Object mapping ref names to style definitions. Each has a `key` field containing the Figma style key. Ref names are used later in node-level `styles` bindings.

### `tree` (required)

Array of node specs (or a single node spec object). These are the top-level children appended to the wrapper frame. Each node spec has a `type` field that dispatches to the appropriate builder.

---

## Shared Properties

These properties are available on most node types. See per-type tables for which ones apply.

### `sizing`

Controls how the node sizes within its parent's auto-layout. **Must be applied AFTER the node is appended to its parent** (the interpreter handles this automatically).

```json
{
  "horizontal": "FILL",
  "vertical": "HUG",
  "minWidth": 200,
  "maxWidth": 600,
  "minHeight": 40,
  "maxHeight": null
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `horizontal` | `"FILL"` / `"HUG"` / number | -- | `"FILL"` = stretch to parent width. `"HUG"` = shrink to content. Number = fixed pixel width. |
| `vertical` | `"FILL"` / `"HUG"` / number | -- | `"FILL"` = stretch to parent height. `"HUG"` = shrink to content. Number = fixed pixel height. |
| `minWidth` | number | -- | Minimum width constraint (optional). |
| `maxWidth` | number | -- | Maximum width constraint (optional). |
| `minHeight` | number | -- | Minimum height constraint (optional). |
| `maxHeight` | number | -- | Maximum height constraint (optional). |

### `layout`

Auto-layout configuration for FRAME nodes.

```json
{
  "mode": "VERTICAL",
  "spacing": 12,
  "padding": [16, 20, 16, 20],
  "wrap": false,
  "counterAxisSpacing": 8,
  "primaryAxisAlign": "MIN",
  "counterAxisAlign": "MIN"
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `mode` | string | `"VERTICAL"` / `"HORIZONTAL"` / `"NONE"` | Layout direction. `"NONE"` skips setting `layoutMode` (absolute positioning). |
| `spacing` | number | -- | Gap between children (`itemSpacing`). |
| `padding` | array | `[top, right, bottom, left]` | Padding in CSS order. Always a 4-element array. |
| `wrap` | boolean | -- | If `true`, sets `layoutWrap` to `"WRAP"`. |
| `counterAxisSpacing` | number | -- | Gap between wrapped rows/columns. Only meaningful when `wrap` is `true`. |
| `primaryAxisAlign` | string | `"MIN"` / `"CENTER"` / `"MAX"` / `"SPACE_BETWEEN"` | Alignment along the layout direction. |
| `counterAxisAlign` | string | `"MIN"` / `"CENTER"` / `"MAX"` / `"BASELINE"` | Alignment perpendicular to layout direction. |

When `layout` is provided with `mode` other than `"NONE"`, the interpreter also sets `primaryAxisSizingMode = 'AUTO'` and `counterAxisSizingMode = 'AUTO'` (HUG on both axes by default). Override with `sizing` on the node.

### `fills`

Array of hex color strings or gradient objects. An empty array `[]` means transparent (no fills).

**Solid fills:**
```json
["#F5F5FA"]
```

**Multiple fills:**
```json
["#FFFFFF", "#F0F0F0"]
```

**Gradient fills:**
```json
[{
  "type": "LINEAR",
  "stops": [
    { "color": "#FF0000", "position": 0, "opacity": 1 },
    { "color": "#0000FF", "position": 1, "opacity": 0.5 }
  ],
  "angle": 90
}]
```

| Gradient field | Type | Values | Description |
|----------------|------|--------|-------------|
| `type` | string | `"LINEAR"` / `"RADIAL"` / `"ANGULAR"` / `"DIAMOND"` | Gradient type. |
| `stops` | array | -- | Array of color stops. |
| `stops[].color` | string | `"#RRGGBB"` | Hex color. |
| `stops[].position` | number | 0-1 | Position along the gradient. |
| `stops[].opacity` | number | 0-1 | Optional, defaults to 1. |
| `angle` | number | degrees | Rotation angle. Optional, defaults to 0. |

### `stroke`

```json
{
  "color": "#E0E0E0",
  "weight": 1,
  "align": "INSIDE",
  "sides": { "top": true, "right": true, "bottom": true, "left": false }
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `color` | string | `"#RRGGBB"` | Stroke color. |
| `weight` | number | -- | Stroke weight in pixels. |
| `align` | string | `"INSIDE"` / `"OUTSIDE"` / `"CENTER"` | Stroke alignment. |
| `sides` | object | -- | Per-side visibility. A side set to `false` gets its weight set to 0. |

### `effects`

```json
[{
  "type": "DROP_SHADOW",
  "color": "#000000",
  "opacity": 0.15,
  "offset": { "x": 0, "y": 2 },
  "radius": 4,
  "spread": 0
}]
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `type` | string | `"DROP_SHADOW"` / `"INNER_SHADOW"` / `"LAYER_BLUR"` / `"BACKGROUND_BLUR"` | Effect type. |
| `color` | string | `"#RRGGBB"` | Color (shadows only). |
| `opacity` | number | 0-1 | Alpha. Defaults to 0.25 for shadows. |
| `offset` | object | `{ "x": number, "y": number }` | Shadow offset (shadows only). Defaults to `{ "x": 0, "y": 0 }`. |
| `radius` | number | -- | Blur radius. |
| `spread` | number | -- | Shadow spread (shadows only, optional). |

For `LAYER_BLUR` and `BACKGROUND_BLUR`, only `type` and `radius` are used.

### `cornerRadius`

Either a single number (uniform) or an object for per-corner values:

```json
8
```
```json
{ "topLeft": 8, "topRight": 8, "bottomRight": 0, "bottomLeft": 0 }
```

### `opacity`

Number from 0 to 1. Applied to the node's opacity.

---

## Node Type Details

### FRAME

The primary container node. Sets `layoutMode` before appending children to prevent frame collapse.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Frame name in the layers panel. |
| `layout` | object | Auto-layout configuration. See `layout` above. |
| `fills` | array | Background fills. |
| `cornerRadius` | number/object | Corner radius. |
| `stroke` | object | Border stroke. |
| `effects` | array | Shadow/blur effects. |
| `opacity` | number | Node opacity (0-1). |
| `clipsContent` | boolean | Whether frame clips overflowing children. |
| `width` | number | Fixed width (set before children, for non-auto-layout sizing). |
| `height` | number | Fixed height (set before children). |
| `sizing` | object | Auto-layout sizing within parent. |
| `children` | array | Child node specs. Built recursively. |
| `styles` | object | Style bindings (see Style Binding below). |
| `variables` | object | Variable bindings (see Variable Binding below). |

### TEXT

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name in the layers panel. |
| `content` | string | Text characters. Converted to string automatically. |
| `font` | string | `"Family:Style"` format, e.g. `"Inter:Regular"`. Defaults to `"Inter:Regular"`. |
| `bold` | boolean | Shorthand -- overrides font style to `"Bold"`. |
| `size` | number | Font size in pixels. |
| `color` | string | `"#RRGGBB"` text fill color. |
| `width` | number | Fixed width. When set, `textAutoResize` becomes `"HEIGHT"` (auto-height). |
| `textAlign` | object | `{ "horizontal": "LEFT"/"CENTER"/"RIGHT"/"JUSTIFIED", "vertical": "TOP"/"CENTER"/"BOTTOM" }` |
| `lineHeight` | number/string/object | Number = pixels. `"AUTO"` = auto. Object = `{ "value": number, "unit": "PIXELS"/"PERCENT" }`. |
| `letterSpacing` | number/object | Number = pixels. Object = `{ "value": number, "unit": "PIXELS"/"PERCENT" }`. |
| `textDecoration` | string | `"NONE"` / `"UNDERLINE"` / `"STRIKETHROUGH"`. |
| `textCase` | string | `"ORIGINAL"` / `"UPPER"` / `"LOWER"` / `"TITLE"`. |
| `opacity` | number | Node opacity (0-1). |
| `textRanges` | array | Mixed-style ranges (see below). |
| `sizing` | object | Auto-layout sizing within parent. |
| `styles` | object | Style bindings. |
| `variables` | object | Variable bindings. |

#### `textRanges`

Apply different styles to character ranges within the same text node:

```json
[
  { "start": 0, "end": 5, "color": "#6200EE", "font": "Inter:Bold", "size": 14 },
  { "start": 5, "end": 10, "color": "#333333", "textDecoration": "UNDERLINE" }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `start` | number | Start character index (inclusive). |
| `end` | number | End character index (exclusive). |
| `color` | string | `"#RRGGBB"` fill for this range. |
| `font` | string | `"Family:Style"` for this range. Must be listed in top-level `fonts`. |
| `size` | number | Font size for this range. |
| `textDecoration` | string | `"NONE"` / `"UNDERLINE"` / `"STRIKETHROUGH"`. |
| `textCase` | string | `"ORIGINAL"` / `"UPPER"` / `"LOWER"` / `"TITLE"`. |

### RECT

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `width` | number | Width in pixels. |
| `height` | number | Height in pixels. |
| `fills` | array | Background fills. |
| `cornerRadius` | number/object | Corner radius. |
| `stroke` | object | Border stroke. |
| `effects` | array | Shadow/blur effects. |
| `opacity` | number | Node opacity (0-1). |
| `sizing` | object | Auto-layout sizing within parent. |
| `styles` | object | Style bindings. |
| `variables` | object | Variable bindings. |

### INSTANCE

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Instance name. |
| `ref` | string | Key into `imports` -- references the imported component or component set. |
| `variant` | string | Variant name for component sets, e.g. `"Size=Large, State=Default"`. Supports partial matching. |
| `props` | object | Component properties set by prefix matching. e.g. `{ "Label": "Save", "Icon": true }`. |
| `detach` | boolean | If `true`, detaches the instance into a mutable frame after setting props. |
| `fills` | array | Override fills on the instance. |
| `children` | array | Children appended into a `"Content"` slot (or the instance root). |
| `sizing` | object | Auto-layout sizing within parent. |
| `styles` | object | Style bindings. |
| `variables` | object | Variable bindings. |

**Variant matching logic:** The interpreter first tries an exact match on the variant's `name` property. If no exact match, it tries a partial match (checks if the variant name contains the spec string). If still no match, it uses `defaultVariant` or `children[0]`.

**Props prefix matching:** Property keys in Figma look like `"Label#1234:0"`. The interpreter splits on `#` and matches the prefix. So `"Label"` matches `"Label#1234:0"`.

### DIVIDER

A convenience type. Looks for an import with ref `"divider"` or `"cardDivider"` and creates an instance. If no import is found, falls back to a thin rectangle.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. Defaults to `"Divider"`. |
| `width` | number | Width for fallback rectangle. Defaults to 300. |
| `color` | string | Fill color for fallback rectangle. Defaults to `"#E0E0E0"`. |

### LOCAL_INSTANCE

Creates an instance of a component that lives in the **same Figma file** as the output. The component is referenced by node ID (not a library key). Used for Card 2 variant matrix and Card 3 state grid in component-brief.

Declare the component in `spec.localComponents` first:
```json
{ "localComponents": { "targetComponent": { "nodeId": "7206:2643" } } }
```

| Property | Type | Description |
|----------|------|-------------|
| `ref` | string | **Required.** Key in `spec.localComponents`. |
| `variant` | string | Variant name (e.g., `"Type=Primary, Size=Default, State=Default"`). Supports partial matching. |
| `name` | string | Node name. |
| `opacity` | number | Node opacity (0-1). |

**Example:**
```json
{
  "type": "LOCAL_INSTANCE",
  "ref": "targetComponent",
  "variant": "Type=Primary, Size=Default, State=Default",
  "name": "Primary Default"
}
```

The interpreter does: `getNodeByIdAsync(nodeId)` → `children.find(name matches variant)` → `createInstance()`. Partial matching is supported — if exact name match fails, it tries `indexOf`.

### LINE

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `length` | number | Line length (horizontal). |
| `stroke` | object | Only `color` and `weight` are used (no `align` or `sides`). |
| `rotation` | number | Rotation in degrees. |
| `opacity` | number | Node opacity (0-1). |

### ELLIPSE

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `width` | number | Width. |
| `height` | number | Height. |
| `fills` | array | Background fills. |
| `stroke` | object | Border stroke. |
| `arcData` | object | `{ "startingAngle": 0, "endingAngle": 6.2832, "innerRadius": 0 }` for arcs/donuts. Angles in radians. |
| `opacity` | number | Node opacity (0-1). |

### VECTOR

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `paths` | array | Array of SVG path data strings or `{ "windingRule": "NONZERO"/"EVENODD", "data": "M0 0 L10 10..." }` objects. |
| `width` | number | Width (resize after path set). |
| `height` | number | Height (resize after path set). |
| `fills` | array | Path fills. |
| `stroke` | object | Path stroke. |
| `opacity` | number | Node opacity (0-1). |

### POLYGON

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `width` | number | Width. |
| `height` | number | Height. |
| `pointCount` | number | Number of sides. |
| `fills` | array | Background fills. |
| `stroke` | object | Border stroke. |
| `opacity` | number | Node opacity (0-1). |

### STAR

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `width` | number | Width. |
| `height` | number | Height. |
| `pointCount` | number | Number of points. |
| `innerRadius` | number | Inner radius ratio (0-1). |
| `fills` | array | Background fills. |
| `stroke` | object | Border stroke. |
| `opacity` | number | Node opacity (0-1). |

### SVG

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `svg` | string | Raw SVG markup string. Passed to `figma.createNodeFromSvg()`. |

### GROUP

Children are created on the current page first, then grouped. Requires at least 1 child.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Group name. |
| `children` | array | Child node specs. At least 1 required. |
| `opacity` | number | Group opacity (0-1). |

### BOOLEAN

Creates a boolean operation from 2+ children. Children are created on the current page first, then combined.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Node name. |
| `operation` | string | `"UNION"` / `"SUBTRACT"` / `"INTERSECT"` / `"EXCLUDE"`. Defaults to `"UNION"`. |
| `children` | array | Child node specs. At least 2 required. |
| `fills` | array | Fills applied to the result. |
| `stroke` | object | Stroke applied to the result. |
| `opacity` | number | Node opacity (0-1). |

### SECTION

Top-level organizational container. Does not support auto-layout or stroke.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Section name. |
| `fills` | array | Background fills. |
| `children` | array | Child node specs. |

---

## Tier 4 — Component Authoring

### COMPONENT

Creates a reusable Figma component (`figma.createComponent()`). Supports all FRAME properties plus component-specific features.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Component name. For variants: `"Type=Success, Size=Large"`. |
| `layout` | object | Auto-layout (same as FRAME). |
| `sizing` | object | Sizing (same as FRAME). |
| `fills` | array | Background fills. |
| `cornerRadius` | number/object | Corner radius. |
| `stroke` | object | Stroke. |
| `effects` | array | Effects. |
| `opacity` | number | Opacity. |
| `width`, `height` | number | Fixed dimensions before children. |
| `properties` | array | Component properties to expose. See below. |
| `propertyLinks` | array | Links text nodes to TEXT properties. See below. |
| `variableScopes` | array | Set scopes on bound variables. See below. |
| `children` | array | Child node specs. |
| `variables` | object | Variable bindings (same as FRAME). |
| `styles` | object | Style bindings (same as FRAME). |

**`properties` array:**

```json
[
  { "name": "Title", "type": "TEXT", "default": "Button" },
  { "name": "Show Icon", "type": "BOOLEAN", "default": true },
  { "name": "Icon", "type": "INSTANCE_SWAP", "default": "component-key-here" }
]
```

Types: `TEXT`, `BOOLEAN`, `INSTANCE_SWAP`. (`VARIANT` is managed automatically by `COMPONENT_SET`.)

**`propertyLinks` array** — CRITICAL for avoiding "unused property" publish errors:

```json
[
  { "layer": "Title", "property": "Title" },
  { "layer": "Description", "property": "Description" }
]
```

`layer` = name of the TEXT node inside the component. `property` = name from `properties` array. The interpreter finds the text node and sets `componentPropertyReferences = { characters: propertyKey }`.

**`variableScopes` array** — set correct scopes on bound variables:

```json
[
  { "ref": "bgDefault", "scopes": ["FRAME_FILL"] },
  { "ref": "textPrimary", "scopes": ["TEXT_FILL"] },
  { "ref": "borderDefault", "scopes": ["STROKE_COLOR"] },
  { "ref": "spacing16", "scopes": ["GAP"] }
]
```

Never leave as `ALL_SCOPES`. Valid scopes: `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR`, `GAP`, `CORNER_RADIUS`, `WIDTH_HEIGHT`, `OPACITY`, `EFFECT_FLOAT`, `EFFECT_COLOR`, `FONT_SIZE`, `LINE_HEIGHT`, `LETTER_SPACING`.

### COMPONENT_SET

Groups multiple COMPONENT variants into a variant set (`figma.combineAsVariants()`).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Component set name (e.g., `"FM Alert"`). |
| `description` | string | Optional description for the component set. |
| `variants` | array | Array of COMPONENT specs. Each must have a variant name like `"Type=Success"`. |

```json
{
  "type": "COMPONENT_SET",
  "name": "FM Alert",
  "description": "Alert component with type variants",
  "variants": [
    { "name": "Type=Success", "properties": [...], "layout": {...}, "children": [...] },
    { "name": "Type=Error", "properties": [...], "layout": {...}, "children": [...] },
    { "name": "Type=Warning", "properties": [...], "layout": {...}, "children": [...] }
  ]
}
```

Variant names MUST follow Figma's `Axis=Value, Axis=Value` format. The interpreter builds each variant as a Component, then combines them via `combineAsVariants`.

---

## Variable Binding

Any node that supports `variables` can bind Figma variables to specific fields. The `variables` object maps field paths to ref names defined in the top-level `variables` section.

### Field path formats

| Path pattern | Binding method | Example |
|-------------|---------------|---------|
| `fills.{index}.color` | `setBoundVariableForPaint` on fills array | `"fills.0.color": "bgDefault"` |
| `strokes.{index}.color` | `setBoundVariableForPaint` on strokes array | `"strokes.0.color": "borderDefault"` |
| `effects.{index}.color` | `setBoundVariableForEffect` on effects array | `"effects.0.color": "shadowColor"` |
| `effects.{index}.radius` | `setBoundVariableForEffect` on effects array | `"effects.0.radius": "blurRadius"` |
| Any scalar field | `setBoundVariable` directly on node | `"paddingTop": "spacingMd"` |

### Scalar fields that support variable binding

These are passed directly to `node.setBoundVariable(field, variable)`:

- `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
- `itemSpacing`, `counterAxisSpacing`
- `opacity`
- `cornerRadius`, `topLeftRadius`, `topRightRadius`, `bottomRightRadius`, `bottomLeftRadius`
- `fontSize`
- `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`
- `strokeWeight`

### Example

```json
{
  "type": "FRAME",
  "name": "Card",
  "fills": ["#FFFFFF"],
  "layout": { "mode": "VERTICAL", "spacing": 12, "padding": [16, 16, 16, 16] },
  "variables": {
    "fills.0.color": "bgSurface",
    "strokes.0.color": "borderDefault",
    "paddingTop": "spacingMd",
    "paddingBottom": "spacingMd"
  },
  "stroke": { "color": "#E0E0E0", "weight": 1, "align": "INSIDE" },
  "children": []
}
```

The initial hex values in `fills` and `stroke.color` provide the fallback appearance. The variable binding overrides them at runtime when the variable resolves.

---

## Style Binding

Any node that supports `styles` can bind shared Figma styles. The `styles` object maps type keys to ref names defined in the top-level `styles` section.

### Style type keys

| Key | Applies to | Figma API method |
|-----|-----------|-----------------|
| `text` | TEXT nodes | `setTextStyleIdAsync` |
| `fill` | Any node | `setFillStyleIdAsync` |
| `stroke` | Any node | `setStrokeStyleIdAsync` |
| `effect` | Any node | `setEffectStyleIdAsync` |
| `grid` | FRAME nodes | `setGridStyleIdAsync` |

### Example

```json
{
  "type": "TEXT",
  "name": "Heading",
  "content": "Button",
  "font": "Inter:Bold",
  "size": 24,
  "color": "#1A1A1A",
  "styles": {
    "text": "headingDisplay",
    "fill": "textPrimary"
  }
}
```

The `font`, `size`, and `color` provide fallback values. The style binding overrides them when the style resolves.

---

## Common Mistakes

| Mistake | What happens | Fix |
|---------|-------------|-----|
| Missing font in `fonts` array | `loadFontAsync` never called, text node creation fails silently or throws | List every `"Family:Style"` used in any `font`, `bold`, or `textRanges[].font` field. |
| `layout.padding` as object | Interpreter expects an array, object is ignored | Always use `[top, right, bottom, left]` array format. |
| `sizing` on the node itself without parent auto-layout | `layoutSizingHorizontal/Vertical` has no effect on nodes not in an auto-layout parent | Only use `sizing` on children of FRAME nodes that have `layout.mode` set. |
| Setting `layout.mode: "NONE"` | Interpreter skips setting `layoutMode`, so children overlap at (0,0) | Use `"NONE"` only for absolute positioning. For most layouts, use `"VERTICAL"` or `"HORIZONTAL"`. |
| `fills` as a single string instead of array | Interpreter calls `.map()` on the value, string gets split into characters | Always wrap in an array: `["#FFFFFF"]` not `"#FFFFFF"`. |
| `stroke.sides` with missing keys | Only explicitly `false` sides are zeroed; missing keys are left at `strokeWeight` | Include all four sides when using partial borders. |
| `variant` string not matching any child | Falls back to `defaultVariant` or first child -- not what you intended | Copy the exact variant name string from Figma (e.g., `"Mode=DS, Type=Standard, State=Default"`). |
| `ref` not matching any `imports` key | Throws `"Import ref not found"` error | Ensure every `INSTANCE` node's `ref` value matches a key in `imports`. |
| Forgetting `detach: true` when adding children to instance | Children go into `"Content"` slot which may not exist | Detach first if you need to freely modify the instance structure. |
| Colors in 0-1 range instead of hex | Interpreter expects `"#RRGGBB"`, passing `{ r: 0.5, g: 0, b: 0 }` breaks fills | Always use hex strings in the spec. The interpreter converts to 0-1 internally. |
| `textRanges` with `bold` field | `bold` is a top-level TEXT shorthand, not a range field | Use `"font": "Inter:Bold"` in the range instead. |
| Gradient `type` using Figma constants | Spec uses short names (`"LINEAR"`), not Figma API names (`"GRADIENT_LINEAR"`) | Use `"LINEAR"`, `"RADIAL"`, `"ANGULAR"`, or `"DIAMOND"`. |

---

## Call Splitting with `appendToId`

When a spec exceeds the 20KB `use_figma` limit or requires incremental building, split it across multiple calls using `appendToId`.

### How it works

1. **First call:** Omit `appendToId`. The interpreter creates a new wrapper frame and returns `{ wrapperId: "123:789", ... }`.
2. **Subsequent calls:** Set `meta.appendToId` to the wrapper ID from the first call. The interpreter finds the existing wrapper and appends new tree children to it.

### First call

```json
{
  "meta": {
    "targetNodeId": "0:1",
    "skill": "generate-flow",
    "component": "Login Flow",
    "appendToId": null
  },
  "fonts": ["Inter:Regular", "Inter:Bold"],
  "imports": { "card": { "method": "component", "key": "KEY_1" } },
  "tree": [
    { "type": "FRAME", "name": "Screen 1", "...": "..." },
    { "type": "FRAME", "name": "Screen 2", "...": "..." }
  ]
}
```

### Subsequent call

```json
{
  "meta": {
    "targetNodeId": "0:1",
    "skill": "generate-flow",
    "appendToId": "123:789"
  },
  "fonts": ["Inter:Regular", "Inter:Medium"],
  "imports": { "alert": { "method": "set", "key": "KEY_2" } },
  "tree": [
    { "type": "FRAME", "name": "Screen 3", "...": "..." }
  ]
}
```

Each call can declare its own `fonts`, `imports`, `variables`, and `styles` -- they are loaded fresh per call. Only the wrapper frame persists across calls.

---

## Examples

### Example 1: Simple Card

A card with a title, description, and a subtle shadow.

```json
{
  "meta": {
    "targetNodeId": "0:1",
    "skill": "example",
    "component": "SimpleCard"
  },
  "fonts": [
    "Inter:Bold",
    "Inter:Regular"
  ],
  "imports": {},
  "variables": {
    "bgSurface": { "key": "805afec875092b89deebe685e17992963d603974" },
    "borderDefault": { "key": "290c868621027b488cbc3b262619959bec52765f" }
  },
  "styles": {},
  "tree": [
    {
      "type": "FRAME",
      "name": "Card",
      "layout": {
        "mode": "VERTICAL",
        "spacing": 8,
        "padding": [24, 24, 24, 24]
      },
      "sizing": { "horizontal": 360, "vertical": "HUG" },
      "fills": ["#FFFFFF"],
      "cornerRadius": 8,
      "stroke": { "color": "#E0E0E0", "weight": 1, "align": "INSIDE" },
      "effects": [{
        "type": "DROP_SHADOW",
        "color": "#000000",
        "opacity": 0.08,
        "offset": { "x": 0, "y": 2 },
        "radius": 8,
        "spread": 0
      }],
      "variables": {
        "fills.0.color": "bgSurface",
        "strokes.0.color": "borderDefault"
      },
      "children": [
        {
          "type": "TEXT",
          "name": "Title",
          "content": "Card Title",
          "font": "Inter:Bold",
          "size": 18,
          "color": "#1A1A1A",
          "sizing": { "horizontal": "FILL", "vertical": "HUG" }
        },
        {
          "type": "TEXT",
          "name": "Description",
          "content": "A brief description of the card content goes here. It wraps at the card width.",
          "font": "Inter:Regular",
          "size": 14,
          "color": "#666666",
          "lineHeight": 20,
          "sizing": { "horizontal": "FILL", "vertical": "HUG" }
        }
      ]
    }
  ]
}
```

### Example 2: Table Row with Color Swatches

A horizontal row showing color tokens with visual swatches, names, and hex values.

```json
{
  "meta": {
    "targetNodeId": "0:1",
    "skill": "component-brief",
    "component": "ColorTokens"
  },
  "fonts": [
    "Inter:Medium",
    "JetBrains Mono:Regular"
  ],
  "imports": {},
  "variables": {},
  "styles": {},
  "tree": [
    {
      "type": "FRAME",
      "name": "Color Token Row",
      "layout": {
        "mode": "HORIZONTAL",
        "spacing": 24,
        "padding": [12, 16, 12, 16],
        "counterAxisAlign": "CENTER"
      },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "fills": ["#FAFAFA"],
      "stroke": {
        "color": "#E0E0E0",
        "weight": 1,
        "align": "INSIDE",
        "sides": { "top": false, "right": false, "bottom": true, "left": false }
      },
      "children": [
        {
          "type": "FRAME",
          "name": "Swatch Group: Primary",
          "layout": {
            "mode": "HORIZONTAL",
            "spacing": 10,
            "padding": [0, 0, 0, 0],
            "counterAxisAlign": "CENTER"
          },
          "sizing": { "horizontal": "HUG", "vertical": "HUG" },
          "fills": [],
          "children": [
            {
              "type": "RECT",
              "name": "Swatch",
              "width": 32,
              "height": 32,
              "fills": ["#6200EE"],
              "cornerRadius": 4,
              "sizing": { "horizontal": 32, "vertical": 32 }
            },
            {
              "type": "FRAME",
              "name": "Labels",
              "layout": { "mode": "VERTICAL", "spacing": 2, "padding": [0, 0, 0, 0] },
              "sizing": { "horizontal": "HUG", "vertical": "HUG" },
              "fills": [],
              "children": [
                {
                  "type": "TEXT",
                  "name": "Token Name",
                  "content": "theme-primary",
                  "font": "Inter:Medium",
                  "size": 13,
                  "color": "#1A1A1A"
                },
                {
                  "type": "TEXT",
                  "name": "Hex Value",
                  "content": "#6200EE",
                  "font": "JetBrains Mono:Regular",
                  "size": 12,
                  "color": "#888888"
                }
              ]
            }
          ]
        },
        {
          "type": "FRAME",
          "name": "Swatch Group: Border",
          "layout": {
            "mode": "HORIZONTAL",
            "spacing": 10,
            "padding": [0, 0, 0, 0],
            "counterAxisAlign": "CENTER"
          },
          "sizing": { "horizontal": "HUG", "vertical": "HUG" },
          "fills": [],
          "children": [
            {
              "type": "RECT",
              "name": "Swatch",
              "width": 32,
              "height": 32,
              "fills": ["#E0E0E0"],
              "cornerRadius": 4,
              "stroke": { "color": "#CCCCCC", "weight": 1, "align": "INSIDE" },
              "sizing": { "horizontal": 32, "vertical": 32 }
            },
            {
              "type": "FRAME",
              "name": "Labels",
              "layout": { "mode": "VERTICAL", "spacing": 2, "padding": [0, 0, 0, 0] },
              "sizing": { "horizontal": "HUG", "vertical": "HUG" },
              "fills": [],
              "children": [
                {
                  "type": "TEXT",
                  "name": "Token Name",
                  "content": "border-default",
                  "font": "Inter:Medium",
                  "size": 13,
                  "color": "#1A1A1A"
                },
                {
                  "type": "TEXT",
                  "name": "Hex Value",
                  "content": "#E0E0E0",
                  "font": "JetBrains Mono:Regular",
                  "size": 12,
                  "color": "#888888"
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

### Example 3: Component Instance with Detach

Import a Button component set, pick a variant, set properties, then detach to add custom children.

```json
{
  "meta": {
    "targetNodeId": "0:1",
    "skill": "generate-flow",
    "component": "ActionBar"
  },
  "fonts": [
    "Inter:Medium"
  ],
  "imports": {
    "buttonSet": { "method": "set", "key": "abc123def456abc123def456abc123def456abcd" },
    "divider": { "method": "component", "key": "fed321fed321fed321fed321fed321fed321fedc" }
  },
  "variables": {},
  "styles": {},
  "tree": [
    {
      "type": "FRAME",
      "name": "Action Bar",
      "layout": {
        "mode": "HORIZONTAL",
        "spacing": 12,
        "padding": [16, 24, 16, 24],
        "primaryAxisAlign": "MAX",
        "counterAxisAlign": "CENTER"
      },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "fills": ["#FFFFFF"],
      "stroke": {
        "color": "#E0E0E0",
        "weight": 1,
        "align": "INSIDE",
        "sides": { "top": true, "right": false, "bottom": false, "left": false }
      },
      "children": [
        {
          "type": "INSTANCE",
          "name": "Cancel Button",
          "ref": "buttonSet",
          "variant": "Type=Ghost, Size=Medium",
          "props": {
            "Label": "Cancel"
          },
          "detach": false
        },
        {
          "type": "INSTANCE",
          "name": "Save Button",
          "ref": "buttonSet",
          "variant": "Type=Primary, Size=Medium",
          "props": {
            "Label": "Save Changes"
          },
          "detach": false
        },
        {
          "type": "INSTANCE",
          "name": "Custom Card",
          "ref": "buttonSet",
          "variant": "Type=Primary, Size=Large",
          "props": {
            "Label": "Submit"
          },
          "detach": true,
          "fills": ["#1A73E8"],
          "children": [
            {
              "type": "TEXT",
              "name": "Badge",
              "content": "NEW",
              "font": "Inter:Medium",
              "size": 10,
              "color": "#FFFFFF"
            }
          ]
        }
      ]
    }
  ]
}
```

In this example:
- `Cancel Button` and `Save Button` remain as live instances -- variant switching and property updates still work.
- `Custom Card` is detached (`detach: true`) so custom children can be appended and fills overridden. It is no longer linked to the library component.
- The `DIVIDER` import is available but not used in this tree -- it could be referenced in a subsequent `appendToId` call.
