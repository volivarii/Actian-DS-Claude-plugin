# Breadcrumbs: usage notes

Breadcrumbs show the user's location within the product hierarchy and allow navigation back up the tree.

## When to use
- Use breadcrumbs to show where the user is in the product hierarchy and let them jump back up in one click (for example **Data products / Sales analytics / orders-raw**).
- Use them in the page header of detail pages below a section root.
- The deeper the nesting, the more the path matters (a dataset inside a data product, a field inside a dataset).

## When not to use
- Don't use breadcrumbs as the primary way to move between sections of the app: that is the side nav. Breadcrumbs only go up the current branch.
- Don't treat them as a replacement for the browser back button: back retraces history, breadcrumbs climb the hierarchy. Both must work.
- Don't show breadcrumbs on top-level list pages (connections, datasets): there is nothing above them, so a single-item trail is noise.
- Don't use them to switch between peer views of the same entity: use tabs.

## Style
- Use the exact page or item name at each level.
- Do not truncate unless space is severely limited.
- The current page is not a link — it is plain text at the end of the breadcrumb trail.

## Category guidance (inherited: design, behavior)
Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
