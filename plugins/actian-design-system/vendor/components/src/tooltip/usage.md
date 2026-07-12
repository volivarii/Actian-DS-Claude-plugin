---
title: "Tooltip usage guidelines"
---
## When to use

* Use a tooltip to label icon-only controls: every icon-only [button](button) gets one, and the tooltip supplies its accessible name.

* Use it for a short supplementary hint on hover or focus: what a control does, a keyboard shortcut, a spelled-out abbreviation.

* Use it to expose the full value of truncated text, for example a clipped cell in a [table](table), provided the trigger itself is focusable so keyboard users can reach it.

## When not to use

* Don't put essential content in a tooltip: anything the user must know to proceed stays visible on the page. If they have to hover to understand the UI, the UI is broken.

* Don't use a tooltip for rich or multi-sentence content, links, or actions: use a [popover](popover), which opens on click and can hold structure.

* Don't use a tooltip for form-field guidance the user needs while typing: use persistent helper text under the field.

* Don't attach tooltips to disabled controls as the only explanation; hover never fires on touch, and focus may not reach them. Explain the disabled state inline.

## Variant selection

Tooltips have a single Default variant; the real choices are configuration.

* **Body text:** a few words to one short sentence. The tooltip is flex width up to a 320px maximum; if the text wraps past two lines, move it to a [popover](popover) or inline help.

* **Placement:** default to above the trigger; flip automatically near viewport edges so the tooltip is never clipped.

* **Trigger:** hover and keyboard focus, never click. It must appear for keyboard users exactly as it does for mouse users.

## Do / Don't

| Do | Don't |
| --- | --- |
| Give every icon-only button a tooltip naming its action | Rely on the icon alone to convey meaning |
| Keep the tooltip to one short sentence | Pack instructions and links into a 320px block |
| Show the tooltip on keyboard focus as well as hover | Make the hint mouse-only |
| Explain a disabled control with inline text | Hide the reason behind a hover on a disabled target |

> Tooltip wording rules (no label repetition, one concise sentence) live in the Content guidelines for tooltips.
