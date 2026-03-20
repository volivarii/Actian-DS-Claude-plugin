# Prompt Template: Component Brief

> Copy this into Claude Desktop when documenting a new or existing component. Replace the [bracketed] parts.
> Updated: 2026-03-19

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
2. **Actual component (Locked)** — All variants × states rendered, theme comparison (Actian/Studio/Explorer)
3. **Anatomy** — Enlarged component with labeled parts (A, B, C...), token references
4. **Design tokens** — Full token map (color tokens per state + sizing/spacing/typography tables)
5. **Component API** — Props table (prop, type, default, accepted values, required/optional)
6. **Usage guidelines** — When to use / When NOT to use, with Do/Don't visual examples
7. **Content guidelines** — Terminology, labeling conventions, Do/Don't pairs
8. **Accessibility** — WCAG AA: Role & semantics, Keyboard support, Focus ring, Touch target, Disabled state, Icon-only, Toggle state, Contrast ratio table
9. **Code specification** — Framework-agnostic CSS with full --zen- token mapping in a dark code block

Use --zen- prefixed token names everywhere:
  --zen-color-*, --zen-spacing-*, --zen-radius-*, --zen-shadow-*, --zen-size-*, --zen-width-*, --zen-font-*

Show all 3 theme modes where colors vary (Actian, Studio, Explorer).
Each card is 1200px wide, auto-heights to fit content.
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
| 2 | Component | `"Actual component (Locked)"` | State grid, variant matrix, theme comparison |
| 3 | Anatomy | `"Anatomy"` | Labeled parts (A–F), dimensions, tokens |
| 4 | Design tokens | `"Design tokens"` | Color token map + sizing/spacing + typography |
| 5 | Component API | `"Component API"` | Props table with types, defaults, accepted values |
| 6 | Usage guidelines | `"Usage guidelines"` | When to use, Do/Don't examples |
| 7 | Content guidelines | `"Content guidelines"` | Terminology, labeling rules |
| 8 | Accessibility | `"Accessibility"` | WCAG, keyboard, ARIA, contrast ratios |
| 9 | Code specification | `"Code specification"` | Framework-agnostic CSS with `--zen-` tokens |

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
- The Code specification card uses a dark code block with syntax highlighting
