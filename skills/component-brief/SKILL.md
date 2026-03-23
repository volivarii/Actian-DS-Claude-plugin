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

All 9 cards use the same chrome and internal styling:

```css
/* Card outer shell */
.card { border-radius: 16px; overflow: hidden; background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

/* Section header — grey top */
.card-section-header {
  background: #F5F5FA; padding: 56px 64px;
}
.card-section-header__title {
  font-family: 'Roboto', sans-serif;
  font-weight: 500; font-size: 40px; color: black; margin-bottom: 8px;
}
.card-section-header__subtitle {
  font-family: 'Roboto', sans-serif;
  font-weight: 400; font-size: 20px; line-height: 1.4;
  color: black; max-width: 600px;
}

/* Content area — white bottom */
.card-content {
  padding: 56px 64px;
  display: flex; flex-direction: column; gap: 48px;
}

/* Sub-section dividers */
.card-divider { height: 1px; background: #EDF0F7; }

/* Sub-section headings */
.card-sub-heading {
  font-family: 'Roboto', sans-serif;
  font-weight: 500; font-size: 24px; color: black; margin-bottom: 24px;
}

/* Standard table chrome (used in Cards 2–5, 8) */
table { width: 100%; border-collapse: collapse; font-family: 'Roboto', sans-serif; font-size: 13px; }
th {
  text-align: left; padding: 10px 12px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
  color: #717D96; font-weight: 500;
}
thead tr { border-bottom: 2px solid #E2E7F0; }
tbody tr { border-bottom: 1px solid #EDF0F7; }
tbody tr:last-child { border-bottom: none; }
td { padding: 12px; }

/* Token code tags (red on pink) */
.token-tag {
  background: #FFF5F5; border: 1px solid #FDE8E8;
  color: #C10C0D; padding: 2px 8px; border-radius: 4px; font-size: 11px;
}

/* Grey content cells (states, themes) */
.grey-cell {
  background: #F9FAFB; border-radius: 12px; padding: 24px; text-align: center;
}

/* State/theme label */
.cell-label {
  font-family: 'Roboto', sans-serif; font-size: 11px; font-weight: 500;
  color: #717D96; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;
}

/* Numbered pointer badge (anatomy) */
.pointer-badge {
  width: 20px; height: 20px; background: #1a1a1a; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-family: 'Roboto', sans-serif; font-size: 11px; font-weight: 500;
}

/* Do/Don't cards (usage & content guidelines) */
.do-card { border-radius: 12px; overflow: hidden; border: 1px solid #EDF0F7; }
.do-card__bar--do { height: 4px; background: #22C55E; }
.do-card__bar--dont { height: 4px; background: #EF4444; }
.do-card__body--do { padding: 24px; background: #FAFFF5; }
.do-card__body--dont { padding: 24px; background: #FFF5F5; }

/* Dark code block (a11y cards, code spec) */
.code-block {
  background: #1E1E2E; border-radius: 8px; padding: 14px;
  font-family: 'Roboto Mono', monospace; font-size: 11px; color: #CDD6F4; line-height: 1.6;
}
```

**These class names are reference only** — the actual HTML uses inline styles for Figma capture compatibility. But every card MUST follow these exact values.

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

Section header: "Actual component" / "The finalized, production-ready component. Locked — cannot be edited."

Content — 3 sub-sections separated by `1px #EDF0F7` dividers:

**Sub-section 1: States** — Horizontal grid showing all interactive states
- Grid: `grid-template-columns: repeat(N, 1fr)` where N = number of states (typically 5: Enabled, Hovered, Focused, Pressed, Disabled)
- Each cell: `background: #F9FAFB; border-radius: 12px; padding: 20px; text-align: center`
- State label: uppercase, 10px, `#717D96`, `letter-spacing: 1px`, 14px margin-bottom
- Render the actual component in each state with correct colors/outlines

**Sub-section 2: Variant matrix** — Table with live components
- If the component has multiple hierarchy/type variants AND sizes, show a table
- Columns = size variants (Default, Small, Icon-only, etc.)
- Rows = hierarchy/type variants (Primary, Secondary, Tertiary, etc.)
- Each cell renders the actual component at correct size and style
- Table header: same chrome as all other tables (11px uppercase, `#717D96`)

**Sub-section 3: Theme comparison** — 3-column grid
- Grid: `repeat(3, 1fr)` for Actian / Studio / Explorer
- Each cell: `background: #F9FAFB; border-radius: 12px; padding: 24px; text-align: center`
- Theme label: uppercase, 10px, `#717D96`
- Render the component with that theme's primary color
- Color swatches below: small 16px rounded squares showing primary + selected colors

#### Card 3 — Anatomy
`data-name="Anatomy"`

Section header: "Anatomy" / "Each labelled part is a token reference. Color and size adapt to variant and theme."

Content — 4 sub-sections separated by `1px #EDF0F7` dividers:

**Sub-section 1: Structure** — Component with numbered pointer badges
- Component rendered at actual scale inside `background: #F9FAFB; border-radius: 12px; padding: 48px 64px`
- Numbered pointer badges: 20px dark circles (`#1a1a1a`), white text (11px, weight 500)
- Each badge has a 14px directional line (`1px solid #1a1a1a`) pointing to its element
- Pointers above or below the component — NEVER overlapping it
- Numbers start at 1, increment sequentially
- Only structural parts (Container, Icon slots, Label, etc.) — NO states
- Inline legend below diagram: horizontal row of badge + element name pairs, 13px, `#475467`, 20px gap

**Sub-section 2: Specs** — Visual component with dimension annotations
- Show each size variant side by side inside `background: #F9FAFB; border-radius: 12px`
- Height: pink bracket line (`#D71D6D`) on the left with rotated "Npx" label
- Padding: pink semi-transparent overlay blocks (`#D71D6D`, 35% opacity) on left/right edges
- Gap: pink annotations between content elements
- Token pill below each variant: `background: #FFF5F5; border: 1px solid #FDE8E8; color: #C10C0D; border-radius: 4px; font-size: 10px`
- Radius callout at bottom with visual border-radius indicator + token pill

**Sub-section 3: States** — 3-column grid of key interactive states
- Grid: `repeat(3, 1fr)` — typically Default, Focused, Hovered
- Each cell: `background: #F9FAFB; border-radius: 12px; padding: 24px; text-align: center`
- State label: uppercase, 11px, `#717D96`, `letter-spacing: 1px`
- States that introduce NEW visual elements (focus ring, overlay) get numbered pointers continuing from Structure (e.g., 5, 6)
- Pointer + element name positioned below the state example
- Extra bottom padding (48px) on cells with pointers to prevent clipping
- No pointer on Default state

**Sub-section 4: Parts reference** — Two tables under one heading
- Heading: "Parts reference" (24px, weight 500)
- Sub-header 1: **Structure** (15px, weight 500) — table for parts 1–N from the Structure diagram
- Sub-header 2: **States** (15px, weight 500) — table for parts N+1–M from the States diagram
- Table columns: [badge] | Element | Token | Notes
- Badge: same 20px dark circle as in diagrams
- Token values: `background: #FFF5F5; border: 1px solid #FDE8E8; color: #C10C0D; padding: 2px 8px; border-radius: 4px; font-size: 11px`
- Em-dash (`—`) for elements with no token
- Every number in the tables MUST appear in a diagram above

#### Card 4 — Design tokens
`data-name="Design tokens"`

Section header: "Design tokens" / "Complete token map for every visual property. Never hardcode values."

Content — 3 sub-sections separated by `1px #EDF0F7` dividers:

**Sub-section 1: Color tokens** — Table with color swatches
- Columns: Variant / State | Background | Text / Icon
- Each color cell: 14px rounded swatch + token code tag
- Token code tags: `background: #FFF5F5; border: 1px solid #FDE8E8; color: #C10C0D; padding: 2px 6px; border-radius: 4px; font-size: 11px`
- Use "inherits" in grey (`#A0ABC0`) when a state inherits from its base
- Row per variant×state combination (e.g., Primary·Enabled, Primary·Hovered, Primary·Disabled)

**Sub-section 2: Sizing & spacing** — Table with Default/Small columns
- Columns: Property | Token | Default | Small
- Property column: weight 500, `#101828`
- Value columns: `#475467`
- Token column: same red code tag style as color tokens
- Rows: Height, Horizontal padding, Content gap, Border radius, Focus ring width, etc.

**Sub-section 3: Typography** — Inline specimen card
- `background: #F9FAFB; border-radius: 12px; padding: 24px`
- Left: rendered text sample in the component's font
- Divider: `1px #EDF0F7` vertical line
- Right: Token code tag + specs inline (Family, Weight, Size, Line height, Tracking)

#### Card 5 — Component API
`data-name="Component API"`

Section header: "Component API" / "Figma variant properties map 1:1 to component props."

Content — Single props table:
- Columns: Prop | Type | Default | Values | Notes
- Prop name: `background: #F0F2F5; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500`
- Accepted values: pill chips (`background: #F0F2F5; padding: 1px 6px; border-radius: 4px; font-size: 11px; color: #475467`) with flex-wrap
- Type and Default: plain text, `#475467`
- Notes: `font-size: 12px`, `#475467`

#### Card 6 — Usage guidelines
`data-name="Usage guidelines"`

Section header: "Usage guidelines" / "When and how to use each [component] type, with do and don't examples."

Content — 3 sub-sections separated by `1px #EDF0F7` dividers:

**Sub-section 1: When to use** — Bulleted list with green `+` prefix
- Each item: `display: flex; gap: 8px`
- Plus sign: `color: #22C55E; font-weight: 700`
- Text: 14px, `#475467`, `line-height: 1.6`

**Sub-section 2: When NOT to use** — Bulleted list with red `−` prefix
- Same layout as "When to use" but minus sign: `color: #EF4444; font-weight: 700`
- Each anti-pattern includes the correct alternative (e.g., "→ use Link instead")

**Sub-section 3: Do / Don't pairs** — 2-column grid of comparison cards
- Grid: `grid-template-columns: 1fr 1fr; gap: 16px`
- Each card: `border-radius: 12px; border: 1px solid #EDF0F7; overflow: hidden`
- Do card: 4px green bar (`#22C55E`) on top, `background: #FAFFF5` body
- Don't card: 4px red bar (`#EF4444`) on top, `background: #FFF5F5` body
- Each card: visual example centered + caption below (13px, `#475467`, centered)
- For form input components: include 480px max-width rule pair
- **Forms layout** (for form input components): include the 480px max-width rule for simple forms, full-width rule for extended elements (selectable rows, tiles, tables), and fluid rule for multi-column layouts. See CLAUDE.md "Forms Layout Rules".

#### Card 7 — Content guidelines
`data-name="Content guidelines"`

Section header: "Content guidelines" / "Label copy rules: what to write, how to write it, and common mistakes."

Content — Stacked rules, separated by `1px #EDF0F7` dividers:

Each rule block contains:
- Rule heading: 20px, weight 500, black
- Explanation: 14px, `#475467`, `line-height: 1.6`, 16px margin-bottom
- Inline Do/Don't pair: same 2-column grid as Card 6 but compact (20px padding, no caption text if the visual is self-explanatory)

Typical rules for any component:
- Sentence case
- Lead with a verb (for action components)
- Confirm destructive actions explicitly
- Keep labels concise (2–3 words max for buttons, clear field labels for inputs)

#### Card 8 — Accessibility
`data-name="Accessibility"`

Section header: "Accessibility" / "WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios."

Content — 2 sub-sections separated by `1px #EDF0F7` divider:

**Sub-section 1: A11y requirement cards** — 2-column grid
- Grid: `grid-template-columns: 1fr 1fr; gap: 16px`
- Each card: `border: 1px solid #EDF0F7; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 12px`
- Card header: `display: flex; align-items: center; gap: 10px`
  - Icon placeholder: `width: 28px; height: 28px; background: #EEF4FF; border-radius: 8px` — NO emoji icons, leave as plain colored square
  - Title: 15px, weight 500, `#101828`
- Body text: 13px, `#475467`, `line-height: 1.6` — plain language ONLY, no inline `<code>` tags
- Code block: `background: #1E1E2E; border-radius: 8px; padding: 14px; font-family: 'Roboto Mono', monospace; font-size: 11px; color: #CDD6F4; line-height: 1.6`

**CRITICAL: No inline `<code>` tags in body text.** Inline code causes text overlapping when captured to Figma. Put all code/ARIA references in the dark code block only.

Standard cards (include all that apply to the component):
| Card | Content |
|---|---|
| **Role & semantics** | Native element, fallback role + tabindex. Code in dark block. |
| **Keyboard support** | Key mappings (Tab, Enter, Space, Escape). Table in dark block. |
| **Focus ring** | Ring description. CSS :focus-visible in dark block. |
| **Touch target (WCAG 2.5.8)** | 44×44px minimum. ::after expansion in dark block. |
| **Disabled state** | aria-disabled="true" pattern. Code in dark block. |
| **Icon-only** | aria-label requirement. Code in dark block. |

**Sub-section 2: Contrast ratio table**
- Columns: Variant | Foreground | Background | Ratio | WCAG AA
- Foreground/Background cells: 12px color swatch + hex value
- Ratio: weight 500, `#101828`
- Pass badge: `background: #DCFCE7; color: #166534; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 500`
- Exempt badge: `background: #F3F4F6; color: #6B7280` (same shape)

#### Card 9 — Code specification
`data-name="Code specification"`

Section header: "Code specification" / "Framework-agnostic implementation reference with full CSS token mapping."

Content — Single dark code block:
- `background: #1E1E2E; border-radius: 12px; padding: 32px`
- `font-family: 'Roboto Mono', monospace; font-size: 12px; line-height: 1.8; color: #CDD6F4`
- Syntax highlighting (Catppuccin Mocha palette):
  - Keywords/types: `#CBA6F7` (purple)
  - Strings: `#A6E3A1` (green)
  - Comments: `#6C7086` (grey)
  - Values/numbers: `#FAB387` (orange)
  - Properties: `#89DCEB` (cyan)
  - Selectors: `#89B4FA` (blue)
  - Pseudo-classes: `#F38BA8` (pink)
  - Functions: `#F9E2AF` (yellow)

Code structure:
1. Header comment: component name, Figma node-id, source page
2. Type definitions for all variant axes
3. Container base styles with all token vars + fallback values
4. Size variant overrides
5. Focus ring (`:focus-visible` — never suppress)
6. One variant example (e.g., Primary) with hover/active states
7. Disabled state using `[aria-disabled="true"]` pattern

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

2. Save to `Actian-DS-Assembler/component-spec.json`

3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**

4. After creation, remind the user to:
   - Review the component in Figma
   - Publish to library if it's a shared component
   - Run `sync-all.js` to update the registry
