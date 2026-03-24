---
name: component-brief
description: Draft a structured component brief (9-card Actian DS or 5-card Fat Marker) and generate an HTML spec page. Use when user asks to document, brief, or spec a component.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief and generate an HTML spec page. Supports two modes matching the two design system layers.

> **Content guidelines:** All UI copy in briefs must follow `references/content-guidelines.md` (in the skills directory). Read it before writing Cards 6 (Usage guidelines) and 7 (Content guidelines).
> **Accessibility guidelines:** Card 8 (Accessibility) must follow `references/accessibility-guidelines.md` (in the skills directory) — use the component-specific checklist matching the component type (P0/P1/P2), include WCAG criteria references, contrast ratio table, and keyboard interaction spec. All WCAG 2.1 AA.
> **Quality & hygiene:** Before marking any output complete, validate against the Quality & Hygiene Checklist in CLAUDE.md — all 10 items must pass for Figma-bound deliverables.

> **Mode: Spec.** Be thorough — document every variant, state, and edge case. Structure everything with consistent headings, tables, and numbered lists. Define before building; every decision needs a rationale. Cross-reference tokens, components, and guidelines by name. Include what's out of scope explicitly.

## Modes

Determine the mode from context:

| Signal | Mode |
|--------|------|
| User says "FM", "Fat Marker", "wireframe", "lo-fi" | **Fat Marker** |
| User says "DS2026", "design system", "hi-fi", "production" | **Actian DS** |
| Component exists in FM catalog (`FATMARKER-COMPONENT-CATALOG.md`) | **Fat Marker** |
| User provides a Figma URL from the DS2026 library (`8Yu8wUtPTXsa3iV6R4TmnS` or `l8biHxfarNi1I2RMvVxVOK`) | **Actian DS** |
| Ambiguous | Ask the user: "Fat Marker (lo-fi wireframe) or Actian DS (hi-fi production)?" |

## Input

The user describes a component or provides a Figma URL. Examples:
- "Draft a brief for the link component" + Figma URL
- "Document FM Alert"
- "We need a notification banner component"

## Step 1 — Research

Before writing anything:

1. **Check the Fat Marker catalog** (`docs/fm-component-catalog.md`) — does this component already exist?
2. **Check the DS2026 library** (`l8biHxfarNi1I2RMvVxVOK` or `8Yu8wUtPTXsa3iV6R4TmnS`) — fetch design context + screenshot if a node exists
3. Check existing feature files — is there a real usage example?
4. **Check CLAUDE.md** — what tokens, conventions, and **Forms Layout Rules** apply to this component type?
5. **Check `references/design-system.md` (in the skills directory)** — get exact token values per theme (Actian DS mode only)

## Step 2 — Draft the brief

Present a structured markdown brief to the user covering all sections relevant to the mode.

## Step 3 — Review with user

Present the brief and ask:
- "Does this match your expectations?"
- "Any variants or states I should add?"
- "Which cards should I generate?"

Then present the card selector:

### Card selector

The user can choose which cards to generate. Default is **All**.

**Actian DS cards:**

| # | Card | `data-name` | Template file |
|---|------|-------------|---------------|
| 1 | Page header | `"Page header"` | `templates/ds-card-1-page-header.html` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `templates/ds-card-2-actual-component.html` |
| 3 | Anatomy | `"Anatomy"` | `templates/ds-card-3-anatomy.html` |
| 4 | Design tokens | `"Design tokens"` | `templates/ds-card-4-design-tokens.html` |
| 5 | Component API | `"Component API"` | `templates/ds-card-5-component-api.html` |
| 6 | Usage guidelines | `"Usage guidelines"` | `templates/ds-card-6-usage-guidelines.html` |
| 7 | Content guidelines | `"Content guidelines"` | `templates/ds-card-7-content-guidelines.html` |
| 8 | Accessibility | `"Accessibility"` | `templates/ds-card-8-accessibility.html` |
| 9 | Code specification | `"Code specification"` | `templates/ds-card-9-code-specification.html` |

**Fat Marker cards:**

| # | Card | `data-name` | Template file |
|---|------|-------------|---------------|
| 1 | Page header | `"Page header"` | `templates/fm-card-1-page-header.html` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `templates/fm-card-2-actual-component.html` |
| 3 | Design guidelines | `"Design guidelines"` | `templates/fm-card-3-design-guidelines.html` |
| 4 | Content guidelines | `"Content guidelines"` | `templates/fm-card-4-content-guidelines.html` |
| 5 | Anatomy | `"Anatomy"` | `templates/fm-card-5-anatomy.html` |

**How the user selects:**

| Input | Result |
|-------|--------|
| "generate" or "all" or no selection | All cards (default) |
| "generate card 4" or "Design tokens" | Only that one card |
| "generate 2, 4, 9" or "Component, Tokens, Code" | Only those cards |
| "generate 1–5" or "first 5" | Range of cards |
| "skip 6 and 7" or "all except Content and Usage" | All minus excluded |

When generating a subset, only include the selected cards in the HTML `brief-row`. The CSS framework and capture script are always included regardless of selection.

## Step 4 — Generate HTML spec page (TEMPLATE-DRIVEN)

**CRITICAL: You MUST read the template files and use them as the structural foundation for every card.** Do not generate card HTML from memory or from the descriptions above — the templates are the single source of truth for layout, CSS classes, and structure.

### Assembly process

1. **Read the wrapper template:**
   - Actian DS: `templates/ds-wrapper.html`
   - Fat Marker: `templates/fm-wrapper.html`

2. **For each selected card, read its template file** from the table above.

3. **Replace all `{{PLACEHOLDER}}` markers** in each template with component-specific content. Each template contains HTML comments explaining what to put in each placeholder.

4. **Assemble the final HTML:**
   - Copy the wrapper template
   - Insert the filled card HTML fragments where `<!-- {{CARDS}} -->` appears
   - For Card 2 (Actual component), also inject `{{COMPONENT_SPECIFIC_CSS}}` into a `<style>` block inside the card — these are the CSS classes needed to render the actual component (e.g., `.btn`, `.link`, `.input`)

5. **Save to:** `components/[component-name]/[component-name]-spec.html`

### Rules

- **DO NOT** invent new card structures — use the template exactly as provided
- **DO NOT** change CSS class names, spacing values, font sizes, or colors from the template
- **DO** add component-specific CSS classes inside Card 2 for rendering the actual component
- **DO** add `data-name` attributes to every section div
- Each card auto-sizes to fit content — NEVER use fixed heights that clip or overflow
- For existing components, check `components/*/` for previously generated specs as additional reference

---

## Token Naming Convention

All design tokens displayed in briefs MUST use the `--zen-` prefix following this pattern:

```
--zen-<type>-<name>

Types:
  color     → --zen-color-base-brand, --zen-color-text-primary, --zen-color-interactive-hovered-secondary
  spacing   → --zen-spacing-xs, --zen-spacing-md
  radius    → --zen-radius-default, --zen-radius-full
  shadow    → --zen-shadow-xs, --zen-shadow-md
  size      → --zen-size-md, --zen-size-xl
  width     → --zen-width-default, --zen-width-focus
  font      → --zen-font-body-standard, --zen-font-label-standard
```

Map from raw Figma tokens to `--zen-` prefixed names:
- `theme-primary` → `--zen-color-theme-primary`
- `interactive-hovered-secondary` → `--zen-color-interactive-hovered-secondary`
- `interactive-focused-stroke-default` → `--zen-color-interactive-focused-stroke-default`
- `spacing-xs` → `--zen-spacing-xs`
- `radius-default` → `--zen-radius-default`
- `width-focus` → `--zen-width-focus`
- `shadow-xs` → `--zen-shadow-xs`
- `size-xl` → `--zen-size-xl`
- `body-standard` → `--zen-font-body-standard`
- `label-standard` → `--zen-font-label-standard`

Use these prefixed names everywhere: spec tables, anatomy callouts, code specification, CSS custom properties.

---

## Step 5 — Capture to Figma

If the user wants to push the spec to Figma, use the `generate_figma_design` **MCP tool** (not a browser extension, not a Figma plugin — the MCP tool).

### Capture flow

1. **Serve the HTML file locally:**
   ```bash
   BASE_URL=$(.claude-plugin/scripts/ensure-server.sh . 8765)
   ```
   This gives you a URL like `http://localhost:8765/components/button/button-spec.html`

2. **Call the `generate_figma_design` MCP tool** with the localhost URL:
   - To create a new Figma file: set `outputMode: "newFile"` and `fileName`
   - To add to an existing file: set `outputMode: "existingFile"`, `fileKey`, and optionally `nodeId`
   - If unsure, call without `outputMode` first — the tool returns options to choose from

3. **Poll for completion:** Call `generate_figma_design` again with the returned `captureId` every 5 seconds (up to 10 times) until status is `completed`

4. **Share the Figma link** with the user

### Important

- **NEVER** suggest installing browser extensions or Figma plugins for capture
- **NEVER** tell the user to open the HTML manually in a browser for capture
- **ALWAYS** use the `generate_figma_design` MCP tool — it handles capture end-to-end
- Each `captureId` is single-use — one capture per page

## Step 6 — Create in Figma (optional)

If the user says "create it in Figma", "build the component", or "make it real":

1. Generate a `component-spec.json` from the brief:
   - Component name from Card 1 (Page header)
   - Variants from Card 2 (Actual component) and Card 5 (Component API)
   - Internal layout from Card 3 (Anatomy)
   - Text properties from Card 5 text props (mark as `"isProperty": true`)
   - Library: `"fat-marker"` (if FM mode) or `"ds2026"` (if Actian DS mode)
   - Use nested component instances where appropriate (e.g., buttons, icons)

2. Save to `Actian-DS-Assembler/component-spec.json`

3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**

4. After creation, remind the user to:
   - Review the component in Figma
   - Publish to library if it's a shared component
   - Run `sync-all.js` to update the registry
