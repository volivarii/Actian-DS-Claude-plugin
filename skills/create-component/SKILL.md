---
name: create-component
description: Create a new Figma component with variants from a description or reference. Uses the DS Assembler plugin. Use when user asks to create, build, or add a new component to the design system.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component.

> Uses the DS Assembler plugin's Create mode. Requires the plugin to be installed and `python3 serve.py 8765` running in the Actian-DS-Assembler directory.

## Input

The user describes a component they want to create. Examples:
- "Create a Page Header component with title, subtitle, and action buttons variants"
- "Add a Card component with Default, Hover, and Selected states"
- "Extend this component with a new variant" + Figma URL
- "Create an FM Alert component with success, error, warning, and info variants"

## Step 1 — Understand the component

Clarify:
- **Component name** (with FM prefix for Fat Marker, no prefix for DS2026)
- **Library** — Fat Marker (`"fat-marker"`, Inter font) or DS2026 (`"ds2026"`, Roboto font)?
- **Variants** — what axes and values? (e.g., Type: Default / With Actions / Compact)
- **Content** — what text, icons, or nested components does each variant contain?
- **Layout** — horizontal or vertical? Spacing? Padding?
- **Properties** — which text fields should be editable component properties?

If a Figma URL is provided, fetch it with `get_design_context` + `get_screenshot` to understand the existing component before extending it.

## Step 2 — Check existing components

Before creating, check:
1. `docs/ds2026-component-reference.md` — does it already exist in DS2026?
2. `docs/fm-component-catalog.md` — does it already exist in FM Kit?
3. Registry: `registry/component-registry.json` — is there a key for it?

If it exists, tell the user and suggest modifying it instead of creating a duplicate.

## Step 3 — Generate the component spec

Generate a `component-spec.json` following this schema:

```json
{
  "type": "component",
  "name": "Component Name",
  "description": "What it does and when to use it.",
  "library": "fat-marker",
  "variants": { "Type": ["Default", "With Actions"] },
  "definitions": [
    {
      "variant": { "Type": "Default" },
      "layout": "horizontal",
      "width": 600,
      "children": [
        { "type": "text", "name": "Title", "content": "Title", "style": "heading-display", "isProperty": true }
      ]
    }
  ]
}
```

### Node types in children

**Text node:**
```json
{ "type": "text", "name": "Title", "content": "Page Title", "style": "heading-display", "isProperty": true }
```
- `style`: heading-display, heading-prominent, heading-standard, heading-subtle, body-standard, body-subtle, label-standard, label-subtle, label-micro
- `isProperty: true`: exposes text as an editable component property

**Nested component instance:**
```json
{ "component": "FM Button", "props": { "Type": "Primary", "Size": "sm" } }
```
Use exact component names from the registry.

**Frame (container):**
```json
{
  "type": "frame",
  "layout": "horizontal",
  "spacing": 8,
  "width": "fill",
  "children": [ ... ]
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
| `fill` | hex color (e.g., `"#F5F5FA"`) | Background fill |
| `cornerRadius` | number | Border radius |

## Step 4 — Save and create

1. Save the spec to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/component-spec.json`
2. Ensure `python3 serve.py 8765` is running
3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**
4. After creation, remind the user to publish to library if it's a shared component

## Step 5 — Update references

After the component is created and published:
1. Run `FIGMA_TOKEN=figd_xxx node registry/sync-all.js` to update the registry and reference docs
2. If it's a FM Kit component, update `registry/fm-descriptions.json` with a description
