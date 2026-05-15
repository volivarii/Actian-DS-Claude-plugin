---
title: "Wizards"
nav_order: 49
---
# Wizards

Wizards are guided multi-step flows that walk users through complex setup or configuration tasks. They combine steppers, forms, and confirmation screens into a linear sequence with clear progression.

---

## When to use

- For complex setup tasks that cannot be completed on a single form - for example, creating a connection, configuring a pipeline, or onboarding a new dataset.
- When the steps have a natural sequence and later steps depend on earlier choices.
- Do not use a wizard for simple tasks that can be completed in a single form or modal.

## Step titles

- Short imperative verb phrases. For example, `Choose a connector`, `Set connection details`, `Test and save`.
- Parallel structure across all steps.
- Do not repeat the wizard title in each step title.

## In-step content

- Use a short paragraph at the top of each step to explain what the user is about to do and why.
- Keep explanatory text to two sentences maximum.
- Use inline help (popovers or helper text) for field-level guidance rather than long step-level explanations.

## Confirmation and summary step

- The final step before submission should present a summary of the user's choices.
- Label the summary step `Review` or `Review and create`.
- Use the same attribute labels as the preceding form fields - do not rephrase.
- Show an edit link next to each section so the user can go back and change specific settings.

## Navigation buttons

Follow the [stepper button terminology guidelines](stepper). Use **Back**, **Next**, and the appropriate object-specific verb for the final step (for example, **Create connection**).

## Do / Don't

| Do | Don't |
|---|---|
| Choose a connector | Connector selection step |
| Review and create | Confirmation |
| Create connection | Finish / Submit / Done |
| Connect to your data source. This will allow the platform to read and write data on your behalf. | Please complete all required fields in this step before proceeding. |
{: .do-dont-table}
