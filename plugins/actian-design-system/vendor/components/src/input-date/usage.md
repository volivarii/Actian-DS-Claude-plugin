---
title: "Date input usage guidelines"
---
## When to use

* Use a date input for compact date entry in a form, such as a deadline, an effective date, or a historical data point.

* Use it when users may know the exact date, so typing it is as fast as picking it.

* Pair it with an attached [calendar](calendar) when a visual month view would help the choice.

## When not to use

* Don't use a bare date input when the month view is the point of the screen (planning against surrounding days): lead with the [calendar](calendar).

* Don't fall back to a plain [text input](text-input) for a date: the date input constrains the format and validates the value.

* Don't split a date across separate day, month, and year [dropdown / select](dropdown-select) controls: three picks are slower and more error-prone than one field.

## Variant selection

* **Single date:** one date field; the default for deadlines and effective dates.

* **Date range:** start and end in one control, for spans such as a reporting window or a retention period.

* **Label, sub label, and helper text:** on by default; drop the sub label only when the label alone is unambiguous; helper text carrying the expected format (YYYY-MM-DD) stays as long as typing is accepted.

* **Required (asterisk):** show the asterisk on required date fields so the requirement is visible before submit.

## Do / Don't

| Do | Don't |
| --- | --- |
| Validate the date on blur | Flash errors while the user is still typing |
| Accept typing and the attached calendar equally | Force every entry through the picker |
| Say what range is valid when a date is rejected | Stop at naming the field invalid |
| Keep one date format across the product | Vary the format field by field |
| Constrain a range so the end follows the start | Accept an end date before the start date |

> Label, placeholder, and error wording rules ("Start date"; typed format YYYY-MM-DD, displayed format Jun 28, 2026) live in the Content guidelines for date inputs.
