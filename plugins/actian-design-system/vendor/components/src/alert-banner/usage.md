---
title: "Alert / banner usage guidelines"
---
## When to use

* Use an alert banner for a message that must persist until the user deals with it: it sits at the top of the page or affected section and never auto-dismisses.

* Use it to warn about a condition that may affect the user's work or data before they act (read-only datasets, an expiring connection).

* Use it for a system-level error that requires action to resolve (authentication expired, a broken connection blocking the section).

* Use the inline banner form for the same kind of message scoped to a form or panel rather than the whole page.

## When not to use

* Don't use a banner to confirm a routine action: use a [global toast](global-toast); plain confirmations dismiss themselves after a few seconds.

* Don't use it for feedback tied to one element on screen (a value copied, a field saved): use an [inline toast](inline-toast).

* Don't use it for a single field's validation error: that belongs to inline validation on the [text input](text-input) itself.

* Don't use it when a whole region failed to render: show an [error state](error-state) in place of the missing content.

* Don't use it to ask for a decision before an action proceeds: use a [confirmation](confirmation) dialog.

## Variant selection

* **Primary (info):** neutral system information the user should know while working (an upcoming maintenance window, a policy change).

* **Success:** a significant completed action the user must not miss the way they might a passing toast; dismissible. Routine completions stay a [global toast](global-toast); a finished journey ends on a [success state](success-state).

* **Warning:** a condition that may affect work or data if the user proceeds.

* **Danger:** an error that blocks work or requires action to resolve.

* **Horizontal:** the default; a one-sentence message with the action inline.

* **Vertical:** longer messages where the text wraps and the action drops below it, or narrow containers such as panels.

## Do / Don't

| Do | Don't |
| --- | --- |
| Place the banner at the top of the page or section it concerns | Float an alert in the middle of the screen |
| Include the action that resolves the issue (**Log in again**) | State a problem with nothing the user can do about it |
| Consolidate related problems into one banner | Stack three banners at the top of the same page |
| Keep Warning and Danger banners up until resolved | Auto-dismiss an error the user has not dealt with |

> Wording rules (one to two sentences, no "Warning:" prefixes, example messages) live in the Content guidelines for alert / banner.
