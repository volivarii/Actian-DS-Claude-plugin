# Consuming actian-ds-knowledge

This substrate is built to be consumed by *any* number of readers (the Claude
plugin, the docs site, a future Storybook, AI/LLM surfaces) without bending to
any one of them. This is the on-ramp.

## 1. Start at the manifest — never hardcode paths

[`paths-manifest.json`](paths-manifest.json) is the contract. Each entry maps a
**logical name** (e.g. `accessibility.index`, `components.registries.dskit`) to
its file `path`, `type`, `origin`, and `description`. Resolve by logical name;
treat the directory tree as implementation detail (it can move).

```js
const manifest = require("./paths-manifest.json");
const rel = manifest.paths["accessibility.index"].path; // -> accessibility/dist/a11y-index.json
```

Working resolvers to copy: the plugin's `scripts/lib/paths.js` and the docs
site's `scripts/lib/paths.cjs`.

## 2. Be a Tolerant Reader

- Read only the fields you need; **ignore unknown fields** (don't fail on them).
- Use defaults for absent optional fields.
- Never depend on field ordering or exhaustive key enumeration.
- Pin a schema **major** version and own a **version floor** guard (read
  `knowledge_version`; refuse versions below your tested floor). The docs site
  has `MIN_SUPPORTED_KNOWLEDGE`; new consumers should add an equivalent.

## 3. Filter by zone

The `_zones` block classifies every artifact by role
(`knowledge` / `contract` / `metadata`), keyed by the artifact's top-level
key prefix. To consume only design-system content:

```js
const z = manifest._zones;
const inZone = (key, zone) => (z[zone] || []).includes(key.split(".")[0]);
const knowledgeKeys = Object.keys(manifest.paths)
  .filter((k) => inZone(k, "knowledge"));
```

Prefixes under `_zones._pendingEviction` are consumer-specific and will leave
the substrate — don't build on them. See [`ARCHITECTURE.md`](ARCHITECTURE.md).

## 4. Dist naming vocabulary

Across knowledge domains the derived `dist/` files follow one convention:

| Suffix / name | Meaning |
|---|---|
| `_index.json` | Navigation — root metadata + child list for a section tree |
| `*.bundle.json` | One-shot roll-up — the whole domain in a single file (LLM-friendly) |
| `<slug>.json` | A single leaf/item (per-component, per-section) |
| `-defaults.json` | Per-category structural defaults |

(Generated `dist/` lives beside each domain's `src/` — co-located by
responsibility. The manifest is your unified index of the distribution surface:
`Object.values(manifest.paths).filter(e => e.origin === "ci")`.)

> **Roll-ups are intentionally unschematized.** `*.bundle.json` (one-shot domain
> roll-ups) and `foundations-index.json` (flat slug list) have no dedicated
> schema — they're composed from already-validated per-item shapes. A schema is
> added only when a consumer reads them programmatically. Per-item dist
> (sections, guidelines, words-to-avoid, a11y-index) IS schema-validated in CI.

## 5. Validate against schemas

Machine-readable schemas live in [`schemas/`](schemas/). Validate what you read
and (recommended) codegen types from them. Coverage is being completed across
all knowledge domains.

## 6. Versioning & pinning

Semver in `paths-manifest.json#knowledge_version` (= `package.json#version`).
Patch = data/derived refresh; minor = additive contract; major = breaking.
Pin a range; major/minor jumps are explicit consumer-side bumps.
