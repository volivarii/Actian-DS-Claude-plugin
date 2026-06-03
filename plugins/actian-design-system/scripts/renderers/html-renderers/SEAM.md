# Component-node seam contract

The render pipeline is one **tier-agnostic component-node spec** consumed by
renderers. Today: the HTML renderers. Later (Sub-project B): a deterministic
Figma emitter. Later still: a DS/hifi interpreter branch.

## The contract
- **Closed node taxonomy:** `FRAME · TEXT · INSTANCE · RECT · ELLIPSE · DIVIDER`.
- **The only tier-variant carrier:** `INSTANCE { ref, variant, props, library? }`.
  Fatmarker carries FM refs (`fmButton`); hifi will carry DS refs. Nothing else
  differs between tiers.
- **Discipline rule (load-bearing):** NO fidelity-specific vocabulary in the spec
  — no `fm-*` classes, no FM axis names, no inline styles. All of that lives
  INSIDE the interpreter (as `fm-html-map.js` already does). This is what lets a
  DS interpreter (and B's Figma emitter) plug in behind an unchanged seam.
- Validated by `validate-node.js` (pure, no-throw, error-accumulating — the
  `render-figma.js` pattern generalized from tables to components).

## How a new fidelity tier plugs in
A new interpreter implements `switch(node.type)` -> for `INSTANCE`, `switch(ref)`.
It reuses the structural-node renderer (`render-node.js`) verbatim; only its
INSTANCE branch (the ref->markup map) is new. The seam, schema, and the three
gates (token-resolution, FM coverage, golden-snapshot) are reused unchanged.
