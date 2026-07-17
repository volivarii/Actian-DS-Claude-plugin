# Spinner: usage notes

The spinner communicates that the system is processing an action. It is used inline, inside buttons, form fields, or small UI sections, rather than as a full-page loading state.

## When to use
- After a user triggers an action and the system is processing it.
- Inline within a component rather than as a full-page loader.
- Use a spinner right after a user triggers an action, inside the control that triggered it: a saving button, a validating field, a small section refreshing.
- Use it for short, indeterminate, localized waits where a full loading treatment would be noise.
- Add a brief label only when the context doesn't already say what is happening (**Running query...**).

## When not to use
- Don't use a spinner for a large component or a page section: use a loader.
- Don't use it when the incoming layout is known: use a loading skeleton.
- Don't use it for application startup or app switches: use the loader with logo.
- Don't use it when progress is measurable: use a progress bar.

## Style
- Use an accompanying label only when the context does not make it clear what is happening.
- Keep labels brief and present-tense.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
