# Loader: usage notes

The loader appears during page transitions, data fetches, and background processes to communicate that the system is working. For application startup or full-screen transitions, use the loader with logo instead.

## When to use
- During page loads, data fetches, or transitions that require the user to wait.
- For in-page or component-level loading states.
- Use a loader for an indeterminate wait on a large component or a section of a page: a fetch whose duration is unknown and whose result can't be sketched in advance.
- Use it for in-page transitions where a region's content is being replaced (switching a dashboard's data source, reloading a results panel).
- Use it as the fallback loading treatment when no more specific indicator fits the container.

## When not to use
- Don't use a loader when the layout of the incoming content is known: use a loading skeleton that sketches it.
- Don't use it for a small, control-level wait (a saving button, a validating field): use a spinner inside the control.
- Don't use it for application startup or switches between apps: use the loader with logo.
- Don't use it when progress is measurable (an upload, a stepped job): use a progress bar.

## Style
- Include a loading message only when the wait is likely to exceed three seconds.
- Keep messages brief and present-tense.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
