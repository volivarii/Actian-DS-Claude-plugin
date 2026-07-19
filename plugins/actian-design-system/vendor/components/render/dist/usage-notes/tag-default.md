# Tags: usage notes

Tags categorize or label items with metadata values such as topics, types, or user-defined attributes. The tag component has several variants: default, status, stage, catalog, interactive, and updated.

## When to use
- To categorize or label items with metadata values such as topics, types, or user-defined attributes.
- Do not use tags as action triggers — they are labels, not buttons. Use an interactive tag for clickable tag behavior.
- Use tags to label items with metadata values: topics, domains, types, or user-defined attributes on datasets, data products, and glossary entries.
- Use them for both user-applied labels (a topic a steward adds) and system-applied classification (an item's type or lifecycle stage).
- Use interactive tags in edit contexts where a label can be removed or selected, for example managing the topics on a data product or clearing an applied criterion in filters.

## When not to use
- Don't use a tag as an action trigger: tags are labels, not buttons. Only the interactive variant responds to clicks, and only to select or remove the label itself.
- Don't use a tag for a count or a small indicator attached to another element (unread items on a nav entry): use a badge. A tag names a metadata value and stands on its own.
- Don't invent freeform text for values the platform already classifies: item types, stages, and statuses use their dedicated variants with fixed vocabularies.
- Don't stack so many tags on a card or row that they crowd out the content; show the few that aid recognition and overflow the rest.

## Style
- Use sentence case.
- Keep tag text to one to three words.
- Status tags use standard vocabulary: Active, Inactive, Draft, Published, Deprecated, Error.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
