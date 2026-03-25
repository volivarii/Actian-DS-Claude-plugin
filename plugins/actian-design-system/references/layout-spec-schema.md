# Layout Spec Schema

JSON schema for the DS Assembler layout specs. Used by generate-flow and create-component skills to produce Figma-ready component and screen layouts.

## Generation Metadata Frame

Every assembler spec must include a generation metadata frame as the **first child** of the top-level wrapper (or the first element before the first screen in a flow). See CLAUDE.md for the full spec. Compact version:

```json
{
  "type": "frame",
  "name": "Generation log",
  "layout": "vertical",
  "spacing": 4,
  "padding": { "top": 16, "right": 20, "bottom": 16, "left": 20 },
  "fill": "#2D3648",
  "cornerRadius": 8,
  "width": 280,
  "height": "hug",
  "children": [
    { "type": "text", "content": "GENERATED", "style": "label-micro", "fill": "#A0ABC0" },
    { "type": "text", "content": "Skill: generate-flow", "style": "label-subtle", "fill": "#CBD2E0" },
    { "type": "text", "content": "2026-03-25T14:30:00", "style": "label-subtle", "fill": "#CBD2E0" },
    { "type": "text", "content": "claude-opus-4-6 · v1.9.1", "style": "label-subtle", "fill": "#CBD2E0" }
  ]
}
```

## Node Types

Two node types: **frames** (layout containers) and **instances** (component references).

### Frame node

```json
{
  "type": "frame",
  "name": "Content Area",
  "layout": "vertical",
  "spacing": 16,
  "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
  "fill": "--zen-color-background-bg-default",
  "width": "fill",
  "height": "hug",
  "align": "min",
  "counterAlign": "min",
  "children": []
}
```

### Instance node

```json
{
  "component": "FM Button",
  "props": { "Type": "Primary" },
  "text": { "Label": "Save" },
  "width": "fill"
}
```

### Layout properties

| Property | Values | Description |
|----------|--------|-------------|
| `layout` | `"vertical"` / `"horizontal"` | Auto-layout direction |
| `spacing` | number | Gap between children (px) |
| `padding` | `{ top, right, bottom, left }` | Inner padding |
| `width` / `height` | number, `"hug"`, `"fill"` | Sizing mode |
| `align` | `"min"` / `"center"` / `"max"` / `"space-between"` | Primary axis alignment |
| `counterAlign` | `"min"` / `"center"` / `"max"` | Counter axis alignment |
| `fill` | `--zen-*` token name or hex value | Background fill |
| `cornerRadius` | number | Border radius |

## textOverrides

Override text inside any FM component instance by matching the current text content or layer name. Use this to set contextual labels instead of leaving default placeholder text.

```json
{
  "component": "FM Side navigation bar",
  "height": "fill",
  "textOverrides": {
    "Nav Item": "Dashboard",
    "Active Item": "Overview"
  }
}
```

Keys are matched against text content first, then layer name. All matched text layers are updated. This works on any FM component — nav items, tabs, table headers, button labels, etc.

## FM Kit Component Names

Use these exact names — no abbreviations or renames.

**Layout:** `FM App_header`, `FM Side navigation bar`, `FM Side navigation item`, `FM Tabs`, `FM Tab`, `FM Sidepanel`, `FM Menu`, `FM Menu item`

**Inputs:** `FM Text input field`, `FM Text Area`, `FM Search input field`, `FM Dropdown`, `FM Multi-select dropdown`, `FM Date input`, `FM Checkbox`, `FM Radio button`, `FM Toggle`, `FM Slider`

**Actions:** `FM Button`, `FM Icon Buttons`

**Data:** `FM Table Cell`, `FM Table example`, `FM Badge`, `FM Tag`, `FM Chip`

**Feedback:** `FM Alert`, `FM Banner`, `FM Toast`, `FM Dialog`, `FM Empty State`, `FM Progress bar`, `FM Spinner`, `FM Tooltip`

**Other:** `FM Placeholder`, `FM User`, `FM Cursor`

All components support `textOverrides` for customizing labels, nav items, tabs, headers, and other text content to match the flow context.

## Full Screen Example

```json
{
  "version": "1.0",
  "name": "Settings Page",
  "type": "frame",
  "layout": "vertical",
  "width": 1440,
  "height": 900,
  "children": [
    { "component": "FM App_header", "width": "fill" },
    {
      "type": "frame",
      "layout": "horizontal",
      "width": "fill",
      "height": "fill",
      "children": [
        { "component": "FM Side navigation bar", "height": "fill" },
        {
          "type": "frame",
          "name": "Content",
          "layout": "vertical",
          "spacing": 16,
          "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
          "width": "fill",
          "children": [
            { "component": "FM Text input field", "width": "fill" },
            {
              "type": "frame",
              "layout": "horizontal",
              "spacing": 8,
              "children": [
                { "component": "FM Button", "props": { "Type": "Primary" } },
                { "component": "FM Button", "props": { "Type": "Secondary" } }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```
