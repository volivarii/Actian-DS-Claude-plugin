---
title: "Modal"
nav_order: 22
---
# Modal

Modals interrupt the current flow to require the user's attention for a confirmation, input, or critical action. Use them sparingly - overuse degrades their impact.

***

## When to use

* To confirm destructive or irreversible actions. For full confirmation dialog patterns, see [confirmation](confirmation).

* To collect a small amount of input before completing an action.

* Do not use modals for purely informational content - use inline messages or tooltips instead.

## Style

* Modal title should match the label of the button or link that triggered it.

* Keep body copy short and actionable. One to two sentences.

* Use a primary and secondary button pair. Align with the [button terminology guidelines](button).

* Do not nest modals.

## Do / Don't

| Do                                                             | Don't                                |
| -------------------------------------------------------------- | ------------------------------------ |
| Title: Delete dataset                                          | Title: OK                            |
| This will permanently delete the dataset and cannot be undone. | Are you sure you want to do this?    |
| Primary CTA: Delete / Secondary CTA: Cancel                    | Primary CTA: Yes / Secondary CTA: No |
