# Global header: usage notes

Permanently anchored to the top of the screen across all pages and apps, for access when users need to switch context, use global tools, or access account options.

## When to use
- To switch between product areas or catalogs.
- To access global tools such as search or notifications.
- To view account and profile options.
- Use the global header as the one persistent bar at the top of every screen, across Studio, Explorer, and Administration.
- Use it for suite-level chrome only: switching between product areas, global search, notifications, what's new, help, and the account menu (profile, logout).
- Use it to state which app the user is in: the branded title and navigation context adapt to the current app.

## When not to use
- Don't put page identity or page-level actions in it (**New dataset**, **Edit**): those belong to the page header, which sits below it.
- Don't use it to navigate between sections within an app: that is the side nav.
- Don't add app-specific or entity-specific tools to it: if a control only makes sense on one page or for one entity, it does not belong in suite chrome.
- Don't stack a second custom top bar under it: one global header per screen, then the page header.

## Style
- Only the branded title and navigation context change between applications.
- Utility icons (notifications, help, profile) should be unlabeled but include tooltips.

## Category guidance (inherited: design, behavior)
Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
