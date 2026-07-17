# What's new: usage notes

The What's New section summarizes recent product changes. It is product communication, not marketing. The tone should be factual and helpful.

## When to use
- Use the what's new dropdown, attached to its icon in the global header, to summarize recent product changes: new capabilities, improvements, and fixes.
- Use it for release communication the user reads on their own schedule: it waits in the header instead of interrupting work.
- Use it to group updates by product area (for example **Data catalog**, **Connections**, **Performance**) so users can scan for what affects them.

## When not to use
- Don't use it for user-specific events (an import failed, an access request arrived): that is the notification dropdown.
- Don't use it for anything that requires action or acknowledgement: use an alert banner or a modal for blocking messages.
- Don't use it as a marketing surface: it is factual product communication, not promotion.
- Don't announce releases anywhere else in the product chrome: this dropdown is the single home for what changed.

## Style
- Group updates by category (for example, **Data catalog**, **Connections**, **Performance**).
- Use past tense to describe what changed. For example, "Added support for..." or "Fixed an issue where..."
- Do not use marketing adjectives like "powerful," "seamless," or "game-changing."
- Keep each item to one to two sentences.

## Category guidance (inherited: design, behavior)
Navigation patterns share an items-with-current-state anatomy regardless of orientation. The `Orientation` axis captures the horizontal-tab vs vertical-rail authoring choice. `aria-current=page` is the single most important a11y affordance — it lets assistive tech announce "where am I" without sighted users needing the indicator.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
