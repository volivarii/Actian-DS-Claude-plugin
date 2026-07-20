# Notification dropdown: usage notes

The notification dropdown is the panel that surfaces all recent notifications. It provides the frame for browsing, acting on, and dismissing notification items.

## When to use
- As the primary entry point for viewing all recent notifications.
- Use the notification dropdown as the single entry point for recent notification items, opened from the bell in the global header.
- Use it to let the user browse, open, and mark notifications as read without leaving their current page.
- Use it in every app of the suite (Studio, Explorer, Administration) so background-job feedback always lives in the same place.
- Signal unread items with an indicator on the bell; the user decides when to open the panel.

## When not to use
- Don't rely on the panel to deliver an error that blocks the user's current work: put it in an alert banner on the affected page.
- Don't use it to confirm an action the user is watching: that moment belongs to a global toast.
- Don't open it automatically when a notification arrives; only a user click opens it.
- Don't put content in the panel that is not a notification item: product announcements and release notes belong to the what's new dropdown.

## Style
- Panel header: use **Notifications** in title case with no article.
- Empty state: use "No notifications" with a brief supporting line if helpful.
- Do not truncate notification body text in the panel if it can be avoided.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
