# Component-node seam contract

> **Renderer relocation phase 2 (2026-07-20).** The hi-fi DS tier no longer
> lives here. `ds-html-map.js`, `ds-base.css`, `ds-fonts.css`,
> `anatomy-variant-key.js` and the appearance/anatomy interpreters moved to the
> knowledge repo (`components/render/renderer/`) and are vendored back; the
> plugin reaches them through `scripts/lib/renderer.js` and keeps no copy.
> Paths named below for the DS tier are historical. What stays in this
> directory is the fatmarker tier (`fm-html-map.js`), the structural renderers
> (`render-node.js`, `flow-renderer.js`), and the Figma twin emitter.


The render pipeline is one **tier-agnostic component-node spec** consumed by
renderers. Today: two HTML render tiers behind one seam — the lo-fi **fatmarker**
tier (`fm-html-map.js`) and the hi-fi **DS** tier (`ds-html-map.js`, Phase 0:
button/input/checkbox) — plus a deterministic **Figma twin emitter**
(Sub-project B, `render-node-figma.js`).

## The contract
- **Closed node taxonomy:** `FRAME · TEXT · INSTANCE · RECT · ELLIPSE · DIVIDER`.
- **The only tier-variant carrier:** `INSTANCE { ref, variant, props, library?, dsSlug? }`.
  Fatmarker carries FM refs (`fmButton`); hifi carries `library:"ds"` + `dsSlug`
  (`button`). Today those DS nodes come from `transform-to-hifi.js` (FM→DS
  conversion); a future DS-native generator will emit the **same shape** directly.
  Nothing else differs between tiers.
- **Discipline rule (load-bearing):** NO fidelity-specific vocabulary in the spec
  — no `fm-*` classes, no FM axis names, no inline styles. All of that lives
  INSIDE the interpreter (as `fm-html-map.js` already does). This is what lets a
  DS interpreter (and B's Figma emitter) plug in behind an unchanged seam.
- Validated by `validate-node.js` (pure, no-throw, error-accumulating — the
  `render-figma.js` pattern generalized from tables to components). Today this is
  a contract-checker exercised by its unit test, not a render-time gate: the HTML
  renderers do not call it on the hot path. Runtime enforcement (validating a tree
  before emit) is deferred to Sub-project B's deterministic emitter, where an
  invalid spec must fail loudly rather than render lo-fi.

## How a new fidelity tier plugs in
A new interpreter only owns the INSTANCE branch (a ref/slug → token-bound markup
map); it reuses the structural-node renderer (`render-node.js`) verbatim. The
hi-fi DS tier is the worked example:
- `ds-html-map.js` exposes `renderDSComponent(node)` = `switch(node.dsSlug)`
  (mirrors `fm-html-map.js`'s `switch(node.ref)`); reuses `esc`/`parseVariant`/
  `normalizeProps` from `fm-html-map.js`; graceful-chip fallback (`ds-component`).
- `render-node.js`'s INSTANCE case dispatches `node.library === "ds"` →
  `dsMap.renderDSComponent`, else the FM path. The `dsMap` is resolved via the
  same UMD `window.dsHtmlMap || require("./ds-html-map")` pattern as `fmMap`.
- `ds-base.css` carries the `.ds-*` styles, 100% bound to `--zen-*` tokens
  (geometry measured once from the published Figma DS Kit).
- **Delivery is a MODE of flow-share, not a new `--type`.** `assembleFlowShare`
  renders server-side via `renderScreen` → the seam, so it produces DS markup for
  free; `ds-base.css` is inlined unconditionally (inert for lo-fi) via `FLOW_CSS`.
- **Gates (all reused/mirrored):** `token-resolution` (covers ds-base.css +
  ds-html-map.js), `ds-coverage` (every DS slug reachable from
  `fm-to-ds-map.json` has a case or is in a shrinking allowlist), `golden-snapshot`
  (frozen `ds-*` goldens), plus an end-to-end offline assembly test.

**Two feeders into this one tier.** The DS render tier is shared substrate, NOT
capped at the FM-map's slugs. It is fed by (1) **FM→DS conversion**
(`transform-to-hifi.js` + `fm-to-ds-map.json`, the "translate my wireframe"
path — 22 slugs, gated by `ds-coverage`), and (2) **DS-native authoring**
(future — a generator that emits DS nodes directly, reaching the broader
*authorable dskit* surface, far beyond 22). Both emit the same node shape and
render through this seam unchanged; only their coverage targets differ.

**Deferred (not yet built):** the remaining 19 conversion-reachable DS slugs (P1
forms, P2 display/feedback, P3 chrome — tracked by `ds-coverage`'s
`NOT_YET_IMPLEMENTED`); the DS-native authoring feeder + its authorable-dskit
coverage gate;
user-facing `--hifi` skill wiring in generate-flow; the durable anatomy-geometry
JSON substrate (ds-base.css's px comments are the interim record); icon-name→SVG
mapping (generic SVGs for now). Static interactive states approximate via CSS
pseudo-classes.
