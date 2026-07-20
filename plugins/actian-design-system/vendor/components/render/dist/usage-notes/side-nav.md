# Side nav: usage notes

Permanently anchored (though collapsible) to the left side of all apps in which it is available, for persistent access to primary sections of the product.

## When to use
- For persistent access to primary sections of the product.
- Use the side nav for persistent access to the primary sections of an app (for example **Dashboard**, **Catalog**, **Topics** in Studio): it is the main way to move between places.
- Use it when the app has several top-level sections, or when a section needs visible sub-navigation.
- Use it anchored to the left of the content area, below the global header, on every page of the apps that have it.

## When not to use
- Don't use it to switch between peer views of one object (**Overview**, **Lineage**, **Settings**): that is tabs. The side nav changes place; tabs change view.
- Don't use it for suite-level switching between products or apps: that is the global header.
- Don't use it to show the path back up from a detail page: that is breadcrumbs in the page header.
- Don't put actions in it (**Create data product**, **Export**): navigation only. Actions live in the page header or a toolbar.

## Style
- Clarity: use short, descriptive labels that match the text used in page headers.
- Consistency: keep naming and order consistent across the platform.
- Use plain language and common industry terms.

## Category guidance (inherited: design, behavior)
Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
