# Cards: usage notes

Cards present information in compact, scannable formats and allow users to interact or navigate efficiently.

## When to use
- On dashboards and detail pages where items need to be viewed or opened quickly.
- To display individual items such as datasets, visualizations, or catalog entries in a clickable format.
- When users need to choose between options by clicking anywhere on the card.
- Use the large variant when additional context is needed (title, description, image, metadata).
- Use the small variant when space is limited.
- Cards can function as radio buttons (single select) or checkboxes (multi-select).
- To represent curated groupings or domains, such as data topics.

## When not to use
- Don't use cards for large sets of comparable records that users sort and filter: use a table.
- Don't use a card for a lone block of text on a page: plain page content needs no frame.
- Don't put primary page actions inside a card: page-level actions belong in the page header.
- Don't nest cards inside cards; use the grouped-content card's slot for inner content instead.

## Style
- Use the item name as the card title. Keep it concise and match the name used elsewhere in the platform.
- Include metadata (type, owner, last modified) using short labels.
- Use sentence case throughout.
- Title: short noun phrase describing the option. Sentence case.
- Description: one sentence maximum. Plain language.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
