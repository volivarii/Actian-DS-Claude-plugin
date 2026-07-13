---
title: "Breadcrumbs usage guidelines"
---
## When to use

* Use breadcrumbs to show where the user is in the product hierarchy and let them jump back up in one click (for example **Data products / Sales analytics / orders-raw**).

* Use them in the [page header](page-header) of detail pages below a section root.

* The deeper the nesting, the more the path matters (a dataset inside a data product, a field inside a dataset).

## When not to use

* Don't use breadcrumbs as the primary way to move between sections of the app: that is the [side nav](side-nav). Breadcrumbs only go up the current branch.

* Don't treat them as a replacement for the browser back button: back retraces history, breadcrumbs climb the hierarchy. Both must work.

* Don't show breadcrumbs on top-level list pages (connections, datasets): there is nothing above them, so a single-item trail is noise.

* Don't use them to switch between peer views of the same entity: use [tabs](tabs).

## Variant selection

Breadcrumbs have a single Default variant; the choices are configuration.

* **Trail depth:** show the full path from the section root to the current page. Two to four levels is typical; if trails regularly exceed that, the information architecture is too deep.

* **Current page:** always the last item, rendered as plain text, never a link.

* **Truncation:** keep full names; truncate an item only when space is severely limited, and truncate the middle levels before the current page.

## Do / Don't

| Do | Don't |
| --- | --- |
| Use the exact page or entity name at every level | Paraphrase or shorten names (**Analytics** for **Sales analytics**) |
| Render the current page as plain text at the end | Make the current page a clickable link |
| Match the trail to the hierarchy shown in the side nav | Build the trail from the user's browsing history |
| Keep every parent level clickable | Include decorative, non-navigable levels |

> Naming pattern and truncation wording (Main component / Sub component / Specific item) live in the Content guidelines for breadcrumbs.
