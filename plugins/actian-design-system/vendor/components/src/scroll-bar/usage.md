---
title: "Scroll bar usage guidelines"
---
Scroll bars are a behavior primitive, not a layout choice: they appear automatically when content overflows its container. The usage question is when a custom scroll container is appropriate at all.

## When to use

* Let the scroll bar appear automatically when content exceeds the visible area of a container: it signals the overflow and lets users navigate it.

* Use a custom scroll container only when standard browser scrolling is insufficient: an independently scrolling region inside a fixed layout, such as a [drawer / side panel](drawer-side-panel) body or a [table](table) body under a pinned header.

* Use it in any container with a fixed height and variable content: query results, log output, long attribute lists.

## When not to use

* Don't restyle or replace the page-level browser scroll: custom scroll is for regions inside the page, not the page itself.

* Don't suppress scroll bars where overflow is expected: a region that looks unscrollable reads as complete when it isn't.

* Don't nest independently scrolling regions inside one another: two scroll bars in the same direction fight for the wheel.

* Don't use scrolling as a fix for an overloaded panel: when a drawer scrolls forever, move the content to the full details page.

## Variant selection

Scroll bars have no type or size variants; the choices are between modes and configurations.

* **Orientation:** vertical for lists and panels; horizontal only for wide [table](table) content that cannot reflow, never for prose.

* **Accessible label:** give the scrollable region an accessible label (Dataset list, Query results) so screen reader users know what they are scrolling.

* **Keyboard access:** a custom scroll region must be reachable and scrollable by keyboard (focusable, arrow keys work), not only by wheel or trackpad.

## Do / Don't

| Do | Don't |
| --- | --- |
| Let the scroll bar appear only on overflow | Force one onto content that fits |
| Name the scrollable region for assistive tech | Leave an anonymous scroll region |
| Keep one scroll direction per region | Make users pan both axes to read a list |
| Keep the scroll position stable while content loads | Yank the user back to the top on data refresh |
| Pair a pinned header with a scrolling table body | Let column headers scroll out of view |

> Accessible-label wording for scroll regions lives in the Content guidelines for scroll bars.
