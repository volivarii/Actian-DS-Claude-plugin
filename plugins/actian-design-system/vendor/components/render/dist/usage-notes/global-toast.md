# Global toast: usage notes

Global toasts appear at a fixed position on screen, independent of the triggering element.

## When to use
- To confirm background action completions.
- To surface non-critical errors or warnings that do not block the user.
- Do not use for actions that require user input.
- For confirmations that need to persist, use an alert / banner instead.
- Use a global toast to confirm the result of an async or background action: import finished, export ready, connection saved. It appears at a fixed screen edge, independent of what triggered it; plain confirmations dismiss themselves after a few seconds.
- Use it when the user has moved on (or may move on) from where the action started: deleting a dataset from a list, publishing a data product, starting an import. For long jobs the notification keeps the durable record; the toast only announces.
- Use it for non-critical errors or warnings that do not block the user, ideally with a retry action (**Connection failed. Try again**). A toast that carries an action (**Undo**, **Try again**) must stay up until dismissed, never auto-dismiss.

## When not to use
- Don't use a toast for a message that must persist until the user deals with it: use an alert banner at the top of the page or section.
- Don't use a toast for an error the user must act on. Blocking or actionable errors belong inline next to the control that caused them, or in an alert banner.
- Don't use a toast for feedback tied to a specific element on screen (a copied value, a field saved in place): use an inline toast anchored to that element.
- Don't use a toast to ask anything. If the user must decide before continuing, use the 450px confirm modal.

## Style
- Keep to one short sentence.
- Include an undo action where relevant.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
