# Maintenance state: usage notes

Maintenance states inform users that part of the platform is temporarily unavailable due to planned or unplanned work.

## When to use
- When a page or feature is temporarily unavailable due to maintenance.
- Use a maintenance state when a page, feature, or app is temporarily unavailable because of planned work: an upgrade window, a migration, scheduled downtime.
- Use it for a known, acknowledged outage while work is underway, so users see intent and timing rather than a raw failure.
- Compose it from an illustration, a title, and what is affected; timing and the optional action are covered under Variant selection.

## When not to use
- Don't use it for an unexpected failure the product just hit: something broken is an error state with a **Try again**.
- Don't use it for a container with no content yet: that is an empty state.
- Don't use it to warn ahead of a window while everything still works: announce upcoming maintenance in a Primary alert banner.
- Don't let it block the whole app when one feature is down: scope it to the affected page or region and keep the rest working.

## Style
- Explain what is affected and for how long.
- Provide an estimated time to resolution when available.
- Include a single CTA if there is something the user can do.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
