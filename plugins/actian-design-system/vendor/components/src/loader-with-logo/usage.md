---
title: "Loader with logo usage guidelines"
---
## When to use

* Use the loader with logo for application startup: the first paint of Studio, Explorer, or Administration before the shell renders.

* Use it for logging in and out, where the suite itself is the context.

* Use it for switches between apps of the suite, where the whole screen changes hands.

* Use it full-screen only; the brand carries the wait when there is nothing else on screen to look at.

## When not to use

* Don't use it for in-page or section-level loading: use the standard [loader](loader).

* Don't use it once the app shell has rendered and the incoming layout is known: use a [loading skeleton](loading-skeleton) for the content.

* Don't use it for a control-level wait: use a [spinner](spinner).

* Don't use it when progress is measurable (an install, a large import): use a [progress bar](progress-bar-small).

* Don't use it when the transition is instant; a flash of brand between two ready screens reads as a glitch.

## Variant selection

* **Studio / Explorer / Admin:** match the logo to the destination app, the one being opened, not the one being left.

* **Actian Data Intelligence:** suite-level surfaces where no single app owns the screen (login, the switch itself before a destination is chosen).

## Do / Don't

| Do | Don't |
| --- | --- |
| Match the logo to the app being opened | Show the Studio mark while Explorer boots |
| Hand off to the shell and its [loading skeleton](loading-skeleton) as soon as they can render | Hold the logo screen until every widget has data |
| Show it for the whole boot, once | Replay it on every in-app navigation |
| Respect reduced-motion preferences with a calm fallback | Force the full animation on users who opted out |

> Wording rules (brief present-tense messages such as **Loading your workspace...**) live in the Content guidelines for loader with logo.
