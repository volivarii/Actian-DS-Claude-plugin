---
title: "Toolbar"
---
# Toolbar

A toolbar groups the primary actions for the content below it, such as a table or a canvas. It keeps frequent actions visible and in a predictable place.

***

## When to use

* To group the main actions that apply to a view or a selection within it.

* Do not use a toolbar for page-level title actions. Those belong in the [page header](page-header).

## Style

* Use short action labels. Prefer one or two words. For example, "Export", "Add filter".

* Order actions by frequency of use, most common first.

* Use icon-only buttons only for well-understood actions, and always pair them with a [tooltip](tooltip).

* Group related actions together and separate unrelated groups.

## Behavior

* Disable actions that do not apply to the current selection rather than hiding them, so the layout stays stable.

* When actions depend on a selection, state that in the empty case. For example, "Select items to export".

## Do / Don't

| Do                                | Don't                               |
| --------------------------------- | ----------------------------------- |
| Export                            | Export selected items to file       |
| Add filter                        | Filtering                           |
| Delete (disabled until selection) | Hide Delete until a row is selected |
