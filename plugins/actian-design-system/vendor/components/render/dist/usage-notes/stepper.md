# Stepper: usage notes

A stepper guides users through a multi-step process in a defined sequence. Each step represents a discrete task that must be completed before moving to the next. Steppers are used in onboarding flows, connection setup, and wizards.

## When to use
- When a process has three or more distinct steps that must be completed in order.
- When it is important for users to understand their progress through a workflow.
- Do not use a stepper for simple two-step confirmations - use a modal instead.
- Use a stepper for a linear process of three or more distinct steps that must be completed in order: connection setup, onboarding, a create wizard for a data product or connection.
- Use it when seeing progress matters: the stepper shows which steps are completed, which one is current, and what is still ahead.
- Use it on a dedicated page when a task outgrows a modal: a long form split into digestible stages.

## When not to use
- Don't use a stepper for a simple two-step confirmation: use a modal.
- Don't use it for peer views the user can visit in any order: use tabs. A stepper implies sequence; tabs imply choice.
- Don't use it to show a running system process (an import, a metadata scan): use a progress bar or a loader. The stepper tracks the user's task, not the machine's.
- Don't split a short form that fits one screen into steps: the ceremony costs more than it guides.

## Category guidance (inherited: design, behavior)
Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
