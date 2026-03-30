# Meta Kit — Text Styles

DS Kit text styles for binding via `figma.importStyleByKeyAsync(key)`.
Extracted from Actian Design System v1.1.0 on 2026-03-26.

## Usage

```js
const style = await figma.importStyleByKeyAsync("KEY");
textNode.textStyleId = style.id;
```

## Styles

| Style | Key | Font | Weight | Size | Line Height | Letter Spacing |
|-------|-----|------|--------|------|-------------|----------------|
| heading-display | `a14c21c5bc8ae3817de4f44cf89ac193e067bac7` | Roboto | SemiBold | 24 | 28px | 0 |
| heading-prominent | `6fe718b74016ab3a13b59f00020ad605edc82f55` | Roboto | SemiBold | 18 | 26px | 0 |
| heading-standard | `ea7401fa6fba7514c1aca93e911581cd3f16a1d8` | Roboto | SemiBold | 16 | 24px | 0.1px |
| heading-subtle | `c8c9880fd0f780b4e9a558f336c83131abe3447f` | Roboto | SemiBold | 14 | 20px | 0.2px |
| heading-micro | `9847fe1277845ce86f97157b5ba8342ecaf3f180` | Roboto | SemiBold | 12 | 16px | 0.3px |
| body-prominent | `9997e4e40cb87b1902f1c832dfef7589175e0226` | Roboto | Regular | 16 | 24px | 0.1px |
| body-stardard | `e2d890ede4702bfa4815b6805f53ac812caef4ad` | Roboto | Regular | 14 | 20px | 0.2px |
| body-subtle | `e91a526042a6328e2e9b33b8aaa493a7d456d96e` | Roboto | Regular | 12 | 16px | 0.3px |
| body-micro | `9862f620e4c4e2114aeb1bd35838174be5098103` | Roboto | Regular | 11 | 14px | 0.4px |
| label-standard | `693f5c1da87bf4ac6c00821229e0c47cea40ccd7` | Roboto | Medium | 14 | 20px | 0.2px |
| label-subtle | `48d53e9b9fca2555a64713c9c6eca3f0be96058e` | Roboto | Medium | 12 | 16px | 0.3px |
| label-micro | `1abb2bafb770f181a96123707f8fd4b1199c5341` | Roboto | Medium | 11 | 14px | 0.4px |

> **Note:** `body-stardard` is a known typo in the Figma source (should be `body-standard`). Use the key as-is when importing.
