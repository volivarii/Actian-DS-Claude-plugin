# `foundations/dist/` — AUTO-GENERATED, DO NOT EDIT

The 8 JSON files in this directory are derived by CI from `foundations/src/foundations.md` (Design system lead's MD-as-SoT). Hand edits here are reverted on the next CI run.

| File | Source section in `foundations.md` |
|---|---|
| `color.json` | 1 (Primitives), 2.1, 2.2, 2.5, 2.10, 3.1, 4.1 |
| `borders.json` | 2.3, 4.2 |
| `breakpoint-grid-structure.json` | 2.4, 3.6 |
| `elevation.json` | 2.6, 3.4 |
| `icons.json` | 2.12 |
| `interaction-motion.json` | 2.9, 3.5 |
| `spacing.json` | 2.7, 2.11, 3.3 |
| `typography.json` | 2.8, 3.2, 4.3 |

## To change a token

Edit `foundations/src/foundations.md`. The `foundations-derive.yml` workflow regenerates these JSONs on every PR that touches the source MD or the parser scripts, and posts a semantic-diff comment summarizing what changed.

## How CI writes here

`scripts/foundations/derive-foundations.js` parses `foundations/src/foundations.md` against the section map in `scripts/foundations/foundations.parser.json` and emits one JSON per output filename. See `foundations/src/AUTHORING.md` for the contributor-facing guide.
