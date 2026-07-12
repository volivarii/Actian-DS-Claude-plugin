---
title: "Collapse / accordion usage guidelines"
---
## When to use

* Use a collapse / accordion to progressively disclose secondary content on long pages: advanced settings, connection details, FAQ answers.

* Use it when content is long and only some users need all of it: everyone else keeps a shorter page.

* Use it to reduce vertical clutter on a detail or settings page while keeping every section on the page and reachable in one click.

## When not to use

* Don't use it for content users need on every visit: keep frequently accessed content visible.

* Don't use it for peer views the user switches between repeatedly: use [tabs](tabs), which swap views instead of stacking them.

* Don't use it to show the properties of an item selected from a list: use a [drawer / side panel](drawer-side-panel).

* Don't wrap a page's primary content in an accordion: disclosure is for the secondary layer, not the main event.

## Variant selection

Collapse / accordion sections have no type or size variants; the choices are between modes and configurations.

* **One open at a time:** the default; opening a section closes the current one. Allow multiple open sections only when users genuinely compare their contents.

* **Initial state:** sections holding optional content start collapsed; auto-expanding everything on load defeats the disclosure.

* **Header:** the whole header row is the toggle, with a chevron that rotates to show the open or closed state.

## Do / Don't

| Do | Don't |
| --- | --- |
| Label sections with specific noun phrases (Advanced settings, Connection details) | Fall back to generic labels (More options, Details) |
| Put only genuinely optional content behind a collapse | Hide required form fields in a collapsed section |
| Animate expand and collapse smoothly | Snap open with a layout shift |
| Keep the header label identical in both states | Toggle the label between Show and Hide |

> Header label wording rules live in the Content guidelines for collapse / accordion.
