---
# yaml-language-server: $schema=../../../schemas/category-defaults.json
_schema_version: 2
slug: action
label: Action
authoring_status: engineer-seed
confidence:
  anatomy: medium
  variants: high
  motion: high
  a11y: high
last_reviewed: 2026-05-12

anatomy:
  - { name: Container, description: the interactive surface — receives focus, hover, press states }
  - { name: Label, description: action verb in title case; the primary affordance signal }
  - { name: Leading icon (optional), description: reinforces the label; decorative when paired with text }
  - { name: Trailing icon (optional), description: chevron or external-link glyph for navigation hints }
  - { name: Loading indicator (optional), description: replaces label when action is in-flight }

variants:
  - { axis: Style, values: [primary, secondary, tertiary, ghost, destructive] }
  - { axis: Size, values: [small, medium, large] }
  - { axis: State, values: [default, hover, focus, active, loading, disabled] }

motion_refs:
  - { ref: state-transitions, note: hover/focus/active transitions stay within the 100-200ms band }

a11y_refs:
  - { ref: focus-keyboard, note: must be operable with Enter and Space (button) or Enter (link) }
  - { ref: color-contrast }
  - { ref: alerts-toasts-banners, note: loading + disabled states must be announced; do not rely on color alone }
  - { ref: aria-labels }
---

# Action — design rationale

Components in this category trigger discrete actions or navigate. Members: `button`, `link`, `sticky-footer`.

## Reference patterns

- **Polaris** — Button, Link
- **Material** — Buttons (Filled / Outlined / Text), Link
- **Carbon** — Button (Primary/Secondary/Tertiary/Ghost/Danger), Link

## Why these defaults

Action surfaces converge on a small set of style ramps (primary → ghost) and a tight state machine (default → hover → focus → active → loading → disabled). The category lives or dies on accessibility: keyboard operability, focus visibility, and non-color state signalling are non-negotiable.

## Notes for refining authors

- `sticky-footer` is a layout wrapper that pins one or more action buttons; its anatomy extends with `Container` (full-width bar) but otherwise inherits the action defaults.
- `link` MAY drop the `Leading icon`/`Trailing icon` parts unless the link semantically points to an external resource or downloads a file.
- The `loading` state should preserve the button's width to avoid layout shift.
