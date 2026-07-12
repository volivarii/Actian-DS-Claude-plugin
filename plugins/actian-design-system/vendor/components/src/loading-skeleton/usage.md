---
title: "Loading skeleton usage guidelines"
---
## When to use

* Use a loading skeleton when content is on its way and the layout is known in advance: the placeholder sketches the blocks the content will fill.

* Use it for content-heavy views: [table](table) rows, card grids, detail pages with a fixed structure.

* Use it for the first paint of a page inside an already-running app, before the response lands.

* Keep it visual only; if the wait needs a message, use a [loader](loader) alongside instead of writing into the blocks.

## When not to use

* Don't use a skeleton when the incoming layout is unpredictable: use a [loader](loader).

* Don't use it for a small, control-level wait: use a [spinner](spinner) inside the control.

* Don't use it for application startup or app switches: use the [loader with logo](loader-with-logo).

* Don't use it when progress is measurable: use a [progress bar](progress-bar-small).

## Variant selection

Loading skeletons have no type or size variants; the shape is the choice, built from the layout it stands in for.

* **Structure:** same columns, headings, and block placement as the final view.

* **Density:** a plausible number of rows or cards for the container, not an arbitrary fill.

## Do / Don't

| Do | Don't |
| --- | --- |
| Mirror the final layout's shapes | Show generic gray bars unrelated to the content |
| Resolve to content, an [empty state](empty-state), or an [error state](error-state) when the response lands | Drop from skeleton to a blank container |
| Fill in real content progressively as it arrives | Hold the whole skeleton until the last request finishes |
| Cap the placeholder at a screenful | Fake two hundred skeleton rows for a table of five |

> Copy rules (skeletons carry no text, no "Loading..." inside blocks) live in the Content guidelines for loading skeleton.
