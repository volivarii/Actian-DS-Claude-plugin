# DS Assembler — Component Creator Mode

**Date:** 2026-03-21
**Status:** Draft
**Priority:** Medium
**Author:** Vincent + Claude

## Problem

The assembler can compose screens from existing components and analyze/update them, but cannot create new components. When a designer needs a new FM Kit or DS2026 component (e.g., "Page Header with Buttons"), they must build it manually in Figma.

## Goal

Add a component creation mode to the DS Assembler plugin. Claude describes a component spec (with variants, auto-layout, nested instances), the plugin creates it as a real Figma component or component set.

## Users

- **Designers:** Create new components from a spec without manual Figma work
- **Claude (via /component-brief):** After drafting a component brief, auto-create the component in Figma

## Architecture

Same bidirectional localhost loop:

```
Claude generates component-spec.json
  → serves on localhost:8765
  → Plugin fetches and creates the component
  → Result: real Figma ComponentNode or ComponentSetNode
```

## Component Spec Schema

```json
{
  "type": "component",
  "name": "FM Page Header",
  "description": "Page title area with optional subtitle and action buttons.",
  "variants": {
    "Type": ["Title only", "Title + Subtitle", "Title + Actions"]
  },
  "defaultVariant": { "Type": "Title only" },
  "definitions": [
    {
      "variant": { "Type": "Title only" },
      "layout": "horizontal",
      "width": "fill",
      "padding": { "top": 0, "right": 0, "bottom": 16, "left": 0 },
      "counterAlign": "center",
      "children": [
        {
          "type": "text",
          "name": "Title",
          "content": "Page Title",
          "style": "heading-display",
          "isProperty": true
        }
      ]
    },
    {
      "variant": { "Type": "Title + Subtitle" },
      "layout": "horizontal",
      "width": "fill",
      "padding": { "top": 0, "right": 0, "bottom": 16, "left": 0 },
      "counterAlign": "center",
      "children": [
        {
          "type": "frame",
          "layout": "vertical",
          "spacing": 4,
          "width": "fill",
          "children": [
            { "type": "text", "name": "Title", "content": "Page Title", "style": "heading-display", "isProperty": true },
            { "type": "text", "name": "Subtitle", "content": "Description text", "style": "body-standard", "isProperty": true }
          ]
        }
      ]
    },
    {
      "variant": { "Type": "Title + Actions" },
      "layout": "horizontal",
      "width": "fill",
      "padding": { "top": 0, "right": 0, "bottom": 16, "left": 0 },
      "align": "space-between",
      "counterAlign": "center",
      "children": [
        {
          "type": "frame",
          "layout": "vertical",
          "spacing": 4,
          "width": "fill",
          "children": [
            { "type": "text", "name": "Title", "content": "Page Title", "style": "heading-display", "isProperty": true },
            { "type": "text", "name": "Subtitle", "content": "Description text", "style": "body-standard", "isProperty": true }
          ]
        },
        {
          "type": "frame",
          "name": "Actions",
          "layout": "horizontal",
          "spacing": 8,
          "children": [
            { "component": "FM Button", "props": { "Type": "Secondary", "Size": "sm" } },
            { "component": "FM Button", "props": { "Type": "Primary", "Size": "sm" } }
          ]
        }
      ]
    }
  ]
}
```

### New node types (beyond existing spec)

| Type | Figma API | Description |
|------|-----------|-------------|
| `"type": "component"` | `figma.createComponent()` | Creates a single component |
| `"type": "component-set"` | Wraps multiple components into `figma.combineAsVariants()` | Creates a component set with variants |
| `"type": "text"` | `figma.createText()` | Creates a text node with style |
| `"isProperty": true` | `addComponentProperty()` | Exposes text as an editable component property |

### Text style resolution

The `"style"` field on text nodes maps to DS2026 text styles:

```json
{
  "heading-display": { "fontFamily": "Roboto", "fontSize": 24, "fontWeight": 600, "lineHeight": 28, "letterSpacing": 0 },
  "heading-prominent": { "fontFamily": "Roboto", "fontSize": 18, "fontWeight": 600, "lineHeight": 26, "letterSpacing": 0 },
  "body-standard": { "fontFamily": "Roboto", "fontSize": 14, "fontWeight": 400, "lineHeight": 20, "letterSpacing": 0.2 }
}
```

Or for FM Kit:
```json
{
  "heading-display": { "fontFamily": "Inter", "fontSize": 24, "fontWeight": 600, "lineHeight": 34, "letterSpacing": 0 },
  "body-standard": { "fontFamily": "Inter", "fontSize": 14, "fontWeight": 400, "lineHeight": 22, "letterSpacing": -0.28 }
}
```

## Plugin API calls needed

### Creating a single component
```ts
const comp = figma.createComponent();
comp.name = "FM Page Header";
comp.layoutMode = "HORIZONTAL";
// ... add children (text nodes, nested instances, frames)
```

### Creating a component set (with variants)
```ts
// Create each variant as a separate component
const variants: ComponentNode[] = [];
for (const def of spec.definitions) {
  const comp = figma.createComponent();
  comp.name = `Type=${def.variant.Type}`;
  // ... build internal layout
  variants.push(comp);
}
// Combine into a component set
const componentSet = figma.combineAsVariants(variants, figma.currentPage);
componentSet.name = spec.name;
componentSet.description = spec.description;
```

### Creating text nodes
```ts
const text = figma.createText();
await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
text.characters = "Page Title";
text.fontSize = 24;
text.fontName = { family: "Roboto", style: "SemiBold" };
```

### Exposing text properties
```ts
comp.addComponentProperty("Title", "TEXT", "Page Title");
// Then link the text node to this property
text.componentPropertyReferences = { characters: "Title#uniqueId" };
```

## Plugin UI

New tab or option in the Assemble tab:

- "Create Component" button (or separate tab)
- Fetches `component-spec.json` from the server
- Shows preview: component name, variant count, property count
- Click to create
- Created component appears on the current page, ready to publish

## Skill integration

### /component-brief (enhanced)

After generating a 9-card brief, Claude can optionally create the component in Figma:

1. Claude generates the brief as usual
2. If user says "create it in Figma": Claude generates `component-spec.json`
3. User runs the plugin to create the component
4. User publishes to the library

## Constraints

- `figma.loadFontAsync()` required before setting text — fonts must be available
- `combineAsVariants()` requires all variant components to have consistent naming (`Prop=Value`)
- Component properties (`addComponentProperty`) have limitations on types (TEXT, BOOLEAN, INSTANCE_SWAP, VARIANT)
- Nested component instances inside created components work via `importComponentByKeyAsync` (already implemented)
- Plugin cannot publish to library — user must do this manually

## Out of scope (v1)

- Boolean properties (show/hide layers)
- Instance swap properties
- Auto-publishing to library
- Variant interaction (prototype connections)
- Component documentation/annotations

## Implementation estimate

- **Component creator engine** (`plugin/src/creator.ts`): 2-3 tasks
- **Text node creation + font loading**: 1 task
- **Component set / combineAsVariants**: 1 task
- **Component property exposure**: 1 task
- **Plugin UI (Create tab)**: 1 task
- **Skill integration (/component-brief)**: 1 task
- **E2E testing**: 1 task

Total: ~8 tasks
