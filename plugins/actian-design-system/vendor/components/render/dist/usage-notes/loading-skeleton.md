# Loading skeleton: usage notes

Loading skeletons are visual placeholders that show the layout of a page or component while content loads. They do not include copy.

## When to use
- When loading a page or section where the layout structure is known in advance.
- As an alternative to a spinner for content-heavy views.
- Use a loading skeleton when content is on its way and the layout is known in advance: the placeholder sketches the blocks the content will fill.
- Use it for content-heavy views: table rows, card grids, detail pages with a fixed structure.
- Use it for the first paint of a page inside an already-running app, before the response lands.
- Keep it visual only; if the wait needs a message, use a loader alongside instead of writing into the blocks.

## When not to use
- Don't use a skeleton when the incoming layout is unpredictable: use a loader.
- Don't use it for a small, control-level wait: use a spinner inside the control.
- Don't use it for application startup or app switches: use the loader with logo.
- Don't use it when progress is measurable: use a progress bar.

## Style
- Skeletons are visual only and require no text labels.
- Do not add placeholder text such as "Loading..." inside skeleton blocks.
- If a loading message is needed alongside a skeleton, pair with a loader instead.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
