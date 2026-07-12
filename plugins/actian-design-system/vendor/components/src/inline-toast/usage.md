---
title: "Inline toast usage guidelines"
---
## When to use

* Use an inline toast to confirm a localized micro-action, right where it happened: a value copied to the clipboard, a field saved in place, a tag added to an asset, a share link generated.

* Use it when the user's eyes are already on the element the feedback concerns, inside a form, panel, or drawer. The message appears next to that element, not at the screen edge.

* Use it for brief, non-blocking feedback that the user can safely miss: it confirms, it never asks.

## When not to use

* Don't use an inline toast for the result of a page-level or background action (import finished, scan started): use a [global toast](global-toast) at the screen edge.

* Don't use an inline toast for an error the user must fix. Field errors belong to inline validation on the [text input](text-input) itself; section-level problems belong in an [alert banner](alert-banner).

* Don't use an inline toast for a message that must persist until acknowledged: use an [alert banner](alert-banner).

* Don't stack inline toasts to narrate a multi-step operation; confirm the end result once with a [global toast](global-toast).

## Variant selection

Inline toasts have no variants of their own; the choice is the intent.

* **Success:** the default and by far the most common intent (**Copied**, **Saved**, **Tag added**).

* **Info:** a neutral, transient notice tied to an element (for example a value refreshed in place).

* **Warning:** a non-blocking caution the user can ignore (for example a value saved with a fallback). If the user must respond, leave the toast family.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep it under ten words (**Copied**, **Link created**) | Write a sentence explaining what copying means |
| Anchor the toast to the element it confirms | Float a "Saved" message at the screen edge for one field |
| Let it dismiss itself without user action | Add a close button to a two-word confirmation |
| Use inline validation for field errors | Report a required-field error in a toast that fades away |

> Wording rules (under ten words, past-tense confirmations, example messages) live in the Content guidelines for inline toast.
