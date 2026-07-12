---
title: "Popover usage guidelines"
---
## When to use

* Use a popover for rich or multi-sentence contextual content that a [tooltip](tooltip) cannot hold: formatted text and links. It opens on click and stays open until the user clicks outside or presses Escape.

* Use it to explain a concept, term, or complex field inline, without sending the user off the page or into documentation.

* Use it when the user needs to keep the page visible while reading: a popover is non-modal and never dims the page behind.

## When not to use

* Don't use a popover for a short plain-text hint on hover or focus: that is a [tooltip](tooltip). Anything hover-triggered is a tooltip; a popover always opens on click.

* Don't use it as a command menu on a button: use an actions menu (see [dropdown / select](dropdown-select)).

* Don't use it for a task with form fields or a decision that blocks the page: use a [modal](modal) or a [drawer / side panel](drawer-side-panel).

* Don't use it for critical or error messaging: use inline validation on the field or an [alert banner](alert-banner). A popover disappears on a stray click; errors must not.

## Variant selection

* **Interaction guide:** in-place guidance that walks the user through a control or feature, anchored to the element it explains.

* **Advanced search:** the structured search-options panel that opens under the [search](search) field to build a precise query.

* Both types are click-triggered and non-modal; there is no plain default popover, so pick the type whose structure matches the content.

## Do / Don't

| Do | Don't |
| --- | --- |
| Open on click, close on outside click or Escape | Trigger a popover on hover |
| Keep the body to two to four short sentences | Pack bullet lists and long prose into it |
| Anchor the popover to the element it explains | Float it in the middle of the screen like a dialog |
| Show one popover at a time | Chain a second popover from the first |

> Title and body wording rules live in the Content guidelines for popovers.
