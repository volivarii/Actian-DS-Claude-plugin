# Alert / banner: usage notes

Alerts communicate important information that requires the user's attention. They can be informational, confirmatory, cautionary, or indicate an error. Unlike toasts, alerts are persistent and remain visible until dismissed or resolved.

## When to use
- To warn the user of a condition that may affect their work or data - before an action is taken.
- To confirm that a significant action was completed and the user should be aware of the result.
- To surface a system-level error that requires action to resolve.
- Do not use alerts for routine confirmations - use toast notifications instead.
- Do not stack multiple alerts. Consolidate if possible.
- To display persistent warnings, errors, or informational messages within a page or form.
- Use an alert banner for a message that must persist until the user deals with it: it sits at the top of the page or affected section and never auto-dismisses.

## When not to use
- Don't use a banner to confirm a routine action: use a global toast; plain confirmations dismiss themselves after a few seconds.
- Don't use it for feedback tied to one element on screen (a value copied, a field saved): use an inline toast.
- Don't use it for a single field's validation error: that belongs to inline validation on the text input itself.
- Don't use it when a whole region failed to render: show an error state in place of the missing content.

## Style
- Keep alert text to one to two sentences.
- Lead with the most important information.
- Use the appropriate severity: informational, success, warning, or error.
- Include a clear action link or button when the user needs to do something.
- Do not use `Alert:` or `Warning:` as a prefix in the message body - the icon and color convey severity.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
