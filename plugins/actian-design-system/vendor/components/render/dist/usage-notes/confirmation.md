# Confirmation: usage notes

Confirmation dialogs interrupt the user before an irreversible or destructive action to verify intent. Use them only for actions that cannot be undone.

## When to use
- Use a confirmation to interrupt the user before an irreversible or destructive action and verify intent: deleting a dataset, revoking a connection, resetting a configuration.
- Use it when the action reaches beyond the user's own work: unpublishing a shared data product, removing another user's access.
- Use it only when the action cannot be undone; the interruption is the price of irreversibility.

## When not to use
- Don't confirm reversible actions: perform them and offer **Undo** in a global toast.
- Don't confirm routine, low-stakes operations (saving, closing a panel with nothing typed); constant interruptions teach users to click through.
- Don't use a confirmation to collect input or choices: that is a create or edit task for a modal.
- Don't use it after the action to report the outcome: completion feedback is a global toast, and a finished journey ends on a success state.

## Style
- Title: name the action, not the outcome.
- Body: one sentence stating what will happen and whether it can be undone.
- Primary CTA: matches the title verb. For example, **Delete**.
- Secondary CTA: **Cancel**.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
