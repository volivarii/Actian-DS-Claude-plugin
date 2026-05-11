# Contributing to actian-ds-knowledge

This is the federated knowledge layer for the Actian Design System 2026. It feeds the [Actian DS Claude plugin](https://github.com/volivarii/Actian-DS-Claude-plugin) (vendored snapshot, refreshed nightly) and a future docs site, Storybook, and API clients.

The repo is organized so **a human contributor can tell at a glance what's editable and what's CI-generated** — without reading any file's frontmatter or `_meta` block. The signal is the folder name.

## The `src/` + `dist/` convention

Mixed-origin domains (where humans author content AND CI generates derived artifacts) split into two visible folders:

```
foundations/
├── src/         ← edit here (Kristina's MD-as-SoT + AUTHORING guide)
└── dist/        ← CI-generated, do not edit (8 derived JSONs)

components/
├── src/         ← edit here (per-component guidelines, hand-curated content)
└── dist/        ← CI-generated, do not edit (Figma-synced registries + style MDs)
```

Single-origin domains stay flat (no `src/`+`dist/` nesting) — adding it would be noise:

```
content/         ← purely human (Jeff's content guidelines)
accessibility/   ← purely human
presentation/    ← purely human
app-context/     ← purely human (curated patterns)
fm-to-ds-map/    ← purely human (curated FM↔DS mapping)
tokens/          ← interim: human-frozen (see tokens/README.md)
```

## Edit-here / never-edit table

| If you want to change… | Edit here | What CI does on PR |
|---|---|---|
| A foundation token, rule, or scale | `foundations/src/foundations.md` | `foundations-derive.yml` regenerates 8 `foundations/dist/*.json` |
| Component guideline content (anatomy, examples, behavior) | `components/src/guidelines/<slug>.json` | None — content goes live on merge |
| Component registry data (key, variants, properties) | **Don't.** Edit upstream in Figma. | `sync-from-figma.yml` (nightly 07:00 UTC) writes `components/dist/registries/*.json` |
| Meta Kit `templates` block | `components/dist/registries/metakit.json` (ONLY this block — hand-curated; CI preserves across syncs) | Same workflow preserves the block |
| Token value | `tokens/tokens.json` + matching CSS variable in `tokens/tokens.css` | `render-token-reference.js` regenerates `tokens/token-reference.md` |
| Content guidelines (UI copy rules) | `content/content.md` | None |
| Accessibility guidance | `accessibility/accessibility.md` | None |
| Presentation templates / chart patterns | `presentation/presentation-guide.md` | None |
| App context / persona / terminology | `app-context/app-context.json` | None |
| FM↔DS component mapping | `fm-to-ds-map/fm-to-ds-map.json` | None — `dsSlug` is hand-maintained alongside `dsKey` |

## The "do not edit `dist/`" rule

Anything in a `dist/` folder is rewritten by CI on the next run. If you edit `dist/` content directly, your changes will be reverted — sometimes within minutes, sometimes overnight. The folder name is the signal.

When CI regenerates `dist/` content, it stamps each generated file with `_meta.auto_generated: true` (JSON) or an `AUTO-GENERATED — DO NOT EDIT` banner (MD).

## Per-domain authoring guides

- [`foundations/src/AUTHORING.md`](foundations/src/AUTHORING.md) — how Kristina (and the UX team) edits foundations
- [`components/src/guidelines/AUTHORING.md`](components/src/guidelines/AUTHORING.md) — the stub-flip ritual

## Consumer indirection

Downstream consumers (the plugin, future docs site, Storybook) reference logical names from `paths-manifest.json` at the repo root, not physical file paths. The manifest maps each logical name (e.g., `foundations.color`, `components.registries.dskit`) to its file location. When this repo restructures, only the manifest changes — consumer code keeps working.

Plugin's CI pulls knowledge tags via semver range (`vendored.json.knowledge_repo_version_range`), so structural changes upstream don't auto-propagate — the plugin team bumps the range explicitly when ready to consume new versions.

## Repo collaborators

- Vincent Olivari (`volivarii`) — lead
- Jeff (`levita99zeenea`) — content guidelines
- Kristina — foundations

## License

UNLICENSED — internal Actian use only.
