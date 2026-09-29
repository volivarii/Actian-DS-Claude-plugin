# Component-node seam contract

The render path is one **tier-agnostic component-node spec** consumed by two
renderers in this directory: the structural HTML renderer (`render-node.js`,
with `flow-renderer.js` drawing a screen's frame) and its deterministic
**Figma twin emitter** (`render-node-figma.js`). The component interpreters
themselves (`ds-html-map.js`, `ds-base.css`, `ds-fonts.css`,
`anatomy-variant-key.js`, `fm-html-map.js`, `fm-base.css` and the
appearance/anatomy interpreters) live in the knowledge repo
(`components/render/renderer/`) and are vendored back; the plugin reaches them
through `scripts/lib/renderer.js` and keeps no copy.

Who feeds it: `assemble-direct.js` renders the prototype's app frame through
`flow-renderer.js`, and `figma-screen.js` turns one screen JSON into the
Plugin-API script through `render-node-figma.js`.

## The contract
- **Closed node taxonomy:** `FRAME · TEXT · INSTANCE · RECT · ELLIPSE · DIVIDER`.
- **The only tier-variant carrier:** `INSTANCE { ref, variant, props, library?, dsSlug? }`.
  A Fat Marker node carries an FM ref (`fmButton`); a design system node carries
  `library:"ds"` + `dsSlug` (`button`). Nothing else differs between tiers.
- **Discipline rule (load-bearing):** NO fidelity-specific vocabulary in the spec:
  no `fm-*` classes, no FM axis names, no inline styles. All of that lives INSIDE
  the interpreter. This is what lets the DS interpreter and the Figma emitter plug
  in behind an unchanged seam.
- Validated by `validate-node.js` (pure, no-throw, error-accumulating). It is a
  contract-checker exercised by its unit test, not a render-time gate: the HTML
  renderers do not call it on the hot path.

## How the tiers dispatch
- `render-node.js`'s INSTANCE case dispatches `node.library === "ds"` to
  `dsMap.renderDSComponent` (a `switch(node.dsSlug)` with a graceful
  `ds-component` chip fallback), else the FM path. Both maps are resolved through
  `scripts/lib/renderer.js`.
- `ds-base.css` carries the `.ds-*` styles, bound to `--zen-*` tokens; it is part
  of `FLOW_CSS` in `assemble-shared.js`, which the prototype's frame inlines.
- **Gates:** `token-resolution` (ds-base.css and ds-html-map.js resolve their
  tokens), `golden-snapshot` (frozen `ds-*` goldens), `twin-parity-emit` (pins
  the Figma emitter's output byte for byte against its golden).
