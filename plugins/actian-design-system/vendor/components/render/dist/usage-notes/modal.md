# Modal: usage notes

Modals interrupt the current flow to require the user's attention for a confirmation, input, or critical action. Use them sparingly - overuse degrades their impact.

## When to use
- To confirm destructive or irreversible actions. For full confirmation dialog patterns, see confirmation.
- To collect a small amount of input before completing an action.
- Do not use modals for purely informational content - use inline messages or tooltips instead.
- Use a modal for a "stop and think" moment: the user must complete or explicitly cancel the step before returning to the page.
- Use it to confirm consequential actions, above all destructive ones (deleting a dataset, revoking a connection); see the confirmation guidelines.
- Use it for short, focused create or edit tasks (a handful of fields) that benefit from staying in the current context.
- Use it when the underlying page state must not change while the user decides.

## When not to use
- Don't use a modal when the user needs to keep seeing or referencing the page behind: use a drawer / side panel.
- Don't use a modal for a long form or a multi-step process: navigate to a dedicated page, with a stepper if the steps are linear.
- Don't use a modal to announce a result: use a global toast or inline toast after the action completes.
- Don't open a modal from a modal. If a task spawns a second blocking step, the task is too big for a modal.

## Style
- Modal title should match the label of the button or link that triggered it.
- Keep body copy short and actionable. One to two sentences.
- Use a primary and secondary button pair. Align with the button terminology guidelines.
- Do not nest modals.

## Category guidance (inherited: design, behavior)
Overlays share a Trigger → Surface relationship and a tight contract with focus management. The `Dismissibility` axis captures the modal-vs-dismissible decision that drives the entire keyboard + a11y model. The `Type` axis is intentionally finite — adding a new overlay type means revisiting the category contract, not extending it.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
