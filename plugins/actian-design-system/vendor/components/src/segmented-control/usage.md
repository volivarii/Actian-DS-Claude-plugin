---
title: "Segmented control usage guidelines"
---
## When to use

* Use a segmented control to switch between two to four mutually exclusive presentations of the same content set, applied the instant a segment is clicked (**List / Grid**, **Day / Week / Month**).

* Use it when all options benefit from side-by-side visibility, so the current mode and its alternatives read at a glance.

* Use it above a [table](table) or card grid to re-display the records already on screen in another arrangement.

## When not to use

* Don't use it inside a form where the choice applies on submit: use a [radio button](radio-button) group.

* Don't use it for peer views of different content on one object (**Overview**, **Lineage**, **Settings**): use [tabs](tabs). A segmented control re-displays one content set; tabs move between distinct ones.

* Don't use it for page-level navigation; if the destination changes, it is the [side nav](side-nav) or [tabs](tabs), not a mode switch.

* Don't use it for a single binary on/off setting: use a [toggle](toggle).

* Don't use it to narrow which records are shown: reducing a result set by criteria is [filters](search-filters), not a view switch.

## Variant selection

Segmented controls have no type or size variants; the choices are configuration.

* **Segment count:** two to four. Beyond four, labels shrink past legibility; regroup the modes into fewer, broader presentations.

* **Default segment:** one segment is always selected; load the view most users need first and keep that default identical across similar surfaces.

* **Persistence:** when a surface remembers its last mode, restore it on return rather than snapping back to the default.

## Do / Don't

| Do | Don't |
| --- | --- |
| Apply the switch immediately on click | Pair a segmented control with an **Apply** button |
| Keep exactly one segment selected at all times | Allow a no-selection state |
| Re-render the same records in the new mode | Load different content behind a segment |
| Keep the same segment set across sibling surfaces | Offer **List / Grid** on one catalog page and **Grid** only on the next |

> Segment label wording (short balanced nouns, **List / Grid** not **List view / Grid view**) lives in the Content guidelines for segmented controls.
