# Buttons: usage notes

Buttons trigger actions. They are the primary mechanism for users to submit forms, confirm choices, navigate, and initiate processes within the platform.

## When to use
- Use buttons for actions, not navigation. For navigation, use links.
- Use a primary button for the main action on a page or modal.
- Use secondary buttons for alternative or less critical actions.
- Use ghost or tertiary buttons for low-priority or destructive actions that should not draw immediate attention.
- Use a button to trigger an action: submit a form, confirm a choice, start or cancel a process.
- Use one filled (primary) button per view for the single most important action (for example **Create data product**, **Save changes**).
- Use outlined (secondary) buttons for supporting actions that sit beside the primary (for example **Cancel**, **Back**, **Preview**).

## When not to use
- Don't use a button to take the user somewhere: navigation is a link. If activating it only changes location, it is not an action.
- Don't use a button to switch between views of the same content: use tabs or a segmented control.
- Don't use a button for an immediate on/off state change: use a toggle.
- Don't line up more than three actions in a row: keep the two that matter and move the rest behind an actions menu (**Actions** or **More**, see dropdown / select). A page header carries at most two.

## Style
- Use sentence case for all button labels.
- Use the verb + object formula whenever possible (for example, **Create report**, **Delete dataset**).
- Keep labels concise - ideally two to four words.
- Do not end button labels with punctuation.
- Do not use articles (a, an, the) in button labels unless necessary for clarity.

## Design
A button is a single container holding an optional leading icon and a text label. The container is the click target; padding and the icon-to-label gap are token-driven so every variant shares one geometry.

## Behavior
Loading state: The spinner replaced the label while loading. The skeleton loading (already exists) together with this should give a clear signal that the page is loading. The interaction is disabled  to prevent double-clicks and dim the background slightly using a brightness filter.

> Note: includes guidance not yet ratified: DRAFT (usage, design, behavior).
