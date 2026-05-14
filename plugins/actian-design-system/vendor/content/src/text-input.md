---
title: "Text input"
nav_order: 36
---
# Text input

Text inputs allow users to enter freeform text. They are used for naming, descriptions, search, and any field where the expected value cannot be constrained to a fixed list.

---

## Behavior

Error validation should happen at the latest when the user clicks out of the text entry field (on blur).

## Placeholder text

- Placeholder text provides a brief example of the expected input content.
- Use placeholder text only to model good input - not to convey instructions or restrictions for the field.
- Placeholder text should never simply repeat the field label or description.

### When to use placeholder text

- When an example would model the correct input.
- When naming conventions or restrictions should be reinforced.
- When the field label could be interpreted in different ways and an example would reduce that ambiguity.
- Never use placeholder text if the label text is sufficient on its own.

## Do / Don't

| Do | Don't |
|---|---|
| Label: Dataset name / Placeholder: e.g. Q4_sales_report | Placeholder: Enter dataset name |
| Placeholder: e.g. john.doe@company.com | Placeholder: Enter your email address |
{: .do-dont-table}
