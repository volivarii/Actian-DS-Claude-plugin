# Popover: usage notes

Popovers display richer contextual content than a tooltip. They appear on click and can contain formatted text, links, and actions. Use them when the information is too long or interactive for a tooltip.

## When to use
- To explain a concept or term inline, without leaving the current page.
- To show a small set of related actions in a compact overlay (also called an action popover).
- To provide definitions or help text for complex fields.
- Do not use popovers for critical error messages - use inline alerts or validation messages.
- Use a popover for rich or multi-sentence contextual content that a tooltip cannot hold: formatted text and links. It opens on click and stays open until the user clicks outside or presses Escape.
- Use it to explain a concept, term, or complex field inline, without sending the user off the page or into documentation.
- Use it when the user needs to keep the page visible while reading: a popover is non-modal and never dims the page behind.

## When not to use
- Don't use a popover for a short plain-text hint on hover or focus: that is a tooltip. Anything hover-triggered is a tooltip; a popover always opens on click.
- Don't use it as a command menu on a button: use an actions menu (see dropdown / select).
- Don't use it for a task with form fields or a decision that blocks the page: use a modal or a drawer / side panel.
- Don't use it for critical or error messaging: use inline validation on the field or an alert banner. A popover disappears on a stray click; errors must not.

## Style
- Popover title: short noun phrase in sentence case. Optional but recommended for longer content.
- Body: plain prose, two to four sentences maximum.
- Avoid bullet lists inside popovers - keep content scannable through short sentences.
- Link text within a popover follows the same descriptive link text guidelines as inline links.

## Category guidance (inherited: design, behavior)
Overlays share a Trigger → Surface relationship and a tight contract with focus management. The `Dismissibility` axis captures the modal-vs-dismissible decision that drives the entire keyboard + a11y model. The `Type` axis is intentionally finite — adding a new overlay type means revisiting the category contract, not extending it.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
