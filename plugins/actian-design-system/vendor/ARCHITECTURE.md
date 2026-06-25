# Architecture — actian-ds-knowledge

This repo is the federated **knowledge substrate** for the Actian Design
System. Its top level mixes several kinds of thing; this map tells you which is
which. The same classification is machine-readable in the `_zones` block of
[`paths-manifest.json`](paths-manifest.json).

## The layers

| Zone | What it is | Where |
|---|---|---|
| **Knowledge** | The design-system content — *how to design*. | `foundations/` `components/` `content/` `accessibility/` |
| **Contract** | The machine-readable consumption surface — *the connector*. | [`paths-manifest.json`](paths-manifest.json), `schemas/`, `graph/dist/graph.json`, [`llms.txt`](llms.txt) / `llms-full.txt` |
| **Metadata** | Product/config reference data consumed by tooling. | `app-context/` (`src/` human-authored → `dist/` CI-derived), `tokens/` (interim, frozen) |
| **Tooling** | Build machinery — *not consumed by anyone reading the substrate*. | `scripts/`, `tests/`, `editor/`, `auth-worker/` |

> **Track E complete.** The consumer-specific artifacts `fm-to-ds-map/` (a
> plugin tool's FM↔DS mapping table) and `presentation/` (a plugin skill's slide
> guide) were evicted to the plugin — they were never agnostic substrate. The
> manifest's `_zones._pendingEviction` is now empty.

Why "zones, not folders": consumers address logical names in
`paths-manifest.json`, never raw file paths (GOVERNANCE.md P7), so the layout
above can evolve without breaking anyone — and the classification lives in the
contract surface (`_zones`), where machines can read it.

## You are here — pick your path

- **I want to consume this (a reader, Storybook, an AI surface)** →
  [`CONSUMING.md`](CONSUMING.md).
- **I want to author content** → the `src/AUTHORING.md` in the relevant
  knowledge domain (`foundations/src/`, `components/src/`, `content/src/`,
  `accessibility/`).
- **I want to contribute / understand CI** → [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **I want the AI-agent guide** → [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md).
