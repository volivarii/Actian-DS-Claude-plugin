---
title: "Toolbar usage guidelines"
---
## When to use

* Use a toolbar to group the primary actions for the working surface directly below it: a [table](table), a canvas, or a list (for example **Export**, **Add filter**, **Delete** above a dataset table).

* Use it for actions that apply to the current view or to the current selection within it, and that users reach for repeatedly.

* Use it to keep frequent actions visible in one predictable place instead of scattering them around the content.

## When not to use

* Don't use a toolbar for page-level title actions (**New dataset**, **Edit**): those belong in the [page header](page-header).

* Don't use it for actions on a single row: those are ghost or icon-only [buttons](button) inside the [table](table) row itself.

* Don't use it as the commit bar of a long form (**Save**, **Cancel**): that is the [sticky footer](sticky-footer).

* Don't use it for navigation between views or places: use [tabs](tabs) or the [side nav](side-nav).

## Variant selection

* **Single:** one standalone action or control; the minimal strip.

* **Combined:** mixed controls in one strip (buttons, filters, search); the default for tables and lists.

* **Group:** related actions clustered into visible groups, separated from unrelated groups; use when the strip carries more than a handful of actions.

* **Horizontal:** the default orientation, spanning the top of the surface it controls.

* **Vertical:** alongside a canvas surface, such as the lineage graph, where actions stack on the edge.

## Do / Don't

| Do | Don't |
| --- | --- |
| Disable actions that don't apply to the selection | Hide actions and let the layout jump around |
| Say what's needed in the empty case (**Select items to export**) | Leave disabled actions unexplained |
| Order actions by frequency, most common first | Order actions alphabetically or by team ownership |
| Keep the same toolbar layout on every similar surface | Rearrange actions between two dataset tables |

> Action label wording (one or two words, verb first) lives in the Content guidelines for toolbars.
