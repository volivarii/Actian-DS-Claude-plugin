# Error state: usage notes

Error states communicate that something failed or a resource could not be loaded. Copy must be specific, non-blaming, and give users a path forward.

## When to use
- When a page, component, or resource fails to load.
- When a user action fails to complete.
- Use an error state when a page, panel, or resource failed to load and its content cannot be shown: a request error, a broken connection, a failed fetch.
- Use it when a user action failed in a way that empties or invalidates the container it ran in.
- Compose it from an illustration, a clear title, a short explanation, and a recovery action (**Try again**).

## When not to use
- Don't use an error state when the container is simply empty: no datasets yet is an empty state, not a failure.
- Don't use it while the request is still in flight: show a loading skeleton until the response lands.
- Don't use it for planned downtime or a known outage: use a maintenance state.
- Don't use it for a field or form error: that belongs to inline validation on the text input, or an alert banner for section-level problems.

## Style
- Be specific about what failed where possible.
- Offer a resolution step or next action.
- Do not use technical error codes as the primary message.
- Do not blame the user.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
