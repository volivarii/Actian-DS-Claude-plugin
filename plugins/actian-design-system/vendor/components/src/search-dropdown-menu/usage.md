---
title: "Search dropdown menu usage guidelines"
---
The search dropdown menu is the suggestion surface of the search flow: it opens under a [search](search) field, before the full results page with its [search result cards](search-result-card) and [filters](search-filters).

## When to use

* Use it to surface matching results and suggestions live under a [search](search) field as the user types, so a known target is reachable without leaving the field.

* Use it to shortcut the full results page: a user typing an exact asset name should land on that asset in one click.

* Use it to group matches by type (**Datasets**, **Topics**) when more than one kind of asset can match the query.

## When not to use

* Don't put filter controls or unrelated actions in the menu: refinement belongs to [filters](search-filters) on the results page; the menu carries only matches and suggestions.

* Don't use it as a form control that assigns a value by typing: use a [combo box](combo-box).

* Don't use it as a command or actions menu under a button: use [dropdown / select](dropdown-select).

* Don't make it the whole search experience: cap the list and hand off to the full results page (**See all results**) instead of scrolling dozens of matches in a floating menu.

## Variant selection

* **Before typed:** the field is focused but empty; show recent searches or suggested entry points so the menu is never blank.

* **After typed:** live matches for the current query, grouped by type, matched portion highlighted.

* **No result:** a brief message naming the query (for example **No matches for "orders"**); suggest adjusting the query, never a create action.

* **Explorer home:** the wider menu paired with the Explorer home [search](search) variant on the landing surface.

## Do / Don't

| Do | Don't |
| --- | --- |
| Highlight the matched portion of each result | Make users guess why a result matched |
| Keep each row to its name plus minimal context (type, owner) | Load full metadata cards into the menu |
| Offer **See all results** when matches exceed the menu | Truncate the list silently |
| Let users move through results with the keyboard and select with Enter | Support pointer selection only |

> Group headings, empty-message wording, and the **See all results** phrasing live in the Content guidelines for the search dropdown menu.
