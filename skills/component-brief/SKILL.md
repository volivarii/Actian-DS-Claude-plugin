---
name: component-brief
description: Draft a structured component brief (9-card Actian DS or 5-card Fat Marker) and generate an HTML spec page. Use when user asks to document, brief, or spec a component.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief and generate an HTML spec page. Supports two modes matching the two design system layers.

> **Content guidelines:** All UI copy in briefs must follow `references/content-guidelines.md` (in the skills directory). Read it before writing Cards 6 (Usage guidelines) and 7 (Content guidelines).
> **Accessibility guidelines:** Card 8 (Accessibility) must follow `references/accessibility-guidelines.md` (in the skills directory) — use the component-specific checklist matching the component type (P0/P1/P2), include WCAG criteria references, contrast ratio table, and keyboard interaction spec. All WCAG 2.1 AA.

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
3. **Check the Policies flow** (`2WF4POyRBXKEJ5zSLIu8pn`) or other feature files — is there a real usage example?
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

| # | Card | `data-name` |
|---|------|-------------|
| 1 | Page header | `"Page header"` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` |
| 3 | Anatomy | `"Anatomy"` |
| 4 | Design tokens | `"Design tokens"` |
| 5 | Component API | `"Component API"` |
| 6 | Usage guidelines | `"Usage guidelines"` |
| 7 | Content guidelines | `"Content guidelines"` |
| 8 | Accessibility | `"Accessibility"` |
| 9 | Code specification | `"Code specification"` |

**Fat Marker cards:**

| # | Card | `data-name` |
|---|------|-------------|
| 1 | Page header | `"Page header"` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` |
| 3 | Design guidelines | `"Design guidelines"` |
| 4 | Content guidelines | `"Content guidelines"` |
| 5 | Anatomy | `"Anatomy"` |

**How the user selects:**

| Input | Result |
|-------|--------|
| "generate" or "all" or no selection | All cards (default) |
| "generate card 4" or "Design tokens" | Only that one card |
| "generate 2, 4, 9" or "Component, Tokens, Code" | Only those cards |
| "generate 1–5" or "first 5" | Range of cards |
| "skip 6 and 7" or "all except Content and Usage" | All minus excluded |

When generating a subset, only include the selected cards in the HTML `brief-row`. The CSS framework and capture script are always included regardless of selection.

## Step 4 — Generate HTML spec page

When approved, generate an HTML spec page containing the selected cards. The output format depends on the mode.

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

## Shared HTML rules (both modes)

- Include the Figma capture script: `<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>`
- **Horizontal layout:** All brief sections are laid out as a horizontal row of cards
- **Height:** Each card auto-sizes to fit its content — NEVER use fixed heights that clip or overflow
- **Frame naming:** Each top-level card must have a descriptive `data-name` attribute (becomes the Figma frame name when captured)
- **Section naming:** Each section within a card must also have a `data-name` attribute
- Include `<!-- AI CONSUMPTION METADATA -->` comment in `<head>`
- Save to: `components/[component-name]/[component-name]-spec.html`

---

## Mode A — Fat Marker

Use when documenting FM components for the wireframe kit.

### Fonts & palette
- Font: **Inter** (Google Fonts)
- Palette: FM tokens from `generate-flow` skill CSS reference

### Cards (5 total)

1. **Page header** — Dark (#333) artboard with source label + title
2. **Actual component (Locked)** — All variants rendered
3. **Design guidelines** — Accessibility, behavior
4. **Content guidelines** — When to use, do/don't
5. **Anatomy** — Callout diagram + specs

---

## Mode B — Actian DS

Use when documenting DS2026 production components.

### Fonts & palette
- Font: **Roboto** (headings, component samples) + **Inter** (tables, captions, code)
- Palette: DS2026 tokens from `references/design-system.md` (in the skills directory)

### Cards (9 total, horizontal)

All 9 cards use the same chrome structure:

```css
/* Section header — grey top with rounded corners */
.card-section-header {
  background: #F5F5FA;
  padding: 80px;
  border-radius: 16px 16px 0 0;
  display: flex; flex-direction: column; gap: 16px;
}
.card-section-header__title {
  font-family: 'Roboto', sans-serif;
  font-weight: 500; font-size: 48px; line-height: 1.3;
  color: black;
}
.card-section-header__subtitle {
  font-family: 'Roboto', sans-serif;
  font-weight: 400; font-size: 24px; line-height: 1.3;
  color: black; max-width: 840px;
}
/* Content area — white bottom */
.card-content {
  background: white;
  padding: 80px;
  display: flex; flex-direction: column; gap: 48px;
  border-radius: 0 0 16px 16px;
}
```

#### Card 1 — Page header
`data-name="Page header"`

Special card (no section header chrome). White background, `border-radius: 24px`, `padding: 80px`.

| Element | Spec |
|---------|------|
| Title | Roboto Medium 72px, `line-height: 1.173`, color `black` |
| Logo | Actian pyramid SVG placeholder, 64×60px, top-right |
| Body | Roboto Regular 32px, `line-height: 1.36`, color `#12131F`, max-width 1062px |

Content: Component name as title. 1–2 paragraphs describing what the component does, its role in the system, and its variants at a high level.

#### Card 2 — Actual component (Locked)
`data-name="Actual component (Locked)"`

Section header: "Actual component (Locked)" / "The finalized, production-ready component that cannot be edited."

Content:
- **State grid** — All states rendered side by side (Enabled, Hovered, Focused, Pressed, Selected/Visited, Disabled) with labels below each
- **Variant matrix** — If the component has multiple types/sizes, show a grid: rows = types, columns = states
- **Theme comparison** — Show Actian / Studio / Explorer side by side with color swatches when colors vary per theme

#### Card 3 — Anatomy
`data-name="Anatomy"`

Section header: "Anatomy" / "Each labelled part is a token reference. Color & size adapt to variant and theme."

**IMPORTANT: Use the two-zone layout to prevent text overlapping.**

**Zone 1 — Annotated diagram** (top half):
- Render the component at 1.5–2× scale inside a dashed border box
- Place **letter badges only** (A, B, C, D...) as small colored circles (24px, `#0550DC` bg, white text, bold) positioned next to each structural part
- **NO descriptions or token names on the diagram** — only the letter badges
- Show additional state variants (e.g., Focused, Error) as smaller companion diagrams below the main one, each with relevant badges highlighted
- Keep the diagram clean and scannable — whitespace between parts

**Zone 2 — Parts table** (bottom half):
- A structured table listing each part with full specs:

```
| Part | Element | Token | Spec |
|------|---------|-------|------|
| A | Container | --zen-size-*, --zen-radius-*, --zen-spacing-* | 32px height, 6px radius, 12px padding |
| B | Leading icon | — | 20×20px (Default), 16×16px (Small) |
| C | Label | --zen-font-label-standard | Roboto Medium 14px/20px, 0.2px |
| D | Trailing icon | — | 20×20px |
| E | Focus ring | --zen-width-focus, --zen-color-interactive-focused-stroke-default | 2px solid #000, offset 2px |
| F | State overlay | --zen-color-interactive-hovered-primary | Absolute inset, matches container radius |
```

This approach follows industry best practices (Adobe Spectrum, Material Design, Carbon):
- Diagram stays clean and readable at any zoom level
- Token details live in a table that auto-sizes and never overlaps
- Letter badges create a clear cross-reference between diagram and table

#### Card 4 — Design tokens
`data-name="Design tokens"`

Section header: "Design tokens" / "Complete token map for every visual property. Never hardcode values — always reference the token."

Content — TWO tables side by side:

**Table 1: Color tokens**

| Type / State | Background token | Text / Icon token |
|---|---|---|
| Primary · Enabled | `--zen-color-base-brand` #0550DC | `--zen-color-base-inverse` #FFFFFF |
| Primary · Hovered | `--zen-color-base-brand` + `--zen-color-interactive-hovered-primary` overlay | inherits |
| Primary · Disabled | `--zen-color-interactive-disabled-secondary` | `--zen-color-interactive-disabled-primary` |
| ... | ... | ... |

**Table 2: Sizing, spacing & typography**

| Sizing & Spacing | Token | Value |
|---|---|---|
| Height — Default | `--zen-size-xl` | 32px |
| Padding horizontal | `--zen-spacing-sm` | 12px |
| Gap (icon–label) | `--zen-spacing-xs` | 8px |
| Border radius | `--zen-radius-default` | 6px |
| Focus ring width | `--zen-width-focus` | 2px |

| Typography | Value |
|---|---|
| Token | `--zen-font-label-standard` |
| Font family | Roboto |
| Font weight | 500 (Medium) |
| Font size | 14px |
| Line height | 20px |
| Letter spacing | 0.2px |

#### Card 5 — Component API
`data-name="Component API"`

Section header: "Component API" / "All Figma variant properties map 1:1 to component props. AI agents must honour these exact names."

Content — Props table:

| Prop | Type | Default | Accepted values | Notes |
|---|---|---|---|---|
| `type` **REQUIRED** | string | "Primary" | "Primary"\|"Secondary"\|"Ghost"\|... | Drives all colour tokens |
| `size` OPTIONAL | string | "Default" | "Default"\|"Small" | Default=32px; Small=24px |
| `state` OPTIONAL | string | "Enabled" | "Enabled"\|"Hovered"\|"Focused"\|... | CSS :hover/:focus-visible in production |
| `label` OPTIONAL | string | "Button" | Any string | Omit for Icon type |
| `ariaLabel` OPTIONAL | string | — | Any string | REQUIRED when type="Icon" |
| `ariaDisabled` OPTIONAL | boolean | — | true\|false | Preferred over HTML disabled |

#### Card 6 — Usage guidelines
`data-name="Usage guidelines"`

Section header: "Usage guidelines" / "When and how to use each [component] type, with do and don't examples."

Content:
- **When to use** — bulleted list of appropriate scenarios
- **When NOT to use** — anti-patterns with correct alternatives
- **Do / Don't pairs** — side-by-side cards with green bar (Do) / red bar (Don't), each showing a visual example + caption
- **Forms layout** (for form input components): include the 480px max-width rule for simple forms, full-width rule for extended elements (selectable rows, tiles, tables), and fluid rule for multi-column layouts. See CLAUDE.md "Forms Layout Rules".

#### Card 7 — Content guidelines
`data-name="Content guidelines"`

Section header: "Content guidelines" / "Guidance on what content works best, including text, imagery, and messaging."

Content:
- **Terminology rules** — specific label conventions (e.g., "Cancel vs Close", "Create vs Add vs Insert", "Submit vs Send vs Save")
- Each rule: heading, explanation, Do/Don't example pairs
- Keep language prescriptive and concise

#### Card 8 — Accessibility
`data-name="Accessibility"`

Section header: "Accessibility" / "WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios."

Content — **2-column grid of cards**, each with an icon, title, plain-text description, and a dark code snippet below.

**CRITICAL: No inline `<code>` tags in the `.a11y-card__body` text.** Inline code elements cause text overlapping when captured to Figma. Instead:
- Write the description in **plain language only** (no backtick-wrapped tokens or HTML entities in the body text)
- Put all code/token references **only in the `.a11y-card__code` dark block** below the description
- Example: write "Use aria-disabled='true' instead of the disabled attribute" NOT "Use `aria-disabled="true"` instead of `disabled`"

| Card | Content |
|---|---|
| **Role & semantics** | Native element, fallback role + tabindex if not native. Code example in dark block. |
| **Keyboard support** | Keys (Tab, Enter, Space, Escape) and what they do. Key mapping in dark block. |
| **Focus ring** | Plain description of ring appearance. CSS :focus-visible in dark block. |
| **Touch target (WCAG 2.5.8)** | Minimum 44×44px. ::after expansion in dark block. |
| **Disabled state** | Prefer aria-disabled="true" over HTML disabled. Code in dark block. |
| **Icon-only** | Must have accessible name via aria-label. Code in dark block. |
| **Toggle / Selected state** | aria-pressed for toggles, aria-expanded for dropdowns. Code in dark block. |
| **Critical action context** | aria-describedby pointing to warning text. Code in dark block. |

Then a **Contrast ratio table**:

| Variant | Foreground | Background | Ratio | WCAG AA |
|---|---|---|---|---|
| Primary label | #ffffff | #0550DC | 5.94:1 | Pass |
| Disabled | #9898A7 | #F5F5FA | 2.06:1 | Exempt |

#### Card 9 — Code specification
`data-name="Code specification"`

Section header: "Code specification" / "Framework-agnostic implementation reference with full CSS token mapping."

Content — A **dark code block** (`background: #1E1E2E`, monospace font, syntax-highlighted) containing:

```css
/**
 * [Component] — Actian Design System 2026
 * Figma component : [node-id]
 * Source page     : [page-node-id]
 */

/* Types */
type [Component]Type = "Primary" | "Secondary" | "Ghost" | ...;
type [Component]Size = "Default" | "Small";
type [Component]State = "Enabled" | "Hovered" | "Focused" | "Pressed" | "Disabled";

/* --- Container tokens --- */
.[component] {
  height:         var(--zen-size-xl, 32px);
  padding:        0 var(--zen-spacing-sm, 12px);
  gap:            var(--zen-spacing-xs, 8px);
  border-radius:  var(--zen-radius-default, 6px);
  border-width:   var(--zen-width-default, 1px);
  font-family:    'Roboto', sans-serif;       /* --zen-font-label-standard */
  font-size:      14px;
  font-weight:    500;
  line-height:    20px;
  letter-spacing: 0.2px;
}

/* --- Size: Small --- */
.[component]-sm {
  height: var(--zen-size-lg, 24px);
  padding: 0 var(--zen-spacing-xs, 8px);
  font-size: 12px;
  letter-spacing: 0.3px;
}

/* --- Focus ring — never suppress --- */
.[component]:focus-visible {
  outline: var(--zen-width-focus, 2px) solid var(--zen-color-interactive-focused-stroke-default, #000000);
  outline-offset: 2px;
}

/* --- Primary variant --- */
.[component]-primary {
  background: var(--zen-color-theme-primary, #0550DC);
  color: var(--zen-color-base-inverse, #ffffff);
}
.[component]-primary:hover {
  background: color-mix(in srgb, var(--zen-color-theme-primary) 82%, #000);
}
.[component]-primary:active {
  background: var(--zen-color-interactive-selected-primary, #0029A9);
}

/* --- Disabled — aria-disabled pattern --- */
[aria-disabled="true"].[component] {
  background: var(--zen-color-interactive-disabled-secondary, #F5F5FA);
  color:      var(--zen-color-interactive-disabled-primary, #9898A7);
  cursor:     not-allowed;
  pointer-events: none;
}
```

Use syntax highlighting with color classes: keywords in purple, strings in green, comments in grey, values in orange, properties in light blue.

---

## Step 5 — Capture to Figma

If the user provides a target Figma file:

1. Ensure the local HTTP server is running on port 8765
2. Call `generate_figma_design` with `outputMode: "existingFile"` and the target file key/node
3. Open the HTML file with the capture hash URL
4. Poll until capture completes
5. Share the Figma link with the user

## Step 6 — Create in Figma (optional)

If the user says "create it in Figma", "build the component", or "make it real":

1. Generate a `component-spec.json` from the brief:
   - Component name from Card 1 (Page header)
   - Variants from Card 2 (Actual component) and Card 5 (Component API)
   - Internal layout from Card 3 (Anatomy)
   - Text properties from Card 5 text props (mark as `"isProperty": true`)
   - Library: `"fat-marker"` (if FM mode) or `"ds2026"` (if Actian DS mode)
   - Use nested component instances where appropriate (e.g., buttons, icons)

2. Save to `/Users/volivari/Developer/Actian/Actian-DS-Assembler/component-spec.json`

3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**

4. After creation, remind the user to:
   - Review the component in Figma
   - Publish to library if it's a shared component
   - Run `sync-all.js` to update the registry
