---
title: "Avatar usage guidelines"
---
## When to use

* Use an avatar to identify a person or account wherever ownership or authorship is surfaced: an Owner or Steward column in a [table](table), a comment thread, an assignee field.

* Use it as a compact stand-in when a full name would take too much space, with the name reachable another way: adjacent text, the profile it opens on click, or a [tooltip](tooltip) plus accessible label. A hover tooltip must never be the only reveal; it is unreachable on touch.

* Use it inside components that offer avatars: a [dropdown / select](dropdown-select) that shows avatars beside options when picking a person (assigning an owner or steward), or [tabs](tabs) showing an avatar when a tab represents a person or account.

* Use a group of avatars to show the set of people attached to one item, for example everyone who owns or contributes to a data product.

## When not to use

* Don't use an avatar for things that are not people or accounts: datasets, connections, and data processes are identified by an icon and a name, not a face.

* Don't use an avatar as a status or count indicator on an item: that is a [badge](badge).

* Don't make an avatar trigger arbitrary actions: clicking it opens the person's profile or contact details, nothing else.

## Variant selection

* **Default:** a single person; the standard case in table cells, headers, and assignee fields.

* **One group:** one set of people stacked in a row, for example all owners of an asset.

* **Two groups:** two distinct sets shown side by side, for example owners and contributors, when the distinction matters at a glance.

* **Image or initials:** show the profile photo when one exists; fall back to two uppercase initials, then to a generic placeholder when neither is available.

## Do / Don't

| Do | Don't |
| --- | --- |
| Use first and last initial in uppercase (CF for Chris Frost) | Use a single letter or a first name |
| Give the person's details a home beyond hover (profile on click, adjacent text) | Make a hover tooltip the only carrier of who this is |
| Fall back to initials when the image fails to load | Show a broken image icon |
| Collapse into a +N indicator when a group exceeds four avatars | Truncate a group without saying how many are hidden |

> Initials format and tooltip content rules live in the Content guidelines for avatars.
