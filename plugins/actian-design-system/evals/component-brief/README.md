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

## Marketplace-cache constraint

`/component-brief` reads its skill code from the installed plugin
marketplace cache, NOT from your feature branch. So the eval tests
the LATEST released version of the brief skill, not whatever you
have locally checked out.

For PRs that **change the brief skill itself** (or the push patterns
it consumes), this means:

- Pre-merge eval runs against your feature branch catch
  eval-infrastructure regressions only — not skill-behavior changes.
- The load-bearing smoke evidence is an eval run made AFTER the PR
  is merged AND propagated to the marketplace.

A pragmatic flow for brief-skill-changing PRs:

1. Open the PR with a placeholder Smoke evidence section
   (`Pending marketplace propagation`).
2. Merge.
3. Wait for marketplace cache refresh (typically minutes).
4. Run the eval against `main`. Paste benchmark.md into the merged
   PR's description as a follow-up.
5. If the eval regresses, open a fix PR immediately.

For PRs that **only add to or modify the eval lane itself** (like
the v1.72.0 PR that introduces this lane), pre-merge runs are
sufficient — they validate the lane's plumbing, not the skill.

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
