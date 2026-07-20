# Sticky footer: usage notes

The sticky footer is a persistent action bar that remains visible at the bottom of a page or drawer as the user scrolls. It ensures that primary actions are always accessible without requiring the user to scroll to the bottom.

## When to use
- When a page or drawer contains primary actions that must remain available during scrolling.
- When users complete steppers or multi-field forms that extend beyond the current view.
- When the action affects the entire page, drawer, or form state.
- Use a sticky footer as the persistent commit bar of a long form: a page or drawer / side panel whose fields extend beyond one view, so **Save** and **Cancel** stay reachable while scrolling.
- Use it for stepper flows, carrying **Back**, **Next**, and a final button named for the outcome (**Create connection**).
- Use it when the actions commit the state of the entire page, drawer, or form (for example creating a connection, saving import settings).

## When not to use
- Don't use it in a modal: modals have their own footer as part of the dialog.
- Don't use it for page-level actions on non-form pages (**New dataset** on a list page): those belong in the page header.
- Don't use it for actions scoped to a selection in the content: that is a toolbar above the working surface.
- Don't use it on short forms that fit one view without scrolling: place the actions at the end of the form instead.

## Category guidance (inherited: design, behavior)
Action surfaces converge on a small set of style ramps (primary → ghost) and a tight state machine (default → hover → focus → active → loading → disabled). The category lives or dies on accessibility: keyboard operability, focus visibility, and non-color state signalling are non-negotiable.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
