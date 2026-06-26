---
# P8 transversal refs — file-scoped (Option A). Authoritative subsection
# inventory lives in [[project_p8_closure_pickup]]; this file's refs are the
# union across §2.2 Typography, §2.5 Focus Rings, §2.9 Heights & Trigger Areas,
# §2.10 Icons, §2.11 Motion.
a11y_refs:
  - { ref: typography, note: covers text token rules (§2.2 Typography) }
  - { ref: focus-keyboard, note: focus-ring tokens (§2.5) + min-height/trigger-area tokens (§2.9) }
  - { ref: touch-pointer, note: min-height + trigger-area tokens (§2.9) }
  - { ref: icons, note: icon-size tokens (§2.10) }
  - { ref: motion, note: motion tokens (§2.11) honor prefers-reduced-motion }
motion_refs:
  - { ref: drawer-open-close }
  - { ref: accordion-expand-collapse }
  - { ref: success-toast }
  - { ref: anchor-motion }
  - { ref: layered-overlays-modals }
  - { ref: skeleton-loading }
  - { ref: staggered-entrance }
  - { ref: state-transitions, note: §2.11 token bands govern all 8 component motion patterns }
---
## 2. Tokens {#tokens}

All tokens are implemented as CSS custom properties under the `--zen-` namespace and as Figma variables in the Zen Colors library.

**Token status key**

| Status       | Meaning                                                               |
| ------------ | --------------------------------------------------------------------- |
| 🟢 Shipped   | Live in engineering and Figma. Safe to use in production.             |
| 🔵 In Review | Discussed with eng; defined in Figma; pending implementation in code. |
| 🟡 Proposed  | Design has spec'd this; not yet discussed with eng.                   |

***

### 2.1 Global Color

| Token                 | Resolves To              | Status      |
| --------------------- | ------------------------ | ----------- |
| `--zen-color-primary` | `--zen-color-royal-blue` | 🟡 Proposed |
| `--zen-color-success` | `--zen-color-green`      | 🟢 Shipped  |
| `--zen-color-warning` | `--zen-color-orange`     | 🟢 Shipped  |
| `--zen-color-error`   | `--zen-color-red`        | 🟢 Shipped  |
| `--zen-color-neutral` | `--zen-color-cool-grey`  | 🟡 Proposed |

#### Theme Palettes

A theme is a choice of two base palettes — `primary` and `neutral`. All other
semantics (success/warning/error/annotation) are theme-invariant. Adding a theme
is two values. Default (un-suffixed) theme is Actian.

| Theme    | primary    | neutral   | Status     |
| -------- | ---------- | --------- | ---------- |
| Actian   | royal-blue | cool-grey | 🟢 Shipped |
| Studio   | blue       | grey      | 🟢 Shipped |
| Explorer | turquoise  | grey      | 🟢 Shipped |

### 2.2 Typography

#### Text Color Tokens

| Token                                 | Resolves To               | Usage                                       | Status                                                               |
| ------------------------------------- | ------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `--zen-color-text-default`            | `--zen-color-black`       | Titles, labels, body text                   | 🟡 Proposed (rename from `text-primary` — eng update required)       |
| `--zen-color-text-secondary`          | `--zen-color-neutral-800` | Hints, subtext                              | 🟢 Shipped                                                           |
| `--zen-color-text-tertiary`           | `--zen-color-neutral-700` | Subtitles, alternate texts                  | 🟢 Shipped                                                           |
| `--zen-color-text-placeholder`        | `--zen-color-neutral-600` | Input placeholders                          | 🟢 Shipped                                                           |
| `--zen-color-text-placeholder-subtle` | `--zen-color-neutral-400` | Secondary placeholders (e.g. search fields) | 🟢 Shipped                                                           |
| `--zen-color-text-disabled`           | `--zen-color-neutral-500` | Disabled inputs, buttons, form elements     | 🟢 Shipped                                                           |
| `--zen-color-text-primary`            | `--zen-color-primary-500` | Interactive text                            | 🟡 Proposed (named `primary` to align with primary color convention) |
| `--zen-color-text-error`              | `--zen-color-error-600`   | Error messages                              | 🟢 Shipped                                                           |
| `--zen-color-text-link-default`       | `--zen-color-primary-500` | Hyperlinks                                  | 🟢 Shipped                                                           |
| `--zen-color-text-link-reverse`       | `--zen-color-white`       | Hyperlinks on dark or primary-colored backgrounds | 🟡 Proposed                                                     |
| `--zen-color-text-link-visited`       | `--zen-color-primary-700` | Visited hyperlinks                          | 🟡 Proposed                                                          |
| `--zen-color-text-warning`            | `--zen-color-warning-600` | Warning messages                            | 🟢 Shipped                                                           |
| `--zen-color-text-success`            | `--zen-color-success-600` | Success messages                            | 🟢 Shipped                                                           |
| `--zen-color-text-reverse`            | `--zen-color-white`       | Text on dark or primary-colored backgrounds | 🟡 Proposed                                                          |

#### Font Family

| Token                    | Value           | Usage                       | Status     |
| ------------------------ | --------------- | --------------------------- | ---------- |
| `--zen-font-family-text` | `Roboto`        | Default — headings and body | 🟢 Shipped |
| `--zen-font-family-mono` | `"Roboto Mono"` | Code and data               | 🟢 Shipped |

#### Font Weight

| Token                        | Value | Status     |
| ---------------------------- | ----- | ---------- |
| `--zen-font-weight-regular`  | `400` | 🟢 Shipped |
| `--zen-font-weight-medium`   | `500` | 🟢 Shipped |
| `--zen-font-weight-semibold` | `600` | 🟢 Shipped |
| `--zen-font-weight-bold`     | `700` | 🟢 Shipped |

#### Font Size

| Token                 | Value              | Usage                                | Status     |
| --------------------- | ------------------ | ------------------------------------ | ---------- |
| `--zen-font-size-xs`  | `0.6875rem` (11px) | Hint                                 | 🟢 Shipped |
| `--zen-font-size-sm`  | `0.75rem` (12px)   | Body, section subtitle               | 🟢 Shipped |
| `--zen-font-size-md`  | `0.875rem` (14px)  | Page subtitle, card header (small)   | 🟢 Shipped |
| `--zen-font-size-lg`  | `1rem` (16px)      | Section title, card header (default) | 🟢 Shipped |
| `--zen-font-size-xl`  | `1.125rem` (18px)  | —                                    | 🟢 Shipped |
| `--zen-font-size-2xl` | `1.25rem` (20px)   | —                                    | 🟢 Shipped |
| `--zen-font-size-3xl` | `1.5rem` (24px)    | Page title                           | 🟢 Shipped |
| `--zen-font-size-4xl` | `1.875rem` (30px)  | —                                    | 🟢 Shipped |

#### Letter Spacing

> **⚠️ Token name correction:** Previously named `--zen-font-lettingspacing-*` (typo). Correct name is `--zen-font-letterspacing-*`. Engineering must update in codebase.

| Token                             | Value   | Usage                       | Status       |
| --------------------------------- | ------- | --------------------------- | ------------ |
| `--zen-font-letterspacing-normal` | `0px`   | Font sizes larger than 16px | 🔵 In Review |
| `--zen-font-letterspacing-wide-1` | `0.1px` | Font size 16px              | 🔵 In Review |
| `--zen-font-letterspacing-wide-2` | `0.2px` | Font size 14px              | 🔵 In Review |
| `--zen-font-letterspacing-wide-3` | `0.3px` | Font size 12px              | 🔵 In Review |
| `--zen-font-letterspacing-wide-4` | `0.4px` | Font size 11px and smaller  | 🔵 In Review |

#### Line Height

| Token                       | Value             | Usage                     | Status     |
| --------------------------- | ----------------- | ------------------------- | ---------- |
| `--zen-font-lineheight-xs`  | `14px / 0.875rem` | Font size 11px or smaller | 🟢 Shipped |
| `--zen-font-lineheight-sm`  | `16px / 1rem`     | Font size 12px            | 🟢 Shipped |
| `--zen-font-lineheight-md`  | `20px / 1.25rem`  | Font size 14px            | 🟢 Shipped |
| `--zen-font-lineheight-lg`  | `24px / 1.5rem`   | Font size 16px            | 🟢 Shipped |
| `--zen-font-lineheight-xl`  | `26px / 1.625rem` | Font size 18px            | 🟢 Shipped |
| `--zen-font-lineheight-2xl` | `32px / 2rem`     | Font size 24px            | 🟢 Shipped |

#### Text Style Tokens (Composite)

These are semantic aliases that combine weight + size + letter spacing + line height into a single named style.

| Token                          | Weight   | Size | Letter Spacing       | Line Height | Usage                                        | Status     |
| ------------------------------ | -------- | ---- | -------------------- | ----------- | -------------------------------------------- | ---------- |
| `--zen-text-heading-display`   | semibold | 3xl  | letterspacing-normal | 2xl         | Primary header, display font                 | 🟢 Shipped |
| `--zen-text-heading-prominent` | semibold | xl   | letterspacing-normal | xl          | Secondary header, default page header        | 🟢 Shipped |
| `--zen-text-heading-standard`  | semibold | lg   | letterspacing-wide-1 | lg          | Tertiary header, section header              | 🟢 Shipped |
| `--zen-text-heading-subtle`    | semibold | md   | letterspacing-wide-2 | md          | Subsection header                            | 🟢 Shipped |
| `--zen-text-heading-micro`     | semibold | sm   | letterspacing-wide-3 | sm          | Low-emphasis header                          | 🟢 Shipped |
| `--zen-text-body-display`      | regular  | xl   | letterspacing-wide-1 | lg          | Support text next to header                  | 🟢 Shipped |
| `--zen-text-body-prominent`    | regular  | lg   | letterspacing-wide-1 | lg          | Intro, highlighted paragraph                 | 🟢 Shipped |
| `--zen-text-body-standard`     | regular  | md   | letterspacing-wide-2 | md          | Main content                                 | 🟢 Shipped |
| `--zen-text-body-subtle`       | regular  | sm   | letterspacing-wide-3 | sm          | Secondary content                            | 🟢 Shipped |
| `--zen-text-body-micro`        | regular  | xs   | letterspacing-wide-4 | xs          | Footnotes, microcopy                         | 🟢 Shipped |
| `--zen-text-label-standard`    | medium   | md   | letterspacing-wide-2 | md          | Default button, form label                   | 🟢 Shipped |
| `--zen-text-label-subtle`      | medium   | sm   | letterspacing-wide-3 | sm          | Less prominent actions, secondary info label | 🟢 Shipped |
| `--zen-text-label-micro`       | medium   | xs   | letterspacing-wide-4 | xs          | Microcopy                                    | 🟢 Shipped |

### 2.3 Borders

#### Radius

| Token                      | Value    | Usage            | Status     |
| -------------------------- | -------- | ---------------- | ---------- |
| `--zen-border-radius-2xs`  | `2px`    | —                | 🟢 Shipped |
| `--zen-border-radius-xs`   | `4px`    | —                | 🟢 Shipped |
| `--zen-border-radius-sm`   | `6px`    | **Default**      | 🟢 Shipped |
| `--zen-border-radius-md`   | `8px`    | —                | 🟢 Shipped |
| `--zen-border-radius-lg`   | `10px`   | —                | 🟢 Shipped |
| `--zen-border-radius-xl`   | `12px`   | —                | 🟢 Shipped |
| `--zen-border-radius-full` | `9999px` | Buttons, avatars | 🟢 Shipped |

#### Width

| Token                   | Value | Usage                 | Status     |
| ----------------------- | ----- | --------------------- | ---------- |
| `--zen-border-width-md` | `1px` | Default               | 🟢 Shipped |
| `--zen-border-width-lg` | `2px` | Focus rings, emphasis | 🟢 Shipped |

#### Style (Composite)

| Token                   | Value                               | Usage                                          | Status      |
| ----------------------- | ----------------------------------- | ---------------------------------------------- | ----------- |
| `--zen-border-default`  | `1px solid --zen-color-neutral-100` | Default border for containers                  | 🟢 Shipped  |
| `--zen-border-subtle`   | `1px solid --zen-color-neutral-50`  | Separators                                     | 🟢 Shipped  |
| `--zen-border-disabled` | `1px solid --zen-color-neutral-100` | Disabled state of components                   | 🟢 Shipped  |
| `--zen-border-primary`  | `1px solid --zen-color-primary-500` | Interactive elements                           | 🟡 Proposed |
| `--zen-border-selected` | `2px solid --zen-color-primary-500` | Selected state of components                   | 🟡 Proposed |
| `--zen-border-error`    | `1px solid --zen-color-error-600`   | Error state inputs                             | 🟡 Proposed |
| `--zen-border-warning`  | `1px solid --zen-color-warning-600` | Warning state                                  | 🟡 Proposed |
| `--zen-border-success`  | `1px solid --zen-color-success-600` | Success state                                  | 🟡 Proposed |
| `--zen-border-info`     | `1px solid --zen-color-primary-500` | Info state                                     | 🟡 Proposed |
| `--zen-border-strong`   | `1px solid --zen-color-neutral-800` | High emphasis borders                          | 🟡 Proposed |
| `--zen-border-reverse`  | `1px solid --zen-color-white`       | Borders on dark or primary-colored backgrounds | 🟡 Proposed |

### 2.4 Breakpoints

| Token                 | Value    | Usage            | Status     |
| --------------------- | -------- | ---------------- | ---------- |
| `--zen-breakpoint-sm` | `600px`  | Phone landscape  | 🟢 Shipped |
| `--zen-breakpoint-md` | `840px`  | Tablet landscape | 🟢 Shipped |
| `--zen-breakpoint-lg` | `1200px` | Desktop          | 🟢 Shipped |
| `--zen-breakpoint-xl` | `1920px` | Larger screens   | 🟢 Shipped |

### 2.5 Focus Rings

Outlined focus rings must be applied with an offset on interactive elements. For inputs and textareas, use outline without offset.

| Token                      | Value                               | Usage                                                                  | Status     |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------- | ---------- |
| `--zen-focus-ring-primary` | `2px solid --zen-color-primary-500` | Buttons, toggles, checkboxes, radios, avatars, breadcrumbs, tags, tabs | 🟢 Shipped |
| `--zen-focus-ring-error`   | `2px solid --zen-color-error-600`   | Destructive button links, error inputs                                 | 🟢 Shipped |
| `--zen-focus-ring-offset`  | `2px`                               | Used with outlined focus states                                        | 🟢 Shipped |

### 2.6 Elevation

> Elevation must only be used to define layering between elements when required. Use drop shadows only — do not use bevels, borders, or opacity to depict layering.

| Token             | Value                                       | Usage                                              | Status     |
| ----------------- | ------------------------------------------- | -------------------------------------------------- | ---------- |
| `--zen-shadow-xs` | `0px 1px 3px 1px rgba(0, 0, 15, 0.06), 0px 1px 5px 0px rgba(0, 0, 18, 0.07)` | Dropdowns, elevated button (default), card hover   | 🟢 Shipped |
| `--zen-shadow-sm` | `0px 1px 7px 3px rgba(0, 0, 20, 0.08), 0px 1px 3px 1px rgba(0, 0, 31, 0.12)` | App header, navigation menu, elevated button hover | 🟢 Shipped |
| `--zen-shadow-md` | `0px 1px 3px 0px rgba(0, 0, 77, 0.3), 0px 4px 8px 3px rgba(0, 0, 38, 0.15)` | Notification message, snackbar                     | 🟢 Shipped |
| `--zen-shadow-lg` | `0px 6px 10px 4px rgba(0, 0, 38, 0.15), 0px 2px 3px 0px rgba(0, 0, 77, 0.3)` | —                                                  | 🟢 Shipped |
| `--zen-shadow-xl` | `0px 8px 12px 6px rgba(0, 0, 38, 0.15), 0px 4px 4px 0px rgba(0, 0, 77, 0.3)` | Dialogs, toasts, overview panel                    | 🟢 Shipped |

### 2.7 Spacing

| Token               | Value            | Usage                                                                                          | Status      |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------- | ----------- |
| `--zen-spacing-3xs` | `0.125rem` (2px) | Tightest spacing, hairline gaps                                                                | 🟡 Proposed |
| `--zen-spacing-2xs` | `0.25rem` (4px)  | Between elements within a small component & default paddings within an extra compact component | 🟢 Shipped  |
| `--zen-spacing-xs`  | `0.5rem` (8px)   | Default spacing between components & default paddings within a small component                 | 🟢 Shipped  |
| `--zen-spacing-sm`  | `0.75rem` (12px) | Padding in a large component                                                                   | 🟢 Shipped  |
| `--zen-spacing-md`  | `1rem` (16px)    | Padding in a large component; spacing between components                                       | 🟢 Shipped  |
| `--zen-spacing-lg`  | `1.5rem` (24px)  | Spacing between sections                                                                       | 🟢 Shipped  |
| `--zen-spacing-xl`  | `2rem` (32px)    | Use when a clear separation is needed                                                          | 🟢 Shipped  |
| `--zen-spacing-2xl` | `3rem` (48px)    | Major section breaks, page padding                                                             | 🟡 Proposed |
| `--zen-spacing-3xl` | `4rem` (64px)    | Hero sections, full-page layout                                                                | 🟡 Proposed |

### 2.8 Backgrounds

| Token                     | Suggested Value                    | Usage                                | Status      |
| ------------------------- | ---------------------------------- | ------------------------------------ | ----------- |
| `--zen-color-bg-default`  | `--zen-color-white`                | Default page background              | 🟡 Proposed |
| `--zen-color-bg-subtle`   | `--zen-color-neutral-25`           | Subtle section backgrounds, sidebars | 🟡 Proposed |
| `--zen-color-bg-muted`    | `--zen-color-neutral-50`           | Cards, input fills, table rows       | 🟡 Proposed |
| `--zen-color-bg-disabled` | `--zen-color-neutral-50`           | Disabled state backgrounds           | 🟡 Proposed |
| `--zen-color-bg-selected` | `--zen-color-primary-25`           | Selected row or item background      | 🟡 Proposed |
| `--zen-color-bg-overlay`  | `--zen-color-black` at 40% opacity | Modal/dialog backdrop                | 🟡 Proposed |
| `--zen-color-bg-primary`  | `--zen-color-primary-500`          | CTA banners, primary filled areas    | 🟡 Proposed |
| `--zen-color-bg-emphasis` | `--zen-color-primary-500`          | Consumer-facing alias of bg-primary; emphasis fills | 🟡 Proposed |
| `--zen-color-bg-success`  | `--zen-color-success-25`           | Success alert backgrounds            | 🟡 Proposed |
| `--zen-color-bg-warning`  | `--zen-color-warning-25`           | Warning alert backgrounds            | 🟡 Proposed |
| `--zen-color-bg-error`    | `--zen-color-error-25`             | Error alert backgrounds              | 🟡 Proposed |
| `--zen-color-bg-info`     | `--zen-color-primary-25`           | Info alert backgrounds               | 🟡 Proposed |
| `--zen-color-bg-reverse`  | `--zen-color-black`                | Dark/inverted surface backgrounds    | 🟡 Proposed |

### 2.9 Heights and Trigger Areas

#### Component Heights

| Token                   | Value  | Usage                             | Status      |
| ----------------------- | ------ | --------------------------------- | ----------- |
| `--zen-size-height-2xs` | `20px` | Extra compact components          | 🟡 Proposed |
| `--zen-size-height-xs`  | `24px` | Compact chips, dense table rows   | 🟡 Proposed |
| `--zen-size-height-sm`  | `32px` | Small buttons, secondary inputs   | 🟡 Proposed |
| `--zen-size-height-md`  | `40px` | Default button, input, select     | 🟡 Proposed |
| `--zen-size-height-lg`  | `48px` | Large buttons, prominent inputs   | 🟡 Proposed |
| `--zen-size-height-xl`  | `56px` | Hero inputs, large touch surfaces | 🟡 Proposed |

#### Trigger Area

| Token                           | Value  | Usage                                                             | Status      |
| ------------------------------- | ------ | ----------------------------------------------------------------- | ----------- |
| `--zen-size-trigger-min`        | `24px` | Minimum interactive target area for desktop (WCAG 2.5.5 Level AA) | 🟡 Proposed |
| `--zen-size-trigger-min-mobile` | `44px` | Minimum interactive target area for mobile (WCAG 2.5.5 Level AA)  | 🟡 Proposed |

### 2.10 Icons

#### Icon Sizes

| Token                | Value  | Usage                                   | Status      |
| -------------------- | ------ | --------------------------------------- | ----------- |
| `--zen-size-icon-xs` | `12px` | Tight UI contexts, dense tables, badges | 🟡 Proposed |
| `--zen-size-icon-sm` | `16px` | Inline icons, compact components        | 🟡 Proposed |
| `--zen-size-icon-md` | `20px` | Default icon size                       | 🟡 Proposed |
| `--zen-size-icon-lg` | `24px` | Standalone icons, feature icons         | 🟡 Proposed |

#### Icon Colors

| Token                       | Suggested Value           | Usage                                                 | Status      |
| --------------------------- | ------------------------- | ----------------------------------------------------- | ----------- |
| `--zen-color-icon-default`  | `--zen-color-black`       | Default icon color                                    | 🟡 Proposed |
| `--zen-color-icon-subtle`   | `--zen-color-neutral-600` | De-emphasized icons                                   | 🟡 Proposed |
| `--zen-color-icon-disabled` | `--zen-color-neutral-400` | Disabled icon state (no filter — uses explicit color) | 🟡 Proposed |
| `--zen-color-icon-primary`  | `--zen-color-primary-500` | Primary action icons                                  | 🟡 Proposed |
| `--zen-color-icon-error`    | `--zen-color-error-600`   | Error state icons                                     | 🟡 Proposed |
| `--zen-color-icon-success`  | `--zen-color-success-600` | Success state icons                                   | 🟡 Proposed |
| `--zen-color-icon-warning`  | `--zen-color-warning-600` | Warning state icons                                   | 🟡 Proposed |
| `--zen-color-icon-reverse`  | `--zen-color-white`       | Icons on dark or primary-colored backgrounds          | 🟡 Proposed |

### 2.11 Motion

> **Status:** All motion tokens are 🟡 Proposed. They are defined in Figma and have not yet been implemented in engineering.

Motion tokens cover three dimensions: **duration** (how long), **easing** (how it accelerates), and **delay** (when it starts). All three must be specified together for any animated component.

#### Duration

Duration controls the speed of a transition. Smaller, simpler components move faster; larger, complex surfaces take slightly more time to respect their physical weight.

| Token                           | Value   | Usage                                                                            | Status      |
| ------------------------------- | ------- | -------------------------------------------------------------------------------- | ----------- |
| `--zen-motion-duration-instant` | `100ms` | Micro-feedback: button hovers, checkbox toggles, radio buttons, focus rings      | 🟡 Proposed |
| `--zen-motion-duration-fast`    | `200ms` | Small scale: tooltip fade-ins, dropdown/select expansions, tag dismissals        | 🟡 Proposed |
| `--zen-motion-duration-base`    | `300ms` | Structural changes: collapse/accordion expanding, toast notifications sliding in | 🟡 Proposed |
| `--zen-motion-duration-slow`    | `400ms` | Large surfaces: modal scaling in, drawer (side panel) sliding in                 | 🟡 Proposed |

#### Easing

Easing curves give motion a natural, physical feel.

| Token                        | Value         | Usage                                                                                                                                  | Status      |
| ---------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `--zen-motion-ease-entrance` | `ease-out`    | Fast start, slow finish. Objects entering the screen (e.g. modals, drawers). Feels responsive but settles smoothly.                    | 🟡 Proposed |
| `--zen-motion-ease-exit`     | `ease-in`     | Slow start, fast finish. Objects leaving the screen (e.g. closing a side nav, dismissing a toast). Gets out of the user's way quickly. | 🟡 Proposed |
| `--zen-motion-ease-standard` | `ease-in-out` | Smooth start and finish. Elements moving from point A to B, or expanding internally (e.g. accordions opening, progress bars filling).  | 🟡 Proposed |

#### Delay

Delay dictates the pause before the motion duration begins.

| Token                        | Value   | Usage                                                                                                                          | Status      |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `--zen-motion-delay-stagger` | `20ms`  | Choreography: applied incrementally to list items, table rows, or search result cards as they enter the screen                 | 🟡 Proposed |
| `--zen-motion-delay-intent`  | `300ms` | Hover protection: standard wait time before revealing a tooltip or complex glossary popover. Prevents accidental visual noise. | 🟡 Proposed |
| `--zen-motion-delay-long`    | `500ms` | Feedback holding: used for temporary success states before they auto-dismiss (e.g. a toast lingering before sliding out)       | 🟡 Proposed |

***

#### Component Motion Guide

Reference patterns for how motion tokens combine in common components. These define the expected behavior — engineering should implement these exactly.

***

**Drawer (open/close)** {#drawer-open-close}

| Phase | Duration        | Easing          | Behavior                 |
| ----- | --------------- | --------------- | ------------------------ |
| Open  | `duration-slow` | `ease-entrance` | Slides in from the right |
| Close | `duration-base` | `ease-exit`     | Slides out to the right  |

***

**Accordion (expand/collapse)** {#accordion-expand-collapse}

| Phase    | Duration        | Easing          | Behavior                                                                        |
| -------- | --------------- | --------------- | ------------------------------------------------------------------------------- |
| Expand   | `duration-base` | `ease-standard` | Height animates open; content fades in (0→100% opacity) during final 150ms      |
| Collapse | `duration-base` | `ease-standard` | Height animates closed; content fades out (100→0% opacity) during initial 100ms |

***

**Success Toast** {#success-toast}

| Phase | Duration                                         | Easing          | Behavior                                                           |
| ----- | ------------------------------------------------ | --------------- | ------------------------------------------------------------------ |
| Entry | `duration-base`                                  | `ease-entrance` | Slides in from the bottom                                          |
| Hold  | `delay-long` (500ms as token; 4000ms total hold) | —               | Settle time after entry completes before auto-dismiss timer begins |
| Exit  | `duration-fast`                                  | `ease-exit`     | Fades out quickly                                                  |

> Note: The `--zen-motion-delay-long` token value is 500ms and represents the *token unit* for the holding pattern. The full 4000ms hold period is a product-level decision, not a motion token.

***

**The "Anchor" Motion — Dropdowns, Popovers, and Tooltips** {#anchor-motion}

| Phase | Duration        | Easing          | Behavior                                                                                                  |
| ----- | --------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| Open  | `duration-base` | `ease-entrance` | Fades in (0→100% opacity) over full duration; element scales up from its trigger point while fading in    |
| Close | `duration-fast` | `ease-standard` | Fades out (100→0% opacity) over full duration; element scales down and retracts back to its trigger point |

**Logic & Accessibility**

* **Intentionality:** Apply `--zen-motion-delay-intent` (300ms) for Tooltip opening on hover to prevent accidental triggers

* **Immediate Focus:** Keyboard focus (Tab) ignores delays and triggers the open motion immediately

* **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, fade transitions are disabled and elements toggle visibility instantly

***

**Layered Overlays — Modals** {#layered-overlays-modals}

| Phase | Duration        | Easing          | Behavior                                                                                                                                                             |
| ----- | --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open  | `duration-slow` | `ease-entrance` | Modal scales 95%→100% while background scrim fades in. The slow duration communicates that the user has entered a new, temporary top-level context.                  |
| Close | `duration-fast` | `ease-exit`     | Modal scales 100%→95% and fades 100%→0%. Scrim fades 100%→0%, synchronized. Slower on open to help users track context; dismisses quickly once the decision is made. |

***

**Skeleton Loading** {#skeleton-loading}

| Duration           | Easing   | Behavior                                                                                                                                                                                            |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2000ms` (looping) | `linear` | A continuous, subtle gradient shimmer moving left-to-right. Not tokenized — value is fixed. Provides visual confirmation the system is active and reduces perceived wait time for data-heavy views. |

***

**Staggered Entrance — Lists, Table Rows, Search Cards** {#staggered-entrance}

| Per-item duration | Easing          | Delay per item                                                          |
| ----------------- | --------------- | ----------------------------------------------------------------------- |
| `duration-fast`   | `ease-entrance` | `delay-stagger` × item index (item 1: 0ms, item 2: 20ms, item 3: 40ms…) |

The cascading effect guides the eye naturally downward and prevents the screen feeling "flashed" with too much at once.

***

**State Transitions** {#state-transitions}

| State        | Duration           | Easing          | Behavior                                                                         |
| ------------ | ------------------ | --------------- | -------------------------------------------------------------------------------- |
| Hover        | `duration-instant` | `ease-standard` | Subtle background color shift via brightness filter                              |
| Focus        | —                  | —               | No motion tokens — instant high-contrast ring/border for accessibility and speed |
| Pressed      | `duration-instant` | `ease-exit`     | Subtle scale or brightness darkening                                             |
| → Selected   | `duration-fast`    | `ease-standard` | Subtle background color shift and side stroke draw-in                            |
| → Unselected | `duration-instant` | `ease-exit`     | Rapid fade and stroke collapse                                                   |
