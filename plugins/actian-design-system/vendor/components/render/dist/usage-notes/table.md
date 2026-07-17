# Table: usage notes

The table component displays structured information in rows and columns. It is the primary way users view, compare, and act on datasets, connections, catalog entries, and other list-based content in the platform.

## When to use
- To display multiple items with shared attributes that benefit from comparison.
- When users need to sort, filter, or act on rows individually or in bulk.
- When row-level actions (edit, delete, export) need to be accessible without leaving the view.
- Do not use a table for fewer than three columns or when a simple list or prose suffices.
- Do not use a table to display a single item's attributes - use a detail panel or form instead.
- Use a table for large sets of comparable records with shared attributes: datasets, connections, data processes, catalog entries.
- Use it when users need to sort, filter, or scan columns to compare values across many rows.

## When not to use
- Don't use a table for browseable items whose identity matters more than attribute comparison: use a card grid (for example data products on a dashboard).
- Don't use a table to show a single item's attributes: use a definition list on the detail page or a drawer / side panel.
- Don't reach for a table when a simple list carries the content: two columns of name plus one value rarely need sorting chrome.
- Don't build search results as a generic table when scannability of matches matters: use the search result card.

## Style
- Default column width should fit the widest expected value. Fixed widths work well for predictable data types: status (80-100px), date (120px), count or ID (60-80px).
- Do not add row numbers unless the sequence itself is meaningful data - for example, a ranked list.
- Status values always use standard vocabulary: Active, Inactive, Draft, Published, Deprecated, Error. Do not invent synonyms.
- Truncate long text with an ellipsis and expose the full value on hover via tooltip. Never wrap cell text across multiple lines.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
