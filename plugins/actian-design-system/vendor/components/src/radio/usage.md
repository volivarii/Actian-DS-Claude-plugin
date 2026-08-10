---
title: "Radio button usage guidelines"
---
## When to use

* Use radio buttons when the user must pick exactly one of 2-5 mutually exclusive options (for example a refresh schedule: **Daily**, **Weekly**, **Monthly**).

* Use them when seeing all options at once helps the user compare before choosing (for example access levels on a connection).

* Use them inside forms where the choice applies on submit, not the instant it is clicked.

## When not to use

* Don't use radio buttons for more than about five options, or for lists that grow dynamically: use a [dropdown / select](dropdown-select).

* Don't use them to switch views of the same content with immediate effect: use a [segmented control](segmented-control).

* Don't use them when several options can be selected together: use [checkboxes](checkbox).

* Don't use a Yes/No radio pair for a single opt-in: use one [checkbox](checkbox), or a [toggle](toggle) if the change applies immediately.

## Variant selection

Radio buttons have no type or size variants; the choices are between group configurations.

* **Preselected default:** when a choice is required and one option is clearly the safest or most common, select it by default.

* **No default:** when the decision is consequential (for example picking a data product's visibility), leave all options unselected and require an explicit choice.

* **Card format:** when each option needs a title, description, or image, use the card format as a radio group (see [cards](card)).

## Do / Don't

| Do | Don't |
| --- | --- |
| Show every option; radio groups never scroll | Stack ten radio options in a column |
| Keep one group per decision | Let two decisions share a single group |
| Preselect the most common option when it is safe | Preselect a destructive or irreversible option |
| Use radios only for real alternative values | Use two radios for a plain on/off setting |

> Label wording rules (short noun phrases, parallel structure, group labels) live in the Content guidelines for radio buttons.
