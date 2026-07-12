---
title: "Modal usage guidelines"
---
## When to use

* Use a modal for a "stop and think" moment: the user must complete or explicitly cancel the step before returning to the page.

* Use it to confirm consequential actions, above all destructive ones (deleting a dataset, revoking a connection); see the [confirmation](confirmation) guidelines.

* Use it for short, focused create or edit tasks (a handful of fields) that benefit from staying in the current context.

* Use it when the underlying page state must not change while the user decides.

## When not to use

* Don't use a modal when the user needs to keep seeing or referencing the page behind: use a [drawer / side panel](drawer-side-panel).

* Don't use a modal for a long form or a multi-step process: navigate to a dedicated page, with a [stepper](stepper) if the steps are linear.

* Don't use a modal to announce a result: use a [global toast](global-toast) or [inline toast](inline-toast) after the action completes.

* Don't open a modal from a modal. If a task spawns a second blocking step, the task is too big for a modal.

* Don't open a modal without an explicit user action (never on page load). System-initiated warnings such as session expiry are the one exception.

## Variant selection

* **450px warning / confirm:** single-decision dialogs; one sentence of consequence plus two actions. The confirm variant is the standard companion of critical [buttons](button).

* **700px create / setting:** short single-column forms, up to roughly six fields.

* **900px create / edit:** richer forms that need breathing room or a second column.

* **1200px:** exceptional, data-heavy tasks such as column mapping or selecting from large lists. If content pushes past this size, move to a dedicated page.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep one task per modal | Stack a second modal on top of the first |
| Name the primary action after the task (**Create report**) | Label a task modal's primary action **OK** |
| Land initial focus on the safe action in destructive confirms | Let a reflex Enter keypress delete data |
| Warn before discarding unsaved input on dismiss | Silently drop what the user typed |
| Pick the smallest size that fits the task | Default every dialog to 900px |
