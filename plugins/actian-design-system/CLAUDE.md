# Actian Design System 2026 — Claude Code Rules

Follow these rules for every task in this project.

---

## Output File Paths

**CRITICAL:** Write all generated files to the **user's project working directory**, not the plugin cache. Use absolute paths — `CLAUDE_PLUGIN_ROOT` points to the plugin cache, not the project.

```bash
# Correct: project directory
{project_working_directory}/components/flows/my-flow.html
# Wrong: plugin cache
components/flows/my-flow.html
```

`ensure-server.sh` must also serve the project directory, never `.`.

---

## Node.js Resolution

On Desktop, `node` may not be in PATH. Always resolve first:
```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/some-script.js" ...
```
**Never use bare `node`** — always `$NODE_BIN` after sourcing `resolve-node.sh`.

---

## File Organization

Data flows: `Figma -> /sync-design-system (MCP) -> docs/ + tokens/`. JSON is source of truth; Markdown is for human review.

**Key data files** (read JSON, not Markdown):
- `docs/component-guidelines/*.json` — 44 component guidelines
- `docs/fmkit.json` / `docs/dskit.json` / `docs/metakit.json` — component registries (keys, variants, properties)
- `docs/app-context.json` — structured app context (apps, entities, terminology, patterns)
- `tokens/actian-ds.tokens.json` — W3C DTCG tokens (3 themes)

**Scripts** (utilities — NOT used for Figma push):
- `scripts/assemble-preview.js` — generates HTML previews from data models
- `scripts/shared-constants.js` — dynamic registry loaders, key maps, palette, buildGenLog
- `scripts/validate-flow-data.js` — pipeline validation (banned text, tokens, terminology)
- `scripts/changelog.js` — design changelog (push-to-push diffing)
- `scripts/fm-tree-to-flow-data.js` — converts FM Figma tree to flow-data.json

---

## Versioning

Semver in `.claude-plugin/plugin.json`. PATCH = fixes, MINOR = features, MAJOR = breaking. Bump as part of the feature/fix commit, not separately. Batch related changes.

---

## Generation Metadata

Every output includes a generation card (first element) with: skill name, prompt (200 chars), ISO date, duration, model, plugin version. Measure duration with `date +%s` at start and end.

---

## Design System Rules

- **Tokens:** `tokens/actian-ds.tokens.json` (source of truth). For HTML: `var(--zen-color-theme-primary)`, never hardcoded hex.
- **Content guidelines:** `docs/content-guidelines.md`
- **Accessibility:** `docs/accessibility-guidelines.md` — WCAG 2.1 AA
- **Never hardcode:** colors, fonts, spacing, radius, shadows, icons. Use tokens. FM outputs use `--fm-*` variables only.
- **Component instances:** set ALL properties (variants, text, booleans, nested). See `references/component-instance-rules.md`.
- **Library gaps:** check catalog before custom frames. See `references/library-gap-detection.md`.
- **Forms layout:** 480px max-width for simple inputs, full-width for tables/tiles. See `references/layout-patterns.md`.

---

## Quality (P0 blockers)

- Auto Layout on every container (Hug/Fill, no fixed widths)
- All interactive states present
- WCAG AA contrast on all text/background pairs
- 100% token binding — zero hardcoded values

Full checklist: `references/quality-checklist.md`

---

## Figma MCP Flow

1. `get_design_context` first. 2. `get_metadata` if response too large. 3. `get_screenshot` for visual ref. 4. Push to Figma using small direct `use_figma` calls (200-2000 bytes each, one operation per call) — see `references/figma-push-patterns.md` for component keys and patterns. Always pass `skillNames: "figma-use"`. 5. Validate against screenshot. See `references/figma-output.md`.

---

## Local Server

Use `ensure-server.sh` for all preview serving. Never manually run servers or kill processes. Always pass the project directory, never `.`. See `references/annotation-reference.md` for browser annotations. See `references/prototype-reference.md` for interactive prototypes.

---

## Parity Check

Parity check is **opt-in** — only run when the user asks ("check parity", "verify output"). When triggered: screenshot → check for clipping, empty text, missing children → fix P0s. See `references/parity-check.md`.

---

## Release Notes

Save to `release-notes/v{version}.md` (gitignored). Run `/release-notes` to generate.
