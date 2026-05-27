## 11. Components {#components}

### Buttons {#buttons}
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

### Navigation {#navigation}
- Active/current page state uses more than color alone — bold, underline, icon, or `aria-current`.
- Navigation landmark structure (header, nav, main, footer) annotated in specs.
- Sidebar collapse trigger is keyboard accessible; collapsed icon-only views provide tooltips or accessible names.
- Skip link ("Skip to main content") annotated — engineering implements; it becomes visible on focus.
- Breadcrumbs are an ordered list inside a labeled `<nav>`; the current page is not a link and uses `aria-current="page"`.
- Screen reader: each navigation block is announced via its landmark and unique label; menu triggers announce expanded/collapsed state; breadcrumb separators are hidden from assistive technology.

**WCAG criteria:** 1.3.1, 2.1.1, 2.4.1, 2.4.3, 2.4.4, 3.2.3, 4.1.2

### Forms {#forms}
- Every input has a visible label above or beside it — never placeholder-only.
- Required fields marked visually (asterisk) and with `aria-required`.
- Error messages appear adjacent to the relevant field and describe how to fix the problem.
- Use `--zen-border-error` (`1px solid error-600`) for error-state borders.
- Error and success states use icon + color — not color alone.
- Related inputs annotated for fieldset/legend grouping.
- Multi-step forms have a progress indicator; form-level instructions appear at the start, not the end.
- Screen reader: error messages are linked via `aria-describedby`; focus moves to the error summary or first invalid field on submission; success is announced via `aria-live`.

**WCAG criteria:** 1.3.1, 1.3.5, 2.1.1, 2.4.3, 3.3.1, 3.3.2, 3.3.3, 4.1.2

### Modals {#modals}
- Focus moves to the dialog or first interactive element on open.
- Focus returns to the trigger element on close.
- Escape always closes the modal.
- Close button always present with a clear `aria-label`.
- Background content is inert while modal is open.
- Don't auto-dismiss modals containing critical information.
- Touch targets inside the modal are at least 44x44px (or 24px with sufficient spacing).
- Screen reader: announced as a dialog via `role="dialog"` named by its heading (`aria-labelledby`); focus trap and return focus annotated for engineering.

**WCAG criteria:** 1.3.1, 1.3.5, 2.1.1, 2.4.3, 2.5.8, 3.3.1, 3.3.2, 3.3.3, 4.1.2

### Alerts, Toasts & Banners {#alerts-toasts-banners}
- Status communicated by icon + color — not color alone.
- Alert text describes what happened and what to do next.
- Toasts stay visible at least 4 seconds. Do not auto-dismiss if they contain actions.
- Dismissible banners have a keyboard-accessible close button.
- System alerts use `role="alert"`; non-critical banners and toasts use `role="region"` or `role="status"`.
- Screen reader: dynamic toasts and alerts are announced via an `aria-live` region — use `polite` for non-urgent updates, `assertive` only for critical, time-sensitive errors.

**WCAG criteria:** 1.3.1, 1.4.1, 2.2.1, 3.3.1, 4.1.2, 4.1.3

### Dropdowns, Menus & Popovers {#dropdowns-menus-popovers}
- Trigger has a visible label or `aria-label`.
- Keyboard: Enter/Space to open · arrow keys to navigate · Escape to close.
- Menus emerge from their trigger point — not from the screen center.
- Selected item indicated beyond color alone.
- Popovers close on Escape and on focus leaving — no focus trap.
- Popover content stays "hoverable" so users can move the mouse onto it without it disappearing, and is not clipped by the browser edge.
- Screen reader: trigger exposes state via `aria-expanded` and `aria-haspopup`; menu items are announced as a list or group; the current selection (`aria-selected`) and disabled items are announced.

**WCAG criteria:** 1.3.1, 1.4.13, 2.1.1, 2.4.3, 3.2.1, 4.1.2

### Data Tables {#data-tables}
- Column headers labeled. Abbreviations have full names via tooltip or `aria-label`.
- Sort direction indicated beyond color (up/down arrow).
- Row selection uses a checkbox — not color highlight alone.
- Sticky headers don't obscure focused elements (WCAG 2.4.11).
- Empty cells show "—" or "N/A" — not blank.
- Pagination controls keyboard accessible with clear labels.
- Screen reader: real table markup with `<th>` + `scope`; sort state announced via `aria-sort`; row/column counts accurate; an empty table provides a clear message in a row or replacement state.

**WCAG criteria:** 1.3.1, 1.3.2, 2.1.1, 2.4.3, 4.1.2

### Loading Patterns {#loading-patterns}
- Skeleton loaders match the layout they replace.
- Spinners have a text alternative ("Loading…") — annotate for engineering.
- Button loading state changes label (e.g. "Saving…") or has `aria-label`.
- No significant layout shift after loading completes.
- For long waits (over 10 seconds), provide a progress bar with a percentage instead of an infinite spinner.
- Interactive elements are disabled during critical loading to prevent duplicate actions.
- Infinite scroll provides a manual "Load More" or pagination fallback for keyboard users; focus and scroll position are preserved when new data is injected.
- Screen reader: the loading container uses `aria-busy="true"`; status updates use `aria-live="polite"` to announce "Loading…" and the result when complete.

**WCAG criteria:** 1.3.1, 2.1.1, 2.2.1, 2.2.2, 2.3.1, 2.4.3, 3.2.3, 4.1.2, 4.1.3

### Empty States {#empty-states}
- Always include: heading, explanation, and primary action.
- Primary action is a proper button or link — not styled text.
- Distinguish "first use" vs "no results" — different messages needed.
- Informational illustrations are hidden from screen readers (`alt=""` or `aria-hidden="true"`); placeholder graphics are not focusable.
- Screen reader: the change from "loading" or "populated" to "empty" is announced if it happens dynamically; heading levels follow the page hierarchy.

**WCAG criteria:** 1.1.1, 1.3.1, 2.4.3, 2.4.6, 4.1.3

### Tabs {#tabs}
- Active tab uses more than color alone — underline, bold, or background change.
- Left/right arrows navigate between tabs. Enter/Space activates.
- Only the active panel is in the tab order.
- Home/End move focus to the first and last tab.
- Screen reader: tablist, tab, and tabpanel roles applied; tabs linked to panels via `aria-controls`; the active tab announced via `aria-selected="true"`.

**WCAG criteria:** 1.3.1, 2.1.1, 2.4.3, 2.4.7, 4.1.2

### Icons {#icons}
- Icon-only interactive elements have a visible label, tooltip, or `aria-label`.
- Decorative icons annotated as decorative (hidden from screen readers).
- Informational icons have a text alternative.
- Icon color meets 3:1 contrast against its background (WCAG 1.4.11).
- Meaning is not conveyed by color alone — a success checkmark is distinct from an error X by shape.
- Screen reader: icons that repeat adjacent visible text are hidden with `aria-hidden="true"`; status icons carry a text alternative; interactive standalone SVGs have a `<title>` linked via `aria-labelledby`.

**WCAG criteria:** 1.1.1, 1.4.1, 1.4.11, 2.1.1, 4.1.2

### Tooltips {#tooltips}
- Triggered by both hover and keyboard focus.
- Dismiss on Escape or focus leaving the trigger.
- Content is supplementary only — never the sole place critical information appears.
- Tooltip content remains "hoverable" and persistent until hover/focus is removed or the user dismisses it.
- Screen reader: tooltip text is linked to the trigger via `aria-describedby`; for icon-only buttons the tooltip supplies the accessible name via `aria-labelledby`.

**WCAG criteria:** 1.3.1, 1.4.4, 1.4.10, 1.4.13, 2.1.1, 4.1.2

### Truncation & Overflow {#truncation-overflow}
- Truncated text always has a reveal mechanism — tooltip, expand, or detail view.
- Never truncate error messages or critical labels.
- Scrollable containers are keyboard accessible.
- Text is not cut off in a way that changes its meaning (e.g. "$1,000" becoming "$1…").
- Screen reader: when a label or link is truncated, the accessible name still contains the full, un-truncated text; focusable scroll regions have a descriptive `aria-label`. Don't rely on the `title` attribute as the only reveal — it is not accessible to mobile or keyboard-only users.

**WCAG criteria:** 1.3.1, 1.4.4, 1.4.10, 1.4.13, 2.1.1, 4.1.2

### Drag & Drop {#drag-drop}
- Every drag interaction has a keyboard-operable alternative (arrow keys, reorder control, or cut/paste).
- Drag and drop target states designed; valid drop zones are visually highlighted during the drag.
- Drop targets and drag handles meet minimum touch target size (44px on touch).
- Screen reader: state is announced when an item is "Grabbed," "Moved," "Dropped," or "Canceled"; an `aria-live` region announces current position and available targets; clear help text precedes the interaction.

**WCAG criteria:** 1.3.1, 2.1.1, 2.1.3, 2.5.2, 2.5.7, 4.1.2, 4.1.3

### AI Output & Suggestions {#ai-output-suggestions}

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
