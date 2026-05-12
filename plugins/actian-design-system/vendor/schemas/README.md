# schemas/

JSON Schemas (draft 2020-12) for artifacts in this knowledge repo. Surfaces:

1. **CI validation** — `validate-schemas.yml` runs Ajv against every PR; violations posted inline via reviewdog.
2. **Future docs site** — every schema property carries `description` + `examples`; tooling can lift these into reference docs.
3. **Future AI agents** — schemas double as machine-readable contracts when MCP servers / agents query the knowledge layer.

## Files

| Schema | Validates | Required? |
|---|---|---|
| `guideline.json` | `components/src/guidelines/*.json` (44 curated + 41 stubs) | Yes, on every PR |
| `foundations-section.json` | `foundations/dist/**/*.json` (Pattern H tree) | Yes, post-derive |
| `manifest.json` | `paths-manifest.json` | Yes, on every PR |
| `category-defaults.json` | `components/src/categories/*.md` frontmatter (Phase 2, PR δ) | Lands with PR δ |

## Authoring rules

- Every property has `description` + `examples` (with rare exceptions for trivially-obvious ones).
- Required fields are the truly load-bearing ones; everything else stays optional.
- `additionalProperties` defaults to `true` for author-facing shapes (don't surprise authors); strict for CI-derived shapes.
- All schemas use `"$schema": "https://json-schema.org/draft/2020-12/schema"`.
