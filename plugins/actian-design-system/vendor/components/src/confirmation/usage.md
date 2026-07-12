---
title: "Confirmation usage guidelines"
---
## When to use

* Use a confirmation to interrupt the user before an irreversible or destructive action and verify intent: deleting a dataset, revoking a connection, resetting a configuration.

* Use it when the action reaches beyond the user's own work: unpublishing a shared data product, removing another user's access.

* Use it only when the action cannot be undone; the interruption is the price of irreversibility.

## When not to use

* Don't confirm reversible actions: perform them and offer **Undo** in a [global toast](global-toast).

* Don't confirm routine, low-stakes operations (saving, closing a panel with nothing typed); constant interruptions teach users to click through.

* Don't use a confirmation to collect input or choices: that is a create or edit task for a [modal](modal).

* Don't use it after the action to report the outcome: completion feedback is a [global toast](global-toast), and a finished journey ends on a [success state](success-state).

## Variant selection

Confirmations come in one dialog size; the vehicle is the 450px confirm [modal](modal), and the choices are configuration.

* **Destructive:** the primary action uses the critical [button](button) intent (**Delete**, **Revoke**); start focus on the safe action.

* **Consequential but not destructive:** a permanent change that destroys nothing (transferring ownership); keep the default primary intent.

* Keep it to one sentence of consequence and two actions; if it needs more, the action deserves a task modal or a page, not a bigger dialog.

## Do / Don't

| Do | Don't |
| --- | --- |
| Ask about one decision at a time | Chain a second confirmation behind the first |
| Make **Cancel** a safe, complete exit | Start any part of the action before the user confirms |
| Require a typed name when irreversibly deleting a shared or production asset | Guard a shared, production-wide delete with one click |
| Reserve the interruption for irreversible actions | Confirm what a toast **Undo** already protects |

> Wording rules (title names the action, CTA matches the title verb, body states the consequence) live in the Content guidelines for confirmation.
