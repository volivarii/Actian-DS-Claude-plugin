---
title: "Avatar"
---
# Avatar

Avatars represent a user with their profile image or initials. They appear in headers, comments, assignee fields, and anywhere user identity is surfaced.

***

## When to use

- To identify a user in context, such as in a list, a comment thread, or an assignee field.
- As a compact representation when showing a full name would take too much space.

## Style

- Initials use first and last initial in uppercase. For example, "CF" for Chris Frost.
- Always include a tooltip or accessible label with the user's full name, role, and email address.
- If a profile image fails to load, fall back to initials. If initials are unavailable, use a generic placeholder.

## Behavior

- Clicking an avatar should open the user's profile or display their contact information at minimum.
- When a group of avatars exceeds available space, show a "+N" overflow indicator instead of additional avatars. Use this pattern when displaying 5 or more avatars.

## Do / Don't

| Do | Don't |
|---|---|
| Initials: CF | Initials: C or Chris |
| Tooltip: Chris Frost / Designer / chris.frost@example.com | Tooltip: Chris Frost only |
| Fall back to initials when image is unavailable | Show a broken image icon |
| Show +3 when a fourth avatar would overflow | Truncate without indicating how many are hidden |
