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

| Layer | Location | Format | Purpose |
|---|---|---|---|
| Tokens | `tokens/actian-ds.tokens.json` | DTCG JSON | 155 tokens, 3 themes, 8 collections |
| Component registries | `docs/generated/{fmkit,dskit,metakit}.json` | JSON | Component keys, variants, properties |
| Component guidelines | `docs/component-guidelines/*.json` | JSON | 85 components (44 curated + 41 stubs) |
| Foundations | `docs/foundations/*.json` + `docs/foundations.md` | JSON + MD | Spacing, typography, color, motion |
| Content guidelines | `docs/content-guidelines.md` | MD | Voice, tone, copy patterns |
| Accessibility | `docs/accessibility-guidelines.md` | MD | WCAG 2.1 AA conformance rules |
| App context | `docs/generated/app-context.json` | JSON | Apps, entities, terminology, patterns |
| FM↔DS map | `docs/generated/fm-to-ds-map.json` | JSON | Wireframe-to-DS component mapping |
| Skill behavior | `plugins/actian-design-system/skills/*/SKILL.md` | MD | Per-skill instructions and references |
| Push patterns | `references/figma/figma-push-patterns.md` + `references/component-brief/push-patterns.md` | MD | Figma Plugin API patterns |

## Reading order for new AI agents

1. **Start at `/llms.txt`** — the canonical index.
2. **For Figma write tasks:** read `figma-use` SKILL.md (upstream) → our `references/figma/figma-push-patterns.md` → relevant skill's SKILL.md.
3. **For DS knowledge questions:** consult tokens + component registries + relevant guideline.
4. **For brief generation specifically:** see `plugins/actian-design-system/skills/component-brief/SKILL.md`.

## Federation status (2026-05-09)

This plugin is in a transitional state. Phase 0 (this surface) makes
existing content AI-discoverable via `llms.txt`. Phase 1 (in progress)
will move the knowledge layer to a separate `actian-ds-knowledge` repo;
the plugin will then vendor snapshots at release time. URLs in `llms.txt`
will migrate when Phase 1 lands; AI agents should re-fetch `llms.txt` if
their cached version is more than ~1 month old.

## Plugin substrate

Built on Anthropic's Claude Code plugin format (SKILL.md, plugin.json,
hooks, MCP integration). The Figma MCP server (Figma's official plugin
at `claude plugin install figma@claude-plugins-official`) provides the
canvas-write surface; our skills layer Actian-specific patterns on top.

## License

UNLICENSED. Internal Actian use.
