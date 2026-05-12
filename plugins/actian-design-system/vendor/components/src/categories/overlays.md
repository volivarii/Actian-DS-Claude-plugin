---
# yaml-language-server: $schema=../../../schemas/category-defaults.json
_schema_version: 1
slug: overlays
label: Overlays
authoring_status: engineer-seed
confidence:
  anatomy: medium
  variants: high
  motion: high
  a11y: high
last_reviewed: 2026-05-12

anatomy:
  - { name: Trigger, description: the element that opens the overlay; retains focus return on close }
  - { name: Surface, description: the overlay panel itself — modal dialog, drawer, popover, tooltip }
  - { name: Scrim (optional), description: dimmed backdrop used for modals + drawers; absent for popovers/tooltips }
  - { name: Header (optional), description: title + close affordance for dismissible overlays }
  - { name: Body, description: the overlay's primary content }
  - { name: Footer (optional), description: action affordances — confirm/cancel/close }
  - { name: Arrow or pointer (optional), description: anchors popovers/tooltips to their trigger }

variants:
  - { axis: Type, values: [modal, drawer, popover, tooltip, chat] }
  - { axis: Dismissibility, values: [dismissible, modal-blocking] }
  - { axis: Position, values: [center, anchored, side-right, side-left, bottom] }

motion_refs:
  - { ref: layered-overlays-modals, note: modals fade + scale; scrim cross-fades }
  - { ref: drawer-open-close, note: drawer-side-panel slides on axis with easing per the drawer pattern }
  - { ref: anchor-motion, note: popover/tooltip anchor open at the trigger with origin transform }

accessibility:
  - { ref: keyboard-focus, note: focus moves into the overlay on open; trapped while modal-blocking; returns to trigger on close }
  - { ref: aria-guidance, note: dialogs use role=dialog + aria-modal=true + labelled by header; tooltips use role=tooltip + aria-describedby }
  - { ref: interactions, note: Escape closes dismissible overlays; outside-click closes popovers but not modals }
  - { ref: motion-media, note: respect prefers-reduced-motion — disable scale + slide, keep fade }
  - { ref: color-contrast }
---

# Overlays — design rationale

Components in this category layer above the page surface. Members: `chat-with-ai-steward`, `drawer-side-panel`, `modal`, `popover`, `tooltip`.

## Reference patterns

- **Polaris** — Modal, Popover, Tooltip, Sheet
- **Material** — Dialog, Menu, Tooltip, Bottom Sheet, Side Sheet
- **Carbon** — Modal, Popover, Tooltip, Side Panel

## Why these defaults

Overlays share a Trigger → Surface relationship and a tight contract with focus management. The `Dismissibility` axis captures the modal-vs-dismissible decision that drives the entire keyboard + a11y model. The `Type` axis is intentionally finite — adding a new overlay type means revisiting the category contract, not extending it.

## Notes for refining authors

- `tooltip` strips down: no Header/Footer/Close; just Surface + Body + Arrow. Trigger is owned by the parent control.
- `popover` may include Header + Footer when used as a confirmation or richer surface.
- `modal` requires the focus trap + return-on-close pattern; `drawer-side-panel` follows the same trap rules.
- `chat-with-ai-steward` is a persistent side overlay — its `Persistence` semantic differs from a typical modal/drawer. Flag during team review for whether it warrants its own category.
- Position values are anchored to common DS Kit usage; specific components may add `top` or `bottom-right` later.
