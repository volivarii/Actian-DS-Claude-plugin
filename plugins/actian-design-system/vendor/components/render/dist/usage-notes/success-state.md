# Success state: usage notes

Success states confirm that a user action completed. They often follow an action that previously triggered an empty state.

## When to use
- After a significant user action completes successfully.
- When confirmation would reduce user anxiety or encourage a logical next step.
- Use a success state to close out a completed journey: a connection created, datasets imported, an onboarding flow finished. Completed journeys end here, not on a passing message.
- Use it when the outcome needs a moment of reassurance: a long setup, a first-time task, an operation the user might doubt worked.
- Use it to hand the user their next step: the screen pairs the confirmation with a logical follow-on action (**Open catalog**).
- Use it in the container the journey occupied: the full page for full-page flows, the modal body for flows that ran there.

## When not to use
- Don't use a success state for a routine action's result: a save or publish is a global toast.
- Don't use it for feedback tied to one element: use an inline toast.
- Don't use it between steps of a flow: mid-journey progress belongs to the stepper.
- Don't show it before the action has fully completed; while the outcome is uncertain, keep the loading treatment.

## Style
- Confirm what was completed, not just that it succeeded.
- Keep copy brief. One line is usually sufficient.
- Offer a logical next action.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
