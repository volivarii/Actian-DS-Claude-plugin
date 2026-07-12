---
title: "Notification dropdown usage guidelines"
---
## When to use

* Use the notification dropdown as the single entry point for recent [notification](notification) items, opened from the bell in the [global header](global-header).

* Use it to let the user browse, open, and mark notifications as read without leaving their current page.

* Use it in every app of the suite (Studio, Explorer, Administration) so background-job feedback always lives in the same place.

* Signal unread items with an indicator on the bell; the user decides when to open the panel.

## When not to use

* Don't rely on the panel to deliver an error that blocks the user's current work: put it in an [alert banner](alert-banner) on the affected page.

* Don't use it to confirm an action the user is watching: that moment belongs to a [global toast](global-toast).

* Don't open it automatically when a notification arrives; only a user click opens it.

* Don't put content in the panel that is not a notification item: product announcements and release notes belong to the [what's new dropdown](whats-new-dropdown).

## Variant selection

The notification dropdown has no type or size variants; the choice is between its two configurations.

* **List:** the populated panel, [notification](notification) items newest first, with a mark-all-as-read action in reach.

* **Empty:** shown when the list is empty; a brief all-caught-up message, not a full illustrated [empty state](empty-state).

## Do / Don't

| Do | Don't |
| --- | --- |
| Order items newest first | Make the user scroll to find the latest event |
| Show enough of each message to act on it | Truncate every item to a cryptic first line |
| Clear the bell's indicator once items are read | Keep the badge lit after everything is read |
| Show the empty message when the list is empty | Hide or disable the bell when there is nothing new |

> Wording rules (panel header, empty copy, mark-all-as-read labels) live in the Content guidelines for notification dropdown.
