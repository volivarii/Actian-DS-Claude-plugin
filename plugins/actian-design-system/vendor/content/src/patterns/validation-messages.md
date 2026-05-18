---
title: "Validation messages"
nav_order: 47
# Pattern fan-out — form controls that carry inline validation. Mirrors most of
# forms.md fan-out but narrower; ordering on the page is forms-then-validation
# (forms appears first in content-index.md). Jeff: edit/correct/extend.
relatedComponents: [input, input-date, checkbox-with-label, radio-button, toglge]
---
# Validation messages

Validation messages appear inline with [form](forms) fields to help users correct input errors. They are the primary mechanism for communicating what went wrong and how to fix it.

---

## When to use

- On field blur (when the user leaves a field), not on every keystroke.
- On form submission when required fields are empty or invalid.
- Do not show validation errors before the user has interacted with a field.

## Style

- Be specific: say what is wrong and how to fix it.
- Use plain language - do not expose technical error codes or internal validation rule names.
- Keep messages to one sentence.
- Do not use "Invalid" as a standalone message - explain why it is invalid.
- Do not blame the user. Use neutral, factual language.
- Do not use "Please" - omit it.

## Do / Don't

| Do | Don't |
|---|---|
| Enter a valid email address. | Invalid email. |
| Connection name is required. | Please fill out this field. |
| Password must be 8–32 characters. | Password does not meet requirements. |
| This name is already in use. Choose a different name. | Duplicate entry error. |
| Select at least one data domain. | You must make a selection. |
{: .do-dont-table}
