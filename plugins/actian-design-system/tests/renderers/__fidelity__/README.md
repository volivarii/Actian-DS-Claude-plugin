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

## Phase A vs B — Gate Doctrine

### Phase A (now, near-zero cost)
This ledger + **assisted-vision scoring** during the build + the existing deterministic gates.
No new scripts. Assisted-vision is the interim gate: a human-guided or LLM-guided checklist
review against the media oracle. Sufficient for the Friday demo.

### Phase B (fast-follow) — pixel-diff is the PRIMARY gate
Scripted headless render + **ImageMagick `compare -metric RMSE -fuzz`** vs the media oracle,
region-weighted, with `await document.fonts.ready` before screenshot capture. Both system
binaries (Chrome headless + ImageMagick `compare`) — zero npm dependencies.

**Why pixel-diff primary:** LLM vision judges are systematically overconfident (ECE 39–74% in
adversarial testing). A vision judge may PASS a layout that pixel-diff catches as a clear miss.
The revised doctrine from counter-research: **vision may ADD findings on a pixel-pass, but
vision alone can never CLEAR a pixel failure.** A leaf is fidelity-green only when pixel-diff
passes first.

Pipeline: Chrome headless screenshot → ImageMagick `compare` (RMSE per region) → pass/fail
threshold → [if pass] optional vision additive checklist → ledger row.

`fidelity-report.js` (transplant `scripts/evals/summarize.js`) + drift loop on the nightly
media-sync capture the corpus PNG pairs.

See counter-research assessment:
`docs/superpowers/specs/2026-06-09-hifi-dsnative-counter-research-assessment.md` (gitignored,
local-only) — §"Fidelity gate" for the ECE calibration data and the full revised doctrine.
