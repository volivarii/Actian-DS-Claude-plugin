# Component-Brief Eval Lane

End-to-end AI-behavior eval for `/component-brief`. Dispatch this when
opening any PR that touches `references/component-brief/`,
`scripts/renderers/figma-table/`, or the brief skill itself.

## How to run

In a Claude Code session at the plugin root:

```bash
plugins/actian-design-system/scripts/evals/run-component-brief.sh plan
```

The script prints two with-skill subagent prompts and two grader
prompts. Dispatch them via the Agent tool, then:

```bash
plugins/actian-design-system/scripts/evals/run-component-brief.sh aggregate <iteration-id>
plugins/actian-design-system/scripts/evals/run-component-brief.sh view <iteration-id>
```

The aggregator emits `benchmark.md`. **Paste benchmark.md into the
PR description's Smoke Evidence section.** That IS the smoke gate
(per `MIGRATIONS.md` Rule 3).

## What's covered

- **checkbox-table-heavy** — token tables, Anatomy diagram, badges A/B,
  Variation matrix. Catches v1.71.0 squash regression + Anatomy
  badge-missing regression.
- **button-variant-heavy** — Variation matrix with multiple variants.
  Catches variant-axis rendering regressions.

## What's NOT covered

- Pixel-perfect parity / brand-style match. Manual review only.
- Pattern 14 / Specs sub-frame correctness. Bug 2 is pre-existing per
  the v1.71.1 pickup memo and slated for Phase 2.
- Refine / vision / flow / hifi / audit skills. Each gets its own
  eval lane in subsequent sprints.

## Updating fixtures

Both fixtures must validate against
`plugins/actian-design-system/schemas/brief-data.schema.json`. If the
schema evolves, the integration test suite catches the drift; update
the fixture in the same PR.

## Updating assertions

Edit `grader.md`. Add new assertion IDs (A8, A9...) and reference them
from `evals.json`. The grader reads grader.md fresh on every dispatch.
