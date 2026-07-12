---
title: "Notifications and messaging"
nav_order: 34
# Pattern fan-out — visible-feedback affordances. Jeff: edit/correct/extend.
relatedComponents: [alert-banner, notification, notification-dropdown, modal]
---
# Notifications and messaging

Banners, toasts, inline messages, and modals form one messaging family. Each has a different scope, urgency, and lifespan. Choosing the right one keeps feedback proportional to what happened.

***

## Principles

* Validate late, clear early. Errors appear after the user leaves the field, not on the first keystroke, and disappear as soon as the value is valid. See [validation messages](validation-messages).

* An unresolved change is not an error. A reminder that something is unsaved is a neutral, informational state, not an error state.

* If the user must decide, use a modal, not a message. Reserve modals for blocking or destructive actions. Use a banner, toast, or inline message for anything else.

## Choosing a messaging pattern

| Type             | Scope                | When it appears                                               | Where it appears                  | How it goes away                                               | Example                                                                           |
| ---------------- | -------------------- | ------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Banner (page)    | The whole page       | Until the underlying issue is resolved                        | Top of the page, below the header | Cleared when the issue resolves, or dismissed if informational | "Some datasets are read-only. Contact your administrator to request edit access." |
| Banner (section) | One part of the page | While a section-level issue exists                            | Top of the affected section       | Cleared when the issue resolves                                | "This output port is managed by an external data contract and is read-only."      |
| Toast            | One completed action | Right after the action completes                              | Bottom center                     | Dismisses automatically after a few seconds                    | "Prospect customers created."                                                     |
| Inline message   | One form field       | On blur, or on submit attempt                                 | Directly below the field          | Clears as soon as the field is valid                           | "Enter a valid email address."                                                    |
| Modal            | A required decision  | When the user must confirm or provide input before continuing | Centered, blocking the page       | Dismissed only by completing or canceling the action           | "This will permanently delete the dataset and cannot be undone."                  |

Do not use a banner for a short confirmation. Use a toast instead. Do not use a toast for something that requires a decision or blocks the user. Use a modal instead.
