---
title: "Progress bar usage guidelines"
---
## When to use

* Use a progress bar when completion is measurable: a percentage, bytes transferred, or steps done out of a total.

* Use it for file operations such as [file uploads](upload-file), for imports, and for long-running jobs that report progress.

* Use it in multi-step flows (wizards, onboarding) to show overall completion alongside the step labels.

* Use it statically to visualize how complete something is (a dataset's documentation, a setup checklist); annotate this use as a meter for engineering, since nothing is running.

## When not to use

* Don't use it when duration is unknown: an indeterminate wait is a [spinner](spinner) in a control or a [loader](loader) over a section.

* Don't use it while page content loads into a known layout: use a [loading skeleton](loading-skeleton).

* Don't use it as the navigation of a stepped flow: the [stepper](stepper) owns named, revisitable steps; the bar only summarizes.

* Don't show a bar for waits too short to read; a sub-second operation needs no progress treatment at all.

## Variant selection

* **Default:** inline and dense contexts: [table](table) rows, cards, panels, upload lists.

* **Large:** when the progress itself is the focus of the view: an import screen, a full-width wizard footer.

* Completeness (0 to 100%) is the live value the bar displays, not a variant to choose.

## Do / Don't

| Do | Don't |
| --- | --- |
| Drive the fill from real measured progress | Animate a fake percentage over an indeterminate wait |
| Move the fill forward only | Slide backwards when an estimate is revised |
| Reach 100% before the bar disappears | Vanish at 80% and call the job done |
| Announce a backgrounded job's completion with a [global toast](global-toast) | Rely on the bar as the only completion signal |

> Wording rules (**Step 2 of 4**, **45% complete**, bytes transferred) live in the Content guidelines for progress bar.
