## 12. Designer Handoff Checklist {#designer-handoff-checklist}

Use before every handoff or design review.

### Color & Contrast {#color-contrast}

* [ ] All text meets contrast minimum (4.5:1 normal · 3:1 large)

* [ ] UI component boundaries meet 3:1 against background

* [ ] No information conveyed by color alone

* [ ] Contrast verified in reverse/dark contexts where applicable

### Typography & Content {#typography-content}

* [ ] No text smaller than 11px

* [ ] All inputs have visible labels — no placeholder-only fields

* [ ] Error messages describe the problem and how to fix it

* [ ] No images of text

* [ ] Line lengths within limits for the font size

### Focus & Interaction {#focus-interaction}

* [ ] All interactive elements have a designed focus state

* [ ] Focus order is logical — annotated if non-standard

* [ ] All actions have a keyboard alternative documented

* [ ] Touch targets meet minimums (24px desktop · 44px mobile)

### States {#states}

* [ ] All interactive states designed: default, hover, focus, pressed, disabled, error

* [ ] Empty, loading, and error states included for data-driven components

* [ ] State changes use more than one signal — icon + color, not color alone

### Labels & Annotations {#labels-annotations}

* [ ] Icon-only elements have `aria-label` documented

* [ ] Decorative icons marked as decorative

* [ ] Dynamic regions annotated with `aria-live`

* [ ] Modal focus trap and return focus documented

* [ ] Form groupings and required fields annotated

* [ ] Drag interactions have keyboard alternatives noted

### Reading Order & Touch {#reading-order-touch}

* [ ] Visual order matches intended reading order — annotated if non-standard

* [ ] Landmark regions annotated (header, nav, main, footer)

* [ ] Heading hierarchy is logical — no skipped levels

* [ ] Hover interactions have touch equivalents documented

* [ ] Destructive/irreversible actions have confirmation step noted

### Motion {#motion}

* [ ] Reduced motion behavior noted for all animated components

* [ ] No content flashes more than 3 times per second
