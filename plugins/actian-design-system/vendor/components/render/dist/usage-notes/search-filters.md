# Filters: usage notes

Filters allow users to refine visible data by applying structured criteria. They reduce results without modifying underlying data. Filters must be consistent in terminology, placement, and behavior across all products.

## When to use
- When a dataset or list is large enough that users need to narrow results to find what they need.
- When multiple filter criteria can be applied simultaneously.
- Do not use filters for permanent data modifications - filters only affect the current view.
- Use filters when a result set or list is large enough that users need structured criteria (**Owner**, **Status**, **Data domain**) to find what they need.
- Use them when several criteria apply simultaneously and users combine them to converge on a result.
- Place them above or to the left of the content they control, so cause and effect stay visually connected.
- Use them to refine search results in Explorer or narrow asset lists in Studio; filters only change what is visible, never the underlying data.

## When not to use
- Don't use filters for keyword lookup: a query typed against names and metadata is search.
- Don't use them to switch between views of the same content set (grid vs table, day vs week): use a segmented control.
- Don't reach for the full filter collection when one or two independent dropdowns above a table do the job: those stay plain dropdown / select controls.
- Don't use filters as a saved-scope or permission mechanism; a filter is a temporary view refinement the user can always clear.

## Style
- Filter labels use short noun phrases that match the attribute being filtered. For example, `Owner`, `Status`, `Data domain`.
- Use sentence case for all filter labels and option values.
- Show the active filter count when filters are collapsed. For example, `Filters (3)`.
- Use consistent terminology across all filter controls in the same view.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
