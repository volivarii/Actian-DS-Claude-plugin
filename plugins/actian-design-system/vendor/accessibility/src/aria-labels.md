## 6. ARIA & Labels {#aria-labels}

Designers annotate specs. Engineering implements.

| Attribute | When to use |
|-----------|------------|
| `aria-label` | Element has no visible text (icon buttons, close buttons) |
| `aria-labelledby` | A visible element labels another (modal heading → dialog) |
| `aria-describedby` | Additional context beyond the label (helper text, error messages) |
| `aria-required` | Required form inputs |
| `aria-invalid` | Error state inputs |
| `aria-live` | Dynamic regions updating without page reload (toasts, alerts, live search) |
| `aria-hidden` | Decorative icons or repeated visual elements |
| `aria-current` | Active item in navigation, breadcrumbs, tabs |
| `aria-expanded` | Triggers for dropdowns, accordions, collapsible panels |
| `aria-disabled` | Any interactive element that should remain discoverable but not actionable — inputs, links, tabs, menu items, checkboxes, custom components |

- Labels describe purpose, not appearance — "Submit" not "Blue button".
- The accessible name must contain the visible text of the element (the 1:1 rule).
- Grouped inputs (date range, phone + country) have a group label annotated separately.
- First rule of ARIA: if a native HTML element exists (`<button>`, `<nav>`), use it instead of an ARIA role.
