# Notification: usage notes

Notifications inform users of updates, background task completions, or events that require their attention. Individual notification items appear in the notification panel.

## When to use
- To inform users of completed background tasks.
- To surface updates or system events that require the user's attention.
- Do not use for actions requiring immediate input. Use a modal instead.
- Use a notification to record a completed background task in the notification panel: an export ready to download, a metadata scan finished, an import processed.
- Use it for system events and updates the user needs to know about but not act on immediately (a connection starting to fail, a glossary term awaiting review).
- Use it when the user may not be looking when the event lands: a long-running job finishing while they work elsewhere in Studio or Explorer. The item waits in the notification dropdown (the panel).
- Give every notification a timestamp and, when there is a result, a link or action to open it (**Download**, **View run**).

## When not to use
- Don't use a notification as the only feedback for an action the user just took and is watching: use a global toast at the moment of completion. For long jobs, do both: the toast announces, the notification remains.
- Don't use it for anything requiring immediate input: use a modal, or a confirmation before a destructive action.
- Don't use it for a persistent problem scoped to a page or section: use an alert banner there.
- Don't use it for feedback anchored to a specific element: use an inline toast.

## Style
- Use direct, concise language. One to two sentences.
- Include a timestamp.
- Include a link or action if the user must respond.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
