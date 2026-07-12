---
title: "Badges usage guidelines"
---
## When to use

* Use a badge to show a numeric count on an item, for example unread notifications on the bell in the [global header](global-header).

* Use it for a short, system-set change flag on an item (**New**, **Updated**) that must be scannable in a [table](table) cell or on a [card](card). Lifecycle and status words (Draft, Published, Deprecated) belong to [tags](tag).

* Use it to flag that something changed or needs attention while the item itself stays unchanged.

* Put the dot form on a container (a [side nav](side-nav) entry, a tab) when the new content lives deeper inside.

## When not to use

* Don't use a badge for labels people apply or curate themselves: user-applied classification is a [tag](tag). The system sets and clears badges; users never do.

* Don't make a badge interactive: it is a read-only signal, never a click target or a removable chip.

* Don't use a badge to report the outcome of an action just taken: use a [global toast](global-toast) or [inline toast](inline-toast).

* Don't badge everything on a screen: when every item carries one, none of them signals anything.

## Variant selection

* **Number:** the exact count carries meaning, for example 12 unread notifications or +5 hidden items.

* **Dot:** the fact that something is new or changed matters more than how many; a dot draws the eye without a number to read.

## Do / Don't

| Do | Don't |
| --- | --- |
| Show a count only when the number itself is useful | Display a badge with 0 |
| Stick to change-flag vocabulary (New, Updated) | Invent per-screen status words |
| Clear the badge as soon as the condition is resolved | Leave a stale New on an item seen weeks ago |
| Keep the label to one word or a number | Write a phrase into a badge |
| Place the badge consistently (top right of an icon, after an item name) | Move it around from screen to screen |

> Status vocabulary and label length rules live in the Content guidelines for badges.
