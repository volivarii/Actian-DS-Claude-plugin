---
# yaml-language-server: $schema=../../../schemas/category-defaults.json
_schema_version: 1
slug: navigation
label: Navigation
authoring_status: engineer-seed
confidence:
  anatomy: medium
  variants: medium
  motion: high
  a11y: high
last_reviewed: 2026-05-12

anatomy:
  - { name: Container, description: the navigation region — typically a landmark role (nav/banner) }
  - { name: Items, description: individual navigable entries; one is marked "current" when applicable }
  - { name: Item label, description: short, scannable text; never sentence case }
  - { name: Item icon (optional), description: reinforces meaning at a glance; not a substitute for label }
  - { name: Active indicator, description: visual treatment for the current item — underline, bar, fill, or background }
  - { name: Trigger (optional), description: opens a dropdown/menu for grouped or contextual items }

variants:
  - { axis: Orientation, values: [horizontal, vertical] }
  - { axis: Density, values: [compact, comfortable] }
  - { axis: State, values: [default, hover, focus, current, disabled] }

motion_refs:
  - { ref: state-transitions, note: hover/focus transitions on items stay subtle — no large translation }
  - { ref: anchor-motion, note: dropdown triggers (account-dropdown, notification-dropdown, etc.) anchor to their button }

accessibility:
  - { ref: focus-keyboard, note: arrow-key traversal between items; Tab moves to/from the navigation region }
  - { ref: aria-labels, note: use aria-current=page on the active item; nav landmark on the container }
  - { ref: color-contrast }
  - { ref: alerts-toasts-banners }
---

# Navigation — design rationale

Components in this category move the user between contexts (pages, sections, steps). Members: `account-dropdown`, `app-switcher-dropdown`, `breadcrumbs`, `global-header`, `notification-dropdown`, `side-nav`, `stepper`, `stepper-buttons`, `tabs`, `traffic-light`, `whats-new-dropdown`.

## Reference patterns

- **Polaris** — Navigation, Tabs, Breadcrumbs
- **Material** — Navigation Bar, Navigation Drawer, Tabs, Breadcrumbs
- **Carbon** — UI Shell (Header, Side Nav), Tabs, Breadcrumbs, Progress Indicator (stepper)

## Why these defaults

Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

## Notes for refining authors

- `breadcrumbs` collapses items at narrow widths — the anatomy extends with `Overflow indicator` (...).
- `stepper` / `stepper-buttons` add `Step number` + `Step status` parts and a `progressively-revealed` state value.
- `traffic-light` is a status-only nav element; its anatomy strips down to `Container` + `Indicator`.
- For dropdown navs (`account-dropdown`, `app-switcher-dropdown`, `notification-dropdown`, `whats-new-dropdown`), the `anchor-motion` ref drives the popover open/close.
