# Toolbar: usage notes

A toolbar groups the primary actions for the content below it, such as a table or a canvas. It keeps frequent actions visible and in a predictable place.

## When to use
- To group the main actions that apply to a view or a selection within it.
- Do not use a toolbar for page-level title actions. Those belong in the page header.
- Use a toolbar to group the primary actions for the working surface directly below it: a table, a canvas, or a list (for example **Export**, **Add filter**, **Delete** above a dataset table).
- Use it for actions that apply to the current view or to the current selection within it, and that users reach for repeatedly.
- Use it to keep frequent actions visible in one predictable place instead of scattering them around the content.

## When not to use
- Don't use a toolbar for page-level title actions (**New dataset**, **Edit**): those belong in the page header.
- Don't use it for actions on a single row: those are ghost or icon-only buttons inside the table row itself.
- Don't use it as the commit bar of a long form (**Save**, **Cancel**): that is the sticky footer.
- Don't use it for navigation between views or places: use tabs or the side nav.

## Style
- Use short action labels. Prefer one or two words. For example, "Export", "Add filter".
- Order actions by frequency of use, most common first.
- Use icon-only buttons only for well-understood actions, and always pair them with a tooltip.
- Group related actions together and separate unrelated groups.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
