# schemas/

JSON Schemas (draft 2020-12) for artifacts in this knowledge repo. Surfaces:

1. **CI validation** — `validate-schemas.yml` runs Ajv against every PR; violations posted inline via reviewdog.
2. **Future docs site** — every schema property carries `description` + `examples`; tooling can lift these into reference docs.
3. **Future AI agents** — schemas double as machine-readable contracts when MCP servers / agents query the knowledge layer.

## Files

| Schema | Validates | Required? |
|---|---|---|
| `guideline.json` | `components/src/guidelines/*.json` (44 curated + 41 stubs) — **legacy Figma-scraped layer, retired by the per-component guideline architecture** | Yes, on every PR |
| `foundations-section.json` | `foundations/dist/**/*.json` (Pattern H tree) | Yes, post-derive |
| `manifest.json` | `paths-manifest.json` | Yes, on every PR |
| `category-defaults.json` | `components/src/categories/*.md` frontmatter (Phase 2, PR δ) | Lands with PR δ |
| `guideline-meta.json` | `components/src/<slug>/_meta.yml` (per-component metadata + domain status matrix) | Yes, post-derive |
| `guideline-tokens.json` | `components/src/<slug>/tokens.yml` (component-specific token bindings) | Yes, post-derive |
| `guideline-component.json` | `components/dist/guidelines/<slug>.json` (CI-derived merged multi-domain guideline object) | Yes, post-derive |
| `app-context.json` | `app-context/app-context.json` (Class C — apps, entities, terminology, patterns) | Yes, on every PR |
| `fm-to-ds-map.json` | `fm-to-ds-map/fm-to-ds-map.json` (Class C — FM→DS mapping; `dsKey` is `readOnly`, synced from Figma) | Yes, on every PR |
| `icon-groups.json` | `components/src/icon-groups.json` (Class C — semantic icon groups, key-order is meaningful) | Yes, on every PR |

## Class C — hand-maintained JSON

The three Class C schemas above cover hand-edited JSONs (sometimes AI-assisted) with a known structure. They form the contract for the Knowledge Editor's "secondary tier" (form-driven editing). Each schema declares a shared `$defs.regenBlock` and the matching files carry an optional top-level `_regen` provenance field — see also D4 in the R6 forward-structural assessment.

## Authoring rules

- Every property has `description` + `examples` (with rare exceptions for trivially-obvious ones).
- Required fields are the truly load-bearing ones; everything else stays optional.
- `additionalProperties` defaults to `true` for author-facing shapes (don't surprise authors); strict for CI-derived shapes. **Exception: Class C schemas (`app-context`, `fm-to-ds-map`, `icon-groups`) use `additionalProperties: false` at root** — the Knowledge Editor's secondary tier renders a schema-driven form, so the contract must enumerate every accepted root key. Add a new property to the schema before adding it to the data file.
- All schemas use `"$schema": "https://json-schema.org/draft/2020-12/schema"`.
