---
title: "Drawer, side panel usage guidelines"
---
## When to use

* Use a drawer for a quick view of an item's properties when the user clicks a tile in a list or a catalog search result: metadata, details, and actions, without leaving the page.

* Use it to surface dependencies, related assets, or linked catalog entries alongside an asset detail page.

* Use it for secondary tasks that need focus while the main page stays visible for reference: the mirror case of a [modal](modal), which blocks the page behind.

* Use it to cut context switching during browsing and review: open, scan, close, move to the next item.

## When not to use

* Don't use a drawer for confirmations or destructive actions: use a [modal](modal), which forces the stop-and-think moment a drawer deliberately avoids.

* Don't rebuild the full detail experience in the panel: when the user needs everything, send them to the full details page instead.

* Don't use it for a linear multi-step process: navigate to a dedicated page with a [stepper](stepper).

* Don't use it for a one-line definition or hint: use a [popover](popover) or [tooltip](tooltip).

## Variant selection

* **Studio** and **Explorer:** the only choice is the app; pick the one matching the product the panel opens in so the chrome stays consistent.

* Content is otherwise free-form: compose metadata, attribute groups, related items, and actions to fit the task.

* **Dismissal and focus:** Escape closes the panel and focus returns to the element that opened it; the non-modal form never traps focus, so the browse loop (open, scan, close, next) works by keyboard.

## Do / Don't

| Do | Don't |
| --- | --- |
| Slide in from the right, over the current page | Push the page content aside or navigate away |
| Title the panel with the exact asset name | Paraphrase or shorten the name |
| Put a View full details link at the top right | Bury the way to the full page |
| Show a message when a section is empty (No related datasets found.) | Leave a blank section |
| Group related attributes under subheadings when the panel runs long | Pour everything into one unstructured list |

> Attribute label wording and empty-section copy live in the Content guidelines for drawers.
