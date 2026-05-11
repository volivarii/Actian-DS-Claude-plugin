---
title: "Sticky footer"
nav_order: 30
---
# Sticky footer

The sticky footer is a persistent action bar that remains visible at the bottom of a page or drawer as the user scrolls. It ensures that primary actions are always accessible without requiring the user to scroll to the bottom.

---

## When to use

- When a page or drawer contains primary actions that must remain available during scrolling.
- When users complete steppers or multi-field forms that extend beyond the current view.
- When the action affects the entire page, drawer, or form state.

## Button hierarchy

- The sticky footer must contain exactly one primary action. The only exception is an additional destructive button such as Delete.
- An optional secondary action can be included.
- Limit to a maximum of three buttons. More actions increase cognitive load.

## Button labels

Use clear verbs that describe the outcome. Labels should describe what will happen, not what the button is.

| Recommended labels | Avoid |
|---|---|
| Save | Done |
| Update | OK |
| Create | Submit (except on forms) |
| Confirm | Yes |
| Delete | Remove (for destructive permanent actions) |
| Continue (as part of a defined stepper) | Next (in sticky footers outside steppers) |
{: .do-dont-table}

## Steppers

When used as part of a stepper, use the following label terminology consistently:

- **Back** for the previous step.
- **Next** for intermediate steps.
- **Submit** for the final step.

Do not mix **Continue** and **Next**, or **Finish** and **Submit** within the same flow.
