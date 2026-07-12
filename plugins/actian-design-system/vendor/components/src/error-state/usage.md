---
title: "Error state usage guidelines"
---
## When to use

* Use an error state when a page, panel, or resource failed to load and its content cannot be shown: a request error, a broken connection, a failed fetch.

* Use it when a user action failed in a way that empties or invalidates the container it ran in.

* Compose it from an illustration, a clear title, a short explanation, and a recovery action (**Try again**).

## When not to use

* Don't use an error state when the container is simply empty: no datasets yet is an [empty state](empty-state), not a failure.

* Don't use it while the request is still in flight: show a [loading skeleton](loading-skeleton) until the response lands.

* Don't use it for planned downtime or a known outage: use a [maintenance state](maintenance-state).

* Don't use it for a field or form error: that belongs to inline validation on the [text input](text-input), or an [alert banner](alert-banner) for section-level problems.

* Don't use it for a failed background action that doesn't block the current view: use a critical [global toast](global-toast) with a retry.

## Variant selection

* **Large:** the full page or main content region failed (a dataset detail page that won't load).

* **Medium:** a panel, section, or [table](table) body failed inside a page that otherwise works (one widget's query failing on a dashboard).

* Match the size to the failed container; a Large treatment inside a panel blames the whole page for one section's failure.

## Do / Don't

| Do | Don't |
| --- | --- |
| Give every error state a recovery action (**Try again**) | Dead-end the user with a message and no way forward |
| Keep the rest of the page interactive around a Medium error | Freeze working content because one section failed |
| Replace the skeleton the moment the request fails | Leave a [loading skeleton](loading-skeleton) pulsing over a dead request |
| Preserve the user's context (filters, scroll) across a retry | Reset the page state on every **Try again** |

> Wording rules (specific and non-blaming, no raw error codes, example messages) live in the Content guidelines for error state.
