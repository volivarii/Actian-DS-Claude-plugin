# Progress bar: usage notes

Progress bars communicate the status of multi-step flows, file operations, and long-running background processes.

## When to use
- For multi-step flows such as wizards or onboarding sequences.
- For file uploads or long-running background processes.
- Use a progress bar when completion is measurable: a percentage, bytes transferred, or steps done out of a total.
- Use it for file operations such as file uploads, for imports, and for long-running jobs that report progress.
- Use it in multi-step flows (wizards, onboarding) to show overall completion alongside the step labels.
- Use it statically to visualize how complete something is (a dataset's documentation, a setup checklist); annotate this use as a meter for engineering, since nothing is running.

## When not to use
- Don't use it when duration is unknown: an indeterminate wait is a spinner in a control or a loader over a section.
- Don't use it while page content loads into a known layout: use a loading skeleton.
- Don't use it as the navigation of a stepped flow: the stepper owns named, revisitable steps; the bar only summarizes.
- Don't show a bar for waits too short to read; a sub-second operation needs no progress treatment at all.

## Style
- For step-based progress, show current step and total count.
- For upload or processing progress, show percentage or bytes transferred.
- Use short noun or verb phrases for step labels.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
