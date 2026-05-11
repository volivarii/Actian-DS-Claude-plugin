---
title: "Alerts"
nav_order: 3
---
# Alerts

Alerts communicate important information that requires the user's attention. They can be informational, confirmatory, cautionary, or indicate an error. Unlike toasts, alerts are persistent and remain visible until dismissed or resolved.

---

## When to use

- To warn the user of a condition that may affect their work or data - before an action is taken.
- To confirm that a significant action was completed and the user should be aware of the result.
- To surface a system-level error that requires action to resolve.
- Do not use alerts for routine confirmations - use [toast notifications](notifications-and-messaging) instead.
- Do not stack multiple alerts. Consolidate if possible.

## Style

- Keep alert text to one to two sentences.
- Lead with the most important information.
- Use the appropriate severity: informational, success, warning, or error.
- Include a clear action link or button when the user needs to do something.
- Do not use `Alert:` or `Warning:` as a prefix in the message body - the icon and color convey severity.

## Behavior

- Informational and success alerts can be dismissible.
- Warning and error alerts should persist until the underlying issue is resolved or the user explicitly dismisses them.
- Alerts should appear at the top of the affected area, not in the center of the page.

## Do / Don't

| Do | Don't |
|---|---|
| Your connection expired. Log in again to continue. | Alert: There has been an authentication error. Please log in. |
| Some datasets are read-only. Contact your administrator to request edit access. | Warning: Permission issue detected. |
| Import failed. Check the file format and try again. | Error. |
{: .do-dont-table}
