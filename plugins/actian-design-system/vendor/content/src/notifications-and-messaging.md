---
title: "Notifications and messaging"
nav_order: 23
---
# Notifications and messaging

---

## Notification

### When to use

To inform users of updates, background task completions, or events that require their attention.

### Style

- Use direct, concise language. One to two sentences.
- Include a timestamp.
- Include a link or action if the user must do something in response.
- Do not use generic text like `You have a new notification`.

---

## Tooltip

### When to use

- To provide short contextual help on hover or focus.
- For icon-only controls that require a label.
- Do not use tooltips for critical information - users should not be required to hover to understand the UI.

### Style

- Limit to a few words or one concise sentence.
- Do not repeat the label of the element being described.
- For multi-sentence explanations, use a popover or inline help text instead.

---

## Toast / Snackbar

### When to use

- To confirm that a background action completed.
- To surface non-critical errors or warnings that do not block the user.

### Style

- Keep to one short sentence.
- Include an undo action where relevant.
- Do not use toasts for actions that require user input.

### Examples

| Scenario | Toast text |
|---|---|
| Dataset deleted | Dataset deleted. Undo |
| Export complete | Export ready. Download |
| Connection failed | Connection failed. Try again |
