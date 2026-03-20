# Figma Component Assembler — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Author:** Vincent + Claude

## Problem

The current `/generate-flow` skill generates HTML that gets captured as flat vector frames in Figma via `generate_figma_design`. These frames look correct but are not linked to the Figma component libraries — no variant swapping, no library updates, no design system bindings.

## Goal

Add an opt-in mode that assembles real Figma component instances from the published FM Kit and DS2026 libraries. The existing HTML workflow remains the default fallback.

## Users

- **Designers (self-serve):** Open the Figma plugin, point to a URL hosting a layout spec, click Assemble.
- **Claude (automated):** `/generate-flow` outputs a layout spec JSON, serves it locally. Designer triggers the plugin.

## Architecture

```
Claude generates layout spec (JSON)
  → serves on localhost:8765/spec.json
  → Figma plugin fetches from URL
  → Plugin walks spec tree
  → Creates auto-layout frames + real component instances
  → Result: editable, library-linked Figma frames

Fallback (default):
  Claude generates HTML
  → serves on localhost:8765
  → generate_figma_design captures to Figma
  → Result: flat vector frames (current behavior)
```

## Deliverables

### 1. Component Registry

**File:** `registry/component-registry.json`

Maps component names to Figma component keys, variant definitions, and text properties for both libraries.

```json
{
  "meta": {
    "generatedAt": "2026-03-20T15:00:00Z",
    "libraries": {
      "fat-marker": { "fileKey": "X2JSEUyLvxyNCx22ucOexn", "name": "Fat Marker Kit" },
      "ds2026": { "fileKey": "l8biHxfarNi1I2RMvVxVOK", "name": "Actian Design System 2026" }
    }
  },
  "components": {
    "FM Button": {
      "key": "<component-key>",
      "library": "fat-marker",
      "variants": {
        "Size#502:1": ["sm", "md"],
        "Type#502:2": ["Primary", "Secondary", "Outline"],
        "State#502:3": ["Default", "Disabled"]
      },
      "variantShortNames": { "Size": "Size#502:1", "Type": "Type#502:2", "State": "State#502:3" },
      "textProperties": ["Label#502:4"]
    },
    "Button": {
      "key": "<component-key>",
      "library": "ds2026",
      "variants": {
        "Size#18029:1": ["Large", "Medium"],
        "Style#18029:2": ["Filled", "Ghost", "Outline"],
        "State#18029:3": ["Enabled", "Hovered", "Pressed", "Disabled"]
      },
      "variantShortNames": { "Size": "Size#18029:1", "Style": "Style#18029:2", "State": "State#18029:3" },
      "textProperties": ["Label#18029:4"]
    }
  }
}
```

The registry is bundled inside the Figma plugin. Rebuilt manually when library components change.

### 2. Registry Builder Script

**File:** `registry/build-registry.js`

Node.js script that queries the Figma REST API to generate the registry.

**Input:** Figma file keys (FM Kit + DS2026) + personal access token via `FIGMA_TOKEN` env var.

**API calls:**
- `GET /v1/files/{fileKey}/components` — component names and keys
- `GET /v1/files/{fileKey}/component_sets` — variant metadata

**Usage:**
```bash
FIGMA_TOKEN=figd_xxx node registry/build-registry.js
```

**Output:** `registry/component-registry.json`

Run manually when library components are added, renamed, or restructured. Not automated.

### 3. Layout Spec Schema

JSON format describing a screen as a tree of auto-layout frames with component references. Two node types:

**Parsing rule:** A node is an Instance if it has a `component` field; otherwise it must have `"type": "frame"`.

**Frame node** (layout container):
```json
{
  "type": "frame",
  "name": "Content Area",
  "layout": "vertical",
  "spacing": 16,
  "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
  "fill": "--zen-color-background-bg-default",
  "width": 1440,
  "height": "hug",
  "align": "min",
  "counterAlign": "min",
  "cornerRadius": 0,
  "children": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"frame"` | Required. Identifies as a frame node |
| `name` | string | Optional. Frame name in Figma layers panel |
| `layout` | `"vertical"` \| `"horizontal"` | Required. Auto-layout direction |
| `spacing` | number | Optional. Gap between children (px). Default: 0 |
| `padding` | `{ top, right, bottom, left }` | Optional. Inner padding (px). Default: all 0 |
| `fill` | string | Optional. `--zen-*` token name or hex (e.g. `#FFFFFF`). Plugin resolves tokens via bundled token map (Actian theme) |
| `width` | number \| `"hug"` \| `"fill"` | Optional. Fixed px, hug-contents, or fill-parent. Default: `"hug"` |
| `height` | number \| `"hug"` \| `"fill"` | Optional. Fixed px, hug-contents, or fill-parent. Default: `"hug"` |
| `align` | `"min"` \| `"center"` \| `"max"` \| `"space-between"` | Optional. Primary axis alignment. Default: `"min"` |
| `counterAlign` | `"min"` \| `"center"` \| `"max"` | Optional. Counter axis alignment. Default: `"min"` |
| `cornerRadius` | number | Optional. Border radius (px). Default: 0 |
| `children` | array | Required. Nested frame or instance nodes |

Maps to Figma API: `align` → `primaryAxisAlignItems`, `counterAlign` → `counterAxisAlignItems`, `width`/`height` string values → `layoutSizingHorizontal`/`layoutSizingVertical`.

**Instance node** (component reference):
```json
{
  "component": "FM Button",
  "props": {
    "Type": "Primary",
    "Size": "md"
  },
  "text": {
    "Label": "Save changes"
  },
  "width": "fill",
  "height": "hug"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `component` | string | Required. Exact name from the registry |
| `props` | object | Optional. Variant property overrides |
| `text` | object | Optional. Text property overrides |
| `width` | number \| `"hug"` \| `"fill"` | Optional. Override instance sizing. Default: intrinsic |
| `height` | number \| `"hug"` \| `"fill"` | Optional. Override instance sizing. Default: intrinsic |

**Validation rules:**
- `component` must exist in registry — if not found, skip and log warning
- `props` keys must match variant names in registry — unknown props ignored
- Nesting depth unlimited

**Full screen example:**
```json
{
  "version": "1.0",
  "name": "Settings Page",
  "type": "frame",
  "layout": "vertical",
  "width": 1440,
  "height": 900,
  "children": [
    { "component": "FM App_header", "text": { "Title": "Settings" }, "width": "fill" },
    {
      "type": "frame",
      "layout": "horizontal",
      "width": "fill",
      "height": "fill",
      "children": [
        { "component": "FM Side navigation bar", "height": "fill" },
        {
          "type": "frame",
          "name": "Main Content",
          "layout": "vertical",
          "spacing": 16,
          "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
          "fill": "--zen-color-background-bg-grey-1",
          "width": "fill",
          "height": "fill",
          "children": [
            { "component": "FM Page Header", "text": { "Title": "Profile" }, "width": "fill" },
            { "component": "FM Input Label", "props": { "State": "Default" }, "text": { "Label": "Full name" }, "width": "fill" },
            { "component": "FM Input Label", "props": { "State": "Default" }, "text": { "Label": "Email" }, "width": "fill" },
            {
              "type": "frame",
              "layout": "horizontal",
              "spacing": 8,
              "children": [
                { "component": "FM Button", "props": { "Type": "Primary" }, "text": { "Label": "Save" } },
                { "component": "FM Button", "props": { "Type": "Secondary" }, "text": { "Label": "Cancel" } }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 4. Figma Plugin

**Name:** Actian DS Assembler

**File structure:**
```
figma-plugin/
├── manifest.json
├── code.ts
├── ui.html
├── registry/
│   └── component-registry.json
├── tsconfig.json
└── package.json
```

**manifest.json:**
```json
{
  "name": "Actian DS Assembler",
  "id": "actian-ds-assembler",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "networkAccess": {
    "allowedDomains": ["localhost", "127.0.0.1"]
  },
  "editorType": ["figma"]
}
```

**UI thread** (`ui.html`):
- URL input field (pre-filled with `http://localhost:8765/spec.json`)
- "Assemble" button
- Status log showing progress

**Sandbox thread** (`code.ts`):
1. Receive URL from UI
2. UI fetches JSON spec → sends to sandbox via `postMessage`
3. Load bundled component registry
4. Walk spec tree recursively:
   - `"type": "frame"` → `figma.createFrame()`, set auto-layout, spacing, padding, fill, size
   - `"component": "..."` → look up key in registry → `figma.importComponentByKeyAsync(key)` → `createInstance()` → `setProperties()` for variants → set text overrides → apply `width`/`height` sizing if specified
5. Append root frame to current page
6. Zoom to fit
7. Report results to UI

**Error handling:**
- Component not in registry → skip, log warning, continue with remaining nodes
- Component key invalid (removed from library) → skip, log warning
- Network error fetching spec → show error in UI
- Invalid JSON → show parse error in UI

**Distribution:**
- Development: "Import plugin from manifest" in Figma
- Team: publish to Actian Figma org

### 5. generate-flow Skill Update

The `/generate-flow` skill gets an opt-in mode. No changes to default behavior.

**Default (unchanged):**
- Generates single HTML file with FM CSS classes
- Serves on localhost:8765
- Captured to Figma via `generate_figma_design`

**Opt-in "real components" mode:**
- Triggered when user says "use real components" or "assemble in Figma"
- Claude generates a layout spec JSON referencing components from the registry
- Serves `spec.json` on localhost:8765
- Tells user: "Open the Actian DS Assembler plugin in Figma and click Assemble"

**No changes to:** `/component-brief`, `/design-audit`, `/compare-flows`

## Token Resolution

The plugin bundles a static token-to-hex map generated from `tokens/tokens.css` (Actian theme as default). When a `fill` field references a `--zen-*` token, the plugin looks it up in this map. Raw hex values (e.g. `#FFFFFF`) are also accepted as a fallback for tokens not in the map.

The token map is a simple JSON object bundled alongside the component registry:
```json
{
  "--zen-color-background-bg-default": "#FFFFFF",
  "--zen-color-background-bg-grey-1": "#F5F5F5",
  ...
}
```

## Variant API Pattern

The registry stores **component-set keys** (not individual variant keys). The plugin imports the default variant via `importComponentByKeyAsync(key)`, then calls `instance.setProperties()` to apply the variant combination from `props`. Property names in `setProperties()` must include Figma's `#uniqueID` suffix — the registry builder script captures these full property names from the API.

Example registry entry with full property names:
```json
{
  "FM Button": {
    "key": "abc123...",
    "variants": {
      "Size#502:1": ["sm", "md"],
      "Type#502:2": ["Primary", "Secondary", "Outline"]
    }
  }
}
```

The layout spec uses **short names** (`"Size": "md"`). The plugin maps short names to suffixed names using the registry.

## Library Selection

- **FM Kit components** are prefixed with `FM ` (e.g. `FM Button`, `FM App_header`) — used for wireframe flows
- **DS2026 components** have no prefix (e.g. `Button`, `Text Input`) — used for high-fidelity screens
- Claude chooses based on context: `/generate-flow` defaults to FM Kit, hi-fi requests use DS2026
- Mixing libraries in a single spec is allowed but not recommended

## Constraints

- Components must be published to the Figma team library
- The Figma plugin requires a user to have Figma open and run the plugin (no headless execution)
- `importComponentByKeyAsync` only works on published components
- The Figma plugin UI iframe handles network requests; the sandbox thread cannot access the network directly
- Registry must be rebuilt manually when library components change

## Out of Scope

- Automated registry rebuilds
- Cloud relay / real-time sync
- Drag-and-drop UI inside the plugin
- DS2026 theme switching in the plugin (inherits from Figma file settings)
- Codegen plugins (Figma-to-code direction)
