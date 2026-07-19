# components/render/renderer/

The relocated **DS component renderer**: the styling source of truth (phase 0) plus the
fact-driven renderer JS (phase 1a). Knowledge owns these assets; the shared `render.css`
and the derived gallery in `components/render/dist/` are DERIVED from them (see
`scripts/render/derive-canonical.js` and `scripts/render/derive-from-renderer.js`), not
hand-written and not a snapshot baked into the frozen seeds.

## Styling source (phase 0)

- `ds-base.css`: the leaf component styling (the `.ds-*` rules, `--zen-*` token surface).
- `ds-fonts.css`: the offline font embeds.

`render.css` is built as `tokens/tokens.css` + `ds-fonts.css` + `ds-base.css`, in that
order (the same order the render read path uses). The derive keeps a loud byte-identity
cross-check against the deduped seed stylesheet: if these assets ever drift from the
frozen seeds, the derive fails rather than shipping a mismatch.

## Renderer JS (phase 1a)

Copied structure-preserving from the plugin, with its `lib/paths` coupling severed by
dependency injection:

- `html-renderers/ds-html-map.js`: the entry point, `renderDSComponent`, plus the
  injection seams `setIcons`, `setAnatomyDocMap`, and `setVariantStyleMap`.
- `appearance-render.js` / `appearance-style.js`: the resolved-appearance interpreter
  (facts to CSS declarations).
- `anatomy-render.js` / `ds-anatomy-map.js`: anatomy loading, the ratio-floor gate, and
  the assemble-time `{slug -> anatomyDoc}` / variant-style maps.
- `html-renderers/anatomy-variant-key.js`: the delegated-slug/variant composite-key
  helper shared by the anatomy map and the html renderer.
- `html-renderers/fm-html-map.js`: the Fat Marker wireframe renderer.
- `matrix.js`: the variant-matrix logic (`variantMatrix`, `findComponent`, `groupFor`,
  `RENDER_SLUGS`, `MATRIX_OVERRIDES`), ported from the plugin's seed-capture driver.
- `default-props.json`: default prop values the matrix falls back to.

These modules read facts (anatomy JSON, `icons.json`) via **injected** loaders and maps,
never via `lib/paths` (which lives only in the plugin): a missing `lib/paths` require
degrades to `null` rather than throwing, and callers (knowledge's own derive scripts)
inject loaders backed by knowledge's local `components/dist/` facts instead.
`scripts/render/derive-from-renderer.js` is the reference caller: it injects an icon map
via `setIcons` and runs `matrix.js` over a slug to reproduce that slug's frozen seed
byte-for-byte, proving the ported renderer preserves the plugin's behavior exactly.

Do **not** edit the generated `components/render/dist/`. Edit the source here.

This is renderer-relocation phase 0 (styling) + phase 1a (the renderer JS, the matrix
logic, and the byte-identity derive). A later phase scales the derive to all components,
folds the tag/checkbox fixes into the generic renderer, and has the plugin vendor this
renderer back instead of keeping its own copy.
