---
title: "Empty and system states"
nav_order: 21
# Pattern fan-out (see content/src/AUTHORING.md). Each listed slug receives
# this pattern's sections on its component page + plugin /component-brief.
# Jeff: review/edit/correct after CI lands the first fan-out run.
relatedComponents: [empty-state, error-state, maintenance-state]
---
# Empty and system states

System states communicate the current condition of the platform or a specific view. Clear, direct copy helps users understand what happened and what to do next.

---

## Empty state

Empty states appear when users have not yet created items, or when filters return no results. Clear copy and a direct CTA reduce friction and encourage engagement.

### When to use

- When users have not yet created or uploaded items.
- When [filters](/components/form-input-selection/search-filters/) result in no visible results.
- To encourage engagement with a clear next action.

### Style

- Use a short, instructive headline (noun phrase or imperative verb).
- Follow with one concise sentence that explains what the user can do.
- Provide one primary action (for example, **Create dataset**).
- Do not use `No results found` as a standalone message without guidance.

### Do / Don't

| Do | Don't |
|---|---|
| No items found / Add your first dataset to start exploring. | No results. |
| Nothing here yet / Create a connection to get started. | There are no items to display at this time. |
{: .do-dont-table}

### Example

| Element | Example text |
|---|---|
| Title | No items found |
| Body | Add your first dataset to start exploring. |
| CTA | Create dataset |

---

## Error state

Error states communicate that something failed or a resource could not be loaded. Copy must be specific, non-blaming, and actionable.

### When to use

- When something fails or a resource cannot be loaded.
- When a user action fails to complete.

### Style

- Be specific about what went wrong where possible.
- Offer a resolution step or next action.
- Do not use technical error codes as the primary message.
- Do not blame the user.

### Example

| Element | Example text |
|---|---|
| Title | Something went wrong |
| Body | There was an error creating your item. Try again or contact support if the problem continues. |
| Primary CTA | Try again |

---

## Maintenance state

Maintenance states inform users that part of the platform is temporarily unavailable due to planned or unplanned work.

### Style

- Explain what is affected and for how long.
- Provide an estimated time to resolution when available.
- Include a single action if there is something the user can do (for example, **Refresh**).

### Example

| Element | Example text |
|---|---|
| Title | Scheduled maintenance in progress |
| Body | Reports may be unavailable until 12:00 PM EST. |
| CTA | Refresh |

---

## Success state

Success states confirm that a user action completed. They often follow an action that previously triggered an empty state.

### Style

- Confirm what was completed, not just that it succeeded.
- Keep copy brief. One line is usually sufficient.
- Offer a logical next action.

### Example

| Element | Example text |
|---|---|
| Title | Items imported |
| Body | Your datasets are ready to explore. |
| Primary CTA | Open catalog |
