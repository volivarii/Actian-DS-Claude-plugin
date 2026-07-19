# Search result card: usage notes

Search result cards display individual items returned by a search. Each card identifies the result and provides enough context for the user to evaluate relevance.

## When to use
- To display individual results in a search results list.
- When results need to show metadata alongside the item title to help users identify the right result.
- Use it for search results only: one card per returned item, in the results list of Explorer or Studio.
- Use it when users must evaluate relevance at a glance: it highlights matched keywords and surfaces identifying metadata (type, owner, last modified) beside the title.
- Use it when scannability of matches matters more than column comparison, which is why search results are not built as a generic table.

## When not to use
- Don't use it in ordinary browse grids: data products on a dashboard or catalog items outside a search context use the item card.
- Don't use it for record sets users sort and filter by attributes outside a search: use a table.
- Don't use it inside the search dropdown menu: suggestion rows stay name plus minimal context, not full cards.
- Don't render result cards when the query matched nothing: show the empty results message with query adjustment and no create call to action (see empty state).

## Style
- The result title should match the item name exactly. Do not truncate titles in the title field.
- Metadata labels should be concise. Use nouns or short phrases. For example, "Dataset", "Last modified", "Owner".
- Excerpt or description text should be trimmed at a consistent length with an ellipsis.
- Highlight matched terms in the result text to help users confirm relevance.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
