---
title: "Tabs usage guidelines"
---
## When to use

* Use tabs to switch between peer views of the same object or context, in place, without full navigation (for example **Overview**, **Lineage**, **Settings** on a dataset detail page).

* Use them when the views are at the same level and the user moves between them repeatedly during one task.

* Use them under a [page header](page-header) to structure a detail page whose content does not fit one scroll.

## When not to use

* Don't use tabs to navigate between different places in the app: use the [side nav](side-nav) or links. If the URL context changes meaningfully, it is navigation, not tabs.

* Don't use tabs to filter or re-display the same content set: use a [segmented control](segmented-control) (for example switching a list between grid and table view).

* Don't use tabs for sequential steps that must be completed in order: use a [stepper](stepper).

* Don't nest tabs inside tabs. If a view needs its own sub-views, the page is carrying too much: split it.

## Variant selection

Tabs have a single Default variant; the real choices are configuration.

* **Number of tabs:** two to six. Beyond six, labels truncate and scanning breaks; regroup the content or promote it to navigation.

* **First tab:** make it the summary view (**Overview**) and load it selected. Never land the user on an empty tab.

* **Show avatar:** turn it on only when a tab represents a person or account.

* **Tab order:** most-used view first, administrative or rarely used views (for example **Settings**) last. Keep the order identical across similar detail pages.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep the user on the same page when a tab is clicked | Trigger a full page navigation from a tab |
| Preserve entered state when switching tabs | Discard a half-filled form because the user peeked at another tab |
| Keep tab sets identical across entities of the same kind | Show Lineage on one dataset but not its sibling |
| Land on a populated default tab | Open on an empty tab that needs setup first |

> Tab label wording (short nouns, no verbs, sentence case) lives in the Content guidelines for tabs.
