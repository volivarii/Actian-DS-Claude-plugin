# Empty state: usage notes

Empty states appear when users have not yet created items, or when filters return no results. Clear copy and a direct CTA reduce friction and encourage engagement.

## When to use
- When users have not yet created or uploaded items.
- When filters result in no visible results.
- To encourage engagement with a clear next action.
- Use an empty state when a container has no content yet: no datasets created, no connections configured, an empty glossary on first use.
- Use it when a search or filter returns nothing, so the user knows the query worked but matched no items.
- Compose it from an illustration (decorative for assistive tech), a clear title, a short explanation, and a way forward.
- Give first-use containers a create call to action (**Create dataset**), including a table with no rows yet.

## When not to use
- Don't use an empty state when something failed. A request error, a broken connection, or a failed load is an error state; masking a failure as "no content" hides the problem.
- Don't use an empty state while content is on its way: use a loading skeleton until the response lands, then decide between content, empty, and error.
- Don't use it for planned downtime or an unavailable service: use a maintenance state.
- Don't use it to celebrate the end of a flow: a completed creation or setup journey ends on a success state.

## Style
- Use a short, instructive headline (a noun phrase or imperative verb).
- Follow with one concise sentence explaining what the user can do.
- Provide one primary CTA.
- Do not use "No results found" as a standalone message without guidance.

## Category guidance (inherited: design, behavior)
Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
