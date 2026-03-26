---
name: create-component
description: Use this skill whenever the user wants to add a new component to the Figma design system library or extend an existing one with new variants. Generates a component spec JSON and creates it in Figma via the DS Assembler plugin or the Figma Plugin API. Triggers when the user asks to create, build, or make a new component, add a variant or state to an existing component, extend a component, or describes a UI element that should become reusable in the library.
argument-hint: "[component description or Figma URL]"
---

# Create Component

Create a new Figma component (with variants) from a text description or by extending an existing component.

> **Quality & hygiene:** Validate all output against CLAUDE.md Quality & Hygiene Checklist before marking complete.
> **Generation log:** Follow the Generation Log format in CLAUDE.md — include a visible generation card before the component output.

> **Mode: Implement.** Build first, explain after. Output working artifacts, not commentary. Move fast — infer details from the user's request and make reasonable decisions. Only ask when critical information is genuinely missing (e.g., the user said "create a component" with no name or description). The cleanup pass (Step 6) handles polish. Keep status updates to milestones only.

### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | Component only, no generation log, minimal cleanup |
| No qualifier (default) | Standard | Component + generation log + standard cleanup pass |
| "production", "final" | Production | Standard + variable binding on all scaffolding + research step |

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
- **Properties** — which text fields should be editable component properties? Which booleans toggle visibility?

Infer as much as possible from the request and context. If a Figma URL is provided, fetch it with `get_design_context` + `get_screenshot` to fill in details. Only ask the user if the request is too vague to proceed (no component name, no sense of what it does).

## Step 2 — Check existing components

Before creating, check these files (shipped with the plugin):
1. `../../docs/ds2026-components.md` — does it already exist in DS2026?
2. `../../docs/fm-components.md` — does it already exist in FM Kit?

If it exists, tell the user and suggest modifying it instead of creating a duplicate.

### Load component guidelines

If the component exists (or a similar one does), check for per-component guidelines:
- Read `../../docs/component-guidelines/<slug>.json` (e.g., `button.json`, `text-input.json`)
- This file contains content guidelines, design guidelines, variant inventory, and example screenshots extracted from Figma
- Use the `content_guidelines` and `design_guidelines` fields to inform your spec — they capture Figma-native guidance that the generic docs don't cover
- If the file doesn't exist, proceed without it

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

## Step 4 — Choose creation mode

Two approaches are available. Both can import real library components with correct tokens.

| | Assembler | Plugin API (`use_figma`) |
|---|---|---|
| **Library components** | Yes — imported with Figma variables | Yes — imported via `getComponentByKeyAsync()` with Figma variables |
| **Token binding on library instances** | Automatic (Figma variables) | Automatic (Figma variables) |
| **Token binding on scaffolding** | Resolved to Figma variables | Hex from Token Reference (with token name comments) |
| **Text overrides** | Reliable (`textOverrides` key) | Needs layer name matching (may need debugging) |
| **Workflow** | Declarative JSON spec | Imperative JavaScript |
| **Speed** | Medium (user opens plugin) | Fast (direct in Figma) |
| **Requires** | DS Assembler plugin + local server | `use_figma` MCP tool |

**Default:** Plugin API (Option B) for speed. Assembler (Option A) when you need Figma variable bindings on scaffolding or a reviewable JSON spec.

### Option A: DS Assembler (declarative, production)

Generates a JSON spec, the user runs it through the Assembler Figma plugin which resolves all tokens to Figma variables — including scaffolding frames.

**Use when:**
- You need Figma variable bindings everywhere (not just library components)
- You want a declarative JSON workflow (easier to review and iterate)
- The user has the DS Assembler plugin installed

**Tradeoffs:** Requires the Assembler plugin + local server. User must manually trigger assembly.

### Option B: Figma Plugin API (`use_figma`)

Builds the component directly in Figma via JavaScript. Can import published library components via `figma.teamLibrary.getComponentByKeyAsync()` — imported instances arrive with all their styles and Figma variables intact.

**Use when:**
- The user wants fast, direct creation
- The user doesn't have the Assembler installed
- Any complexity level — library imports work

**What has correct tokens automatically:** All imported library component instances (FM Button, FM Table Cell, FM Tabs, etc.) bring their own bound Figma variables. No hex needed for these.

**What needs library binding:** Custom scaffolding — wrapper frames, backgrounds, text nodes, shadows. Follow `../../references/figma-output.md` § "Token binding": discover keys via `search_design_system`, bind color variables + text styles + effect styles (DS2026) or color styles + text styles (FM). Hex only as fallback.

**Tradeoffs:** Text overrides on library instances can require layer name debugging. No declarative spec.

---

## Step 5A — Assembler path

Generate a `component-spec.json` following the schema below, then:

1. Save the spec to `assembler-specs/component-spec.json`
2. Ensure the project directory is served via `scripts/ensure-server.sh . 8765`
3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**
4. After creation, remind the user to publish to library if it's a shared component

### Spec schema

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
- `isProperty: true`: exposes text as an editable component property — **set this on every user-facing text field** (titles, labels, descriptions, button text). Without it, users can't customize text content when using the component.

**Boolean property (show/hide child):**
```json
{ "type": "frame", "name": "Badge", "visible": true, "isProperty": true, "children": [ ... ] }
```
- `isProperty: true` on a frame with `visible` exposes a boolean toggle in the component properties panel.

**Nested component instance:**
```json
{ "component": "FM Button", "props": { "Type": "Primary", "Size": "sm" } }
```
Use exact component names from `../../docs/fm-components.md` (FM Kit) or `../../docs/ds2026-components.md` (DS2026).

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
| `fill` | token name (see Token Reference below) | Background fill |
| `cornerRadius` | number | Border radius |

---

## Step 5B — Plugin API path (`use_figma`)

Follow the shared `use_figma` pattern in `../../references/figma-output.md`.

Build the component directly in Figma using JavaScript via `use_figma`. Follow the token binding rules in `../../references/figma-output.md`:
- **DS2026**: bind color variables (`importVariableByKeyAsync`), text styles (`textStyleId`), and effect styles (`effectStyleId`). Discover style keys via `search_design_system`.
- **FM**: bind published color styles (`fillStyleId`) and text styles (`textStyleId`). Discover keys via `search_design_system` with query `"Fatmarker"`.

### Required structure

The `use_figma` code must:

1. **Create a component set** (for variants) or a single component
2. **Use auto-layout** on every frame — no absolute positioning
3. **Set component properties** — text properties (`componentPropertyDefinitions`) and boolean properties for show/hide toggles
4. **Bind tokens** — follow `../../references/figma-output.md` "Token binding" section. Use `search_design_system` to discover style keys before writing code.
5. **Include generation metadata** — import `Meta / Chrome / Generation Log` component (key: `a9653f30925367e96dea90093d750bfe70849571`) as the first sibling before the component set. Set all 6 text properties using `setProp()` from `../../docs/meta-kit/components.md`.
6. **Set descriptive names** on every layer — no "Frame 1" or "Rectangle 2"

### Properties checklist

Every component must expose:
- **Text properties** for all user-facing text (titles, labels, descriptions, button text)
- **Boolean properties** for optional elements (badge, description, footer, icon)
- **Variant properties** for different states or types

Without properties, users can't customize the component when using instances.

---

## Token Reference

All token binding patterns — color variables, text styles, effect styles, discovery via `search_design_system`, and fallback rules — are in `../../references/figma-output.md` § "Token binding."

Additional references:
- DS2026 variable keys: `../../docs/meta-kit/variables.md`
- DS2026 full token list: `../../docs/token-reference.md`
- FM hex fallback: `../../references/fm-css-reference.md`

### Spacing scale

Use only these values: 4, 8, 12, 16, 24, 28, 32px.

---

## Step 6 — Cleanup pass

Run through the checklist in `../../references/quality-checklist.md` — check the **Universal** section plus the **Create Component** section for this skill. Fix issues inline before presenting to the user.

If a fix is ambiguous, note it for the user review step instead of fixing silently.

## Step 7 — Update references

After the component is created and published, remind the user to:
1. Run `npm run sync` in the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) repo to update the registry from Figma
2. The registry is hosted on GitHub and auto-fetched by the Assembler plugin — no local files to update
