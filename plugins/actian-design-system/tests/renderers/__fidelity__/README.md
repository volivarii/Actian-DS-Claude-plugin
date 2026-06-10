# Fidelity ledger — capture-as-you-build (Phase A)

This directory is the **learnings ledger** for the hi-fi DS render tier. Every leaf/screen
we build deposits one structured row here. The build process **reads this before building
the next leaf** so known token gaps and parity failures aren't repeated. It's the
feed-forward that makes the iteration loop self-learning rather than just logging.

See the full design: `docs/superpowers/specs/2026-06-08-self-learnable-iteration-inquiry.md`
(gitignored) and the doctrine memory `project_substrate_owns_render_facts_doctrine_2026_06_08`.

## Format — `ledger.jsonl` (one JSON object per line)

| field | meaning |
|---|---|
| `slug` | dskit slug of the built leaf |
| `date` | ISO build date |
| `kind` | `leaf` \| `chrome` \| `screen` |
| `gates` | deterministic-gate results (the Layer-0 floor) — all must be `pass` |
| `fidelity` | assisted-vision checklist: `{dimensions:{...:pass\|fail}, score}` (passed ÷ total). Visual-only; substrate purity is tracked separately. |
| `reference` | the fidelity oracle this leaf was scored against (media `.webp` slug, golden HTML names) |
| `substrate_facts` | anatomy + token bindings measured to build this leaf — a **knowledge-artifact-in-waiting** to author upstream (batched), per the substrate-owns-render-facts doctrine |
| `substrate_gaps` | token/anatomy facts with NO exact substrate home yet (drift debt) → next backfill |
| `failures` | `[{dimension, cause, fix}]` parity misses → each becomes a future checklist dimension/golden row |
| `reuse_rate` | how much was drawn from substrate vs measured fresh (trends ↑ as the substrate fills) |
| `duration` | build wall-clock (harvest gen-card when available); trends ↓ |

## Phase A vs B

- **Phase A (now, near-zero cost):** this ledger + assisted-vision scoring during the build +
  the existing deterministic gates. No new scripts.
- **Phase B (fast-follow):** scripted headless render → zero-dep visual-golden (sha) +
  scripted vision-judge checklist + `fidelity-report.js` (transplant `scripts/evals/summarize.js`)
  + drift loop on the nightly media-sync. The corpus PNG pairs get captured then.
