# Actian Design System — AI agent orientation

This document orients AI coding agents to the Actian DS plugin's content
structure. For the canonical entry-point index, see `/llms.txt` at the
repo root.

## What this plugin is

Actian's federated DS substrate, packaged as a Claude Code plugin. Provides
9 skills (component-brief, generate-flow, generate-presentation,
create-component, convert-to-hifi, design-audit, compare-flows, companion,
sync-design-system) that author and audit Figma designs against the
Actian DS via the official Figma MCP server.

## How knowledge is structured

The DS knowledge layer lives in
[`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge)
(federated). The plugin vendors a pinned snapshot at release time into
`vendor/`. AI agents working with the plugin can read either the
vendored copy or the canonical knowledge repo directly — both are kept
in sync via the plugin's `vendor-snapshot.yml` workflow.

| Layer | Vendor (in plugin) | Canonical (knowledge repo) | Format | Purpose |
|---|---|---|---|---|
| Tokens | `vendor/tokens/tokens.json` + `tokens.css` | `tokens/` | DTCG JSON + CSS | 155 tokens, 3 themes, 8 collections |
| Component registries | `vendor/components/registries/{fmkit,dskit,metakit}.json` | `components/registries/` | JSON | Component keys, variants, properties |
| Component guidelines | `vendor/components/guidelines/*.json` | `components/guidelines/` | JSON | 85 components (44 curated + 41 stubs) |
| Foundations | `vendor/foundations/foundations.md` + `vendor/foundations/*.json` | `foundations/` | MD + JSON | Spacing, typography, color, motion (8 derived) |
| Content guidelines | `vendor/content/content.md` | `content/` | MD | Voice, tone, copy patterns |
| Accessibility | `vendor/accessibility/accessibility.md` | `accessibility/` | MD | WCAG 2.1 AA conformance rules |
| App context | `vendor/app-context/app-context.json` | `app-context/` | JSON | Apps, entities, terminology, patterns |
| FM↔DS map | `vendor/fm-to-ds-map/fm-to-ds-map.json` | `fm-to-ds-map/` | JSON | Wireframe-to-DS component mapping |
| Skill behavior | `plugins/actian-design-system/skills/*/SKILL.md` | (plugin only) | MD | Per-skill instructions and references |
| Push patterns | `references/figma/figma-push-patterns.md` + `references/component-brief/push-patterns.md` | (plugin only) | MD | Figma Plugin API patterns |

## Reading order for new AI agents

1. **Start at `/llms.txt`** — the canonical index, points at knowledge repo URLs.
2. **For Figma write tasks:** read `figma-use` SKILL.md (upstream) → our `references/figma/figma-push-patterns.md` → relevant skill's SKILL.md.
3. **For DS knowledge questions:** consult tokens + component registries + relevant guideline. URLs in `llms.txt` resolve to the knowledge repo; in-plugin code paths read from `vendor/`.
4. **For brief generation specifically:** see `plugins/actian-design-system/skills/component-brief/SKILL.md`.

## Federation status (2026-05-09)

Phase 1 of the federation arc is shipping incrementally:

- ✅ Phase 0 — `llms.txt` index + this orientation doc (v1.76.0)
- ✅ Phase 1.1 — knowledge repo standup, components/registries + 85 guidelines
- ✅ Phase 1.2 — foundations migration
- ✅ Phase 1.3 — tokens + content + accessibility + app-context + fm-to-ds-map
- ✅ Phase 1.4a — vendoring infrastructure (v1.77.0)
- ✅ Phase 1.4b — path remap (v1.78.0, plugin code reads from `vendor/`)
- ⏳ Phase 1.5 — `/sync-design-system` decommission (after Smoke pass #2; multi-week parallel-change discipline)

Knowledge repo CI workflows (sync-from-figma.yml, foundations-derive.yml) keep the content fresh in parallel with the plugin's existing `/sync-design-system` skill until decommission completes.

## Plugin substrate

Built on Anthropic's Claude Code plugin format (SKILL.md, plugin.json,
hooks, MCP integration). The Figma MCP server (Figma's official plugin
at `claude plugin install figma@claude-plugins-official`) provides the
canvas-write surface; our skills layer Actian-specific patterns on top.

## License

UNLICENSED. Internal Actian use.
