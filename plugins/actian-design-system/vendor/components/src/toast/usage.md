---
title: "Notification usage guidelines"
---
## When to use

* Use a notification to record a completed background task in the notification panel: an export ready to download, a metadata scan finished, an import processed.

* Use it for system events and updates the user needs to know about but not act on immediately (a connection starting to fail, a glossary term awaiting review).

* Use it when the user may not be looking when the event lands: a long-running job finishing while they work elsewhere in Studio or Explorer. The item waits in the [notification dropdown](notification-dropdown) (the panel).

* Give every notification a timestamp and, when there is a result, a link or action to open it (**Download**, **View run**).

## When not to use

* Don't use a notification as the only feedback for an action the user just took and is watching: use a [global toast](global-toast) at the moment of completion. For long jobs, do both: the toast announces, the notification remains.

* Don't use it for anything requiring immediate input: use a [modal](modal), or a [confirmation](confirmation) before a destructive action.

* Don't use it for a persistent problem scoped to a page or section: use an [alert banner](alert-banner) there.

* Don't use it for feedback anchored to a specific element: use an [inline toast](inline-toast).

* Don't use it for product announcements or release notes: those belong to the [what's new dropdown](whats-new-dropdown).

## Variant selection

* **Default:** completions and neutral events (export ready, run finished, an asset shared with you). The variant for most items.

* **Critical:** failed jobs and error events worth attention next time the user checks the panel (scan failed, connection lost). If the failure blocks what the user is doing right now, escalate to an [alert banner](alert-banner) instead.

## Do / Don't

| Do | Don't |
| --- | --- |
| Notify about events the user could otherwise miss | Create an item for every click the user just made |
| Link each item to its result (**Download**, **View run**) | Announce a finished export with no way to open it |
| Send one notification per job, updated if it changes | Post a new item for every stage of the same run |
| Keep items until the user reads them | Expire notifications on a timer like a toast |

> Wording rules (one to two sentences, timestamps, example messages) live in the Content guidelines for notification.
