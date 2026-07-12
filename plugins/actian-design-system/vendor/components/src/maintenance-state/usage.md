---
title: "Maintenance state usage guidelines"
---
## When to use

* Use a maintenance state when a page, feature, or app is temporarily unavailable because of planned work: an upgrade window, a migration, scheduled downtime.

* Use it for a known, acknowledged outage while work is underway, so users see intent and timing rather than a raw failure.

* Compose it from an illustration, a title, and what is affected; timing and the optional action are covered under Variant selection.

## When not to use

* Don't use it for an unexpected failure the product just hit: something broken is an [error state](error-state) with a **Try again**.

* Don't use it for a container with no content yet: that is an [empty state](empty-state).

* Don't use it to warn ahead of a window while everything still works: announce upcoming maintenance in a Primary [alert banner](alert-banner).

* Don't let it block the whole app when one feature is down: scope it to the affected page or region and keep the rest working.

## Variant selection

Maintenance states come in a single Large size; the choices are configuration.

* **Timing line:** include what is affected and the expected end (**until 12:00 PM EST**) whenever known.

* **CTA:** at most one action, and only when acting helps (**Refresh** for a window that may already be over); omit it otherwise.

* **Placement:** the state owns the main content region of whatever is down, the way an [error state](error-state) would.

## Do / Don't

| Do | Don't |
| --- | --- |
| Take it down as soon as service is restored | Leave the maintenance screen up past the window |
| Give real timing when known (**until 12:00 PM EST**) | Promise "back soon" for an all-day migration |
| Keep navigation to unaffected areas usable | Trap the user with no way to the rest of the app |
| Describe a shared outage the same way in Studio and Explorer | Tell each app a different story about the same window |

> Wording rules (what is affected and for how long, example messages) live in the Content guidelines for maintenance state.
