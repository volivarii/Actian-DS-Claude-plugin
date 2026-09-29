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

## 7. Building a screen

A consumer that draws an Actian product screen or flow (a generator, an assistant
reading this repository directly, Claude Design, Cowork) reads these, in this order,
by logical name. llms.txt "Building a screen" gives the same route by path.

| Logical name | What it gives |
|---|---|
| `collections.appContextSrc` (`apps/`) | The app record, one file per app: the one record of its chrome, header (context, search, actions) and side navigation (groups, icons, sub-items, the bottom block), plus its use cases |
| `collections.appContextRecipes` | Captured product pages: regions (`slots`), what the renderer reads (`renderNotes`), a node tree |
| `collections.appContextRecipesSrc` (`captures/`) | A captured page's product screenshot, when it ships one |
| `collections.appContextSections` | The parts the product repeats across pages |
| `collections.components.render.fragments` | One HTML file per component, one cell per variant the renderer draws, in the design system's own classes |
| `paths.components.render.css` | The tokens and the component styles in one stylesheet, themed with `data-theme` |
| `paths.components.render.fontsCss` | The embedded fonts |
| `paths.components.icons.svg` | SVG geometry per icon slug |
| `paths.components.render.contract` | The props and variant values the renderer honours, per component |
| `paths.appContext` (`terminology`) | The product's word for each thing, and the words it never uses (authored in `app-context/src/terminology.yml`) |
| `paths.content.globalMd` | Writing rules, UX-pattern topics and product copy rules |
| `collections.appContextHandover` | The handover templates, when the work goes to engineering: `intent.md` (the PM's intent) and `specs.md` (the designer's specs) |

Read a captured page's screenshot, when it has one, before its node tree: the tree is written for the
plugin's JSON renderer, the screenshot and the `slots` prose carry the page (only some recipes ship a
screenshot; without one, the `slots` prose carries it alone). The screenshot
decides structure (what is on the page and where); the design system decides appearance.

Three rules for anything made from this repository:

1. Mark what is new on the page itself: every part the product does not have today, labelled as new where a reader sees it.
2. Ask the open questions: write them down; with nobody to ask, write them into the file as flagged concerns.
3. Say what was not checked: any check you could not run, and anything you could not look at.
