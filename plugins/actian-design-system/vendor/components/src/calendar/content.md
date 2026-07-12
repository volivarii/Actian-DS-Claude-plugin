---
title: "Calendar"
---
# Calendar

The calendar lets users pick a date or date range from a visual month view. It appears on its own or attached to a date input.

***

## When to use

* When users need to select a date or date range and seeing surrounding days adds context.

* For a compact single-date entry where a visual month view is unnecessary, use a [date input](input-date) instead.

## Style

* Label the action by what the date represents. For example, "Start date" or "Effective date", not "Select date".

* Use a single, consistent date format across the product. Spell out or abbreviate the month to avoid ambiguity. For example, "Jun 28, 2026".

* For a range, label both ends clearly as "Start date" and "End date".

## Behavior

* Highlight today's date for orientation.

* Disable dates that are not selectable rather than allowing selection and then showing an error.

* For a range, show the span between the two selected dates.

## Do / Don't

| Do                                 | Don't          |
| ---------------------------------- | -------------- |
| Start date                         | Select date    |
| Jun 28, 2026                       | 06/28/26       |
| End date must be after start date. | Invalid range. |
