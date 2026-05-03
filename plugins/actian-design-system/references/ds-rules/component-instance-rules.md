# Component Instance Rules

## Token mapping

Per-component token lookups are in the synced JSON files — do NOT hardcode from memory:
- **Per-component guidelines:** `docs/component-guidelines/*.json` (44 components — content rules, design rules, variants)
- **All token values:** `tokens/actian-ds.tokens.json` (W3C DTCG, 3 themes) + `docs/generated/token-reference.md`
- **Variable keys for Figma binding:** `docs/generated/meta-kit/variables.md` (115 keys)
- **FM palette:** `references/ds-rules/fm-css-reference.md`

Skills read these at runtime. When building any component, look up its tokens from the JSON — never use hardcoded values.

## Instance properties — use ALL of them

When creating a component instance in Figma (via `content[]` spec nodes or `use_figma`), set every relevant property:
- **Variants** — the variant string (e.g., `"Type=Primary, Size=md, State=Default"`)
- **Text overrides** — every text property (`Label`, `Title`, `Input Text`, `Caption Text`, etc.) — never leave defaults like "Label" or "Button"
- **Boolean properties** — icon toggles (`"👁 Leading Icon": false`), visibility (`"Show label": false`), feature flags (`"Required": true`, `"Disabled": false`). Check `booleanProperties` in the component registry.
- **Nested component properties** — FM inputs (Text Input, Dropdown, Search, Text Area) contain a nested FM Input Label whose properties (Caption, Required, Disabled, Show label) are exposed on the parent instance. Set them on the parent — do NOT create a separate FM Input Label next to an input that already has one built in.

## Key patterns (not a complete reference)

- Buttons: `theme-primary` fill, `label-standard` typography, `radius-sm` border
- Form inputs: `border-default` -> `border-strong` on focus, **480px max-width** container
- Links: `theme-primary` text, `underline solid`, navigation only (use Ghost Button for actions)
- Icons: come from Figma payload — do not import icon libraries
- Charts: `category-1-9` token families for series colors — never hardcode

## Real component instances (P0)

When briefing an existing component (Figma URL provided), import real library instances — never approximate with text placeholders like `[ Save ]`. Use `get_design_context` to extract the component set key, then `importComponentSetByKeyAsync()` in `use_figma`. Applies to component-brief Cards 2 and 3.
