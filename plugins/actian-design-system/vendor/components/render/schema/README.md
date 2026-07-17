# components/render/schema

Vendored third-party JSON Schema, kept out of the repo's own `schemas/` directory
so the local schema-style convention (draft 2020-12, `description` + `examples` on
every property) does not apply to a foreign contract.

## `custom-elements-manifest.schema.json`

The official Custom Elements Manifest (CEM) schema.

- Source: https://raw.githubusercontent.com/webcomponents/custom-elements-manifest/master/schema.json
- `$schema`: JSON Schema draft-07 (validated with the default Ajv instance).
- Fetched: 2026-07-16.

`scripts/render/derive-canonical.js` validates the CEM it emits
(`components/render/dist/custom-elements.json`) against this schema and throws on
any violation, so the substrate cannot ship a non-conformant component contract.

CEM is the source-swap bridge for the North Star: the manifest is hand-derived
from the Figma-sourced render today and will be produced by `cem generate` from
the real Zen web components later, without breaking consumers.
