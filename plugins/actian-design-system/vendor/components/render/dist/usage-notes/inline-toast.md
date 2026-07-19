# Inline toast: usage notes

An inline toast is a brief, non-blocking message displayed within a specific area of the page rather than at a global level. It provides feedback directly adjacent to the action or element it refers to.

## When to use
- To confirm a localized action, such as copying a value or saving a field inline.
- To surface a validation warning directly below or beside a specific form field.
- Do not use an inline toast for global events. Use a global toast instead.
- Use an inline toast to confirm a localized micro-action, right where it happened: a value copied to the clipboard, a field saved in place, a tag added to an asset, a share link generated.
- Use it when the user's eyes are already on the element the feedback concerns, inside a form, panel, or drawer. The message appears next to that element, not at the screen edge.
- Use it for brief, non-blocking feedback that the user can safely miss: it confirms, it never asks.

## When not to use
- Don't use an inline toast for the result of a page-level or background action (import finished, scan started): use a global toast at the screen edge.
- Don't use an inline toast for an error the user must fix. Field errors belong to inline validation on the text input itself; section-level problems belong in an alert banner.
- Don't use an inline toast for a message that must persist until acknowledged: use an alert banner.
- Don't stack inline toasts to narrate a multi-step operation; confirm the end result once with a global toast.

## Style
- One short sentence maximum. Ideally fewer than ten words.
- Use present or past tense to confirm what happened. For example, `Copied` or `Saved`.
- Do not use inline toasts for error messages that require user action - use inline validation instead.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
