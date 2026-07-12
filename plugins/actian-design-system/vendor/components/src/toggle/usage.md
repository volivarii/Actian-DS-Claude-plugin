---
title: "Toggle control usage guidelines"
---
## When to use

* Use a toggle for an on/off state change that applies the moment it is flipped, with no save step (for example **Auto-refresh** in Explorer, or a notification setting in Administration).

* Use it in settings pages (Administration, user preferences) where each row is one independent setting saved instantly.

* Use it to enable or disable a feature, permission, or schedule that has a clear on state and off state.

## When not to use

* Don't use a toggle inside a form that submits; if the change waits for a save action, use a [checkbox](checkbox).

* Don't use a toggle to pick one of several exclusive options: use a [radio button](radio-button) group, or a [segmented control](segmented-control) for immediate view changes.

* Don't use a toggle to trigger an action such as starting an import: use a [button](button).

* Don't use a toggle when the off state is ambiguous; if users can't predict what off means, use a [radio button](radio-button) pair with explicit labels instead.

## Variant selection

* **Toggle location, left (the captured default):** the toggle leads its label; suits a single inline control in dense or embedded contexts.

* **Toggle location, right:** label first with toggles aligned at the end of the row, keeping a settings column scannable. Pick one location per surface and keep it consistent.

## Do / Don't

| Do | Don't |
| --- | --- |
| Apply the change immediately when the toggle flips | Pair a toggle with a **Save** button |
| Revert the toggle and explain if the change fails | Leave a toggle on after the request errored |
| Use one toggle per independent setting | Use a toggle to choose between three modes |
| Confirm first when flipping is destructive or affects others (disabling a shared connection) | Silently cut off every consumer of a shared connection |

> Label wording rules (name the setting, never the state) live in the Content guidelines for toggle controls.
