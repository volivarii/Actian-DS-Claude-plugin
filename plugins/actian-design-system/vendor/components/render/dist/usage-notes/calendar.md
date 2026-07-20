# Calendar: usage notes

The calendar lets users pick a date or date range from a visual month view. It appears on its own or attached to a date input.

## When to use
- When users need to select a date or date range and seeing surrounding days adds context.
- For a compact single-date entry where a visual month view is unnecessary, use a date input instead.
- Use a calendar when seeing surrounding days adds context to the choice (for example scheduling a metadata scan relative to a weekend or month end).
- Use it to pick a date range where the span between start and end should stay visible while choosing.
- Use it attached to a date input as the picking surface, or on its own when the month view is the main content of the screen.

## When not to use
- Don't use a standalone calendar for compact single-date entry in a form: use a date input, which pairs typing with an attached calendar.
- Don't lead with a calendar for dates the user already knows exactly (a documented cutoff, a date from a report): typing into a date input is faster.
- Don't use it to display schedules or events: it is a picking control, not a timeline view.

## Style
- Label the action by what the date represents. For example, "Start date" or "Effective date", not "Select date".
- Use a single, consistent date format across the product. Spell out or abbreviate the month to avoid ambiguity. For example, "Jun 28, 2026".
- For a range, label both ends clearly as "Start date" and "End date".

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
