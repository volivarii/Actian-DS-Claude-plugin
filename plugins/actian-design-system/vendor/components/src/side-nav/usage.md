---
title: "Side nav usage guidelines"
---
## When to use

* Use the side nav for persistent access to the primary sections of an app (for example **Dashboard**, **Catalog**, **Topics** in Studio): it is the main way to move between places.

* Use it when the app has several top-level sections, or when a section needs visible sub-navigation.

* Use it anchored to the left of the content area, below the [global header](global-header), on every page of the apps that have it.

## When not to use

* Don't use it to switch between peer views of one object (**Overview**, **Lineage**, **Settings**): that is [tabs](tabs). The side nav changes place; tabs change view.

* Don't use it for suite-level switching between products or apps: that is the [global header](global-header).

* Don't use it to show the path back up from a detail page: that is [breadcrumbs](breadcrumbs) in the [page header](page-header).

* Don't put actions in it (**Create data product**, **Export**): navigation only. Actions live in the page header or a [toolbar](toolbar).

* Don't use it for an ordered sequence of steps: use a [stepper](stepper).

## Variant selection

* **App (Studio, Admin):** match the app you are designing; Explorer uses its own browsing chrome instead of a side nav.

* **Expanded:** the default; icons plus labels.

* **Collapsed:** icon-only rail for narrow screens or when the user collapses it; it must remain expandable, never remove it entirely.

## Do / Don't

| Do | Don't |
| --- | --- |
| Match item labels to the page headers they lead to | Call it **Data sources** in the nav and **Connections** on the page |
| Keep item naming and order identical across the platform | Reorder sections between Studio and Admin |
| Highlight the current section, and its parent when nested | Leave the user with no "you are here" marker |
| Keep the set of items stable as the user navigates | Add or remove items depending on the current page |

> Label wording rules (short, descriptive, plain language) live in the Content guidelines for the side nav.
