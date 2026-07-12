---
title: "Calendar usage guidelines"
---
## When to use

* Use a calendar when seeing surrounding days adds context to the choice (for example scheduling a metadata scan relative to a weekend or month end).

* Use it to pick a date range where the span between start and end should stay visible while choosing.

* Use it attached to a [date input](input-date) as the picking surface, or on its own when the month view is the main content of the screen.

## When not to use

* Don't use a standalone calendar for compact single-date entry in a form: use a [date input](input-date), which pairs typing with an attached calendar.

* Don't lead with a calendar for dates the user already knows exactly (a documented cutoff, a date from a report): typing into a [date input](input-date) is faster.

* Don't use it to display schedules or events: it is a picking control, not a timeline view.

## Variant selection

* **Single selection:** picking one date; the standard mode when attached to a date input.

* **Range selection:** picking a start and an end; the calendar shows the span between them while choosing.

* **Month view:** the default granularity for picking individual days.

* **Year view:** quick jumps to distant dates without paging month by month.

## Do / Don't

| Do | Don't |
| --- | --- |
| Highlight today's date for orientation | Leave the user hunting for the current day |
| Disable dates that cannot be chosen | Accept any date and show an error afterwards |
| Show the span while a range is being picked | Reveal the range only after both ends are set |
| Open on the month of the current or previously chosen value | Always open on the same fixed month |
| Keep the week layout consistent across the product | Change the first day of the week between screens |

> Date format and range label wording rules (**Start date**, **End date**; displayed format Jun 28, 2026, typed format YYYY-MM-DD) live in the Content guidelines for calendars.
