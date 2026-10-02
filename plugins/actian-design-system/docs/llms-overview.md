# Actian Design System — AI agent orientation

This document orients AI coding agents to the Actian DS plugin's content
structure. For the canonical entry-point index, see `/llms.txt` at the
repo root.

## What this plugin is

Actian's federated DS substrate, packaged as a Claude Code plugin. Provides
4 skills: `actian-ux` (answers from the knowledge, the rules every task
follows, which skill fits), `actian-ux-proposal` (a proposal document),
`actian-ux-prototype` (a clickable prototype, pushed to Figma on request) and
`actian-ux-audit` (findings with evidence and fixes, and `ux-handover.md` from
the final frame), through the official Figma MCP server. They feed the UX lane
of engineering's `/grill` and never write `INTENT.md` or `SPEC.md`.

## How knowledge is structured

The DS knowledge layer lives in
[`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge)
(federated). The plugin vendors a pinned snapshot, refreshed nightly, into
`vendor/`. AI agents working with the plugin can read either the
vendored copy or the canonical knowledge repo directly — both are kept
in sync via the plugin's `vendor-snapshot.yml` workflow.

| Layer | Vendor (in plugin) | Canonical (knowledge repo) | Format | Purpose |
|---|---|---|---|---|
| Tokens | `vendor/tokens/tokens.json` + `tokens.css` | `tokens/` | DTCG JSON + CSS | 463 tokens, 3 themes |
| Component registries | `vendor/components/dist/registries/{fmkit,dskit,metakit}.json` | `components/dist/registries/` | JSON | Component keys, variants, properties |
| Component guidelines | `vendor/components/dist/guidelines/<slug>.json` (`domains.*` shape) | `components/dist/guidelines/` | JSON | Per-component multi-domain merged docs |
| Foundations | `vendor/foundations/src/<slug>.md` (per-section, ordered via `_order.json`) + `vendor/foundations/dist/*.json` | `foundations/src/` | MD + JSON | Spacing, typography, color, motion (79 derived JSONs) |
| Content guidelines | `vendor/content/dist/global.md` + per-component `vendor/components/dist/guidelines/<slug>.json` `domains.content` | `content/` + `components/` | MD + JSON | Voice, tone, copy patterns |
| Accessibility | `vendor/accessibility/src/<slug>.md` (per-section, ordered via `_order.json`) | `accessibility/src/` | MD | WCAG 2.2 AA conformance rules |
| App context | `vendor/app-context/dist/app-context.json` | `app-context/` | JSON | Apps, entities, terminology, patterns |
| Skill behavior | `plugins/actian-design-system/skills/*/SKILL.md` | (plugin only) | MD | Four skill cards; a file a card needs sits beside it |
| Figma notes | `skills/actian-ux-prototype/figma-screen.md`, `skills/actian-ux-audit/figma-api-traps.md` | (plugin only) | MD | The screen JSON the Figma push takes; Plugin API traps |

## Reading order for new AI agents

1. **Start at `/llms.txt`** — the canonical index, points at knowledge repo URLs.
2. **For Figma write tasks:** read `figma-use` SKILL.md (upstream) → the relevant skill card → the files beside it (`figma-screen.md`, `figma-api-traps.md`).
3. **For DS knowledge questions:** consult tokens + component registries + relevant guideline. URLs in `llms.txt` resolve to the knowledge repo; in-plugin code paths read from `vendor/`.
4. **For the retired skills** (component-brief, create-component, compare-flows, generate-presentation, convert-to-hifi): their code was deleted on 2026-09-22; `MIGRATIONS.md` and the CHANGELOG record it, and git history holds it.

## Federation status (2026-05-09)

Phase 1 of the federation arc is shipping incrementally:

- ✅ Phase 0 — `llms.txt` index + this orientation doc (v1.76.0)
- ✅ Phase 1.1 — knowledge repo standup, components/registries + 85 guidelines
- ✅ Phase 1.2 — foundations migration
- ✅ Phase 1.3 — tokens + content + accessibility + app-context + fm-to-ds-map
- ✅ Phase 1.4a — vendoring infrastructure (v1.77.0)
- ✅ Phase 1.4b — path remap (v1.78.0, plugin code reads from `vendor/`)
- ✅ Phase 1.5 — `/sync-design-system` decommission (v1.79.0, 2026-05-10)

Knowledge repo CI workflows (sync-from-figma.yml, foundations-derive.yml) keep the content fresh; the plugin's nightly vendor-snapshot.yml propagates updates to `vendor/` and auto-bumps `plugin.json`.

## Plugin substrate

Built on Anthropic's Claude Code plugin format (SKILL.md, plugin.json,
hooks, MCP integration). The claude.ai Figma connector (built in on
Claude Desktop and Cowork, connected through `/mcp` in the Claude Code CLI)
provides the canvas-write surface; our skills layer Actian-specific
patterns on top.

## License

UNLICENSED. Internal Actian use.
