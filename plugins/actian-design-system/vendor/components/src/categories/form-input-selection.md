---
# yaml-language-server: $schema=../../../schemas/category-defaults.json
_schema_version: 1
slug: form-input-selection
label: Form (input & selection)
authoring_status: engineer-seed
confidence:
  anatomy: medium
  variants: medium
  motion: high
  a11y: high
last_reviewed: 2026-05-12

anatomy:
  - { name: Label, description: caller-supplied text bound to the control via for/aria-labelledby }
  - { name: Required indicator, description: visible asterisk; aria-required carries the semantics }
  - { name: Control, description: the input/select/checkbox/radio/toggle element }
  - { name: Helper text, description: optional persistent guidance below the control }
  - { name: Validation message, description: error/warning/success; replaces helper text when active }
  - { name: Leading icon (optional), description: decorative or semantic hint inside the control }
  - { name: Trailing icon (optional), description: often interactive — clear, reveal, dropdown caret }

variants:
  - { axis: State, values: [default, focus, error, disabled, read-only] }
  - { axis: Size, values: [small, medium, large] }
  - { axis: Label position, values: [top, inline] }

motion_refs:
  - { ref: state-transitions, note: focus-ring fade-in on focus; opacity transition on disabled }

accessibility:
  - { ref: forms-data-entry, note: every control needs a programmatically-associated label + accessible error message }
  - { ref: required-states }
  - { ref: feedback-errors }
  - { ref: keyboard-focus }
  - { ref: color-contrast }
  - { ref: aria-guidance }
---

# Form (input & selection) — design rationale

Components in this category share input/selection patterns. Members: `calendar`, `checkbox-with-label`, `dropdown-select-default`, `input`, `input-date`, `radio-button`, `rich-text`, `search`, `search-dropdown-menu`, `search-filters`, `toggle`.

## Reference patterns

- **Polaris** — TextField, Select, Choice (Checkbox/RadioButton)
- **Material** — Text Field, Selection Controls (Checkbox/Radio/Switch)
- **Carbon** — Form, Text Input, Dropdown, Checkbox, Radio Button

## Why these defaults

Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

## Notes for refining authors

- Specific components may add `Clear button` (search, input with reveal) or `Toggle thumb` (toggle) to the anatomy.
- `Label position` axis is optional — only relevant when the component supports inline labels.
- Motion is minimal by design — form interactions should feel instantaneous.
- For `search` + `search-filters`, the `aria-guidance` ref should be tightened to live-region announcement of result counts.
