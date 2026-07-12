---
title: "Buttons usage guidelines"
---
## When to use

* Use a button to trigger an action: submit a form, confirm a choice, start or cancel a process.

* Use one filled (primary) button per view for the single most important action (for example **Create data product**, **Save changes**).

* Use outlined (secondary) buttons for supporting actions that sit beside the primary (for example **Cancel**, **Back**, **Preview**).

* Use ghost buttons for low-emphasis or repeated actions, such as row-level actions in a [table](table) or card footers.

* Use icon-only buttons for compact, high-frequency actions whose icon is unambiguous; always pair them with a [tooltip](tooltip) that supplies the accessible name.

## When not to use

* Don't use a button to take the user somewhere: navigation is a [link](link). If activating it only changes location, it is not an action.

* Don't use a button to switch between views of the same content: use [tabs](tabs) or a [segmented control](segmented-control).

* Don't use a button for an immediate on/off state change: use a [toggle](toggle).

* Don't line up more than three actions in a row: keep the two that matter and move the rest behind an actions menu (**Actions** or **More**, see [dropdown / select](dropdown-select)). A [page header](page-header) carries at most two.

## Variant selection

* **Filled (primary):** the one main action of the screen or modal.

* **Outlined (secondary):** alternative actions displayed next to the primary.

* **Ghost:** low-priority or repeated actions where visual noise must stay low (table rows, toolbars, card footers).

* **Icon-only:** dense surfaces with well-known icons (edit, delete, refresh).

* **Critical intent:** actions that destroy data or make a permanent change (for example **Delete dataset**). Pair with a [confirmation](confirmation) dialog (the 450px confirm [modal](modal)) when the loss is irreversible.

* **Small size:** dense surfaces such as [table](table) rows and toolbars; use the default size everywhere else.

## Do / Don't

| Do | Don't |
| --- | --- |
| One filled primary button per view | Two competing primary buttons side by side |
| Confirm before a permanent destructive action | Delete data in a single click |
| Give icon-only buttons a tooltip naming the action | Rely on the icon alone to convey the action |
| Keep action placement consistent across similar screens | Reorder Cancel and Save from one modal to the next |

> Label wording rules (sentence case, verb + object, no punctuation) live in the Content guidelines for buttons.
