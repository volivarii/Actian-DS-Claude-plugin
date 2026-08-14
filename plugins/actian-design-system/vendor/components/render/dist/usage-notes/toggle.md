# Toggle control: usage notes

Toggle control is a binary control that turns a setting on or off. Use it for settings that take effect immediately — without requiring a save action. When a save action is needed, use a checkbox instead.

## When to use
- For enabling or disabling a feature, setting, or permission that takes effect immediately.
- Do not use a toggle control when the change requires a save action to apply — use a checkbox or radio button within a form instead.
- Use a toggle for an on/off state change that applies the moment it is flipped, with no save step (for example **Auto-refresh** in Explorer, or a notification setting in Administration).
- Use it in settings pages (Administration, user preferences) where each row is one independent setting saved instantly.
- Use it to enable or disable a feature, permission, or schedule that has a clear on state and off state.

## When not to use
- Don't use a toggle inside a form that submits; if the change waits for a save action, use a checkbox.
- Don't use a toggle to pick one of several exclusive options: use a radio button group, or a segmented control for immediate view changes.
- Don't use a toggle to trigger an action such as starting an import: use a button.
- Don't use a toggle when the off state is ambiguous; if users can't predict what off means, use a radio button pair with explicit labels instead.

## Style
- Label the toggle control for the feature or setting being controlled, not the on/off state. For example, **Email notifications** — not **Enable email notifications** or **Email notifications on**.
- If the on and off states have meaningfully different consequences, add a short description below the toggle label.
- Use sentence case.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
