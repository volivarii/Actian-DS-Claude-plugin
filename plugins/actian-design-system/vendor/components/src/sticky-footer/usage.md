---
title: "Sticky footer usage guidelines"
---
## When to use

* Use a sticky footer as the persistent commit bar of a long form: a page or [drawer / side panel](drawer-side-panel) whose fields extend beyond one view, so **Save** and **Cancel** stay reachable while scrolling.

* Use it for [stepper](stepper) flows, carrying **Back**, **Next**, and a final button named for the outcome (**Create connection**).

* Use it when the actions commit the state of the entire page, drawer, or form (for example creating a connection, saving import settings).

## When not to use

* Don't use it in a [modal](modal): modals have their own footer as part of the dialog.

* Don't use it for page-level actions on non-form pages (**New dataset** on a list page): those belong in the [page header](page-header).

* Don't use it for actions scoped to a selection in the content: that is a [toolbar](toolbar) above the working surface.

* Don't use it on short forms that fit one view without scrolling: place the actions at the end of the form instead.

## Variant selection

Sticky footers have a single Default variant; the choices are configuration.

* **Button set:** exactly one primary action, an optional secondary (**Cancel**), and at most three [buttons](button) total; the only extra allowed is a destructive **Delete**.

* **Scope:** span the surface the actions commit: full page width for a page form, drawer width inside a drawer.

* **Stepper mode:** label the actions **Back** and **Next**, and name the final button for the outcome (**Create**, per the [stepper](stepper) rules); keep the terminology identical through the whole flow.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep the footer visible for the whole scroll of the form | Let the actions scroll away with the content |
| Commit or discard the entire form state from it | Mix in actions that only affect one field or section |
| Keep primary and secondary in the same position on every form | Swap Save and Cancel between two drawers |
| Validate on save and move focus to the first error | Park a permanently disabled Save the user cannot interrogate |
| Keep the focused field visible above the footer | Let the sticky bar cover the input the user is typing in |

> Button label rules (Save vs Done, Next vs Continue, the stepper terminology) live in the Content guidelines for sticky footers.
