---
title: "Combo box"
nav_order: 7
---
# Combo box

A combo box combines a text input with a dropdown list, allowing users to either type a value or select from predefined options. It is used when the list of options is long or when freeform input alongside suggestions is needed.

---

## When to use

- When the user needs to select from a large list (20+ items) and filtering by typing improves efficiency.
- When freeform input is valid alongside suggested options.
- Do not use a combo box when the list is short and fixed - use a standard dropdown instead.

## Style

- Label the combo box with a short noun phrase describing what the user is selecting.
- Use placeholder text to indicate the expected input type. For example, `Search or select a schema`.
- Keep option labels consistent in format and sentence case.
- Do not use `Type to filter` as placeholder text - it states the obvious. Instead describe what is being searched.

## Behavior

- Filter results dynamically as the user types.
- Show a `No results found` message when there are no matches - do not show an empty dropdown.
- Allow selection by clicking or pressing Enter.
- Clear the input on selection unless the selected value is displayed in the input field.

## Do / Don't

| Do | Don't |
|---|---|
| Search or select a data source | Type to filter... |
| No results found for "xyz" | (empty dropdown) |
{: .do-dont-table}
