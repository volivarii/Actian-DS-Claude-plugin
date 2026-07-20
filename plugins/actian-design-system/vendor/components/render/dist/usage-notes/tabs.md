# Tabs: usage notes

Tabs switch between related views on the same page without full navigation.

## When to use
- To switch between related views on the same page without full navigation.
- Use tabs to switch between peer views of the same object or context, in place, without full navigation (for example **Overview**, **Lineage**, **Settings** on a dataset detail page).
- Use them when the views are at the same level and the user moves between them repeatedly during one task.
- Use them under a page header to structure a detail page whose content does not fit one scroll.

## When not to use
- Don't use tabs to navigate between different places in the app: use the side nav or links. If the URL context changes meaningfully, it is navigation, not tabs.
- Don't use tabs to filter or re-display the same content set: use a segmented control (for example switching a list between grid and table view).
- Don't use tabs for sequential steps that must be completed in order: use a stepper.
- Don't nest tabs inside tabs. If a view needs its own sub-views, the page is carrying too much: split it.

## Style
- Tab labels are short nouns or noun phrases. For example, **Overview**, **Lineage**, **Settings**.
- Use sentence case.
- Avoid verbs in tab labels.

## Category guidance (inherited: design, behavior)
Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
