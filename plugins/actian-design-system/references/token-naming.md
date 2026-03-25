# Token Naming Convention

All design tokens displayed in briefs, specs, and generated output use the `--zen-` prefix following this pattern:

```
--zen-<type>-<name>

Types:
  color     → --zen-color-base-brand, --zen-color-text-primary, --zen-color-interactive-hovered-secondary
  spacing   → --zen-spacing-xs, --zen-spacing-md
  radius    → --zen-radius-default, --zen-radius-full
  shadow    → --zen-shadow-xs, --zen-shadow-md
  size      → --zen-size-md, --zen-size-xl
  width     → --zen-width-default, --zen-width-focus
  font      → --zen-font-body-standard, --zen-font-label-standard
```

## Mapping from Figma tokens to `--zen-` names

| Raw Figma token | Prefixed name |
|-----------------|---------------|
| `theme-primary` | `--zen-color-theme-primary` |
| `interactive-hovered-secondary` | `--zen-color-interactive-hovered-secondary` |
| `interactive-focused-stroke-default` | `--zen-color-interactive-focused-stroke-default` |
| `spacing-xs` | `--zen-spacing-xs` |
| `radius-default` | `--zen-radius-default` |
| `width-focus` | `--zen-width-focus` |
| `shadow-xs` | `--zen-shadow-xs` |
| `size-xl` | `--zen-size-xl` |
| `body-standard` | `--zen-font-body-standard` |
| `label-standard` | `--zen-font-label-standard` |

Use these prefixed names everywhere: spec tables, anatomy callouts, code specification, CSS custom properties.
