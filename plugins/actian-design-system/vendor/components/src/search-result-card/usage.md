---
title: "Search result card usage guidelines"
---
The search result card is the presentation surface of the search flow: it renders what a [search](search) query returned, after the [search dropdown menu](search-dropdown-menu) suggestions and under the active [filters](search-filters).

## When to use

* Use it for search results only: one card per returned item, in the results list of Explorer or Studio.

* Use it when users must evaluate relevance at a glance: it highlights matched keywords and surfaces identifying metadata (type, owner, last modified) beside the title.

* Use it when scannability of matches matters more than column comparison, which is why search results are not built as a generic [table](table).

## When not to use

* Don't use it in ordinary browse grids: data products on a dashboard or catalog items outside a search context use the item [card](card).

* Don't use it for record sets users sort and filter by attributes outside a search: use a [table](table).

* Don't use it inside the [search dropdown menu](search-dropdown-menu): suggestion rows stay name plus minimal context, not full cards.

* Don't render result cards when the query matched nothing: show the empty results message with query adjustment and no create call to action (see [empty state](empty-state)).

## Variant selection

* **Explorer:** results in Explorer, where search is a first-class surface and cards emphasize catalog metadata.

* **Studio:** results in Studio, tuned to working assets.

* Pick the variant of the app the results appear in; never mix Explorer and Studio cards in one list.

## Do / Don't

| Do | Don't |
| --- | --- |
| Highlight matched terms in title and excerpt | Show plain text and make users guess the match |
| Make the whole card one click target to the item's detail page | Scatter separate links inside the card body |
| Show the same metadata lines on every card in the list | Vary the metadata set from one result to the next |
| Trim excerpts at a consistent length | Let one card balloon to a paragraph while its neighbors stay two lines |

> Title fidelity, metadata label wording, and timestamp formatting live in the Content guidelines for the search result card.
