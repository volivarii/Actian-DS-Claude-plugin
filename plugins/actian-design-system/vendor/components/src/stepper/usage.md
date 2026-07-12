---
title: "Stepper usage guidelines"
---
## When to use

* Use a stepper for a linear process of three or more distinct steps that must be completed in order: connection setup, onboarding, a create wizard for a data product or connection.

* Use it when seeing progress matters: the stepper shows which steps are completed, which one is current, and what is still ahead.

* Use it on a dedicated page when a task outgrows a [modal](modal): a long form split into digestible stages.

## When not to use

* Don't use a stepper for a simple two-step confirmation: use a [modal](modal).

* Don't use it for peer views the user can visit in any order: use [tabs](tabs). A stepper implies sequence; tabs imply choice.

* Don't use it to show a running system process (an import, a metadata scan): use a [progress bar](progress-bar-small) or a [loader](loader). The stepper tracks the user's task, not the machine's.

* Don't split a short form that fits one screen into steps: the ceremony costs more than it guides.

## Variant selection

Steppers have no type or size variants; the choices are between modes and configurations.

* **Step states:** each step reads as completed, current, or upcoming; exactly one step is current at any time.

* **Placement:** the stepper sits above the step content on a dedicated page, never inside a modal.

* **Navigation:** Back and Next move between steps; the final step's button names the outcome (Create, or the matching object-specific verb).

## Do / Don't

| Do | Don't |
| --- | --- |
| Validate on Next and move focus to the first error | Let users advance past missing required fields |
| Keep entered data when the user goes Back | Wipe earlier steps on return |
| Let the component render step numbers | Write "Step 1:" into the title text |
| Make each step a discrete, completable task | Slice one field per screen just to have a wizard |

> Step title and navigation button wording rules live in the Content guidelines for steppers.
