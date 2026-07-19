# Radio button: usage notes

Radio buttons let users select exactly one option from a group. Use them when options are mutually exclusive and all choices should be visible at once.

## When to use
- When users must choose exactly one option from a small set (2-6 options).
- When the options are mutually exclusive.
- When all options should be visible without interaction.
- For larger or dynamic option sets, use a dropdown select instead.
- Use radio buttons when the user must pick exactly one of 2-5 mutually exclusive options (for example a refresh schedule: **Daily**, **Weekly**, **Monthly**).
- Use them when seeing all options at once helps the user compare before choosing (for example access levels on a connection).
- Use them inside forms where the choice applies on submit, not the instant it is clicked.

## When not to use
- Don't use radio buttons for more than about five options, or for lists that grow dynamically: use a dropdown / select.
- Don't use them to switch views of the same content with immediate effect: use a segmented control.
- Don't use them when several options can be selected together: use checkboxes.
- Don't use a Yes/No radio pair for a single opt-in: use one checkbox, or a toggle if the change applies immediately.

## Style
- Write labels as short noun phrases or adjectives, not full sentences.
- Keep labels parallel in structure across the group.
- Always include a group label that describes what is being selected.
- Avoid labels like "Option 1" or "Other" without further context.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
