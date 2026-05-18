---
title: "Notifications and messaging"
nav_order: 34
# Pattern fan-out — visible-feedback affordances. Jeff: edit/correct/extend.
relatedComponents: [alert-banner, notification, maintenance-banner]
---
# Notifications and messaging

---

## Notification

Notifications inform users of updates, background task completions, or events that require their attention. They appear in the notification panel or dropdown.

### When to use

- To inform users of updates, background task completions, or events that require their attention.

### Style

- Use direct, concise language. One to two sentences.
- Include a timestamp.
- Include a link or action if the user must do something in response.
- Do not use generic text like `You have a new notification`.

---

## Notification toast

Toasts confirm that a background action completed, or surface non-critical errors and warnings that do not block the user.

### When to use

- To confirm that a background action completed.
- To surface non-critical errors or warnings that do not block the user.
- Do not use toasts for actions that require user input.
- For routine confirmations that need persistence, use an [alert / banner](/components/feedback/alert-banner/) instead.

### Style

- Keep to one short sentence.
- Include an undo action where relevant.

### Examples

| Scenario | Toast text |
|---|---|
| Dataset deleted | Dataset deleted. Undo |
| Export complete | Export ready. Download |
| Connection failed | Connection failed. Try again |

---

## Tooltip

Tooltips provide short contextual help on hover or focus. They are best for icon-only controls that need a label, or for brief supplementary information that does not need to be persistently visible.

### When to use

- To provide short contextual help on hover or focus.
- For icon-only controls that require a label.
- Do not use tooltips for critical information — users should not be required to hover to understand the UI.

### Style

- Limit to a few words or one concise sentence.
- Do not repeat the label of the element being described.
- For multi-sentence explanations, use a [popover](/components/overlays/popover/) or inline help text instead.
