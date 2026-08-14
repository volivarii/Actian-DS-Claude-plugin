# Multi-select: usage notes

Multi-select allows users to choose more than one option from a list. It is used in filters, tag assignment, bulk operations, and configuration flows where multiple simultaneous selections are valid.

## When to use
- When users need to apply multiple filters at the same time.
- When assigning multiple tags, owners, or categories to an asset.
- Do not use multi-select when only one selection is valid - use a single-select dropdown or radio buttons instead.
- Use a multi-select as a form field that collects several values from one list, shown as chips inside the field (for example assigning tags, owners, or data domains to a data product).
- Use it when the option list is too long to show as a group of visible checkboxes.
- Use it to apply several filters from one category at once above a table or catalog list.

## When not to use
- Don't use it when exactly one value is valid: use a dropdown / select or a radio button group.
- Don't use it for up to roughly seven options that fit on screen: use a checkbox group so users can compare every option at a glance.
- Don't reach for a searchable multi-choice dropdown / select to collect form values: its in-menu checkboxes are for filtering; a multi-select carries the chosen values as chips.

## Style
- Label the control with a short noun phrase describing the category being selected. For example, **Data domains** or **Owners**.
- Show selected values as chips or tokens inside the input field.
- Keep chip labels concise - use the item name only, not additional metadata.
- Use **Select all** and **Clear all** as action labels when applicable.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
