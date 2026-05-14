---
title: "Multi-select"
nav_order: 23
---
# Multi-select

Multi-select allows users to choose more than one option from a list. It is used in filters, tag assignment, bulk operations, and configuration flows where multiple simultaneous selections are valid.

---

## When to use

- When users need to apply multiple filters at the same time.
- When assigning multiple tags, owners, or categories to an asset.
- Do not use multi-select when only one selection is valid - use a single-select dropdown or radio buttons instead.

## Style

- Label the control with a short noun phrase describing the category being selected. For example, **Data domains** or **Owners**.
- Show selected values as chips or tokens inside the input field.
- Keep chip labels concise - use the item name only, not additional metadata.
- Use **Select all** and **Clear all** as action labels when applicable.

## Behavior

- Show a count of selected items when the list collapses. For example, `3 selected`.
- Allow individual chip removal via a close icon on each chip.
- Keep the dropdown open until the user clicks outside or presses Escape.

## Do / Don't

| Do | Don't |
|---|---|
| 3 selected | 3 items have been selected |
| Clear all | Remove all selections |
| Select all | Check all |
{: .do-dont-table}
