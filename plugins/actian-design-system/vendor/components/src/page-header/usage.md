---
title: "Page header usage guidelines"
---
## When to use

* Use a page header at the top of every main content area to state where the user is: page title, optional [breadcrumbs](breadcrumbs), and the page's primary actions.

* Use it to carry the one or two page-level actions (for example **New dataset** on a list page, **Edit** on a detail page).

* Use it on detail pages to anchor identity: the entity's exact name plus breadcrumbs back up the hierarchy.

## When not to use

* Don't use a page header for suite-level chrome (product switcher, search, account): that is the [global header](global-header), which sits above it.

* Don't use it inside [modals](modal), [drawers / side panels](drawer-side-panel), or nested sections: those surfaces have their own title patterns.

* Don't use it as a section divider within a page: use plain headings.

* Don't load it with more than two primary actions: move the rest into an actions menu ([dropdown / select](dropdown-select)).

## Variant selection

* **Default:** list and index pages (connections, datasets, data processes in Studio or Administration): title plus page-level create action.

* **Details page:** a single entity's page: breadcrumbs, the entity name as title, and entity-level actions such as **Edit**.

* **Explorer home:** the Explorer landing page only; do not reuse it elsewhere.

* **Explorer detail:** asset detail pages inside Explorer; pairs with Explorer's browsing chrome.

## Do / Don't

| Do | Don't |
| --- | --- |
| Title the page with the entity's exact name | Paraphrase or decorate the name (**Sales analytics overview**) |
| Keep at most two primary actions in the header | Line up four buttons across the title row |
| Use breadcrumbs on detail pages to show the path back | Rely on the browser back button as the only way up |
| Use the same variant for every page of the same kind | Give two list pages different header layouts |

> Title and action label wording (sentence case, one or two words per action) lives in the Content guidelines for page headers.
