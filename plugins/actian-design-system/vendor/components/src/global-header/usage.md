---
title: "Global header usage guidelines"
---
## When to use

* Use the global header as the one persistent bar at the top of every screen, across Studio, Explorer, and Administration.

* Use it for suite-level chrome only: switching between product areas, global [search](search), notifications, what's new, help, and the account menu (profile, logout).

* Use it to state which app the user is in: the branded title and navigation context adapt to the current app.

## When not to use

* Don't put page identity or page-level actions in it (**New dataset**, **Edit**): those belong to the [page header](page-header), which sits below it.

* Don't use it to navigate between sections within an app: that is the [side nav](side-nav).

* Don't add app-specific or entity-specific tools to it: if a control only makes sense on one page or for one entity, it does not belong in suite chrome.

* Don't stack a second custom top bar under it: one global header per screen, then the page header.

* Don't detach its dropdowns from it: notifications, [what's new](whats-new-dropdown), and the account menu open anchored to their header icons.

## Variant selection

* **App type (Studio, Explorer, Admin):** always match the app the user is actually in; never mix one app's header with another app's content.

* **Breakpoints (XL to XS):** the breakpoint follows the viewport of the screen you are designing for; it is not a preference.

* Across app types, only the branded title and navigation context change: utility icons keep the same set, order, and position everywhere.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep the header identical in structure across all apps | Rearrange utility icons from one app to the next |
| Reflect the current app in the branded title | Show the Studio header on an Explorer page |
| Give unlabeled utility icons a [tooltip](tooltip) | Add text labels next to every icon |
| Route recent-changes announcements to the [what's new](whats-new-dropdown) entry | Announce releases with a page-level banner on every screen |

> Wording for the branded title and utility tooltips lives in the Content guidelines for the global header.
