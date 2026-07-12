---
title: "Loader usage guidelines"
---
## When to use

* Use a loader for an indeterminate wait on a large component or a section of a page: a fetch whose duration is unknown and whose result can't be sketched in advance.

* Use it for in-page transitions where a region's content is being replaced (switching a dashboard's data source, reloading a results panel).

* Use it as the fallback loading treatment when no more specific indicator fits the container.

## When not to use

* Don't use a loader when the layout of the incoming content is known: use a [loading skeleton](loading-skeleton) that sketches it.

* Don't use it for a small, control-level wait (a saving button, a validating field): use a [spinner](spinner) inside the control.

* Don't use it for application startup or switches between apps: use the [loader with logo](loader-with-logo).

* Don't use it when progress is measurable (an upload, a stepped job): use a [progress bar](progress-bar-small).

## Variant selection

Loaders have no type or size variants; the choice is between two configurations.

* **Bare loader:** the default for indeterminate waits expected to stay short.

* **With message:** add one brief present-tense line (**Loading datasets...**) when the wait is likely to exceed three seconds.

* Past roughly ten seconds an indeterminate loader stops being honest: switch to a [progress bar](progress-bar-small), or surface the wait as a background job with a [notification](notification) on completion.

* Center the loader in the region it replaces, sized to that container rather than to the page.

## Do / Don't

| Do | Don't |
| --- | --- |
| Prefer a [loading skeleton](loading-skeleton) once a view's layout is stable enough to sketch | Spin a generic loader over a table whose columns never change |
| Show one loader per waiting region | Nest loaders inside an already-loading region |
| Resolve to content, an [empty state](empty-state), or an [error state](error-state) | Keep spinning after the request has failed |
| Skip it for sub-second responses | Flash a loader that disappears before it is seen |

> Wording rules (brief present-tense messages, when to add one) live in the Content guidelines for loader.
