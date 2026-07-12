---
title: "Empty state usage guidelines"
---
## When to use

* Use an empty state when a container has no content yet: no datasets created, no connections configured, an empty glossary on first use.

* Use it when a [search](search) or filter returns nothing, so the user knows the query worked but matched no items.

* Compose it from an illustration (decorative for assistive tech), a clear title, a short explanation, and a way forward.

* Give first-use containers a create call to action (**Create dataset**), including a [table](table) with no rows yet.

* For empty search or filter results, drop the create action and offer query adjustment instead (clear filters, broaden the search). Inside a filtered [table](table), keep the table chrome and offer the clear-filters link there.

## When not to use

* Don't use an empty state when something failed. A request error, a broken connection, or a failed load is an [error state](error-state); masking a failure as "no content" hides the problem.

* Don't use an empty state while content is on its way: use a [loading skeleton](loading-skeleton) until the response lands, then decide between content, empty, and error.

* Don't use it for planned downtime or an unavailable service: use a [maintenance state](maintenance-state).

* Don't use it to celebrate the end of a flow: a completed creation or setup journey ends on a [success state](success-state).

## Variant selection

* **Large:** a full page or the main content region owns the emptiness (first visit to Datasets in Studio, an empty catalog in Explorer).

* **Medium:** a panel, section, or [table](table) body inside a page that otherwise has content (an empty tab on a data product's detail page).

* **Small:** compact containers such as cards, side panels, or dropdown lists, where the illustration must not dwarf the widget.

* Pick the size from the container, not from how important the message feels; a Large illustration inside a card overwhelms the page.

## Do / Don't

| Do | Don't |
| --- | --- |
| Give first-use emptiness a create CTA (**Add connection**) | Show "No results." with no way forward |
| Offer **Clear filters** when a search matches nothing | Push **Create dataset** at a user whose search found nothing |
| Match size to the container (Small in a card) | Put a full-page Large empty state inside a panel |
| Show an [error state](error-state) when the load failed | Pretend a failed request is an empty container |

> Wording rules (instructive headline, one-sentence body, CTA phrasing) live in the Content guidelines for empty state.
