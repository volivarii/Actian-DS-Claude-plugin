# Avatar: usage notes

Avatars represent a user with their profile image or initials. They appear in headers, comments, assignee fields, and anywhere user identity is surfaced.

## When to use
- To identify a user in context, such as in a list, a comment thread, or an assignee field.
- As a compact representation when showing a full name would take too much space.
- Use an avatar to identify a person or account wherever ownership or authorship is surfaced: an Owner or Steward column in a table, a comment thread, an assignee field.
- Use it as a compact stand-in when a full name would take too much space, with the name reachable another way: adjacent text, the profile it opens on click, or a tooltip plus accessible label. A hover tooltip must never be the only reveal; it is unreachable on touch.
- Use it inside components that offer avatars: a dropdown / select that shows avatars beside options when picking a person (assigning an owner or steward), or tabs showing an avatar when a tab represents a person or account.
- Use a group of avatars to show the set of people attached to one item, for example everyone who owns or contributes to a data product.

## When not to use
- Don't use an avatar for things that are not people or accounts: datasets, connections, and data processes are identified by an icon and a name, not a face.
- Don't use an avatar as a status or count indicator on an item: that is a badge.
- Don't make an avatar trigger arbitrary actions: clicking it opens the person's profile or contact details, nothing else.

## Style
- Initials use first and last initial in uppercase. For example, "CF" for Chris Frost.
- Always include a tooltip or accessible label with the user's full name, role, and email address.
- If a profile image fails to load, fall back to initials. If initials are unavailable, use a generic placeholder.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
