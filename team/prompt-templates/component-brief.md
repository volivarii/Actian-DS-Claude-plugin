# Prompt Template: Component Brief

> Copy this into Claude Desktop when documenting a new or existing component. Replace the [bracketed] parts.
> Updated: 2026-03-23

---

## The prompt (Actian DS mode — full 9-card brief)

```
Draft a component brief for the following component in our Actian Design System:

**Component name:** [e.g., Link, Button, Toggle]
**Figma URL:** [paste the Figma component/page URL if available]
**Mode:** Actian DS (production, hi-fi)

**Purpose:** [one sentence — what it does and why it exists]
**Where it appears:** [e.g., inline in body text, toolbars, form footers]

Generate a complete 9-card horizontal spec page:

1. **Page header** — Component name (Roboto 72px) + Actian logo + description paragraphs
2. **Actual component (Locked)** — State grid (5-col: Enabled/Hovered/Focused/Pressed/Disabled), variant matrix (rows=types, cols=sizes), theme comparison (Actian/Studio/Explorer with color swatches)
3. **Anatomy** — 4 sub-sections:
   - Structure: component with numbered dark pointer badges (20px #1a1a1a circles) + inline legend
   - Specs: visual component with pink dimension lines (#D71D6D) for height, padding, gap + token pills
   - States: 3-col grid with numbered pointers for new visual elements (focus ring, overlay)
   - Parts reference: two tables — "Structure" (1–N) and "States" (N+1–M) — every number appears in a diagram above
4. **Design tokens** — Color tokens table (swatch + token per state), sizing & spacing table (Default/Small columns), typography specimen
5. **Component API** — Props table with code-styled prop names and pill-chip values
6. **Usage guidelines** — When to use (+), When NOT to use (−), Do/Don't pairs (green/red bar cards)
7. **Content guidelines** — Rule blocks: heading + explanation + inline Do/Don't pairs
8. **Accessibility** — 2-col grid of a11y cards (no emoji icons, plain colored square + title + body + dark code block), contrast ratio table with Pass/Exempt badges
9. **Code specification** — Dark code block (#1E1E2E) with Catppuccin Mocha syntax highlighting

Use --zen- prefixed token names everywhere:
  --zen-color-*, --zen-spacing-*, --zen-radius-*, --zen-shadow-*, --zen-size-*, --zen-width-*, --zen-font-*

Show all 3 theme modes where colors vary (Actian, Studio, Explorer).
Validate against the Quality & Hygiene Checklist before marking complete.
```

---

## The prompt (Fat Marker mode — 5-card brief)

```
Draft a component brief for the following Fat Marker component:

**Component name:** [e.g., FM Alert, FM Button]
**Mode:** Fat Marker (wireframe, lo-fi)

**Purpose:** [one sentence — what it does]
**Where it appears:** [e.g., top of content area, inside forms]

Generate a 5-card horizontal spec page:
1. Page header (dark artboard chrome)
2. Actual component (all variants)
3. Design guidelines (accessibility, behavior)
4. Content guidelines (when to use, do/don't)
5. Anatomy (callout diagram)

Use FM conventions: Inter font, FM color palette.
```

---

## The 9 Actian DS cards at a glance

| # | Card | `data-name` | Key content |
|---|------|-------------|-------------|
| 1 | Page header | `"Page header"` | Title (72px) + logo + description |
| 2 | Component | `"Actual component (Locked)"` | State grid (5-col), variant matrix, theme comparison (3 themes) |
| 3 | Anatomy | `"Anatomy"` | Structure (numbered pointers), Specs (pink dimensions), States (numbered new elements), Parts reference (Structure/States tables) |
| 4 | Design tokens | `"Design tokens"` | Color tokens (swatches), sizing/spacing (Default/Small), typography specimen |
| 5 | Component API | `"Component API"` | Props table with pill-chip values |
| 6 | Usage guidelines | `"Usage guidelines"` | When to use, Do/Don't green/red cards |
| 7 | Content guidelines | `"Content guidelines"` | Rule blocks with inline Do/Don't |
| 8 | Accessibility | `"Accessibility"` | A11y cards (2-col, no emoji) + contrast table |
| 9 | Code specification | `"Code specification"` | Dark code block, Catppuccin Mocha highlighting |

---

## Standardized visual elements

All cards share these exact values:

| Element | Spec |
|---------|------|
| Card chrome | `border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08)` |
| Section header | `background: #F5F5FA; padding: 56px 64px` |
| Title | Roboto 40px weight 500, black |
| Subtitle | Roboto 20px weight 400, black, max-width 600px |
| Content area | `padding: 56px 64px; gap: 48px` |
| Sub-section heading | Roboto 24px weight 500, black |
| Dividers | `1px solid #EDF0F7` |
| Token code tags | `background: #FFF5F5; border: 1px solid #FDE8E8; color: #C10C0D` |
| Pointer badges | `20px #1a1a1a circles, white 11px text` |
| Do/Don't cards | Green bar `#22C55E` on `#FAFFF5` / Red bar `#EF4444` on `#FFF5F5` |
| Dark code blocks | `background: #1E1E2E; color: #CDD6F4; font-family: 'Roboto Mono'` |
| Tables | `11px uppercase headers #717D96; rows 1px #EDF0F7; thead 2px #E2E7F0` |

---

## Token naming convention

All tokens use the `--zen-<type>-<name>` prefix:

```
--zen-color-theme-primary           (was: theme-primary)
--zen-color-interactive-disabled-primary
--zen-spacing-xs                    (was: spacing-xs)
--zen-radius-default                (was: radius-default)
--zen-shadow-md                     (was: shadow-md)
--zen-size-xl                       (was: size-xl)
--zen-width-focus                   (was: width-focus)
--zen-font-body-standard            (was: body-standard)
```

---

## Tips
- If the component already exists in Figma, paste the URL — Claude will fetch the design context first
- After the brief, ask: "Does this overlap with any existing component we should consolidate?"
- To capture the spec page to Figma: ask Claude to push it to a target file
- Each section card auto-heights to fit content — no clipping
- The Anatomy card now uses numbered pointers (1, 2, 3...) instead of letters (A, B, C...)
- Parts reference is split into "Structure" and "States" sub-tables — no "parts" repetition
