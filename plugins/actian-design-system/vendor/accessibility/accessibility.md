# Actian Accessibility Guidelines

<!-- Source-of-truth doc. Hand-edited; not auto-generated. -->
<!-- The plugin vendors this file via vendor-snapshot.yml. -->
<!-- Edit here in volivarii/actian-ds-knowledge — never in the plugin's vendor/ tree. -->
<!-- AUTHORING NOTE: this file = the designer-authored v1.3.0 guidelines + the
     per-component WCAG criteria, screen-reader expectations, and AI Output
     section merged back from the prior version. Author the NEXT version from
     THIS file so that merged detail is preserved. Section ids are auto-derived
     from heading text by scripts/accessibility/derive-a11y-index.js — write
     plain markdown, no manual {#anchor}s. -->

**Version:** 1.3.0
**Last updated:** May 19, 2026

Target standard: **WCAG 2.1 AA**. References: [WCAG 2.1](https://www.w3.org/TR/WCAG21/) · [WebAIM checklist](https://webaim.org/standards/wcag/checklist)

---

## 1. Principles

The four WCAG principles — **Perceivable, Operable, Understandable, Robust** — define what accessible products do. Designers own perceivable and understandable: contrast, hierarchy, labels, states, and interaction patterns. Engineering owns robust and technical implementation.

| Principle | Requirement |
|-----------|------------|
| **Perceivable** | Users must be able to see or hear content (text, images, video) clearly |
| **Operable** | Users must be able to interact with all UI elements (keyboard, gestures) |
| **Understandable** | Content and interface must be predictable and readable |
| **Robust** | Content must work across browsers, assistive technologies, and future devices |

---

## 2. Color & Contrast

| Content type | Min ratio |
|-------------|-----------|
| Normal text (< 18px regular or < 14px bold) | 4.5:1 |
| Large text (≥ 18px regular or ≥ 14px bold) | 3:1 |
| UI components and icons | 3:1 |
| Disabled states | No requirement |

- **Never use color alone to convey information** — always pair with an icon, label, or pattern (WCAG 1.4.1).

---

## 3. Typography

- Minimum size: **11px** — only for non-essential UI (tags, data viz). Default body is 14px, minimum body is 12px.
- Never use light weight (`font-weight: 300`) — fails contrast at small sizes.
- Do not use images of text (WCAG 1.4.5).
- Text must be resizable to 200% without loss of content (WCAG 1.4.4).
- Use `--zen-color-text-default` for body text. Note: `--zen-color-text-primary` is **interactive text** (primary blue) — not body text.
- Placeholder text is not a substitute for a visible label.
- Line length maximums: 544px at 16px · 480px at 14px · 424px at 12px.
- Default paragraph spacing: 8px.

---

## 4. Motion

- All motion respects `prefers-reduced-motion: reduce` — fade transitions disabled, elements toggle visibility instantly.
- No content flashes more than 3 times per second (WCAG 2.3.1).
- State changes communicated by more than motion alone.
- Decorative animations are pauseable.
- `--zen-motion-delay-intent` (300ms) used on hover-triggered tooltips. Note: all motion tokens are 🟡 Proposed — document the intent; engineering implements when tokens ship.

---

## 5. Focus & Keyboard

Focus is the only interactive state handled by a token. Hover, pressed, and disabled use CSS brightness filters — see the Design Foundation.

**Focus ring rules**

- `--zen-focus-ring-primary` (2px solid Royal Blue) + `--zen-focus-ring-offset` (2px) for buttons, links, checkboxes, radios, toggles, tabs, avatars, tags.
- `--zen-focus-ring-error` (2px solid `error-600`) for destructive actions and error-state inputs. Error-600 is intentional — stronger contrast than 500.
- For inputs and textareas: focus ring with no offset — the input border acts as the boundary.
- Focus must never be hidden by sticky headers or overlays (WCAG 2.4.11).
- `:focus-visible` must always be styled — never use `outline: none` without a replacement.

**Keyboard rules**

- All interactive elements reachable by Tab.
- All actions must have a keyboard alternative — annotate when non-obvious.
- Modals trap focus while open; return focus to trigger on close.
- Dropdowns and menus close on Escape.
- No keyboard traps.

**Key bindings by component**

| Component | Keys |
|-----------|------|
| Button | Tab to focus · Enter or Space to activate |
| Link | Tab to focus · Enter to activate |
| Dropdown/Select | Tab to focus · Space/Enter to open · Arrow to navigate · Escape to close |
| Modal | Tab cycles within modal (focus trap) · Escape to close |
| Tabs | Tab to tab list · Arrow Left/Right to switch tabs |
| Menu | Enter/Space to open · Arrow to navigate · Escape to close |
| Data table | Tab between interactive cells · Arrow for cell navigation |

---

## 6. ARIA & Labels

Designers annotate specs. Engineering implements.

| Attribute | When to use |
|-----------|------------|
| `aria-label` | Element has no visible text (icon buttons, close buttons) |
| `aria-labelledby` | A visible element labels another (modal heading → dialog) |
| `aria-describedby` | Additional context beyond the label (helper text, error messages) |
| `aria-required` | Required form inputs |
| `aria-invalid` | Error state inputs |
| `aria-live` | Dynamic regions updating without page reload (toasts, alerts, live search) |
| `aria-hidden` | Decorative icons or repeated visual elements |
| `aria-current` | Active item in navigation, breadcrumbs, tabs |
| `aria-expanded` | Triggers for dropdowns, accordions, collapsible panels |
| `aria-disabled` | Any interactive element that should remain discoverable but not actionable — inputs, links, tabs, menu items, checkboxes, custom components |

- Labels describe purpose, not appearance — "Submit" not "Blue button".
- The accessible name must contain the visible text of the element (the 1:1 rule).
- Grouped inputs (date range, phone + country) have a group label annotated separately.
- First rule of ARIA: if a native HTML element exists (`<button>`, `<nav>`), use it instead of an ARIA role.

---

## 7. Reading Order & Landmarks

- Visual order must match DOM order — don't use CSS to reorder content in ways that differ from the source order.
- Annotate landmark regions in specs: header, nav, main, footer. Screen readers use these to navigate the page.
- Multiple navigation blocks on a page have unique labels (`aria-label="Main"` vs `aria-label="Breadcrumb"`).
- Headings must follow a logical hierarchy (h1 → h2 → h3) — never skip levels for visual styling reasons.

---

## 8. Touch & Pointer

- Hover-only interactions don't work on touch devices — every hover action needs a touch equivalent.
- Touch targets must have adequate spacing between them, not just adequate size — crowded targets cause mis-taps.
- Pointer gestures (swipe, pinch) must have a single-pointer alternative (WCAG 2.5.1). A single-pointer alternative means the action can be done with simple clicks or taps — no holding, no dragging.

---

## 9. Error Prevention

- Destructive or irreversible actions (delete, bulk remove, permanent changes) must require a confirmation step (WCAG 3.3.4).
- Forms with significant data should support undo or review before final submission.
- Auto-save states must be communicated visually and to screen readers.

---

## 10. Session & Timeout Warnings

- If a session can expire, users must be warned before it happens and given a way to extend or save their work (WCAG 2.2.1).
- Timeout warnings must be announced via an ARIA live region — annotate for engineering.
- Do not set session timeouts shorter than 20 hours unless required for security.

---

## 11. Components

### Buttons
- Use a native button element or proper button role; the name clearly describes the action (verb-based).
- Visible text label required. Icon-only buttons need a tooltip or `aria-label`, and the purpose must be understandable without visual context.
- All states designed: default, hover, focus, pressed, disabled. The hit area is not reduced by visual styling.
- Use `aria-disabled` instead of HTML `disabled` to keep the element in the tab order and discoverable — see ARIA & Labels.
- Destructive buttons (Delete, Remove) must be visually distinct beyond color alone.
- Loading state: change the button label (e.g. "Saving…") or add `aria-label` — never leave a spinner with no text alternative. Button must be non-interactive while loading (`aria-disabled`) to prevent duplicate activation.
- Toggle buttons expose their state programmatically; the state change is perceivable without color alone.
- Minimum touch target: `--zen-size-trigger-min` (24px desktop) / `--zen-size-trigger-min-mobile` (44px).
- Screen reader: announced as "button" with a clear name; loading and toggle state changes (pressed / not pressed) are announced.
- Do not use links for actions, rely on hover only, or remove focus styles.

**WCAG criteria:** 2.1.1, 2.4.3, 2.4.7, 3.3.2, 4.1.2, 1.4.1, 2.5.5

### Navigation
- Active/current page state uses more than color alone — bold, underline, icon, or `aria-current`.
- Navigation landmark structure (header, nav, main, footer) annotated in specs.
- Sidebar collapse trigger is keyboard accessible; collapsed icon-only views provide tooltips or accessible names.
- Skip link ("Skip to main content") annotated — engineering implements; it becomes visible on focus.
- Breadcrumbs are an ordered list inside a labeled `<nav>`; the current page is not a link and uses `aria-current="page"`.
- Screen reader: each navigation block is announced via its landmark and unique label; menu triggers announce expanded/collapsed state; breadcrumb separators are hidden from assistive technology.

**WCAG criteria:** 1.3.1, 2.1.1, 2.4.1, 2.4.3, 2.4.4, 3.2.3, 4.1.2

### Forms
- Every input has a visible label above or beside it — never placeholder-only.
- Required fields marked visually (asterisk) and with `aria-required`.
- Error messages appear adjacent to the relevant field and describe how to fix the problem.
- Use `--zen-border-error` (`1px solid error-600`) for error-state borders.
- Error and success states use icon + color — not color alone.
- Related inputs annotated for fieldset/legend grouping.
- Multi-step forms have a progress indicator; form-level instructions appear at the start, not the end.
- Screen reader: error messages are linked via `aria-describedby`; focus moves to the error summary or first invalid field on submission; success is announced via `aria-live`.

**WCAG criteria:** 1.3.1, 1.3.5, 2.1.1, 2.4.3, 3.3.1, 3.3.2, 3.3.3, 4.1.2

### Modals
- Focus moves to the dialog or first interactive element on open.
- Focus returns to the trigger element on close.
- Escape always closes the modal.
- Close button always present with a clear `aria-label`.
- Background content is inert while modal is open.
- Don't auto-dismiss modals containing critical information.
- Touch targets inside the modal are at least 44x44px (or 24px with sufficient spacing).
- Screen reader: announced as a dialog via `role="dialog"` named by its heading (`aria-labelledby`); focus trap and return focus annotated for engineering.

**WCAG criteria:** 1.3.1, 1.3.5, 2.1.1, 2.4.3, 2.5.8, 3.3.1, 3.3.2, 3.3.3, 4.1.2

### Alerts, Toasts & Banners
- Status communicated by icon + color — not color alone.
- Alert text describes what happened and what to do next.
- Toasts stay visible at least 4 seconds. Do not auto-dismiss if they contain actions.
- Dismissible banners have a keyboard-accessible close button.
- System alerts use `role="alert"`; non-critical banners and toasts use `role="region"` or `role="status"`.
- Screen reader: dynamic toasts and alerts are announced via an `aria-live` region — use `polite` for non-urgent updates, `assertive` only for critical, time-sensitive errors.

**WCAG criteria:** 1.3.1, 1.4.1, 2.2.1, 3.3.1, 4.1.2, 4.1.3

### Dropdowns, Menus & Popovers
- Trigger has a visible label or `aria-label`.
- Keyboard: Enter/Space to open · arrow keys to navigate · Escape to close.
- Menus emerge from their trigger point — not from the screen center.
- Selected item indicated beyond color alone.
- Popovers close on Escape and on focus leaving — no focus trap.
- Popover content stays "hoverable" so users can move the mouse onto it without it disappearing, and is not clipped by the browser edge.
- Screen reader: trigger exposes state via `aria-expanded` and `aria-haspopup`; menu items are announced as a list or group; the current selection (`aria-selected`) and disabled items are announced.

**WCAG criteria:** 1.3.1, 1.4.13, 2.1.1, 2.4.3, 3.2.1, 4.1.2

### Data Tables
- Column headers labeled. Abbreviations have full names via tooltip or `aria-label`.
- Sort direction indicated beyond color (up/down arrow).
- Row selection uses a checkbox — not color highlight alone.
- Sticky headers don't obscure focused elements (WCAG 2.4.11).
- Empty cells show "—" or "N/A" — not blank.
- Pagination controls keyboard accessible with clear labels.
- Screen reader: real table markup with `<th>` + `scope`; sort state announced via `aria-sort`; row/column counts accurate; an empty table provides a clear message in a row or replacement state.

**WCAG criteria:** 1.3.1, 1.3.2, 2.1.1, 2.4.3, 4.1.2

### Loading Patterns
- Skeleton loaders match the layout they replace.
- Spinners have a text alternative ("Loading…") — annotate for engineering.
- Button loading state changes label (e.g. "Saving…") or has `aria-label`.
- No significant layout shift after loading completes.
- For long waits (over 10 seconds), provide a progress bar with a percentage instead of an infinite spinner.
- Interactive elements are disabled during critical loading to prevent duplicate actions.
- Infinite scroll provides a manual "Load More" or pagination fallback for keyboard users; focus and scroll position are preserved when new data is injected.
- Screen reader: the loading container uses `aria-busy="true"`; status updates use `aria-live="polite"` to announce "Loading…" and the result when complete.

**WCAG criteria:** 1.3.1, 2.1.1, 2.2.1, 2.2.2, 2.3.1, 2.4.3, 3.2.3, 4.1.2, 4.1.3

### Empty States
- Always include: heading, explanation, and primary action.
- Primary action is a proper button or link — not styled text.
- Distinguish "first use" vs "no results" — different messages needed.
- Informational illustrations are hidden from screen readers (`alt=""` or `aria-hidden="true"`); placeholder graphics are not focusable.
- Screen reader: the change from "loading" or "populated" to "empty" is announced if it happens dynamically; heading levels follow the page hierarchy.

**WCAG criteria:** 1.1.1, 1.3.1, 2.4.3, 2.4.6, 4.1.3

### Tabs
- Active tab uses more than color alone — underline, bold, or background change.
- Left/right arrows navigate between tabs. Enter/Space activates.
- Only the active panel is in the tab order.
- Home/End move focus to the first and last tab.
- Screen reader: tablist, tab, and tabpanel roles applied; tabs linked to panels via `aria-controls`; the active tab announced via `aria-selected="true"`.

**WCAG criteria:** 1.3.1, 2.1.1, 2.4.3, 2.4.7, 4.1.2

### Icons
- Icon-only interactive elements have a visible label, tooltip, or `aria-label`.
- Decorative icons annotated as decorative (hidden from screen readers).
- Informational icons have a text alternative.
- Icon color meets 3:1 contrast against its background (WCAG 1.4.11).
- Meaning is not conveyed by color alone — a success checkmark is distinct from an error X by shape.
- Screen reader: icons that repeat adjacent visible text are hidden with `aria-hidden="true"`; status icons carry a text alternative; interactive standalone SVGs have a `<title>` linked via `aria-labelledby`.

**WCAG criteria:** 1.1.1, 1.4.1, 1.4.11, 2.1.1, 4.1.2

### Tooltips
- Triggered by both hover and keyboard focus.
- Dismiss on Escape or focus leaving the trigger.
- Content is supplementary only — never the sole place critical information appears.
- Tooltip content remains "hoverable" and persistent until hover/focus is removed or the user dismisses it.
- Screen reader: tooltip text is linked to the trigger via `aria-describedby`; for icon-only buttons the tooltip supplies the accessible name via `aria-labelledby`.

**WCAG criteria:** 1.3.1, 1.4.4, 1.4.10, 1.4.13, 2.1.1, 4.1.2

### Truncation & Overflow
- Truncated text always has a reveal mechanism — tooltip, expand, or detail view.
- Never truncate error messages or critical labels.
- Scrollable containers are keyboard accessible.
- Text is not cut off in a way that changes its meaning (e.g. "$1,000" becoming "$1…").
- Screen reader: when a label or link is truncated, the accessible name still contains the full, un-truncated text; focusable scroll regions have a descriptive `aria-label`. Don't rely on the `title` attribute as the only reveal — it is not accessible to mobile or keyboard-only users.

**WCAG criteria:** 1.3.1, 1.4.4, 1.4.10, 1.4.13, 2.1.1, 4.1.2

### Drag & Drop
- Every drag interaction has a keyboard-operable alternative (arrow keys, reorder control, or cut/paste).
- Drag and drop target states designed; valid drop zones are visually highlighted during the drag.
- Drop targets and drag handles meet minimum touch target size (44px on touch).
- Screen reader: state is announced when an item is "Grabbed," "Moved," "Dropped," or "Canceled"; an `aria-live` region announces current position and available targets; clear help text precedes the interaction.

**WCAG criteria:** 1.3.1, 2.1.1, 2.1.3, 2.5.2, 2.5.7, 4.1.2, 4.1.3

### AI Output & Suggestions

**Transparency & Identification**
- AI-generated content is visually and programmatically identified (e.g. a "Sparkle" icon with `aria-label="Generated by AI"`).
- Suggestions are clearly distinguished from primary page content.
- Confidence scores or "Source" links are provided so users can verify information.
- A disclaimer regarding AI accuracy is provided and easily discoverable.

**Interaction & Controls**
- AI suggestions (autocomplete, smart replies) are reachable and dismissible via keyboard.
- Users can easily "Accept," "Regenerate," or "Discard" AI outputs.
- Feedback mechanisms (thumbs up/down) have clear accessible names.
- Stop/Cancel buttons are available for long-running generative tasks.

**Screen Reader Expectations**
- New AI output is announced via `aria-live="polite"` so users know when generation is complete.
- Typing/streaming animations ("AI is thinking…") use `aria-busy="true"` and are announced.
- Suggested text in inputs (ghost text) is not announced as part of the current value until accepted.
- Large blocks of AI text use proper heading structures to allow easy skimming.

**Motion & Loading**
- Streaming text (typewriter effect) respects `prefers-reduced-motion` and can be disabled.
- "Thinking" animations do not use high-frequency flashes.

**Do not**
- Do not automatically inject AI content into the user's focus path without warning.
- Do not rely on color-only gradients (like "AI purple") to signal that content is generated.
- Do not make AI suggestions mandatory — users must be able to bypass them to complete a task.

**WCAG criteria:** 1.3.1, 1.4.1, 2.1.1, 2.2.2, 4.1.2, 4.1.3

---

## 12. Designer Handoff Checklist

Use before every handoff or design review.

### Color & Contrast
- [ ] All text meets contrast minimum (4.5:1 normal · 3:1 large)
- [ ] UI component boundaries meet 3:1 against background
- [ ] No information conveyed by color alone
- [ ] Contrast verified in reverse/dark contexts where applicable

### Typography & Content
- [ ] No text smaller than 11px
- [ ] All inputs have visible labels — no placeholder-only fields
- [ ] Error messages describe the problem and how to fix it
- [ ] No images of text
- [ ] Line lengths within limits for the font size

### Focus & Interaction
- [ ] All interactive elements have a designed focus state
- [ ] Focus order is logical — annotated if non-standard
- [ ] All actions have a keyboard alternative documented
- [ ] Touch targets meet minimums (24px desktop · 44px mobile)

### States
- [ ] All interactive states designed: default, hover, focus, pressed, disabled, error
- [ ] Empty, loading, and error states included for data-driven components
- [ ] State changes use more than one signal — icon + color, not color alone

### Labels & Annotations
- [ ] Icon-only elements have `aria-label` documented
- [ ] Decorative icons marked as decorative
- [ ] Dynamic regions annotated with `aria-live`
- [ ] Modal focus trap and return focus documented
- [ ] Form groupings and required fields annotated
- [ ] Drag interactions have keyboard alternatives noted

### Reading Order & Touch
- [ ] Visual order matches intended reading order — annotated if non-standard
- [ ] Landmark regions annotated (header, nav, main, footer)
- [ ] Heading hierarchy is logical — no skipped levels
- [ ] Hover interactions have touch equivalents documented
- [ ] Destructive/irreversible actions have confirmation step noted

### Motion
- [ ] Reduced motion behavior noted for all animated components
- [ ] No content flashes more than 3 times per second
