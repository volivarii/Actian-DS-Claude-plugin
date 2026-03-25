---
name: create-component
description: Use this skill whenever the user wants to add a new component to the Figma design system library or extend an existing one with new variants. Generates a component spec JSON and creates it in Figma via the DS Assembler plugin with proper auto-layout, variants, and token usage. Triggers when the user asks to create, build, or make a new component, add a variant or state to an existing component, extend a component, or describes a UI element that should become reusable in the library.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component.

> Uses the DS Assembler plugin's Create mode. Requires the plugin to be installed and its Local server URL pointing to the current project directory (served via `scripts/ensure-server.sh . 8765`).
> **Quality & hygiene:** Validate all output against CLAUDE.md Quality & Hygiene Checklist before marking complete.
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

> **Mode: Implement.** Build first, explain after. Output working artifacts, not commentary. Move fast — infer details from the user's request and make reasonable decisions. Only ask when critical information is genuinely missing (e.g., the user said "create a component" with no name or description). The cleanup pass (Step 6) handles polish. Keep status updates to milestones only.

## Input

The user describes a component they want to create. Examples:
- "Create a Page Header component with title, subtitle, and action buttons variants"
- "Add a Card component with Default, Hover, and Selected states"
- "Extend this component with a new variant" + Figma URL
- "Create an FM Alert component with success, error, warning, and info variants"

## Step 1 — Understand the component

Determine from the user's request:
- **Component name** (with FM prefix for Fat Marker, no prefix for DS2026)
- **Library** — Fat Marker (`"fat-marker"`, Inter font) or DS2026 (`"ds2026"`, Roboto font)?
- **Variants** — what axes and values? (e.g., Type: Default / With Actions / Compact)
- **Content** — what text, icons, or nested components does each variant contain?
- **Layout** — horizontal or vertical? Spacing? Padding?
- **Properties** — which text fields should be editable component properties?

Infer as much as possible from the request and context. If a Figma URL is provided, fetch it with `get_design_context` + `get_screenshot` to fill in details. Only ask the user if the request is too vague to proceed (no component name, no sense of what it does).

## Step 2 — Check existing components

Before creating, check:
1. `docs/ds2026-component-reference.md` — does it already exist in DS2026?
2. `docs/fm-component-catalog.md` — does it already exist in FM Kit?
3. Registry: `registry/component-registry.json` — is there a key for it?

If it exists, tell the user and suggest modifying it instead of creating a duplicate.

## Step 3 — Research patterns (optional)

Skip this step if the user already specified variants, layout, and content in detail — they know what they want. Run it when the component is new and the user's description is high-level (e.g., "create a stepper component" without specifying variants or layout).

### What to research

1. **Established design systems** — How do Material, Atlassian, Ant Design, Carbon, or Spectrum handle this component type? Look at:
   - Variant axes (what properties are configurable?)
   - Internal anatomy (what sub-elements make up the component?)
   - Common states (enabled, disabled, error, loading, selected?)
   - Accessibility patterns (keyboard interaction, ARIA roles)

2. **Existing Actian patterns** — Check if similar components in the FM or DS2026 library follow conventions that this component should match (e.g., same variant axis names, same spacing, same state set).

### How to research

- Use `WebSearch` to find component documentation from major design systems
- Focus on the component API and variant structure, not visual styling (we use our own tokens)
- Keep it brief — 2-3 sources is enough to establish the pattern

### Output

Summarize findings internally and use them to inform the spec. Do not present a separate research report — fold the insights directly into the component design. If research reveals variant axes or states the user didn't mention, include them in the spec (the user can remove what they don't need).

## Step 4 — Generate the component spec

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

## Step 5 — Save and create

1. Save the spec to `assembler-specs/component-spec.json`
2. Ensure the project directory is served via `scripts/ensure-server.sh . 8765`
3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**
4. After creation, remind the user to publish to library if it's a shared component

## Step 6 — Cleanup pass

After generation and before presenting to the user, run a focused cleanup sweep on the spec. Fix issues inline.

### Checklist

**Spec structure:**
- [ ] Component name follows convention: `FM` prefix for Fat Marker, no prefix for DS2026
- [ ] All variant axis names and values are consistent with existing catalog patterns
- [ ] `isProperty: true` set on all text fields that should be editable
- [ ] Layout uses `"hug"` / `"fill"` sizing — no unnecessary fixed pixel values

**Token compliance:**
- [ ] Fill colors use `--fm-*` variables (FM) or `--zen-*` tokens (DS2026) — no hardcoded hex
- [ ] Text styles reference valid style names (heading-display, body-standard, label-standard, etc.)
- [ ] Spacing values match the scale (4, 8, 12, 16, 24, 32px)
- [ ] Border radius uses standard values (6px FM default, or token references for DS2026)

**Completeness:**
- [ ] All declared variants have a definition in the `definitions` array
- [ ] Each variant has all required children (no empty definitions)
- [ ] Nested component references use exact registry names

**Content guidelines:**
- [ ] Default text content follows content guidelines (action verbs for buttons, concise labels)
- [ ] Placeholder text is realistic, not "Lorem ipsum"

**Accessibility:**
- [ ] Interactive children have adequate touch target size (min 44px)
- [ ] Text contrast: check that text style + fill color combinations meet WCAG AA

### How to apply fixes

- Fix directly in the spec JSON — do not create a separate report
- If a fix is ambiguous, note it for the user review step

## Step 7 — Update references

After the component is created and published:
1. Run `FIGMA_TOKEN=figd_xxx node registry/sync-all.js` to update the registry and reference docs
2. If it's a FM Kit component, update `registry/fm-descriptions.json` with a description
