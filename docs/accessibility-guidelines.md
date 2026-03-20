# Actian Design System 2026 — Accessibility Guidelines

> WCAG 2.1 AA compliance standards for all components and flows.
> Apply in every skill: component briefs, design audits, flow generation, comparisons, and analysis.
> Source: DS2026 Figma library (`8Yu8wUtPTXsa3iV6R4TmnS`, node `12685:19373`)

---

## WCAG 2.1 AA Principles

| Principle | Requirement |
|-----------|-------------|
| **Perceivable** | Users must be able to see or hear content (text, images, video) clearly |
| **Operable** | Users must be able to interact with all UI elements (keyboard, gestures) |
| **Understandable** | Content and interactions must be predictable and clear |
| **Robust** | Content must work across assistive technologies and browsers |

---

## Color & Contrast

| Check | Ratio |
|-------|-------|
| Body text (< 18pt) | **4.5:1** minimum |
| Large text (≥ 18pt or 14pt bold) | **3:1** minimum |
| UI components, icons, focus indicators | **3:1** minimum |

Rules:
- Use accessible color palettes and tokens — never hardcode
- Do NOT rely on color alone to convey meaning
- Provide secondary visual indicators (icons, text, patterns) alongside color
- Disabled elements are exempt from contrast requirements but must be visually distinguishable

---

## Typography & Readability

- Default body text size: **14px** (`--zen-font-body-standard`)
- Minimum body text size: **12px** (`--zen-font-body-subtle`)
- **11px** only acceptable for non-essential UI (`--zen-font-body-micro`)
- Avoid light font weights for body text
- Maintain readable line height and spacing per text style tokens
- Text must be resizable up to 200% without loss of content
- Paragraph width: 60–75 characters max for readability

---

## Layout & Responsiveness

- Content reflows at **400% zoom** without horizontal scrolling
- Logical reading and focus order preserved at all zoom levels
- Touch targets: **44px ideal / 24px minimum** with sufficient spacing (WCAG 2.5.8)
- No content clipped or hidden at 200% zoom

---

## Keyboard & Focus

- **All interactive elements** are keyboard accessible
- **No keyboard traps** — users can always navigate away
- **Logical focus order** following visual layout (left-to-right, top-to-bottom)
- Use `Tab` for forward, `Shift+Tab` for backward
- Only focusable items that are visually visible should receive focus
- Focus indicator: **2px solid `--zen-color-interactive-focused-stroke-default`** (#000000), never suppressed
- `:focus-visible` must always be styled — never use `outline: none` without a replacement

### Key bindings by component

| Component | Keys |
|-----------|------|
| Button | `Tab` to focus, `Enter` or `Space` to activate |
| Link | `Tab` to focus, `Enter` to activate |
| Dropdown/Select | `Tab` to focus, `Space`/`Enter` to open, `Arrow` to navigate, `Escape` to close |
| Modal | `Tab` cycles within modal (focus trap), `Escape` to close |
| Tabs | `Tab` to tab list, `Arrow Left/Right` to switch tabs |
| Menu | `Enter`/`Space` to open, `Arrow` to navigate, `Escape` to close |
| Data table | `Tab` between interactive cells, `Arrow` for cell navigation |

---

## Required Interactive States

Every interactive component must have these states designed:

| State | Requirement |
|-------|-------------|
| **Default** | Base visual appearance |
| **Hover** | Visual change on mouse hover |
| **Focus** | Visible focus indicator (keyboard) — never remove |
| **Active/Pressed** | Visual feedback during click/tap |
| **Disabled** | Visually distinct, `aria-disabled="true"` preferred over HTML `disabled` |
| **Error** | For form elements — error message + visual indicator |
| **Success** | For form elements — confirmation feedback |

---

## Feedback & Error Messages

- **Explain what happened** and **how to fix it**
- Error messages appear **near the field** they relate to
- Use `aria-live="polite"` for non-critical status updates
- Use `aria-live="assertive"` only for critical, time-sensitive errors
- Status changes must not rely on color alone — include icon + text
- Toasts/alerts auto-dismiss: minimum **5 seconds** display time

---

## Forms & Data Entry

- Labels are **always visible** (no placeholder-only labels)
- Required vs optional is **clearly indicated** (asterisk `*` for required)
- Errors appear **near the field** with explanation
- Inline validation is helpful, not disruptive
- Timeouts include **warnings and recovery options**
- Group related fields with `fieldset`/`legend`
- Logical tab order follows visual layout

---

## ARIA & Label Guidance

### Accessible Names (Labeling)
- Every interactive element has a **visible text label**
- Labels remain visible when field is focused or filled (no placeholder-only)
- The **1:1 Rule**: The accessible name must match the visible label
- Use `aria-label` only when a visible label is not possible (e.g., icon-only buttons)

### ARIA Roles
- **First Rule of ARIA**: If you can use a native HTML element (`<button>`, `<nav>`, `<a>`), use it instead of ARIA roles
- Elements have the **correct role** for their behavior
- Custom components declare their role explicitly (`role="dialog"`, `role="tablist"`, etc.)

### Live Regions
- Use `aria-live` for content that updates without page refresh
- `polite` by default — screen reader announces at next pause
- `assertive` only for critical, time-sensitive errors

### Landmark Roles
- Use `<nav>`, `<header>`, `<main>`, `<footer>` for page landmarks
- Multiple navigation blocks have **unique labels** (`aria-label="Main navigation"`)

---

## Component-Specific Checklists

### P0 Critical — Function & Infrastructure

#### Button
- Uses native `<button>` element or proper `role="button"`
- Name clearly describes the action (verb-based)
- Focusable via `Tab`, activated with `Enter` and `Space`
- Disabled button uses `aria-disabled="true"` (stays in tab order)
- Focus indicator visible, never suppressed
- Touch target ≥ 44px (expand with invisible padding if needed)
- Icon-only buttons have `aria-label`
- Toggle buttons use `aria-pressed`
- WCAG: 2.1.1, 2.4.3, 2.4.7, 3.3.2, 4.1.2

#### Navigation (header, sidebar, breadcrumbs)
- Landmark roles used correctly (`<nav>`, `<header>`, `<main>`, `<footer>`)
- Multiple navigation blocks have unique labels
- Skip-to-content link available
- Breadcrumbs use `<nav aria-label="Breadcrumb">` with `<ol>`
- Current page marked with `aria-current="page"`
- WCAG: 1.3.1, 2.1.1, 2.4.1, 2.4.3, 2.4.4, 3.2.3, 4.1.2

#### Forms
- Logical tab order follows visual layout
- Related fields grouped with `fieldset`/`legend`
- No strict time limits (or extension provided)
- Multi-step forms indicate progress
- All inputs have visible, persistent labels
- Error messages linked to fields via `aria-describedby`
- WCAG: 1.3.1, 1.3.5, 2.1.1, 2.4.3, 2.5.8, 3.3.1, 3.3.2, 3.3.3, 4.1.2

#### Modal
- Focus trapped inside modal when open
- `Escape` closes the modal
- Focus returns to trigger element on close
- Backdrop prevents interaction with content behind
- Uses `role="dialog"` with `aria-modal="true"` and `aria-labelledby`
- WCAG: 1.3.1, 2.1.1, 2.1.2, 2.4.3, 4.1.2

### P1 High Impact — Communication

#### Alerts, Toasts, Banners
- Messages use appropriate color contrast
- Status icons have text alternatives
- Importance conveyed through text, not just color
- Auto-dismissing messages allow pause/extension
- Use `role="alert"` or `aria-live` for dynamic messages
- WCAG: 1.3.1, 1.4.1, 2.2.1, 3.3.1, 4.1.2, 4.1.3

#### Dropdowns, Menus, Popovers
- Trigger indicates state via `aria-expanded`
- Relationship linked via `aria-controls`
- Arrow key navigation within open menu
- `Escape` closes and returns focus to trigger
- Current selection indicated via `aria-selected` or `aria-checked`
- WCAG: 1.3.1, 1.4.13, 2.1.1, 2.4.3, 3.2.1, 4.1.2

#### Data Tables
- Proper table markup (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- Header cells defined with `<th>`, scope or `aria-colindex` for complex tables
- Sortable columns indicate sort state via `aria-sort`
- Interactive rows/cells are keyboard navigable
- WCAG: 1.3.1, 1.3.2, 2.1.1, 2.4.3, 4.1.2

#### Loading Patterns
- Loading indicators visible and not obscured
- Content doesn't "jump" when loading completes (use skeleton screens)
- Announce loading state to screen readers (`aria-busy="true"`, `aria-live`)
- Provide timeout warnings for long operations
- WCAG: 1.3.1, 2.2.1, 2.2.2, 2.3.1, 4.1.2, 4.1.3

#### Empty States
- Clear heading describes why area is empty
- Helpful body text provides next step
- Primary action button is clearly labeled and focusable
- Decorative illustrations have `aria-hidden="true"`
- WCAG: 1.1.1, 1.3.1, 2.4.3, 2.4.6, 4.1.3

### P2 Medium Impact — Refinement

#### Tabs
- Tab container: `role="tablist"`, tabs: `role="tab"`, panels: `role="tabpanel"`
- `Arrow Left/Right` to switch, `Tab` to enter panel content
- `aria-selected="true"` on active tab
- `aria-controls` links tab to panel
- WCAG: 1.3.1, 2.1.1, 2.4.3, 2.4.7, 4.1.2

#### Icons
- Decorative icons: `aria-hidden="true"`, `focusable="false"`
- Meaningful icons: provide `aria-label` or `<title>` in SVG
- Icon-only interactive elements MUST have accessible name
- WCAG: 1.1.1, 1.4.1, 1.4.11, 2.1.1, 4.1.2

#### Tooltips
- Appear on both hover AND focus
- Dismissible via `Escape` without moving focus
- Hoverable: user can move pointer over tooltip without it disappearing
- Persistent: remain visible until explicitly dismissed
- Use `role="tooltip"` with `aria-describedby` on trigger
- WCAG: 1.3.1, 1.4.4, 1.4.10, 1.4.13, 2.1.1, 4.1.2

#### Text Truncation & Overflow
- Truncated text provides way to see full content (tooltip or expansion)
- If truncation occurs on a link/button, full label is accessible via `aria-label`
- WCAG: 1.3.1, 1.4.4, 1.4.10

#### Drag & Drop
- Keyboard alternative provided (action menu or move up/down buttons)
- Focusable handles can be activated with `Enter`/`Space`
- Drop zone announced via `aria-live`
- WCAG: 1.3.1, 2.1.1, 2.1.3, 2.5.2, 2.5.7, 4.1.2, 4.1.3

#### AI Output & Suggestions
- AI-generated content visually and programmatically identified (icon + `aria-label="Generated by AI"`)
- Suggestions can be accepted, rejected, or edited via keyboard
- Streaming output doesn't steal focus
- WCAG: 1.3.1, 1.4.1, 2.1.1, 2.2.2, 4.1.2, 4.1.3

---

## General Accessibility Checklist (for audits)

Use this checklist when running `/design-audit` or reviewing any design:

- [ ] Color contrast meets ratios (4.5:1 text, 3:1 UI, 3:1 large text)
- [ ] Color is not the only indicator of state or meaning
- [ ] Minimum body text: 12px. Avoid light weights.
- [ ] Works at 200–400% zoom, no horizontal scrolling
- [ ] Touch targets ≥ 24px minimum (44px ideal)
- [ ] All interactions work via keyboard
- [ ] Focus order is logical, focus indicator is visible
- [ ] Clear accessible name on every interactive element
- [ ] State changes announced (loading, error, success)
- [ ] All states designed (hover, focus, error, disabled)
- [ ] Loading, empty, error states are accessible
- [ ] Disabled state distinguishable and uses `aria-disabled`
- [ ] All form fields have visible labels
- [ ] Errors explain what happened and how to fix
- [ ] Required vs optional is clear
- [ ] Motion isn't required to understand content
- [ ] Reduced motion preference is respected
