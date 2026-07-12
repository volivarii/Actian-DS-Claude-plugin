---
title: "Multi-select usage guidelines"
---
## When to use

* Use a multi-select as a form field that collects several values from one list, shown as chips inside the field (for example assigning tags, owners, or data domains to a data product).

* Use it when the option list is too long to show as a group of visible checkboxes.

* Use it to apply several filters from one category at once above a [table](table) or catalog list.

## When not to use

* Don't use it when exactly one value is valid: use a [dropdown / select](dropdown-select) or a [radio button](radio-button) group.

* Don't use it for up to roughly seven options that fit on screen: use a [checkbox](checkbox) group so users can compare every option at a glance.

* Don't reach for a searchable multi-choice [dropdown / select](dropdown-select) to collect form values: its in-menu checkboxes are for filtering; a multi-select carries the chosen values as chips.

## Variant selection

Multi-selects have no type or size variants; the choices are between modes.

* **Chips in field:** the default; every selected value stays visible and individually removable via its close icon.

* **Collapsed count:** when selections outgrow the field, collapse to a count such as **3 selected**.

* **Select all / Clear all:** add these actions when picking everything or resetting is a common move.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep the list open while the user picks several values | Close the menu after every single pick |
| Let each chip be removed by keyboard as well as its close icon | Force a full reset to drop one value |
| Show a count when the field collapses | Truncate chips with no signal of how many are chosen |
| Keep chip labels to the item name only | Pack metadata into every chip |
| Preload current assignments when editing an asset | Open an edit form with an empty field |

> Count and action wording rules (**3 selected**, **Select all**, **Clear all**) live in the Content guidelines for multi-selects.
