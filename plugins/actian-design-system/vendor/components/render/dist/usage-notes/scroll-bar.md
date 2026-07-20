# Scroll bar: usage notes

The scroll bar indicates that a container has overflow content and lets users navigate it. It appears automatically when content exceeds its container.

## When to use
- Automatically when content exceeds the visible area of a container.
- Do not suppress scroll bars in contexts where content overflow is expected.
- Let the scroll bar appear automatically when content exceeds the visible area of a container: it signals the overflow and lets users navigate it.
- Use a custom scroll container only when standard browser scrolling is insufficient: an independently scrolling region inside a fixed layout, such as a drawer / side panel body or a table body under a pinned header.
- Use it in any container with a fixed height and variable content: query results, log output, long attribute lists.

## When not to use
- Don't restyle or replace the page-level browser scroll: custom scroll is for regions inside the page, not the page itself.
- Don't suppress scroll bars where overflow is expected: a region that looks unscrollable reads as complete when it isn't.
- Don't nest independently scrolling regions inside one another: two scroll bars in the same direction fight for the wheel.
- Don't use scrolling as a fix for an overloaded panel: when a drawer scrolls forever, move the content to the full details page.

## Style
- Scroll bars carry no copy.
- Scrollable regions should have an accessible label so screen reader users understand the context. For example, "Dataset list" or "Query results".

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
