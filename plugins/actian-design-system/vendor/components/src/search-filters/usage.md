---
title: "Filters usage guidelines"
---
Filters are the refinement surface of the search flow: they narrow what a [search](search) returned or what a list shows, alongside the [search dropdown menu](search-dropdown-menu) for suggestions and [search result cards](search-result-card) for presentation.

## When to use

* Use filters when a result set or list is large enough that users need structured criteria (**Owner**, **Status**, **Data domain**) to find what they need.

* Use them when several criteria apply simultaneously and users combine them to converge on a result.

* Place them above or to the left of the content they control, so cause and effect stay visually connected.

* Use them to refine search results in Explorer or narrow asset lists in Studio; filters only change what is visible, never the underlying data.

## When not to use

* Don't use filters for keyword lookup: a query typed against names and metadata is [search](search).

* Don't use them to switch between views of the same content set (grid vs table, day vs week): use a [segmented control](segmented-control).

* Don't reach for the full filter collection when one or two independent dropdowns above a [table](table) do the job: those stay plain [dropdown / select](dropdown-select) controls.

* Don't use filters as a saved-scope or permission mechanism; a filter is a temporary view refinement the user can always clear.

## Variant selection

* **Explorer:** refining search results and catalog browsing in Explorer, where search is a first-class surface.

* **Studio:** narrowing working lists of catalog assets, topics, and access requests.

* Match the variant to the app the user is in; never mix the two on one surface.

## Do / Don't

| Do | Don't |
| --- | --- |
| Show the active count when collapsed (**Filters (3)**) | Hide that filters are silently narrowing the view |
| Offer **Clear all** whenever filters are active | Force users to unpick criteria one by one |
| Keep the surrounding chrome and a clear-filters link when nothing matches (see [table](table)) | Swap in a create-new [empty state](empty-state) for a filtered-out view |
| Persist filter state when users leave and return to the view | Reset every filter on navigation |

> Filter label wording (short noun phrases, sentence case, the **Filters (3)** pattern) lives in the Content guidelines for filters.
