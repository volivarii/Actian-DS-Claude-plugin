---
# P8 transversal refs — file-scoped (Option A). Union across §3.1 Color Usage,
# §3.2 Typography, §3.3 Spacing, §3.5 Brightness Filter Convention.
a11y_refs:
  - { ref: color-contrast, note: §3.1 semantic-over-primitive rule preserves contrast under theming }
  - { ref: typography, note: §3.2 typography rules }
  - { ref: touch-pointer, note: §3.3 spacing scale underpins hit-target sizing }
  - { ref: focus-keyboard, note: §3.5 brightness filter is the only token-bound interactive state }
motion_refs:
  - { ref: state-transitions, note: §3.5 hover/focus/active brightness transitions stay within the 100-200ms band }
---

## 3. Design Guidelines {#design-guidelines}

### 3.1 Color Usage Rules

**Semantic over primitive.** Always use a semantic token (e.g. `--zen-color-text-default`) rather than a raw palette token (e.g. `--zen-color-grey-900`) unless you're building a new token. This ensures theming works correctly.

**Contrast.** Text on backgrounds must meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text). Use the following pairings as reference:

- `text-default` on `bg-default` ✅
- `text-secondary` on `bg-subtle` ✅
- `text-disabled` should never be used on interactive elements that require action

**Semantic color intent.** Color conveys meaning — don't use `success-*` colors for non-success contexts, even if the green looks right.

### 3.2 Typography Rules

#### Typeface

Use `--zen-font-family-text` (Roboto) as the default for all UI text. Use `--zen-font-family-mono` (Roboto Mono) for code snippets, data tables with identifiers, and technical strings. Roobert is the brand typeface only for marketing and communication materials like website, PPTs, and flyers.

#### Language Support

Provide Noto as a font when your product is being consumed by users who read languages with tall or dense scripts.

#### Minimum Size

Must not use type sizes smaller than 11px. You may use 11px text in labels, tags, data visualizations, and supporting text with icon.

#### Line Length

- Text line length is 544px at max with 16px text
- Text line length is 480px at max with 14px text
- Text line length is 424px at max with 12px text

#### Paragraph Spacing

At default, the paragraph spacing is 8px.

#### Accessibility

- Default body text size is 14px
- Minimum body text size is 12px
- 11px is only acceptable for non-essential UI
- Use defined type styles (avoid light weight)
- Maintain readable line height and spacing
- Text line length is 544px at max with 16px text
- Text line length is 480px at max with 14px text
- Text line length is 424px at max with 12px text
- Avoid placeholder-only labels
- Avoid long blocks of dense text

Don't create one-off font sizes. If your design needs a size between tokens, first check whether a token can be used, then raise it as a proposed token addition.

### 3.3 Spacing Rules

Use spacing tokens for all margin, padding, and gap values. The scale is:

- **2xs–xs** for internal element spacing (icon-to-label, checkbox-to-text)
- **sm–md** for internal component padding
- **lg–xl** for spacing between sections and groups
- **2xl–3xl** for page-level layout breathing room

Never use arbitrary pixel values for spacing. If a layout needs something outside the scale, it's a signal to propose a new token.

### 3.4 Elevation Rules

Elevation communicates depth and layer hierarchy — not decoration. Only use drop shadows to convey that an element is above another. Never stack multiple shadows, and don't apply elevation to elements sitting on the same visual plane.

Common layer levels: `xs` → `sm` → `md` → `lg` → `xl` (each level suggests greater visual separation from the base surface).

### 3.5 Brightness Filter Convention — Interactive States

#### Types of States

**Interaction States**

- **Default:** The neutral state of an element before any user interaction.
- **Hover\*:** Triggered when a cursor is placed over an interactive element.
- **Focus\*:** Triggered when an element is highlighted via keyboard, voice, or other input methods.
- **Pressed\*:** The momentary state during a physical click or tap.
- **Dragged:** Active when a user presses and moves an element from its original position.
- **Selected:** A persistent state indicating an element has been chosen (e.g. via checkbox, tab, or radio button).
- **Disabled:** An inoperable state where the element cannot be interacted with or focused.

*\*Hover states should be suppressed on touch devices to avoid "sticky" visual effects. Conversely, Focus and Pressed states must be supported across all input types to ensure accessibility and tactile feedback.*

**Feedback & System States**

- **Loading:** Indicates a component is processing an action or fetching data.
- **Error:** Indicates invalid input or a failed system action, usually via color or icons.
- **Success:** Indicates valid input or a successfully completed action.
- **Warning:** Indicates a non-blocking issue or a state requiring user caution.
- **Read-Only:** Content is legible and focusable for copying, but cannot be edited.
- **Indeterminate:** A "partial" state, typically for parent checkboxes with mixed child selections.

---

#### Implementation

Interactive color states (hover, pressed/active, disabled) are **not handled with tokens**. Engineering implements these using CSS brightness filters at the component level.

| State | Filter | Notes |
|-------|--------|-------|
| Hover | `filter: brightness(0.92)` | Subtle darkening |
| Pressed / Active | `filter: brightness(0.85)` | More pronounced |
| Disabled | `opacity: 0.4` | Combined with `cursor: not-allowed` |

The only tokenized interactive state is **focus** — see `--zen-focus-ring-primary` and `--zen-focus-ring-error` in Section 2.5.

### 3.6 Breakpoints

The majority of Actian users are on desktop. Desktop (lg) is the primary design target. However, pages should be responsive and tested across the full breakpoint range — from xl (large screens) down to sm (phone landscape) — to ensure usability across contexts.

#### Columns, Gutters, and Margins

Layouts are built on a column grid with three key measurements:

1. **Columns** — guide what the content aligns to
2. **Gutters** — fixed spacing between columns
3. **Margins** — negative space beyond the content area

#### Grid Settings

Target XL and until S. XS is not considered at this moment.

| Grid type | Breakpoint | Token | Total columns | Column | Margin | Gutter | Body |
|-----------|-----------|-------|--------------|--------|--------|--------|------|
| XS | Under 600px | — | 4 | Fluid | 16px | 16px | Fluid |
| S | 600px | `--zen-breakpoint-sm` | 8 | Fluid | 16px | 16px | Fluid |
| M | 840px | `--zen-breakpoint-md` | 16 | Fluid | 24px | 16px | Fluid |
| L | 1200px | `--zen-breakpoint-lg` | 16 | Fluid | 24px | 16px | Fluid |
| XL | 1920px | `--zen-breakpoint-xl` | 16 | 85px | 40px | 16px | 1600px |

---



### 3.7 Focus Ring Rules

**Applies to:** Buttons, links, checkboxes, radios, avatars, breadcrumbs, tags, toggles, tabs

Use `--zen-focus-ring-primary` with `--zen-focus-ring-offset` (2px) as an `outline-offset`.

**Applies to:** Inputs, textareas

Use `--zen-focus-ring-primary` as `outline` with no offset. The border of the input itself acts as the boundary.

**Applies to:** Destructive actions and error-state interactive elements

Use `--zen-focus-ring-error` instead of primary.

**Do not** use `box-shadow` to simulate focus rings — it won't work correctly in high-contrast mode.

### 3.8 Border Usage

Use `--zen-border-default` for standard container borders (cards, panels, inputs at rest). Use `--zen-border-subtle` for dividers and separators between rows or sections. Use `--zen-border-disabled` for any input, button, or form element in a disabled state.

### 3.9 Placeholder Text

Two tiers of placeholder exist for inputs: `--zen-color-text-placeholder` is the standard placeholder (grey-600). `--zen-color-text-placeholder-subtle` (grey-400) is used in search fields where less visual weight is appropriate.

