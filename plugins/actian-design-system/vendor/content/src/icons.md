---
title: "Icons"
nav_order: 16
---
# Icons

Icons support communication by providing visual cues alongside or instead of text. They should reinforce meaning, not replace it, unless paired with a tooltip or accessible label.

---

## When to use

- To supplement a text label and help users scan faster.
- For icon-only controls (such as toolbar buttons) that have a visible tooltip or aria-label.
- Do not use an icon as the only affordance for a critical action - always pair with a text label or tooltip.

## Style

- Use icons from the approved Actian icon set only.
- Do not add decorative icons that have no functional meaning.
- Icon labels (tooltips or aria-labels) use sentence case and follow the same verb/noun conventions as button labels.

## Accessibility

- Every icon-only control must have an accessible name via aria-label or a visually hidden text label.
- Decorative icons must be marked `aria-hidden="true"` so screen readers skip them.
- Do not rely on color alone to convey the meaning of an icon.
