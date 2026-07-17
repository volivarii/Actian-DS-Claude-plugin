# Drawer, side panel: usage notes

The drawer is a slide-in panel that appears from the right side of the screen to show additional details or actions related to a selected item. It allows users to quickly view or interact with content without leaving the current page. The drawer is flexible and can contain various types of content, such as metadata, details, or actions.

## When to use
- When a user clicks an item tile in a list or catalog search result and wants a quick view of its properties.
- To surface dependencies, properties, related assets, or linked catalog entries on an asset detail page.
- To reduce context switching during browsing or review tasks.
- Use a drawer for a quick view of an item's properties when the user clicks a tile in a list or a catalog search result: metadata, details, and actions, without leaving the page.
- Use it to surface dependencies, related assets, or linked catalog entries alongside an asset detail page.
- Use it for secondary tasks that need focus while the main page stays visible for reference: the mirror case of a modal, which blocks the page behind.
- Use it to cut context switching during browsing and review: open, scan, close, move to the next item.

## When not to use
- Don't use a drawer for confirmations or destructive actions: use a modal, which forces the stop-and-think moment a drawer deliberately avoids.
- Don't rebuild the full detail experience in the panel: when the user needs everything, send them to the full details page instead.
- Don't use it for a linear multi-step process: navigate to a dedicated page with a stepper.
- Don't use it for a one-line definition or hint: use a popover or tooltip.

## Style
- Panel title is the asset name. Use the exact name.
- Use short attribute labels (one to two words) followed by their values.
- Group related attributes under a subheading when the panel is long.
- Include a link to the full details page at the top-right of the drawer.

## Category guidance (inherited: design, behavior)
Overlays share a Trigger → Surface relationship and a tight contract with focus management. The `Dismissibility` axis captures the modal-vs-dismissible decision that drives the entire keyboard + a11y model. The `Type` axis is intentionally finite — adding a new overlay type means revisiting the category contract, not extending it.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
