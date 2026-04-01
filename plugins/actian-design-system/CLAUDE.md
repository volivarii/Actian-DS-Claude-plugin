# Actian Design System 2026 — Claude Code Rules

Follow these rules for every Figma-to-code task in this project.

---

## Output File Paths — Project Directory, Not Plugin Directory

**CRITICAL:** All generated files (HTML specs, flows, presentations) MUST be written to the **user's project working directory**, NOT relative to the plugin's own files.

On Claude Code desktop, the plugin runs from a cache directory (`~/.claude/plugins/cache/...`). Relative paths resolve there, which is wrong. Always construct absolute paths using the user's working directory:

```
# Correct — writes to the project directory
{project_working_directory}/components/flows/my-flow.html

# Wrong — writes to the plugin cache
components/flows/my-flow.html
```

**How to get the project directory:** Use the primary working directory from the session context (the directory the user opened Claude Code in). This is NOT `CLAUDE_PLUGIN_ROOT` — that points to the plugin cache.

**Also applies to `ensure-server.sh`** — serve the project directory, not `.`:

```bash
# Correct — serves the project directory
BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)

# Wrong — serves the plugin cache
BASE_URL=$(scripts/ensure-server.sh . 8765)
```

---

## File Organization

### Data flow — single source of truth

Figma libraries are the single source of truth. The `/sync-design-system` skill extracts data directly via MCP tools.

```
Figma libraries → /sync-design-system skill (MCP tools) → Plugin docs/tokens/
```

To update docs and tokens: run `/sync-design-system` (extracts directly from Figma via MCP).

### Dual format strategy — JSON primary, Markdown secondary

Design system data uses a dual-format approach:

- **JSON** = source of truth for skills (structured, queryable, composable)
- **Markdown** = auto-generated from JSON for human review (git-diffable, readable)

Skills should always read JSON for programmatic decisions (token values, guideline rules, component properties). Markdown files are for human documentation and are regenerated on each sync.

### Reference files

**JSON (source of truth — read these in skills):**

| File | Source | Purpose |
|------|--------|---------|
| `docs/component-guidelines/*.json` | Extracted via `/sync-design-system` (Phase 5) | Per-component content/design guidelines (44 components) |
| `docs/foundations/*.json` | Extracted via `/sync-design-system` (Phase 6) | Foundation docs: accessibility, borders, color, spacing, typography, etc. |
| `tokens/actian-ds.tokens.json` | Extracted via `/sync-design-system` | W3C DTCG format (source of truth for token values) |
| `docs/meta-kit/variables.md` | Extracted via `/sync-design-system` | DS Kit variable keys (115 vars, 3 themes) |
| `docs/meta-kit/text-styles.md` | Extracted via `/sync-design-system` | DS Kit text styles with font specs |
| `docs/meta-kit/effect-styles.md` | Extracted via `/sync-design-system` | DS Kit effect styles with shadow params |
| `docs/meta-kit/components.md` | Extracted via `/sync-design-system` | Meta Kit component keys and properties |
| `docs/meta-kit/meta-kit-registry.json` | Generated via `/sync-design-system` | Meta Kit component + template keys, text slots, categories |
| `docs/fm-components-registry.json` | Generated via `/sync-design-system` | FM Kit component keys, variants, text overrides (40 components) |
| `docs/dskit-components-registry.json` | Generated via `/sync-design-system` | DS Kit component keys, variants, text overrides (103 component sets) |

**Markdown (auto-generated from JSON — for human review):**

| File | Generated from | Purpose |
|------|---------------|---------|
| `docs/content-guidelines.md` | `foundations/content-guidelines.json` | UI copy rules (auto-generated, do not edit) |
| `docs/accessibility-guidelines.md` | `foundations/accessibility.json` | WCAG 2.1 AA standards (auto-generated, do not edit) |
| `docs/token-reference.md` | `tokens/actian-ds.tokens.json` | Human-readable token reference (3 themes) |
| `docs/dskit-components.md` | Figma MCP extraction | 97 DS Kit component sets + 3 standalone components |
| `docs/fm-components.md` | Figma MCP extraction | 33 FM Kit component sets + 7 standalone components |
| `tokens/tokens.css` | `tokens/actian-ds.tokens.json` | CSS custom properties (`--zen-*`) |
| `docs/meta-kit/meta-kit-reference.md` | `meta-kit-registry.json` | Human-readable registry table (auto-generated, do not edit) |

**Hand-authored (not synced):**

| File | Purpose |
|------|---------|
| `docs/presentation-guide.md` | Slide templates, voice & tone, chart selection, narrative structure |
| `docs/meta-kit/builders.md` | Shared JS builder functions |
| `scripts/figma-codegen.js` | Shared Figma code generation library — generates Plugin API code from node trees. Used by all Figma-writing skills (flow-to-figma, brief-to-figma, slide-to-figma, create-component). |
| `scripts/flow-to-figma.js` | Flow-specific: reads flow-data.json, applies templates from templates.json, generates self-contained Figma plugin JS via codegen. |
| `scripts/brief-to-figma.js` | Brief-specific: reads brief-data.json, builds 9 cards + gen log, generates Figma plugin JS via codegen. |
| `scripts/slide-to-figma.js` | Slide-specific: reads slide-data.json, builds slide frames with gradients + variable bindings, generates Figma plugin JS via codegen. |
| `scripts/templates.json` | Template definitions: dimensions, chrome type, content area config per template (admin, studio, explorer, no-sidebar, bare, mobile, tablet, compact, custom). |
| `scripts/html-renderers/brief-renderer.js` | Client-side card renderer — builds all 9 DS + 5 FM cards from brief-data.json. Embedded in HTML. |
| `scripts/html-renderers/flow-renderer.js` | Client-side screen chrome renderer — app header, sidebar, page header, cover card. Embedded in HTML. |
| `scripts/html-renderers/presentation-renderer.js` | Client-side slide template renderer — cover, section, body, back cover + chart helpers. Embedded in HTML. |
| `references/figma-spec-schema.md` | JSON spec schema reference — the format AI reads to produce valid specs |
| `references/*.md` | Shared references (figma-output, fm-css, quality-checklist, token-naming, parity-check, app-context, ux-patterns, etc.) |
| `references/component-brief/` | Data schema, figma-spec-builder, Figma rules, playground |
| `references/generate-flow/` | HTML reference, figma-spec-builder, research guide |
| `references/generate-presentation/` | Slide templates, chart types, figma-spec-builder |
| `references/create-component/` | figma-spec-builder for component authoring |
| `templates/` | CSS wrapper templates (ds-wrapper, fm-wrapper), annotation layer, prototype/playground wrappers |


## Versioning (Semantic Versioning)

This project uses **semver** (`MAJOR.MINOR.PATCH`).

| Change type | Bump | Examples |
|-------------|------|----------|
| **PATCH** (x.y.Z) | Bug fixes, typo corrections, doc updates, token value changes | Fix sizing bug, update token hex, fix skill typo |
| **MINOR** (x.Y.0) | New features, new skills, new component support, non-breaking additions | Add analyze mode, add new component to registry, add forms layout rules |
| **MAJOR** (X.0.0) | Breaking changes to spec format or skill behavior | Rename skill commands, restructure files, change token naming convention |

**When to bump:**
- Update version in `.claude-plugin/plugin.json`
- Commit the version bump as part of the feature/fix commit, not as a separate commit
- Do not bump for every small change — batch related changes and bump once

---

## Local Server Management

When serving HTML for local preview, always use the `ensure-server.sh` utility. **Serve the project directory, not the plugin directory:**

```bash
# Serve the project working directory (where output files are written)
BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)
```

The script uses `preview-server.py` — a custom Python handler that serves static files AND provides two endpoints:
- `POST /_annotations` — receives annotation JSON from the browser, writes to `.annotations.json`
- `GET /_version?file=<path>` — returns file mtime for live-reload polling

The script handles all edge cases:
- If nothing is on the port → starts a new server
- If the right server is already running → reuses it (no restart)
- If a different server is on the port → kills it and starts fresh
- Returns the base URL on stdout

**Never manually run `python3 -m http.server` or `kill` processes.** Use `ensure-server.sh` instead.
**Never pass `.` as the directory** — on desktop this resolves to the plugin cache, not the project.

---

## Generation Metadata (required for all outputs)

**Every generated output** MUST include a visible generation card as the **first element** with 7 fields: GENERATED label, skill name, prompt (truncated 200 chars), ISO 8601 date, duration, model, plugin version.

- **HTML:** Use `.gen-card` class from wrapper templates. See renderer references for card structure.
- **Figma:** Import Meta Kit Generation Log component. See `references/figma-output.md` for code pattern.
- `plugin-version` — read from `.claude-plugin/plugin.json` at file-write time

---

## Token Reference

Token reference docs and files:
- **[`docs/token-reference.md`](docs/token-reference.md)** — Human + AI readable token reference (Markdown)
- **[`tokens/actian-ds.tokens.json`](tokens/actian-ds.tokens.json)** — Source of truth (W3C DTCG format)
- **[`tokens/tokens.css`](tokens/tokens.css)** — CSS custom properties with `--zen-*` prefix, 3 theme modes via `[data-theme]`
- Source Figma: Actian Design System 2026 (file key in `.figma-keys.json` → `dsKit`)

When generating HTML, import `tokens/tokens.css` or copy the relevant `--zen-*` variables into your `<style>` block. Use `var(--zen-color-theme-primary)` not hardcoded hex values.

## Content Guidelines

All UI copy rules are in **[`docs/content-guidelines.md`](docs/content-guidelines.md)**.
Apply in every task: component briefs, design audits, flow generation, and analysis.

## Accessibility Guidelines

WCAG 2.1 AA standards and component checklists are in **[`docs/accessibility-guidelines.md`](docs/accessibility-guidelines.md)**.
Apply in every task: contrast ratios, keyboard interaction, ARIA patterns, focus management, touch targets, P0–P2 component checklists.

---

## Figma MCP Integration — Required Flow

**Do not skip any step.**

1. Run `get_design_context` on the target node(s) first
2. If the response is too large, run `get_metadata` to get the node map, then re-fetch specific nodes with `get_design_context`
3. Run `get_screenshot` for visual reference of the variant being implemented
4. Download assets only after you have both `get_design_context` and `get_screenshot`
5. Translate the Figma output into the project's conventions (tokens, framework, styling)
6. Validate against the Figma screenshot for 1:1 visual parity before marking complete

- IMPORTANT: Never hardcode hex colors, pixel values, or font sizes — always use design tokens
- IMPORTANT: Use localhost asset sources returned by the Figma MCP server directly — do not create placeholders
- IMPORTANT: Do not install new icon packages — all icons come from the Figma payload

---

## What Never to Hardcode

- Colors → use `Color` collection tokens or gradient styles
- Font sizes, weights, line heights → use text style tokens
- Spacing → use `Spacing` tokens
- Border radius → use `Border/radius-*` tokens
- Border widths → use `Border/width-*` tokens
- Box shadows → use `shadow-*` effect style tokens
- Icon sizes → use `Size` tokens

**FM outputs (flows, FM briefs, FM components):** Use only `--fm-*` variables from `references/fm-css-reference.md`. No custom colors, gradients, or decorative elements. The FM palette is intentionally constrained — lo-fi means lo-fi.

---

## Forms Layout Rules

Source: Design Consistency 2026 — Forms (file key in `.figma-keys.json` → `designConsistency`)

These rules apply to all generated screens (flows, specs, audits) across all skills:

### Simple forms
- Input form containers must be constrained to **480px max-width** on medium and large screens
- Applies to: text inputs, dropdowns, text areas, date pickers, radio groups, checkbox groups
- The 480px container sits left-aligned within the content area

### Extended form elements
- **Selectable rows, tiles, and tables** must be displayed **full-width**
- Follow the grid and max-width rules of the content area (1600px max-width)
- Applies to: multi-select lists, data tables used in forms, tile selectors, card grids

### Multi-column layouts
- Forms should stay **fluid** inside their containers
- Do not constrain to 480px when the form is inside a multi-column layout (e.g., side panel, split view)

### Action footer
- Stick to **bottom** of the page
- Fluid width for background color and stroke
- Actions container constrained to **1600px max-width**
- **Primary actions on the right**, secondary on the left

---

## Theme Modes

3 themes: **Actian**, **Studio**, **Explorer**.

Theme switching changes these tokens (see `token-reference.md` for exact values):

- `theme-primary`, `theme-selected`
- `interactive-selected-primary`, `interactive-selected-secondary`, `interactive-dragged-primary`
- `background-bg-reverse`
- Most `status-*` tokens (values differ per theme)
- `text-secondary`, `text-tertiary`, `text-placeholder`, `text-disabled`
- `icon-secondary`, `icon-disabled`
- `border-default`, `border-strong`, `border-disabled`
- `overlay-default`
- Category 8 `strong` level
- `background-bg-grey-1`, `background-bg-grey-2`, `background-bg-disabled`

Theme switching must be implemented at the CSS variable root level so all components inherit automatically.

---

## Known Source Typos (Corrected)

These typos were present in earlier Figma exports but have been **corrected in the 03/19 export**.
Use the **corrected** names going forward:
- `body-standard` (was `body-stardard`)
- `interactive-*-secondary` (was `interactive-*-secodary`)

---

## Component Token Mapping

Per-component token lookups are in the synced JSON files — do NOT hardcode from memory:
- **Per-component guidelines:** `docs/component-guidelines/*.json` (44 components — content rules, design rules, variants)
- **All token values:** `tokens/actian-ds.tokens.json` (W3C DTCG, 3 themes) + `docs/token-reference.md`
- **Variable keys for Figma binding:** `docs/meta-kit/variables.md` (115 keys)
- **FM palette:** `references/fm-css-reference.md`

Skills read these at runtime. When building any component, look up its tokens from the JSON — never use the values below as a substitute for the synced data.

**Key patterns to remember** (not a complete reference):
- Buttons: `theme-primary` fill, `label-standard` typography, `radius-sm` border
- Form inputs: `border-default` → `border-strong` on focus, **480px max-width** container
- Links: `theme-primary` text, `underline solid`, navigation only (use Ghost Button for actions)
- Icons: come from Figma payload — do not import icon libraries
- Charts: `category-1–9` token families for series colors — never hardcode

---

## Quality & Hygiene Checklist

Full checklist with P0/P1/P2 severity, pass criteria, and HTML translation in `references/quality-checklist.md`. Apply to ALL skill outputs.

**P0 blockers (must pass before presenting):**
- Auto Layout on every container (Hug/Fill, no fixed widths)
- All interactive states present (Enabled, Hovered, Focused, Pressed, Disabled)
- WCAG AA contrast on all text/background pairs
- 100% token binding — zero hardcoded hex, px fonts, or raw shadows

---

## Skill Review Gates

All Figma-writing skills pause for user approval before pushing to Figma:

| Skill | Gate | Vocabulary |
|-------|------|-----------|
| component-brief | Step 2.5 — HTML preview | "push" / "push N,N" / "playground" / "apply annotations" / feedback |
| generate-flow | Step 2 — research opt-in + Step 4.5 — HTML preview | "push" / "push N,N" / "push and wire" / "wire" / "prototype" / "apply annotations" / feedback |
| generate-presentation | Step 5 — review report + preview | "push" / "push N,N" / "apply annotations" / feedback |
| create-component | Step 4.5 — build plan summary | "build" / feedback |

- If the user's prompt pre-answers a gate question (e.g., "no research"), skip asking
- If the user requests cards/slides not in the HTML at the gate, regenerate HTML first
- Draft tier in create-component skips the build plan gate

---

## Post-Push Parity Check

Every skill that pushes to Figma MUST run a parity check immediately after `use_figma` completes. See `references/parity-check.md` for the full procedure.

**Quick summary:**
1. Screenshot each pushed element
2. Check for clipping (height/width < 10px), empty text, missing children
3. Report findings — fix P0s before presenting to designer
4. Write `.last-push.json` manifest for post-push iteration

| Skill | Parity check step |
|-------|-------------------|
| generate-flow | Step 6 |
| component-brief | Step 4 |
| generate-presentation | Step 7 |
| create-component | Step 6.5 |

---

## Interactive Prototypes & Playgrounds

Opt-in interactive previews for testing flows and components before pushing to Figma. See `references/prototype-reference.md` for generation rules.

**Flows** → `[name]-prototype.html`: Alpine.js shell with click-to-navigate, form validation, branching paths. Template: `templates/flow-prototype-wrapper.html`.

**Components** → `[name]-playground.html`: Alpine.js shell with state switching, variant axes, theme toggling, live token readout. Template: `templates/component-playground-wrapper.html`.

**Opt-in triggers:**
- Prompt keywords: "prototype", "interactive", "playable", "clickable", "test it", "playground", "test states"
- Gate keyword: "prototype" (flows) or "playground" (components)
- Suppressed by: "quick", "draft", "just the flow"

**Rules:**
- Prototypes are for testing only — never pushed to Figma
- Static HTML remains the source of truth for Figma parity
- Same `ensure-server.sh` serves both files
- Alpine.js 3.14.9 from CDN — no build step

---

## Library Gap Detection

When building Figma output, **always check the component catalog before creating custom frames.** If a library component exists for the element you're building, import it — even if a variant is missing.

**When a gap is detected:**
1. Attach a `Feedback (Type=System)` marker next to the improvised frame in Figma — subtle, doesn't distract the reviewing designer
2. Log the gap to `{project_working_directory}/library-gaps.json` with component name, severity, and workaround

**Severity levels:**
- `Missing component` — no library component exists for this element
- `Missing variant` — component exists but lacks the needed variant (e.g., Info type on FM Alert)
- `Missing property` — component exists but lacks a needed property (e.g., no text override, no disabled state)
- `General` — other limitation that forced a workaround

**Designer annotations:** Designers can place `Feedback (Type=Designer)` components in Figma to annotate issues. Skills scan for these at their post-push parity check step.

---

## Browser Annotations

Designers can annotate issues directly in the browser preview instead of describing them in text. See `references/annotation-reference.md` for the full reference.

**How it works:** Click "Annotate" in the preview → click any element → type feedback → click "Apply". The browser POSTs to `/_annotations` which writes `.annotations.json` to the project directory. Designer says "apply" in the CLI → Claude reads the file, fixes the HTML, and the page auto-refreshes with a "Changes applied" toast.

**Gate keyword:** `"apply annotations"` — available at all preview gates (generate-flow Step 4.5, component-brief Step 2.5, generate-presentation Step 5).

**Annotation types:** `change` (modify the HTML — the designer wants something different) or `note` (don't change the HTML — carry forward to Figma push step via `.last-push.json` notes array).

**Prerequisite:** Preview HTML must have `data-name` attributes on annotatable elements. All skills should already add these for Figma frame naming.

---

## Real Component Instances (P0)

When briefing an existing component (Figma URL provided), import real library instances — never approximate with text placeholders like `[ Save ]`. Use `get_design_context` to extract the component set key, then `importComponentSetByKeyAsync()` in `use_figma`. Applies to component-brief Cards 2 and 3.

---

## Release Notes

Save release notes to `release-notes/v{version}.md` (gitignored). Format for Slack copy-paste. Run `/release-notes` to generate.
