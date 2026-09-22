# Retired skills

Hidden from the skill set on 2026-09-10, ahead of the 2026-09-15 product manager demo. The plugin
discovers skills and agents by directory, so nothing under `retired/` registers. Code, schemas,
templates, recipes and reference folders these skills used stay in place until the deletion PR
(Slice 5 of the actian-ux-prototype HTML hardening plan) removes them with their tests.

| Was | Now | Why |
|---|---|---|
| `skills/generate-presentation/` | `retired/skills/generate-presentation/` | Decks are not a design-system deliverable; the skill was never demoed and its renderer carries its own bundle. |
| `skills/convert-to-hifi/` | `retired/skills/convert-to-hifi/` | Hi-fi comes from `actian-ux-prototype --hifi`; the Figma-URL conversion path folds into actian-ux-prototype in Slice 5. |
| `agents/slide-generator.md` | `retired/agents/slide-generator.md` | Only generate-presentation dispatched it. |

Hidden on 2026-09-21 (roadmap 711, Vincent's call of 2026-09-17): the three designer-facing skills,
with the four agents only they dispatched. Their code, schemas, renderer, recipes, eval lane,
reference folders and tests stay in place until a deletion PR removes them together. The plugin
now carries actian-ux, actian-ux-audit, actian-ux-proposal and actian-ux-prototype.

| Was | Now | Why |
|---|---|---|
| `skills/compare-flows/` | `retired/skills/compare-flows/` | Two Figma URLs in, a diff out; no agent, never demoed, and the plugin's deliverables are HTML now. |
| `skills/component-brief/` | `retired/skills/component-brief/` | A designer's component specification; the DS team writes briefs in the knowledge repository. |
| `skills/create-component/` | `retired/skills/create-component/` | Builds components in the Figma library; the library is authored by the DS team, not generated. |
| `agents/brief-researcher.md` | `retired/agents/brief-researcher.md` | Only component-brief dispatched it. |
| `agents/card-generator.md` | `retired/agents/card-generator.md` | Only component-brief dispatched it. |
| `agents/brief-data-validator.md` | `retired/agents/brief-data-validator.md` | Only component-brief dispatched it. |
| `agents/parity-analyzer.md` | `retired/agents/parity-analyzer.md` | Named only by component-brief and create-component; actian-ux-prototype's parity step has run inline since 2026-04-02 (`2f4be79d`), so nothing live dispatched it. |

To bring one back: `git mv` the directory to its old path, restore the routing rows the
retiring commit removed from `skills/actian-ux/SKILL.md`, repin
`tests/integration/retired-skills.test.js` (its skill and agent counts, its lists and its
banned names), name its agents again in the repository-root `.claude-plugin/marketplace.json`, and for
component-brief re-add its entry to `tests/integration/contract.test.js`. The counts in the
docs follow from `scripts/vendor/sync-doc-counts.js`.
