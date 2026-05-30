# Authoring guide — actian-ds-knowledge

> One-page entry doc. Read this first; deep-dive into sub-guides as needed.

## What this repo is

The Actian Design System knowledge layer: tokens, content guidelines, accessibility patterns, component metadata. Consumed by the Actian DS Claude plugin today; future consumers planned (docs site, MCP server, partner integrations).

## What lives where

| Domain | Source (you edit here) | Generated (CI writes) |
|---|---|---|
| **Foundations** (color/type/spacing/motion/elevation/icons) | `foundations/src/<slug>.md` per-section files (ordered by `_order.json`) | `foundations/dist/*.json` (8 derived) + `foundations/dist/foundations.md` (verbatim concat) |
| **Tokens** | `tokens/tokens.json` (frozen snapshot) | `tokens/tokens.css`, `tokens/token-reference.md` |
| **Components** | `components/src/<slug>/{_meta.yml,content.md,usage.md,design.md,behavior.md,tokens.yml}` (per-component multi-domain authoring) + `components/src/categories/*.md` (6 category defaults) | `components/dist/guidelines/<slug>.json` (per-component merged docs, `domains.*` shape) + `components/dist/registries/*` (3, Figma sync) + `components/dist/categories/*.json` (6) + `components/dist/categories.json` |
| **Content guidelines** | `content/src/{writing,patterns,product}/*.md` + root-level meta files (Phase 2c sub-buckets) | `content/dist/global.md` (component-scoped content lives per-component in `components/dist/guidelines/<slug>.json` `domains.content`) |
| **Accessibility** | `accessibility/src/<slug>.md` per-section files (ordered by `_order.json`, with stable `{#slug}` anchors) | `accessibility/dist/a11y-index.json` (slug→WCAG map) |
| **Other** | `app-context/app-context.json`, `fm-to-ds-map/fm-to-ds-map.json`, `presentation/presentation-guide.md` | — |

## Roles (who owns what)

- **Plugin lead** — orchestration, CI, plugin-side integration, schemas
- **Design system lead** — foundations (tokens, scales) + component anatomy + design conventions
- **Content lead** — content guidelines + voice + UI copy

(Sub-`AUTHORING.md` files in each domain dive deeper.)

## How edits propagate

```
Your edit in src/ MD or JSON
    ↓ (open PR; CI validates via JSON Schema)
PR merged on knowledge repo
    ↓ (tag auto-created; nightly cron + manual trigger available)
Plugin's vendor-snapshot.yml pulls the new version
    ↓ (opens auto-merging PR via actian-ds-bot App)
Plugin main updated with new vendor data
    ↓ (marketplace cache propagates)
Designers using the plugin see new content
```

Typical lag end-to-end: <24 hours via nightly cron; ~10 min if you trigger vendor-snapshot manually.

## Validation

You don't need a local toolchain. Edit via the GitHub web UI; CI does the rest.

**On every PR**, automated schema validation runs:

1. **Schema validation** (`validate-schemas.yml`) — Ajv validates every relevant JSON against `schemas/*.json`. Any violation appears as an **inline annotation on the PR Files-Changed view** (red gutter, hover to see the message). No need to scroll through Action logs.

A "derive-diff bot comment" (showing which dist files your PR will change in plain language) is planned as a follow-up enhancement.

**Schema files** live at `schemas/`:
- `guideline-component.json` — `components/dist/guidelines/<slug>.json` (per-component merged docs, current canonical shape)
- `guideline-meta.json` — `components/src/<slug>/_meta.yml` (per-component domain-status frontmatter)
- `guideline-tokens.json` — `components/src/<slug>/tokens.yml`
- `guideline.json` — legacy scraped layer (retired in Phase 5; kept for spec-archaeology)
- `section.json` — `foundations/dist/**/*.json` (post-derive)
- `manifest.json` — `paths-manifest.json` structural shape
- `category-defaults.json` — Phase 2 v2 category frontmatter for `components/src/categories/*.md`
- `registry.json` — `components/dist/registries/*.json` (post-sync)
- `media-index.json` — `components/dist/media/_index.json` (slug → role-keyed media map, CI-derived)

Don't worry about the technical bits — focus on the content; CI will surface anything structural.

If you DO use an IDE: every schema property carries `description` + `examples`, so tooling that consumes JSON Schema (VSCode `json.schemas` settings, YAML language server) can power autocomplete + hover docs. This is opt-in.

## Reserved field conventions

Fields prefixed with `_` are system-managed (`_schema_version`, `_meta`, `_sourceFile`, `_generatedAt`). Authored content uses bare keys. Don't name new content fields with `_`-prefix.

## Cross-references

Cross-domain references use **slugs**, not quoted names:
- `motion_refs: [{ref: state-transitions}]` resolves to `foundations/dist/tokens/motion.json` pattern by slug
- `accessibility: [{ref: label-association}]` resolves to `accessibility/dist/a11y-index.json` by slug

The slug system protects against name drift; canonical names live in their authored source.

## Adding new content

- New component guideline: create `components/src/<slug>/_meta.yml` + the per-domain files you want to author (`content.md`, `usage.md`, `design.md`, `behavior.md`, `tokens.yml`). See `components/src/AUTHORING.md`.
- New foundation token: edit the relevant file under `foundations/src/` (typically `tokens.md`); CI regenerates the hierarchical `foundations/dist/` tree (Pattern H) on PR
- New category default content: edit `components/src/categories/<slug>.md`; CI regenerates dist
- New domain (rare): consult the plugin lead; new directory + paths-manifest entry + CI workflow

## When in doubt

- `paths-manifest.json` is the machine-readable contract
- Sub-`AUTHORING.md` per domain has details
- Open an issue or ask in chat
