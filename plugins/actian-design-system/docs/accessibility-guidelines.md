# Accessibility Guidelines — Actian Design System 2026

<!-- AUTO-GENERATED from docs/foundations/accessibility.json -->
<!-- To update: run /sync-guidelines or /sync-design-system -->
<!-- Do not edit manually — changes will be overwritten -->

Source: [Accessibility page](https://www.figma.com/design/<DS2026_FILE_KEY>?node-id=12685:19373)
Generated: 2026-03-26

---

> Accessibility ensures our products are usable by everyone. We aim to meet WCAG 2.2 AA standards across all experiences.
>
> **Resources:**
> - [WCAG 2.2 guidelines](https://www.w3.org/TR/WCAG22/)
> - [WebAIM Accessibility Guidelines](https://webaim.org/)
> - [Deque University Free Accessibility Courses](https://dequeuniversity.com/)
>
> **Focus on section:**
> - Text Alternatives (1.1) — Alt text for images, icons, and media.
> - Time-based Media (1.2) — Captions, transcripts, audio descriptions.
> - Adaptable / Distinguishable Content (1.3 & 1.4) — Color contrast, readable text, resizing, focus indicators.
> - Keyboard & Navigation (2.1, 2.4) — Keyboard operability, focus order, skip links.
> - Input & Interaction (2.2, 2.3) — Dragging alternatives, timing, animations.
> - Error Prevention & Feedback (3.3) — Forms, validation, error messages.

---

## WCAG Principles

### WCAG 2.2 AA Principles

| Principle | Requirement |
|-----------|-------------|
| **Perceivable** | Users must be able to see or hear content (text, images, video) clearly |
| **Operable** | Users must be able to interact with all UI elements (keyboard, gestures) |
| **Understandable** | Content and interface must be predictable and readable |
| **Robust** | Content must work across browsers, assistive technologies, and future devices |

---

## Color & Contrast

| Check | Ratio |
|-------|-------|
| Body text (< 18pt) | **4.5:1** minimum |
| Large text (≥ 18pt or 14pt bold) | **3:1** minimum |
| UI components, icons, focus indicators | **3:1** minimum |

Rules:
- Use accessible color palettes and tokens — never hardcode
- Do not rely on color alone to convey meaning
- Provide secondary indicators (icons, text, patterns)

---

## Typography & Readability

- Default body text size is **14px**
- Minimum body text size is **12px**
- **11px** is only acceptable for non-essential UI
- Use defined type styles (avoid light weight)
- Maintain readable line height and spacing
- Text line length is **544px** at max with 16px text
- Text line length is **480px** at max with 14px text
- Text line length is **424px** at max with 12px text
- Avoid placeholder-only labels
- Avoid long blocks of dense text
- Text must be resizable up to 200% without loss of content
- Paragraph width: 60–75 characters max for readability

---

## Layout & Responsiveness

- Content reflows at **400% zoom**
- No horizontal scrolling for text content
- Logical reading and focus order preserved
- Touch targets: **44px ideal / 24px minimum** with sufficient spacing (WCAG 2.5.8)
- No content clipped or hidden at 200% zoom

---

## Keyboard & Focus

### Keyboard

- All interactive elements are keyboard accessible
- No keyboard traps
- Logical focus order

### Key Rules

- Use `Tab` for forward and `Shift+Tab` for backward
- Only focusable items that are visually visible should be in the tab order
- Use `Enter` or `Space` to trigger links and expand/collapse buttons
- Support `Enter` or `Space` to activate links and toggles
- `Esc` should close open sub-menus or an expanded sidebar

### Focus

- Focus styles must be visible
- Focus must not be obscured by sticky UI
- Never remove focus outlines without replacement
- Focus indicator: **2px solid `--zen-color-interactive-focused-stroke-default`** (#000000), never suppressed
- `:focus-visible` must always be styled — never use `outline: none` without a replacement

---

## Interactions

- Dragging interactions should also provide single-pointer or keyboard alternative. A single-pointer alternative means the action can be done with simple clicks or taps (no holding, no dragging).
- Avoid time limits. Provide extensions if needed.
- Tooltips must be accessible also by keyboard.

---

## Required States

Every interactive component must have these states designed:

| State | Requirement |
|-------|-------------|
| **Default** | Base visual appearance |
| **Hover** | Visual change on mouse hover |
| **Focus** | Visible focus indicator (keyboard) — never remove |
| **Active/Pressed** | Visual feedback during click/tap |
| **Disabled** | Visually distinct, `aria-disabled="true"` preferred over HTML `disabled` |
| **Error / Success** | For form elements — error message + visual indicator |

---

## Feedback & Errors

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

## Motion & Media

- Motion is never the only feedback
- Reduce motion or provide toggle for sensitive users
- Avoid auto-play without controls
- Keep animations subtle and purposeful

---

## Component-Specific Checklists

### P0 Critical: Function & Infrastructure

> Critical items are the structural essentials. If Navigation, Forms, or Buttons fail, the user is physically blocked. These are the paths and entry points required to actually use the product.
>
> - **Navigation:** Defines the entire site structure and landmarks.
> - **Forms (Patterns & Inputs):** The primary way users provide data.
> - **Modals:** High risk for focus traps and keyboard locking.
> - **Buttons:** The primary triggers for all actions.

---

#### Button

> Buttons translate user intent into system action. If buttons fail (are unclear or broken), the workflow hits a dead end, leaving users physically unable to complete tasks.

**Accessibility checklist**

Button semantics
- [ ] Uses a native button element or proper button role
- [ ] Name clearly describes the action (verb-based)

Keyboard interaction
- [ ] Focusable via Tab
- [ ] Activated with Enter and Space
- [ ] Disabled buttons are not focusable

Target size
- [ ] Recommended: 44x44 px minimum
- [ ] Absolute minimum: 24x24 px with sufficient spacing
- [ ] Hit area is not reduced by visual styling

States
- [ ] Default, hover, focus, active, disabled states are defined
- [ ] Loading state prevents duplicate activation
- [ ] Disabled state is visually and programmatically disabled

Icon-only buttons
- [ ] Has an accessible name (e.g. aria-label)
- [ ] Purpose is understandable without visual context

Toggle buttons
- [ ] Toggle state is programmatically exposed
- [ ] State change is perceivable without color alone

Screen reader expectations
- [ ] Announced as "button" with a clear name
- [ ] Loading or state changes are announced when relevant
- [ ] Toggle buttons announce current state (pressed / not pressed)

Do not
- [ ] Do not use links for actions
- [ ] Do not rely on hover only
- [ ] Do not remove focus styles

**WCAG criteria:** 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 3.3.2 Labels or Instructions, 4.1.2 Name Role Value, 1.4.1 Use of Color, 2.5.5 Target Size (2.2)

---

#### Navigation (header, sidebar, breadcrumbs)

> Navigation patterns define the structural map of your product. If navigation fails, users feel disoriented and abandon the application because they literally cannot find the features they need to do their job.

**Accessibility checklist**

General Navigation
- [ ] Landmark roles are used correctly (`<nav>`, `<header>`, `<main>`, `<footer>`)
- [ ] Multiple navigation blocks on a page have unique labels (e.g., `aria-label="Main"` vs `aria-label="Breadcrumb"`)
- [ ] "Skip to main content" link is available and becomes visible on focus
- [ ] The current page is visually and programmatically identified (e.g., `aria-current="page"`)

Header & Main Menu
- [ ] Navigation links have a minimum target size of 44x44px (or 24px with spacing)
- [ ] Dropdown menus are operable via keyboard (Space/Enter to open, Arrow keys to navigate)
- [ ] Menu triggers clearly indicate their state (e.g., `aria-expanded="true/false"`)
- [ ] Sub-menus can be dismissed with the Esc key

Sidebar
- [ ] Sidebar can be collapsed/expanded, and the state is programmatically exposed
- [ ] When collapsed to an icon-only view, tooltips or accessible names are provided
- [ ] On mobile/narrow viewports, the sidebar behaves like a Modal (Focus trap/Esc to close)
- [ ] Active parent categories are clearly distinguished from active child items

Breadcrumbs
- [ ] Breadcrumbs are wrapped in a `<nav>` element with a label (e.g., `aria-label="Breadcrumb"`)
- [ ] Breadcrumbs are structured as an ordered list (`<ol>`)
- [ ] The last item (current page) is not a clickable link and uses `aria-current="page"`
- [ ] Separators (like `/` or `>`) are hidden from screen readers using `aria-hidden="true"` or CSS

Do not
- [ ] Do not rely on hover alone to reveal sub-navigation (must work on click/focus)
- [ ] Do not use "hamburger" menus on desktop if space allows for visible links
- [ ] Do not lose the user's focus when a navigation item disappears (e.g., when closing a drawer)

**WCAG criteria:** 1.3.1 Info and Relationships, 2.1.1 Keyboard, 2.4.1 Bypass Blocks, 2.4.3 Focus Order, 2.4.4 Link Purpose (In Context), 3.2.3 Consistent Navigation, 4.1.2 Name Role Value

---

#### Forms

> Forms serve as the primary bridge for data collection. If forms fail (poor validation or labels), users experience high friction and error rates, resulting in abandoned processes and lost data.

**Accessibility checklist**

Structure and Flow
- [ ] Logical tab order follows the visual layout
- [ ] Related fields are grouped together (using fieldsets/legends)
- [ ] Form does not have a strict time limit (or provides an extension)
- [ ] Multi-step forms have a progress indicator

Labels and Instructions
- [ ] Every input has a permanent, visible label (not just placeholder text)
- [ ] Instructions or formatting hints are programmatically linked to inputs
- [ ] Required fields are clearly identified via text and `aria-required`
- [ ] Form level instructions are provided at the start, not the end

Touch and Interaction
- [ ] Proximity between label and input is close enough for low-vision users
- [ ] Inputs have a minimum height/width (standard: 44px) for easy tapping
- [ ] Clicking a label places focus into the corresponding input field

Error Handling
- [ ] Errors are identified in text, not just by color changes
- [ ] Error messages are programmatically linked to the input (using `aria-describedby`)
- [ ] Error messages provide specific suggestions on how to fix the issue
- [ ] Focus is moved to the error summary or the first invalid field upon submission

Submission and Feedback
- [ ] Submit button is clearly labeled and easy to find
- [ ] Success messages are announced by screen readers (using `aria-live`)
- [ ] Confirmations are provided before irreversible "destructive" actions

Do not
- [ ] Do not use placeholder text as a replacement for labels
- [ ] Do not automatically move focus (auto-tab) once a field is completed
- [ ] Do not use "Reset" or "Clear Form" buttons (they are high-risk for accidental deletion)

**WCAG criteria:** 1.3.1 Info and Relationships, 1.3.5 Identify Input Purpose, 2.1.1 Keyboard, 2.4.3 Focus Order, 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 3.3.3 Error Suggestion, 4.1.2 Name Role Value

---

#### Modal

> Modals demand immediate attention by interrupting the workflow. If modals fail (e.g., keyboard traps), users become physically stuck in the layer and cannot return to the main content to finish their work.

**Accessibility checklist**

Structure and Flow
- [ ] Logical tab order follows the visual layout
- [ ] Related fields are grouped together (using fieldsets/legends)
- [ ] Form does not have a strict time limit (or provides an extension)
- [ ] Multi-step forms have a progress indicator

Labels and Instructions
- [ ] Every input has a permanent, visible label
- [ ] Instructions or formatting hints are programmatically linked to inputs
- [ ] Required fields are identified via text and `aria-required`
- [ ] Form-level instructions are provided at the start of the flow

Touch and Interaction
- [ ] Touch targets are at least 44x44px (or 24px with sufficient spacing)
- [ ] Proximity between label and input is close for low-vision users
- [ ] Clicking a label places focus into the corresponding input field

Error Handling
- [ ] Errors are identified in text, not just by color changes
- [ ] Error messages are programmatically linked to the input via `aria-describedby`
- [ ] Error messages provide specific suggestions on how to fix the issue
- [ ] Focus is moved to the error summary or first invalid field upon submission

Do not
- [ ] Do not use placeholder text as a replacement for labels
- [ ] Do not automatically move focus (auto-tab) once a field is completed
- [ ] Do not use "Reset" or "Clear Form" buttons

**WCAG criteria:** 1.3.1 Info and Relationships, 1.3.5 Identify Input Purpose, 2.1.1 Keyboard, 2.4.3 Focus Order, 2.5.8 Target Size (Minimum), 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 3.3.3 Error Suggestion, 4.1.2 Name Role Value

---

### P1 High Impact: Communication

> High Impact items act as the system's voice. They provide necessary feedback and organization so the user knows what is happening. Without them, the user feels lost, ignored, or confused.
>
> - **Alerts, Banners & Toasts:** Essential for error recovery and status updates.
> - **Dropdowns, Menus & Popovers:** Complex interaction layers.
> - **Data Tables:** Critical for information-heavy applications.
> - **Loading & Empty States:** Provides necessary system feedback.

---

#### Alerts, Toasts, Banners

> Feedback mechanisms communicate the outcome of interactions. If feedback fails, users are left guessing if their action worked, leading to repeated clicks, anxiety, and mistrust in the system.

**Accessibility checklist**

General Messaging
- [ ] Messages use appropriate color contrast for text and icons
- [ ] Icons used to indicate status (Error, Success, Warning) have text alternatives
- [ ] Importance of the message is conveyed through text, not just color
- [ ] Critical alerts are placed where they are visually and programmatically easy to find

Global Banners (In-page)
- [ ] Banners are placed at the top of the page or section they relate to
- [ ] Banners are programmatically identified using `role="region"` or `role="status"`
- [ ] If the banner is a "System Alert" (e.g., "Site maintenance in 10 mins"), it uses `role="alert"`
- [ ] Persistent banners include a clear "Dismiss" button if they can be closed

Toasts
- [ ] Toasts use `role="status"` (polite) for non-critical feedback (e.g., "Settings saved")
- [ ] Toasts do not contain critical actions (links/buttons) as they disappear too fast
- [ ] Display time is sufficient for users to read (minimum 5-10 seconds)
- [ ] Users can disable or extend the duration of auto-expiring messages
- [ ] Toasts do not block interaction with the rest of the page

Inline Alerts
- [ ] Alerts are placed in close proximity to the related content (e.g., near the Submit button)
- [ ] Dynamic alerts (appearing after an action) use `aria-live` to be announced immediately
- [ ] Alert remains visible until the user resolves the issue or dismisses it

Do not
- [ ] Do not use auto-dismissing toasts for critical errors or information
- [ ] Do not use "Assertive" live regions for non-urgent updates (it interrupts the screen reader mid-sentence)
- [ ] Do not put focusable elements (like links) inside a toast that auto-dismisses

**WCAG criteria:** 1.3.1 Info and Relationships, 1.4.1 Use of Color, 2.2.1 Timing Adjustable, 3.3.1 Error Identification, 4.1.2 Name Role Value, 4.1.3 Status Messages

---

#### Dropdowns, Menus, and Popovers

> Dropdowns manage screen real estate by collapsing options. If dropdowns fail, essential features remain hidden or become impossible to reach for users relying on keyboards.

**Accessibility checklist**

Triggers & States
- [ ] Trigger clearly indicates its state via `aria-expanded="true/false"`
- [ ] The relationship between the trigger and the container is linked via `aria-controls` or `aria-owns`
- [ ] Focus is visible on the trigger when active
- [ ] If the menu contains a list of choices, the trigger has `aria-haspopup="menu"` (or `"listbox"` for selects)

Keyboard interaction
- [ ] Open: Space or Enter opens the menu
- [ ] Close: Esc key closes the menu and returns focus to the trigger
- [ ] Navigation: Arrow keys move focus between items within the menu
- [ ] Dismissal: Clicking outside the container or moving focus away closes the popover

Popovers & Tooltips
- [ ] Popovers do not open on hover alone (must be triggerable by click or focus)
- [ ] Content remains visible and "hoverable" so users can move their mouse over the popover without it disappearing
- [ ] Tooltips that appear on focus are dismissible via Esc without moving focus

Screen reader expectations
- [ ] Menu items are identified as a list or group
- [ ] Current selection is programmatically identified (e.g., `aria-selected="true"`)
- [ ] Disabled items are announced as disabled and are not focusable

Do not
- [ ] Do not use "Auto-tab" or move focus automatically when a selection is made
- [ ] Do not hide important information inside a hover-only tooltip
- [ ] Do not allow the popover to be cut off by the browser edge (ensuring visibility for zoomed-in users)

**WCAG criteria:** 1.3.1 Info and Relationships, 1.4.13 Content on Hover or Focus, 2.1.1 Keyboard, 2.4.3 Focus Order, 3.2.1 On Focus, 4.1.2 Name Role Value

---

#### Data Tables

> Data tables organize high-density information for scanning. If tables fail, complex data becomes an unreadable wall of text, preventing users from comparing values or making informed decisions.

**Accessibility checklist**

Structure & Semantics
- [ ] Proper table markup is used (`<table>`, `<thead>`, `<tbody>`, `<tr>`)
- [ ] Header cells are defined using `<th>` and data cells using `<td>`
- [ ] Header cells use the `scope` attribute (`col` or `row`) to define their direction
- [ ] Complex tables with multiple levels of headers use `id` and `headers` attributes
- [ ] A `<caption>` is provided to describe the table's content and purpose

Keyboard Interaction
- [ ] Sortable Headers: Sorting triggers are keyboard-focusable and clearly labeled
- [ ] Interactive Elements: Buttons or links within cells are reachable via Tab
- [ ] Scrollable Containers: If the table overflows horizontally, the container is keyboard-focusable so it can be scrolled

Screen Reader Expectations
- [ ] Sorting state is announced (e.g., `aria-sort="ascending"`)
- [ ] Row and column counts are accurate and announced
- [ ] Hidden or decorative elements within cells are hidden from assistive technology
- [ ] If the table is empty, a clear message is provided within a table row or as a replacement state

Visual Design
- [ ] Text within cells meets contrast requirements (4.5:1)
- [ ] Row highlights (on hover or focus) assist with horizontal tracking
- [ ] Alignment is consistent (e.g., numeric data is right-aligned) to aid readability

Do not
- [ ] Do not use tables for layout purposes; only use them for tabular data
- [ ] Do not use images of tables; use real text and markup
- [ ] Do not nest tables within tables whenever possible

**WCAG criteria:** 1.3.1 Info and Relationships, 1.3.2 Meaningful Sequence, 2.1.1 Keyboard, 2.4.3 Focus Order, 4.1.2 Name Role Value

---

#### Loading Patterns (Table)

> Table loading patterns dictate how users navigate large datasets. If these fail, users lose their context or become trapped in scroll loops, physically preventing them from reaching the data.

**Accessibility checklist**

Pagination
- [ ] Provides a clear "Page X of Y" text indicator
- [ ] "Previous" and "Next" buttons have clear labels and are disabled when at the start/end
- [ ] The current page is programmatically identified using `aria-current="page"`
- [ ] Focus is moved to the top of the table (or the table caption) after a page change
- [ ] Navigation links are wrapped in a `<nav>` element with an `aria-label="Pagination"`

Load More
- [ ] The "Load More" button is located immediately after the table
- [ ] New rows are appended to the existing table structure, not replacing it
- [ ] Focus remains on the "Load More" button after clicking to allow for consecutive loading
- [ ] A status message announces the result of the load (e.g., "10 more rows added, 50 total")
- [ ] A loading indicator appears within or near the button while the request is in progress

Infinite Scroll (Table)
- [ ] Keyboard Fallback: A manual "Load More" button or pagination is provided for keyboard users
- [ ] Screen readers are notified when new content is added via an `aria-live` region
- [ ] Users can still access the page footer via keyboard without being "trapped" by infinite loading
- [ ] A "Back to Top" link is provided if the table becomes exceptionally long

Do not
- [ ] Do not use infinite scroll as the only way to access data for keyboard users
- [ ] Do not lose the user's focus or scroll position when new data is injected
- [ ] Do not use pagination for very small datasets (usually under 25 items)

**WCAG criteria:** 1.3.1 Info and Relationships, 2.1.1 Keyboard, 2.4.3 Focus Order, 3.2.3 Consistent Navigation, 4.1.2 Name Role Value, 4.1.3 Status Messages

---

#### Loading Patterns (Feedback/content)

> Loading patterns communicate system status and manage perceived wait times. If these indicators fail, users assume the application is frozen, leading to frustration, "rage clicks," or abandonment.

**Accessibility checklist**

Visual & Interaction
- [ ] Loading indicators are visible and not obscured by other UI elements
- [ ] Content does not "jump" unexpectedly when loading is complete (use skeleton screens for layout stability)
- [ ] Interactive elements (buttons, inputs) are disabled during critical loading to prevent duplicate actions
- [ ] For long waits (over 10 seconds), a progress bar with a percentage is provided instead of an infinite spinner
- [ ] Focus is maintained and not lost if a loading state replaces the current content

Screen Reader Expectations
- [ ] Live Regions: Use `aria-busy="true"` on the container currently loading
- [ ] Status updates use `aria-live="polite"` to announce "Loading..." or "Processing..."
- [ ] When loading is finished, `aria-busy` is set to false and the new content is announced
- [ ] Spinners or loaders have an accessible label (e.g., `aria-label="Fetching data"`)

Motion
- [ ] Animation respects the `prefers-reduced-motion` media query (slow down or stop rotation)
- [ ] Loading animations do not flash more than three times per second

Do not
- [ ] Do not use `aria-live="assertive"` for standard loading as it interrupts current screen reader speech
- [ ] Do not leave the user in an "infinite" loading state without a timeout or error message
- [ ] Do not use color alone to indicate that a process is complete

**WCAG criteria:** 1.3.1 Info and Relationships, 2.2.1 Timing Adjustable, 2.2.2 Pause Stop Hide, 2.3.1 Three Flashes or Below Threshold, 4.1.2 Name Role Value, 4.1.3 Status Messages

---

#### Empty States

> Empty states turn a "zero-data" moment into an onboarding opportunity. If empty states fail (showing just a blank page), users face a dead end with no clue how to initiate the first step.

**Accessibility checklist**

Content & Context
- [ ] Clear heading describes why the area is empty (e.g., "No results found")
- [ ] Helpful body text provides a next step or explanation
- [ ] Primary action button is clearly labeled and follows Button guidelines
- [ ] Informational images or illustrations are hidden from screen readers (`alt=""` or `aria-hidden="true"`)

Focus & Navigation
- [ ] Focus is managed logically if the empty state appears dynamically (e.g., after a search)
- [ ] Empty state is contained within the appropriate landmark (e.g., inside the `<main>` or a specific `<section>`)
- [ ] Non-interactive "placeholder" graphics are not focusable

Screen reader expectations
- [ ] The change from "loading" or "populated" to "empty" is announced if it happens dynamically
- [ ] Heading levels follow the page hierarchy (usually an `<h3>` or `<h4>`)
- [ ] If the empty state is a result of a filter, the status is announced (e.g., "0 items match your filters")

Do not
- [ ] Do not use "cute" or vague copy that fails to explain the state (e.g., "Oops, nothing here!")
- [ ] Do not use images to convey the only "Empty" message without a text fallback
- [ ] Do not leave the user with no "path back" (always provide a reset or "Go home" action)

**WCAG criteria:** 1.1.1 Non-text Content, 1.3.1 Info and Relationships, 2.4.3 Focus Order, 2.4.6 Headings and Labels, 4.1.3 Status Messages

---

### P2 Medium Impact: Refinement

> Medium Impact items are the "quality of life" features. They manage space and provide extra utility to make the UI feel intuitive. They don't stop the work, but they make it feel significantly faster and more efficient.
>
> - **Tabs:** Organizes content within a page.
> - **Icons:** Visual support for meaning.
> - **Tooltips, Truncation & Overflow:** Handles space constraints.
> - **Drag & Drop:** Usually has a simpler alternative interaction.
> - **AI Output:** Highly specific to modern generative features.

---

#### Tabs

> Tabs organize content into logical, parallel views. If tabs fail, users miss critical content hidden in other panels or lose context of where they are in the hierarchy.

**Accessibility checklist**

Structure & Relationships
- [ ] The tab container is identified with `role="tablist"`
- [ ] Each tab trigger has `role="tab"` and is contained within the tablist
- [ ] Each content panel has `role="tabpanel"`
- [ ] Tabs are programmatically linked to their panels via `aria-controls`
- [ ] The active tab is identified using `aria-selected="true"`

Keyboard Interaction
- [ ] Tab key: Moves focus into the tablist (to the active tab) and then out to the active panel
- [ ] Arrow keys: Left/Right (or Up/Down) moves focus between the tabs in the list
- [ ] Home/End: Moves focus to the first and last tab respectively
- [ ] Space/Enter: Activates the focused tab (if not using automatic activation)

Visual Design
- [ ] The active tab has a clear visual distinction (not just color)
- [ ] The focus indicator is highly visible on the tab triggers
- [ ] Layout remains functional and readable when text is resized or zoomed

Do not
- [ ] Do not nest tab sets inside other tab sets
- [ ] Do not use tabs for primary page navigation (use a Navigation pattern instead)
- [ ] Do not force the user to "Tab" through every single tab in the list to reach the content panel (use Arrow keys for list navigation)

**WCAG criteria:** 1.3.1 Info and Relationships, 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 4.1.2 Name Role Value

---

#### Icons

> Icons provide a universal visual shorthand. If icons fail (are ambiguous or lack labels), users are forced to guess the function, increasing cognitive load and error rates.

**Accessibility checklist**

Decorative Icons
- [ ] Icons that repeat a visible text label are hidden using `aria-hidden="true"`
- [ ] SVGs used for decoration include `focusable="false"` to prevent IE/Edge focus bugs
- [ ] Purely aesthetic icons (like background flourishes) are ignored by screen readers

Functional & Informational Icons
- [ ] Icon-only buttons (e.g., a "trash can" icon) have a clear `aria-label` or title
- [ ] Icons that convey status (e.g., an "Error" exclamation mark) have a text alternative
- [ ] Interactive icons meet the minimum touch target of 44x44px (or 24px with spacing)
- [ ] Standalone icons have a `<title>` element inside the SVG linked via `aria-labelledby`

Visual Design
- [ ] Icons meet color contrast requirements (3:1 for graphical objects)
- [ ] Icons remain sharp and legible when the interface is zoomed to 400%
- [ ] Meaning is not conveyed by color alone (e.g., a "Success" checkmark is distinct from an "Error" X by shape)

Do not
- [ ] Do not use alt text for icons that are already described by adjacent text
- [ ] Do not use complex icons that lose meaning when scaled down
- [ ] Do not leave SVGs "naked" without roles or labels if they are interactive

**WCAG criteria:** 1.1.1 Non-text Content, 1.4.1 Use of Color, 1.4.11 Non-text Contrast, 2.1.1 Keyboard, 4.1.2 Name Role Value

---

#### Tooltips

> Tooltips deliver contextual assistance on demand. If tooltips fail (don't trigger or won't dismiss), they either obscure content or leave users confused about complex terminology.

**Accessibility checklist**

Trigger & Display
- [ ] Tooltips appear on both hover and focus.
- [ ] Tooltips are dismissible: The user can close the tooltip (e.g., via Esc key) without moving focus or hover.
- [ ] Tooltips are hoverable: The user can move the mouse pointer over the tooltip content without it disappearing.
- [ ] Tooltips are persistent: The content remains visible until the hover/focus is removed or the user dismisses it.
- [ ] No critical information is hidden exclusively inside a tooltip.

Screen Reader Expectations
- [ ] The tooltip text is programmatically linked to the trigger using `aria-describedby`.
- [ ] For icon-only buttons, the tooltip provides the `aria-label` or name (using `aria-labelledby`).

Do not
- [ ] Do not use tooltips for interactive content (links, buttons) as they are hard to access for some users.
- [ ] Do not add a delay before the tooltip appears for keyboard users.

**WCAG criteria:** 1.3.1 Info and Relationships, 1.4.4 Resize Text, 1.4.10 Reflow, 1.4.13 Content on Hover or Focus, 2.1.1 Keyboard, 4.1.2 Name Role Value

---

#### Text Truncation & Overflow

> Truncation manages variable content length within fixed layouts. If truncation fails (without a "show more" option), vital information is cut off and permanently lost to the user.

**Accessibility checklist**

Visual & Interaction
- [ ] Truncated text (using ellipses `...`) provides a way to see the full content (e.g., via a tooltip or expanding the container).
- [ ] If truncation occurs on a link or button, the accessible name still contains the full, un-truncated text.
- [ ] Text is not cut off in a way that changes its meaning (e.g., "$1,000" becoming "$1...").

Responsive Behavior
- [ ] Layout containers allow for text reflow without loss of content or functionality at up to 400% zoom.
- [ ] Containers do not have a fixed height that causes text to overflow and overlap other elements.

Horizontal Overflow
- [ ] If a region (like a code block or table) must scroll horizontally, the scrollable area is keyboard focusable (`tabindex="0"`).
- [ ] Focusable scroll areas have a descriptive label (e.g., `aria-label="Code snippet scrollable region"`).

Do not
- [ ] Do not use `text-overflow: ellipsis` on critical instructional text or headings without a "view more" option.
- [ ] Do not rely on "Title" attributes as the only way to see truncated text (they are not accessible to mobile or keyboard-only users).

**WCAG criteria:** 1.3.1 Info and Relationships, 1.4.4 Resize Text, 1.4.10 Reflow, 1.4.13 Content on Hover or Focus, 2.1.1 Keyboard, 4.1.2 Name Role Value

---

#### Drag & Drop

> Drag and drop mimics physical object manipulation. If this interaction fails (lacking a click-based alternative), users with motor impairments are completely blocked from organizing or moving items.

**Accessibility checklist**

Keyboard Interaction
- [ ] Alternative Input: A keyboard-equivalent (e.g., an "Action" menu or "Move up/down" buttons) is provided
- [ ] Initiation: Focusable handles or items can be "picked up" using Space or Enter
- [ ] Navigation: Arrow keys move the item between valid drop targets
- [ ] Confirmation: Space or Enter drops the item in the new location
- [ ] Cancellation: Esc cancels the move and returns the item to its original position

Screen Reader Expectations
- [ ] State is announced when an item is "Grabbed," "Moved," "Dropped," or "Canceled"
- [ ] Live Regions: An `aria-live` region announces the current position and available drop targets
- [ ] Help Text: Clear instructions are provided before the interaction (e.g., "Use arrow keys to reorder")
- [ ] Grabbed state is programmatically exposed using `aria-grabbed` or `aria-current="true"`

Visual Affordance
- [ ] Drag handles have a minimum touch target of 44x44px
- [ ] Clear visual feedback indicates which item is currently being moved
- [ ] Valid drop zones are visually highlighted during the "drag" state
- [ ] The cursor changes to a "grabbing" hand or appropriate directional icon

Do not
- [ ] Do not rely solely on mouse movements to reorder or move items
- [ ] Do not hide the "Move" actions inside a hover-only state
- [ ] Do not trigger the move automatically without a confirmation keypress

**WCAG criteria:** 1.3.1 Info and Relationships, 2.1.1 Keyboard, 2.1.3 Keyboard (No Exception), 2.5.2 Pointer Cancellation, 2.5.7 Dragging Movements (WCAG 2.2), 4.1.2 Name Role Value, 4.1.3 Status Messages

---

#### AI Output & Suggestions

**Accessibility checklist**

Transparency & Identification
- [ ] AI-generated content is visually and programmatically identified (e.g., using a "Sparkle" icon with an `aria-label="Generated by AI"`)
- [ ] Suggestions are clearly distinguished from primary page content
- [ ] Confidence scores or "Source" links are provided to allow users to verify information
- [ ] A disclaimer regarding AI accuracy is provided and easily discoverable

Interaction & Controls
- [ ] AI suggestions (like autocomplete or smart replies) are reachable and dismissible via keyboard
- [ ] Users can easily "Accept," "Regenerate," or "Discard" AI outputs
- [ ] Feedback mechanisms (Thumbs up/down) have clear accessible names
- [ ] Stop/Cancel buttons are available for long-running generative tasks

Screen Reader Expectations
- [ ] New AI output is announced via `aria-live="polite"` so users know when generation is complete
- [ ] Typing/streaming animations (like "AI is thinking...") use `aria-busy="true"` and are announced to screen readers
- [ ] Suggested text in inputs (ghost text) is not announced as part of the current value until accepted
- [ ] Large blocks of AI text use proper heading structures to allow for easy skimming

Motion & Loading
- [ ] Streaming text (typewriter effect) respects `prefers-reduced-motion` and can be disabled
- [ ] "Thinking" animations do not use high-frequency flashes

Do not
- [ ] Do not automatically inject AI content into the user's focus path without warning
- [ ] Do not rely on color-only gradients (like "AI purple") to signal that content is generated
- [ ] Do not make AI suggestions mandatory; users must be able to bypass them to complete a task

**WCAG criteria:** 1.3.1 Info and Relationships, 1.4.1 Use of Color, 2.1.1 Keyboard, 2.2.2 Pause Stop Hide, 4.1.2 Name Role Value, 4.1.3 Status Messages

---

## ARIA Guidance

### Accessible Names (Labeling)

- [ ] Visible Labels: Every interactive element has a visible text label.
- [ ] Label Persistence: Labels remain visible when the field is focused or filled (no placeholder-only labels).
- [ ] The 1:1 Rule: The `aria-label` or accessible name must contain the visible text of the element.
- [ ] Contextual Clarity: Labels like "Click here" or "View" are replaced with descriptive text (e.g., "View order history").

### ARIA Usage

- [ ] First Rule of ARIA: If you can use a native HTML element (like `<button>` or `<nav>`), use it instead of ARIA roles.
- [ ] Role Accuracy: Elements have the correct role for their behavior (e.g., `role="dialog"` for modals).
- [ ] State Indicators: Dynamic states use properties like `aria-expanded`, `aria-selected`, or `aria-checked`.
- [ ] Relation Linking: Use `aria-labelledby` for names and `aria-describedby` for supplementary info or error messages.

### Live Regions

- [ ] Dynamic Updates: Use `aria-live` for content that updates without a page refresh.
- [ ] Polite vs. Assertive: Use `polite` by default; use `assertive` only for critical, time-sensitive errors.

### Landmark Roles

- Use `<nav>`, `<header>`, `<main>`, `<footer>` for page landmarks
- Multiple navigation blocks have **unique labels** (`aria-label="Main navigation"`)

---

## General Checklist

> Use this before design handoff or review.

### Color & Contrast
- [ ] Meets contrast requirements (4.5:1 for body text, 3:1 for UI components)
- [ ] Color is not the only indicator

### Typography & Readability
- [ ] Minimum body text size is 12px
- [ ] Avoid a too long paragraph width (60-75 characters)

### Layout & Responsiveness
- [ ] Works at 200-400% zoom
- [ ] No horizontal scrolling for text
- [ ] Touch targets are large enough

### Keyboard & Focus
- [ ] All interactions work via keyboard
- [ ] Focus order is logical
- [ ] Focus is visible and not removed

### Screen Reader
- [ ] Clear accessible name (label, aria-label, or text)
- [ ] State changes are announced (loading, error, success)
- [ ] Relationship to trigger/content is clear

### States & Feedback
- [ ] All states are designed (hover, focus, error, disabled)
- [ ] Loading, empty, error states are accessible
- [ ] Disabled state is distinguishable from enabled
- [ ] Status changes aren't color-only

### Forms & Errors
- [ ] All fields have visible labels
- [ ] Errors explain what happened and how to fix
- [ ] Required vs optional is clear

### Motion
- [ ] Motion isn't required to understand content
- [ ] Reduced motion is respected

---

## Additional Rules (hand-authored)

The following items were present in the hand-authored guidelines and supplement the JSON source.

### Key Bindings by Component (quick reference)

| Component | Keys |
|-----------|------|
| Button | `Tab` to focus, `Enter` or `Space` to activate |
| Link | `Tab` to focus, `Enter` to activate |
| Dropdown/Select | `Tab` to focus, `Space`/`Enter` to open, `Arrow` to navigate, `Escape` to close |
| Modal | `Tab` cycles within modal (focus trap), `Escape` to close |
| Tabs | `Tab` to tab list, `Arrow Left/Right` to switch tabs |
| Menu | `Enter`/`Space` to open, `Arrow` to navigate, `Escape` to close |
| Data table | `Tab` between interactive cells, `Arrow` for cell navigation |

### Token References for Typography

- Default body text size: **14px** (`--zen-font-body-standard`)
- Minimum body text size: **12px** (`--zen-font-body-subtle`)
- **11px** only acceptable for non-essential UI (`--zen-font-body-micro`)

### Disabled State Guidance

- `aria-disabled="true"` preferred over HTML `disabled` attribute
- Disabled elements are exempt from contrast requirements but must be visually distinguishable

### Focus Indicator Token

- Focus indicator: **2px solid `--zen-color-interactive-focused-stroke-default`** (#000000)
