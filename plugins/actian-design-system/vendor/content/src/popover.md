---
title: "Popover"
nav_order: 26
---
# Popover

Popovers display richer contextual content than a tooltip. They appear on click and can contain formatted text, links, and actions. Use them when the information is too long or interactive for a tooltip.

---

## When to use

- To explain a concept or term inline, without leaving the current page.
- To show a small set of related actions in a compact overlay (also called an action popover).
- To provide definitions or help text for complex fields.
- Do not use popovers for critical error messages - use inline alerts or validation messages.

## Style

- Popover title: short noun phrase in sentence case. Optional but recommended for longer content.
- Body: plain prose, two to four sentences maximum.
- Avoid bullet lists inside popovers - keep content scannable through short sentences.
- Link text within a popover follows the same descriptive link text guidelines as inline links.

## Behavior

- Opens on click, closes on click outside or Escape.
- Do not open popovers on hover - use tooltips for hover-triggered content.
- Trap focus inside the popover while it is open for accessibility.
