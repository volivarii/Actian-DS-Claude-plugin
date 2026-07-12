---
title: "Search usage guidelines"
---
Search is the input surface of the search flow: suggestions appear in the [search dropdown menu](search-dropdown-menu), refinement lives in [filters](search-filters), and results render as [search result cards](search-result-card).

## When to use

* Use search as the global entry point for finding any data asset across the platform, from the [global header](global-header) or the Explorer home.

* Use it as a scoped filter inside a specific view: a catalog section, a topic, a long list where typing narrows what is shown.

* Use it when users know roughly what they are looking for and a keyword beats browsing or structured criteria.

## When not to use

* Don't use search to collect a freeform form value such as a name or host: use a [text input](text-input). Search queries content; it never stores data.

* Don't use it to pick a form value by typing from a known list: use a [combo box](combo-box).

* Don't use it as the only way to narrow a result set by structured attributes (owner, status, type): pair it with [filters](search-filters) instead of teaching users keyword tricks.

* Don't embed a search field for a list short enough to scan; a dozen visible items need no query box.

## Variant selection

* **Explorer home:** the prominent search on the Explorer landing surface, where finding an asset is the primary task of the page.

* **Global header:** the persistent search in the [global header](global-header), reachable from anywhere in the app for cross-platform lookup.

* **Inline:** a scoped search embedded above a [table](table) or list, filtering only that view's content.

## Do / Don't

| Do | Don't |
| --- | --- |
| Scope the placeholder to what is searched (**Search topics**) | Show a generic **Search** placeholder on every surface |
| Execute the search on Enter or on a suggestion click | Reload the full results page on every keystroke |
| Keep the last query when the user returns to the search view | Wipe the query each time the user navigates back |
| Offer query adjustment when nothing matches (see [empty state](empty-state)) | Push a create call to action at a query that found nothing |

> Placeholder wording rules ("Search + plural asset name", no period) live in the Content guidelines for search.
