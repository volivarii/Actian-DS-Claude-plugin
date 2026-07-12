---
title: "Table usage guidelines"
---
## When to use

* Use a table for large sets of comparable records with shared attributes: datasets, connections, data processes, catalog entries.

* Use it when users need to sort, filter, or scan columns to compare values across many rows.

* Use it when rows carry row-level or bulk actions (edit, delete, export) that must stay reachable without leaving the view.

* Use it for complex rows that mix value types: text, badges, counts, dates, and an actions column.

## When not to use

* Don't use a table for browseable items whose identity matters more than attribute comparison: use a [card](card) grid (for example data products on a dashboard).

* Don't use a table to show a single item's attributes: use a definition list on the detail page or a [drawer / side panel](drawer-side-panel).

* Don't reach for a table when a simple list carries the content: two columns of name plus one value rarely need sorting chrome.

* Don't build search results as a generic table when scannability of matches matters: use the [search result card](search-result-card).

## Variant selection

* **Built type, by columns (default):** compose from column components when column formatting drives the layout: fixed widths, per-column alignment, one cell type per column.

* **Built type, by rows:** compose from row components when row-level treatment matters most: selection, hover actions, row states.

* **Empty data:** when the table has no rows yet, show the [empty state](empty-state) illustration with a create-new call to action (for example **Add connection**). Never render an empty grid.

* **No results after filtering:** keep the table chrome, explain the empty result, and offer a clear-filters link; do not show the create-new [empty state](empty-state).

* **Selection and bulk actions:** add the selection column only when bulk actions exist; otherwise leave it out to save width.

* **Pagination:** paginate long lists; do not rely on an unbounded scroll for datasets users must audit completely.

## Do / Don't

| Do | Don't |
| --- | --- |
| Sort by last modified by default on catalog lists | Default to alphabetical when recency is what users seek |
| Show the empty state with a create CTA when data is null | Leave a blank grid with no explanation |
| Keep one cell type per column | Mix badges, prose, and numbers in the same column |
| Add the selection column only when bulk actions exist | Show checkboxes that select nothing actionable |

> Column header wording, cell formatting, and status vocabulary live in the Content guidelines for tables.
