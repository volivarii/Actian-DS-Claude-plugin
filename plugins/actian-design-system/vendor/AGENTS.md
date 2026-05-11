# AGENTS.md — actian-ds-knowledge

Cross-harness AI guide. If your harness reads `AGENTS.md` (Cursor, Copilot CLI, Codex, Gemini CLI, etc.), this is the entry point. Claude Code reads `CLAUDE.md` for the same content; both files mirror each other.

> **For full guidance, read [CLAUDE.md](CLAUDE.md).** This file is intentionally a thin pointer to keep the two in sync.

## TL;DR

- This repo is the federated knowledge layer for the Actian Design System 2026.
- Mixed-origin domains use `src/`+`dist/` (visible folder boundary; never edit `dist/`).
- Single-origin domains stay flat (`content/`, `accessibility/`, `presentation/`, `app-context/`, `fm-to-ds-map/`).
- `tokens/` is interim-flat — human-frozen snapshots until a successor generator lands.
- One hand-edit exception in `dist/`: `metakit.json.templates` block.
- Consumers reference logical names from `paths-manifest.json` (not physical paths). Generators write only to canonical paths under `dist/`.

## Read order

1. [llms.txt](llms.txt) — content index
2. [CONTRIBUTING.md](CONTRIBUTING.md) — `src/`+`dist/` convention + edit-here table
3. [CLAUDE.md](CLAUDE.md) — full editing rules + don'ts
4. Per-domain `AUTHORING.md` files (e.g., `foundations/src/AUTHORING.md`, `components/src/guidelines/AUTHORING.md`)
