---
title: "Global toast usage guidelines"
---
## When to use

* Use a global toast to confirm the result of an async or background action: import finished, export ready, connection saved. It appears at a fixed screen edge, independent of what triggered it; plain confirmations dismiss themselves after a few seconds.

* Use it when the user has moved on (or may move on) from where the action started: deleting a dataset from a list, publishing a data product, starting an import. For long jobs the [notification](notification) keeps the durable record; the toast only announces.

* Use it for non-critical errors or warnings that do not block the user, ideally with a retry action (**Connection failed. Try again**). A toast that carries an action (**Undo**, **Try again**) must stay up until dismissed, never auto-dismiss.

## When not to use

* Don't use a toast for a message that must persist until the user deals with it: use an [alert banner](alert-banner) at the top of the page or section.

* Don't use a toast for an error the user must act on. Blocking or actionable errors belong inline next to the control that caused them, or in an [alert banner](alert-banner).

* Don't use a toast for feedback tied to a specific element on screen (a copied value, a field saved in place): use an [inline toast](inline-toast) anchored to that element.

* Don't use a toast to ask anything. If the user must decide before continuing, use the 450px confirm [modal](modal).

* Don't use a toast to close out a whole flow: a completed setup or creation journey ends on a [success state](success-state), not a passing message.

## Variant selection

* **Default:** confirmations and neutral notices (saved, exported, published). The variant for nearly every toast.

* **Critical:** a failed background action worth the user's attention but not their immediate action (export failed, sync interrupted). Pair with a retry action where possible; if the failure blocks the user's current task, it is not a toast.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep the message to one short sentence | Explain the whole operation in the toast |
| Offer **Undo** after a reversible delete | Interrupt quick reversible actions with a confirm modal |
| Keep an actionable toast up until dismissed | Auto-dismiss a toast carrying **Undo** or **Retry** |
| Queue toasts when several arrive | Pile every background job's toast down the screen edge |
| Route actionable errors to inline validation or an [alert banner](alert-banner) | Announce a form error in a toast that vanishes before it is read |

> Wording rules (one short sentence, undo phrasing, example messages) live in the Content guidelines for global toast.
