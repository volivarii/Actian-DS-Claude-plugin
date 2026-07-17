# Date input: usage notes

A date input lets users enter a single date by typing or by picking from an attached calendar. Use it for compact date entry within a form.

## When to use
- For single-date entry in a form, such as a deadline or an effective date.
- When a visual month view would help the user choose, pair it with a calendar.
- Use a date input for compact date entry in a form, such as a deadline, an effective date, or a historical data point.
- Use it when users may know the exact date, so typing it is as fast as picking it.
- Pair it with an attached calendar when a visual month view would help the choice.

## When not to use
- Don't use a bare date input when the month view is the point of the screen (planning against surrounding days): lead with the calendar.
- Don't fall back to a plain text input for a date: the date input constrains the format and validates the value.
- Don't split a date across separate day, month, and year dropdown / select controls: three picks are slower and more error-prone than one field.

## Style
- Label the field by what the date represents. For example, "Start date", not "Date".
- Show the expected format as a placeholder example, not as an instruction. For example, "YYYY-MM-DD".
- Use a single, consistent date format across the product.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
