---
title: "Stepper"
nav_order: 32
---
# Stepper

A stepper guides users through a multi-step process in a defined sequence. Each step represents a discrete task that must be completed before moving to the next. Steppers are used in onboarding flows, connection setup, and wizards.

---

## When to use

- When a process has three or more distinct steps that must be completed in order.
- When it is important for users to understand their progress through a workflow.
- Do not use a stepper for simple two-step confirmations - use a [modal](modal) instead.

## Step titles

- Use short imperative verb phrases. For example, `Choose a data source`, `Configure settings`, `Review and create`.
- Do not include the step number in the title text - the stepper component displays that.
- Keep titles parallel in structure across all steps.

## Navigation buttons

- Use **Back** for the previous step button. Do not use **Previous**.
- Use **Next** for all intermediate steps.
- Use **Create** (or the appropriate object-specific verb) for the final step - not **Finish**, **Done**, or **Submit**.
- See the [Buttons](button) section for full stepper button terminology.

## Do / Don't

| Do | Don't |
|---|---|
| Choose a data source | Step 1: Data source selection |
| Create (final step) | Finish / Done / Submit |
| Back | Previous |
{: .do-dont-table}
