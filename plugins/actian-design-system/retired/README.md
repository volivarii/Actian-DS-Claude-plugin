# Retired skills

Hidden from the skill set on 2026-09-10, ahead of the 2026-09-15 product manager demo. The plugin
discovers skills and agents by directory, so nothing under `retired/` registers. Code, schemas,
templates, recipes and reference folders these skills used stay in place until the deletion PR
(Slice 5 of the generate-flow HTML hardening plan) removes them with their tests.

| Was | Now | Why |
|---|---|---|
| `skills/generate-presentation/` | `retired/skills/generate-presentation/` | Decks are not a design-system deliverable; the skill was never demoed and its renderer carries its own bundle. |
| `skills/convert-to-hifi/` | `retired/skills/convert-to-hifi/` | Hi-fi comes from `generate-flow --hifi`; the Figma-URL conversion path folds into generate-flow in Slice 5. |
| `agents/slide-generator.md` | `retired/agents/slide-generator.md` | Only generate-presentation dispatched it. |

To bring one back: `git mv` the directory to its old path and restore the routing rows this
commit removed from `skills/companion/SKILL.md`.
