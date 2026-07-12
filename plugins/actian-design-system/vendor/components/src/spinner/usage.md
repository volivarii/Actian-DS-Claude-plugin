---
title: "Spinner usage guidelines"
---
## When to use

* Use a spinner right after a user triggers an action, inside the control that triggered it: a saving [button](button), a validating field, a small section refreshing.

* Use it for short, indeterminate, localized waits where a full loading treatment would be noise.

* Add a brief label only when the context doesn't already say what is happening (**Running query...**).

## When not to use

* Don't use a spinner for a large component or a page section: use a [loader](loader).

* Don't use it when the incoming layout is known: use a [loading skeleton](loading-skeleton).

* Don't use it for application startup or app switches: use the [loader with logo](loader-with-logo).

* Don't use it when progress is measurable: use a [progress bar](progress-bar-small).

* Don't run several spinners in the same view at once; a whole area waiting is one [loader](loader), not many spinners.

## Variant selection

* **On light bg:** the default on standard surfaces: forms, panels, [table](table) cells.

* **On dark bg:** dark surfaces such as a filled [button](button) or dark chrome, where the light-surface spinner would vanish; pick the mode from the surface behind it.

* The completion arc (25 to 100%) is the animation's own cycle, not a variant to choose.

## Do / Don't

| Do | Don't |
| --- | --- |
| Keep the spinner inside the control it concerns | Overlay the whole page because one button is saving |
| Disable the triggering control while it spins | Let a second click fire the same request again |
| Escalate to a [loader](loader) or [progress bar](progress-bar-small) when the wait grows long | Spin a button for a minute-long job |
| Clear it the moment the response lands | Leave a stale spinner on a control that already finished |

> Wording rules (brief present-tense labels, when to add one) live in the Content guidelines for spinner.
