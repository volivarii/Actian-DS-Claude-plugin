# Tooltip: usage notes

Tooltips provide short contextual help on hover or focus. They are best for icon-only controls that need a label, or for brief supplementary information that does not need to be persistently visible.

## When to use
- To provide short contextual help on hover or focus.
- For icon-only controls that require a label.
- Do not use tooltips for critical information. Users should not be required to hover to understand the UI.
- Use a tooltip to label icon-only controls: every icon-only button gets one, and the tooltip supplies its accessible name.
- Use it for a short supplementary hint on hover or focus: what a control does, a keyboard shortcut, a spelled-out abbreviation.
- Use it to expose the full value of truncated text, for example a clipped cell in a table, provided the trigger itself is focusable so keyboard users can reach it.

## When not to use
- Don't put essential content in a tooltip: anything the user must know to proceed stays visible on the page. If they have to hover to understand the UI, the UI is broken.
- Don't use a tooltip for rich or multi-sentence content, links, or actions: use a popover, which opens on click and can hold structure.
- Don't use a tooltip for form-field guidance the user needs while typing: use persistent helper text under the field.
- Don't attach tooltips to disabled controls as the only explanation; hover never fires on touch, and focus may not reach them. Explain the disabled state inline.

## Style
- Limit to a few words or one concise sentence.
- Do not repeat the label of the element being described.
- For multi-sentence explanations, use a popover or inline help text instead.

## Category guidance (inherited: design, behavior)
Overlays share a Trigger → Surface relationship and a tight contract with focus management. The `Dismissibility` axis captures the modal-vs-dismissible decision that drives the entire keyboard + a11y model. The `Type` axis is intentionally finite — adding a new overlay type means revisiting the category contract, not extending it.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
