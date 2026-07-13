---
title: "Validation messages"
nav_order: 47
# Pattern fan-out — form controls that carry inline validation. Mirrors most of
# forms.md fan-out but narrower; ordering on the page is forms-then-validation
# (forms appears first in content-index.md). Jeff: edit/correct/extend.
relatedComponents: [text-input, input-date, checkbox, radio-button, toggle]
---
# Validation messages

Validation messages appear inline with [form](forms) fields to help users correct input errors. They are the primary mechanism for communicating what went wrong and how to fix it.

***

## When to use

* On field blur (when the user leaves a field), not on every keystroke.

* On form submission when required fields are empty or invalid.

* Do not show validation errors before the user has interacted with a field.

## Style

* Be specific: say what is wrong and how to fix it.

* Use plain language - do not expose technical error codes or internal validation rule names.

* Keep messages to one sentence.

* Do not use "Invalid" as a standalone message - explain why it is invalid.

* Do not blame the user. Use neutral, factual language.

* Do not use "Please" - omit it.

## Do / Don't

| Do                                                    | Don't                                |
| ----------------------------------------------------- | ------------------------------------ |
| Enter a valid email address.                          | Invalid email.                       |
| Connection name is required.                          | Please fill out this field.          |
| Password must be 8–32 characters.                     | Password does not meet requirements. |
| This name is already in use. Choose a different name. | Duplicate entry error.               |
| Select at least one data domain.                      | You must make a selection.           |

## Text slots

Each field can carry up to three distinct pieces of text. Do not blend their roles.

| Slot | When it appears | Content |
|---|---|---|
| Label | Always | The field name. Mark required fields with an asterisk. |
| Description | Always, before the user interacts | Guidance the user needs before typing: the field's purpose, naming rules, or constraints. |
| Helper | Reactively, below the field | Format hints or status. Becomes the error or warning message when one is triggered - never show helper text and an error at the same time. |

## Severity

* **Error** blocks submission. State what's wrong and how to fix it.

* **Warning** does not block submission. State the risk, but let the user proceed. For example, "Datasets not found. You can still create the item."

* **Success** confirms a value or action. Use sparingly, only where confirmation reduces uncertainty.

* **Informational** is neutral guidance tied to a field or section. It carries no icon - reserve icons for error, warning, and success.

## Common fields

Make sure to confirm specific limits, formats, and patterns for any validation messages.

* When a field has a length or character restriction, state it up front in the description or helper text, not only after the user fails it. For example, "Use lowercase letters, numbers, and hyphens only." Repeat the same constraint in the error message if the value doesn't meet it, rather than a generic "Invalid" response.

### Email

* Description: state the expected format only if the field's purpose isn't obvious from the label.

* Error: give a realistic example that matches what this specific field expects, rather than a generic phrase. For example, "Enter a complete email like name@company.com."

### URL

* Description: state what the link is for, specific to that field. For example, "The web address to link to."

* Helper (before interaction): show the expected protocol as an example, matching what the field actually requires. For example, "Start with the protocol, e.g. https://"

* Error: name the specific requirement the value fails. For example, "Enter a URL that starts with https://"

### Date input

* Description or helper: show the expected format as an example, not an instruction.

* Error: name the specific date constraint the value fails, rather than a generic phrase. For example, "Enter a date on or after today."

See [date input](input-date).

### Character counters

* Show the counter as helper text once the user is near the limit, not from the first keystroke.

* Format: "[count]/[max]" (e.g., "42/100"). Switch to error styling only once the limit is exceeded, with the message: "[Field] must be [max] characters or fewer."
