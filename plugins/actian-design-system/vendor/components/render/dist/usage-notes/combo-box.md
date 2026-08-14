# Combo box: usage notes

A combo box combines a text input with a dropdown list, allowing users to either type a value or select from predefined options. It is used when the list of options is long or when freeform input alongside suggestions is needed.

## When to use
- When the user needs to select from a large list (20+ items) and filtering by typing improves efficiency.
- When freeform input is valid alongside suggested options.
- Do not use a combo box when the list is short and fixed - use a standard dropdown instead.
- Use a combo box to select one value from a long list (roughly 20 or more items) where typing to narrow the options beats scrolling (for example picking a schema, a dataset, or a connection from hundreds).
- Use it when freeform input is valid alongside the suggestions, so the user can either pick a listed value or enter a new one.
- Use it when users typically know the value by name and can type its first characters faster than they can scan a menu.

## When not to use
- Don't use a combo box for a short, stable list users can scan without typing: use a dropdown / select.
- Don't use it to query or filter the content of the page: use search. A combo box narrows a field's own options, not what the page shows.
- Don't use it to collect several values as chips: use a multi-select.
- Don't use it for freeform values with no meaningful suggestion list: use a text input.

## Style
- Label the combo box with a short noun phrase describing what the user is selecting.
- Use placeholder text to indicate the expected input type. For example, `Search or select a schema`.
- Keep option labels consistent in format and sentence case.
- Do not use `Type to filter` as placeholder text - it states the obvious. Instead describe what is being searched.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
