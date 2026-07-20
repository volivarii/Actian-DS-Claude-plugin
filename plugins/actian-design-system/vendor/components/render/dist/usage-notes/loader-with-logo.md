# Loader with logo: usage notes

The loader with logo is a branded loading screen used during application startup or major full-screen transitions. For in-page or component-level loading, use the standard loader instead.

## When to use
- During application startup.
- During major context switches that require a full-screen loading experience.
- Use the loader with logo for application startup: the first paint of Studio, Explorer, or Administration before the shell renders.
- Use it for logging in and out, where the suite itself is the context.
- Use it for switches between apps of the suite, where the whole screen changes hands.
- Use it full-screen only; the brand carries the wait when there is nothing else on screen to look at.

## When not to use
- Don't use it for in-page or section-level loading: use the standard loader.
- Don't use it once the app shell has rendered and the incoming layout is known: use a loading skeleton for the content.
- Don't use it for a control-level wait: use a spinner.
- Don't use it when progress is measurable (an install, a large import): use a progress bar.

## Style
- Include a loading message only when the wait is likely to exceed three seconds.
- Keep messages brief and present-tense.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
