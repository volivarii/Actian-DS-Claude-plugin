# Section recipes

A **page recipe** in `../recipes/` is the composition of a whole page shape. A **section recipe**
here is one recurring part of a page, captured from the product and addressable by slug: an item
header, a facet tab bar, a control bar, a properties panel, a drawer header, an action footer.

A page recipe references a section with a node in its `skeleton.content` tree:

    { "type": "SECTION", "section": "item-header" }

`scripts/app-context/derive-recipes.js` splices the section's `skeleton.content[]` in its place and
stamps `sections: [...]` on the dist recipe, so consumers keep reading whole page skeletons. Sections
are also published on their own to `app-context/dist/sections/<slug>.json`, so a consumer composing a
screen from a generic archetype can still place the product's real header, tabs or footer by `role`.

Rules, all enforced by the derive or by `tests/app-context-sections.test.js`:

- `derivedFrom` is required. A section is a capture, not a renderer fragment; the recipes README's
  position that fragments belong with the renderer stands for uncaptured archetypes, not for these.
- Sections are flat: a section may not contain a SECTION node.
- `skeleton` holds only `content[]`: one or more sibling nodes, spliced in document order. No chrome.
- Every INSTANCE keeps its FM `ref`; it may carry a `ds` slug naming the DS-tier leaf for the same part,
  so the lo-fi and hi-fi paths compose the same shape.
- The FILL rule and the token gate apply here as they do to page recipes.

The first five sections were extracted from the three Studio captures without changing a byte of the
derived page skeletons (proven by comparing dist skeletons before and after). `action-footer` was
captured from Studio > New Item on 2026-09-11. The Explorer drawer header stays inline in
`right-sliding-drawer` for now: a different shape for a different app.
