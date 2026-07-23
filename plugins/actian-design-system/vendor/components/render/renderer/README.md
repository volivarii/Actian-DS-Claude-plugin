# components/render/renderer/

The relocated **DS component renderer**: the styling source of truth (phase 0) plus the
fact-driven renderer JS (phase 1a). Knowledge owns these assets; the shared `render.css`
and the derived gallery in `components/render/dist/` are DERIVED from them (see
`scripts/render/derive-canonical.js` and `scripts/render/derive-from-renderer.js`), not
hand-written and not a frozen snapshot.

## Styling source (phase 0)

- `ds-base.css`: the leaf component styling (the `.ds-*` rules, `--zen-*` token surface).
- `ds-fonts.css`: the offline font embeds.
- `fm-base.css`: the Fat Marker (fm) tier's styling source, self-contained (its own
  `--fm-*` custom properties, no `@font-face`, no token-system coupling). Unlike
  `ds-base.css`/`ds-fonts.css`, `render.css` does NOT derive from it: knowledge
  carries it so the plugin can vendor it back for its own fm-tier consumption
  (generate-flow's lo-fi preview, component briefs), not to build an fm gallery
  here.

`render.css` is built as `tokens/tokens.css` + `ds-fonts.css` + `ds-base.css`, in that
order (the same order the render read path uses). `tests/render/derive-canonical.test.js`
pins that composition exactly, so the derive cannot quietly start sourcing its stylesheet
from somewhere else.

## Renderer JS (phase 1a)

Copied structure-preserving from the plugin, with its `lib/paths` coupling severed by
dependency injection:

- `html-renderers/ds-html-map.js`: the entry point, `renderDSComponent`, plus the
  injection seams `setIcons`, `setAnatomyDocMap`, and `setVariantStyleMap`. As of
  2026-07-22, 6 more slugs joined the hand-authored set from the gray-box reduction
  program: `digram-item-types`, `digram-topic`, `lineage-individual-node`,
  `lineage-grouped-node`, `metamodel-widget` (components), and `loader-with-logo`
  (graphic, composes the existing `loader`). `tests/render/ds-html-map.test.js`
  covers these 6 directly in knowledge; the other 35 stay covered by the plugin's
  own `tests/renderers/ds-html-map.test.js` against the vendored copy (a known,
  intentionally deferred split; see the design spec's Risks section).
- `appearance-render.js` / `appearance-style.js`: the resolved-appearance interpreter
  (facts to CSS declarations). `appearance-render.js` carries its own injection seams,
  `setIcons` and `setShadowedSlugs` (phase 3): it resolves icons independently of
  `ds-html-map.js`, through the same dual-source idiom, and a vendored layout has no
  `lib/paths` for its Node branch to resolve, so without these seams a vendored consumer
  silently rendered blank glyphs. Both are module-level mutable state shared across
  renders: callers MUST reset with `setIcons(null)` / `setShadowedSlugs(null)` after
  rendering to avoid cross-render state leak, the same discipline `ds-html-map.js`'s
  `setIcons`, `setAnatomyDocMap`, and `setVariantStyleMap` document at their own
  definitions.
- `anatomy-render.js` / `ds-anatomy-map.js`: anatomy loading, the ratio-floor gate, and
  the assemble-time `{slug -> anatomyDoc}` / variant-style maps.
- `html-renderers/anatomy-variant-key.js`: the delegated-slug/variant composite-key
  helper shared by the anatomy map and the html renderer.
- `html-renderers/fm-html-map.js`: the Fat Marker wireframe renderer. Landed here
  as a side effect of relocating `ds-html-map.js`, which borrows 3 generic helpers
  from it via a guarded require, before fm-html-map.js was a tracked tier in its
  own right. `tests/render/fm-html-map.test.js` now exercises `renderFMComponent` directly,
  and `fm-base.css` (above) is its styling counterpart. Knowledge derives no fm
  gallery from either; the plugin's generate-flow and component-brief renderers
  are the real consumers, and vendor both back.
- `matrix.js`: the variant-matrix logic (`variantMatrix`, `findComponent`, `groupFor`,
  `RENDER_SLUGS`, `MATRIX_OVERRIDES`), ported from the plugin's capture driver. It is
  also the authority on WHICH slugs the gallery covers and which group each lands in.
- `default-props.json`: default prop values the matrix falls back to.

These modules read facts (anatomy JSON, `icons.json`) via **injected** loaders and maps,
never via `lib/paths` (which lives only in the plugin): a missing `lib/paths` require
degrades to `null` rather than throwing, and callers (knowledge's own derive scripts)
inject loaders backed by knowledge's local `components/dist/` facts instead.
`scripts/render/derive-from-renderer.js` is the reference caller: it injects an icon map
via `setIcons` and runs `matrix.js` over a slug to produce that slug's fragment.

Do **not** edit the generated `components/render/dist/`. Edit the source here.

## How the output is guarded

Phase 1a pinned the derive byte-for-byte against frozen captures in
`components/render/src/`, which proved the port from the plugin preserved behavior
exactly. Phase 3 retired those captures once the migration completed and was verified
end-to-end at phase 2. Two gates replace them, both fact-derived, so a legitimate Figma
sync can no longer make either stale:

- `tests/render/fragment-invariants.test.js`: structural soundness per cell (every cell
  renders real component markup, none degrades to the renderer's graceful chip, every
  cell emits a real `ds-` class, cell counts and labels match the variant matrix, every
  slug resolves a real registry group, the phase-1b fixes hold).
- `scripts/render/fidelity-check.js`: color correctness against the appearance facts.

This is renderer-relocation phase 0 (styling) + phase 1a (the renderer JS and the matrix
logic) + phase 1b (the whole gallery deriving from this renderer) + phase 3 (the frozen
captures retired). The plugin vendors this renderer back rather than keeping its own copy.
