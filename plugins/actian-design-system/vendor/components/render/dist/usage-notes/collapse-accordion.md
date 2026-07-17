# Collapse / accordion: usage notes

The collapse accordion progressively discloses content that users may not always need. Use it to reduce visual complexity in long pages or settings panels.

## When to use
- To hide optional or advanced content that does not need to be visible by default.
- When content is long and only some users will need all of it.
- Do not use for content users will need on every visit. Keep frequently accessed content visible.
- Use a collapse / accordion to progressively disclose secondary content on long pages: advanced settings, connection details, FAQ answers.
- Use it when content is long and only some users need all of it: everyone else keeps a shorter page.
- Use it to reduce vertical clutter on a detail or settings page while keeping every section on the page and reachable in one click.

## When not to use
- Don't use it for content users need on every visit: keep frequently accessed content visible.
- Don't use it for peer views the user switches between repeatedly: use tabs, which swap views instead of stacking them.
- Don't use it to show the properties of an item selected from a list: use a drawer / side panel.
- Don't wrap a page's primary content in an accordion: disclosure is for the secondary layer, not the main event.

## Style
- Write header labels as short noun phrases that describe the content inside.
- Avoid generic labels like "More", "Details", or "Other".
- The label should not change when the section is expanded or collapsed.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
