---
title: "Date input"
---
# Date input

A date input lets users enter a single date by typing or by picking from an attached [calendar](calendar). Use it for compact date entry within a form.

***

## When to use

- For single-date entry in a form, such as a deadline or an effective date.
- When a visual month view would help the user choose, pair it with a [calendar](calendar).

## Style

- Label the field by what the date represents. For example, "Start date", not "Date".
- Show the expected format as a placeholder example, not as an instruction. For example, "YYYY-MM-DD".
- Use a single, consistent date format across the product.

## Behavior

- Validate the date on blur, not on every keystroke. See [text input](text-input) for the general rule.
- State what is wrong and how to fix it when a date is invalid or out of range.

## Do / Don't

| Do | Don't |
|---|---|
| Label: Start date / Placeholder: YYYY-MM-DD | Placeholder: Enter a date |
| Enter a date on or after today. | Invalid date. |
| Effective date | Date field |
