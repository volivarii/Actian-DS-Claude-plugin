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

Figma libraries are the single source of truth. Data flows: `Figma → /sync-design-system (MCP) → docs/ + tokens/`. JSON is source of truth for skills; Markdown is auto-generated for human review. Full file catalog: `references/file-catalog.md`.

**Key data files** (read JSON, not Markdown):
- `docs/component-guidelines/*.json` — per-component content/design guidelines (44 components)
- `docs/fm-components-registry.json` — FM Kit: keys, variants, text overrides, boolean properties
- `docs/dskit-components-registry.json` — DS Kit: keys, variants, text overrides, boolean properties
- `tokens/actian-ds.tokens.json` — W3C DTCG token values (3 themes)

**Scripts** (deterministic transformers — data.json → Figma plugin JS):
- `scripts/flow-to-figma.js`, `scripts/brief-to-figma.js`, `scripts/slide-to-figma.js`
- All support `--output-dir <dir>` to write `call-N.js` + `manifest.json` (preferred over stdout)
- `scripts/figma-codegen.js` — shared code generation library used by all three

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

The script uses `preview-server.js` — a custom Node.js handler that serves static files AND provides two endpoints:
- `POST /_annotations` — receives annotation JSON from the browser, writes to `.annotations.json`
- `GET /_version?file=<path>` — returns file mtime for live-reload polling

The script handles all edge cases:
- If nothing is on the port → starts a new server
- If the right server is already running → reuses it (no restart)
- If a different server is on the port → kills it and starts fresh
- Returns the base URL on stdout

**Never manually run `node` http servers or `kill` processes.** Use `ensure-server.sh` instead.
**Never pass `.` as the directory** — on desktop this resolves to the plugin cache, not the project.

---

## Generation Metadata (required for all outputs)

**Every generated output** MUST include a visible generation card as the **first element** with 7 fields: GENERATED label, skill name, prompt (truncated 200 chars), ISO 8601 date, duration, model, plugin version.

- **HTML:** Use `.gen-card` class from wrapper templates. See renderer references for card structure.
- **Figma:** Import Meta Kit Generation Log component. See `references/figma-output.md` for code pattern.
- `plugin-version` — read from `.claude-plugin/plugin.json` at file-write time

---

## Design System References

- **Tokens:** `tokens/actian-ds.tokens.json` (source of truth), `tokens/tokens.css` (`--zen-*` prefix, 3 themes), `docs/token-reference.md` (human-readable)
- **Content guidelines:** `docs/content-guidelines.md` — apply to all UI copy
- **Accessibility:** `docs/accessibility-guidelines.md` — WCAG 2.1 AA, apply to all outputs
- For HTML: use `var(--zen-color-theme-primary)` not hardcoded hex. Import `tokens/tokens.css` or copy relevant variables.

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

## Component Token Mapping

Per-component token lookups are in the synced JSON files — do NOT hardcode from memory:
- **Per-component guidelines:** `docs/component-guidelines/*.json` (44 components — content rules, design rules, variants)
- **All token values:** `tokens/actian-ds.tokens.json` (W3C DTCG, 3 themes) + `docs/token-reference.md`
- **Variable keys for Figma binding:** `docs/meta-kit/variables.md` (115 keys)
- **FM palette:** `references/fm-css-reference.md`

Skills read these at runtime. When building any component, look up its tokens from the JSON — never use the values below as a substitute for the synced data.

**Component instance properties — use ALL of them:**

When creating a component instance in Figma (via `content[]` spec nodes or `use_figma`), set every relevant property:
- **Variants** — the variant string (e.g., `"Type=Primary, Size=md, State=Default"`)
- **Text overrides** — every text property (`Label`, `Title`, `Input Text`, `Caption Text`, etc.) — never leave defaults like "Label" or "Button"
- **Boolean properties** — icon toggles (`"👁 Leading Icon": false`), visibility (`"Show label": false`), feature flags (`"Required": true`, `"Disabled": false`). Check `booleanProperties` in the component registry.
- **Nested component properties** — FM inputs (Text Input, Dropdown, Search, Text Area) contain a nested FM Input Label whose properties (Caption, Required, Disabled, Show label) are exposed on the parent instance. Set them on the parent — do NOT create a separate FM Input Label next to an input that already has one built in.

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

**Every Figma-writing skill pauses before pushing and presents options including "preview".** Default path is structured data → script → Figma. User always sees preview/push/feedback choices.

| Skill | Gate before push | Options presented |
|-------|-----------------|-------------------|
| generate-flow | Screen list approval | approve, "preview", "push [URL]", feedback |
| component-brief | After data model built | "push [URL]", "push N,N", "preview", "playground", feedback |
| generate-presentation | After outline | approve, "preview", "push [URL]", feedback |
| create-component | Build plan summary | "build", feedback |

- If the user's prompt pre-answers a gate (e.g., "no research"), skip asking
- "push and wire" triggers prototype wiring after push (generate-flow only)
- Draft tier in create-component skips the build plan gate

---

## DS Companion

**Skill priority:** For any UI or design work — designing pages, screens, flows, forms, dashboards, dialogs, wireframes, mockups, or any task involving Figma, design tokens, spacing, typography, accessibility, copy review, or UX patterns — use a design system skill (companion, generate-flow, design-audit, etc.) instead of generic creative skills like brainstorming. Design system skills have the domain context (tokens, guidelines, app chrome, component inventory) that generic skills lack.

The companion is the primary interaction model. Users share a Figma URL or describe a design task, and the companion infers intent, loads relevant context, and either handles it directly or routes to a skill pipeline.

**Always-loaded context:** `references/companion-context.md` — compact DS summary (tokens, content rules, app context, component inventory).

**Autonomy rules:**
- **Spot fixes** (wrong token, spacing, auto-layout): act freely, explain after
- **Design tasks** (new screen, layout change): suggest + act on approval
- **Research** (patterns, competitors): suggest only
- **System changes** (guidelines, tokens): suggest only, user decides

**Skill routing:** when the companion detects intent matching a skill (e.g., "mock up a dashboard"), it runs that skill's pipeline internally. All skills work as both companion capabilities and standalone commands (`/generate-flow`, `/design-audit`, etc.).

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

Opt-in interactive previews. See `references/prototype-reference.md` for details.

- **Flows** → `[name]-prototype.html` (Alpine.js, template: `templates/flow-prototype-wrapper.html`)
- **Components** → `[name]-playground.html` (Alpine.js, template: `templates/component-playground-wrapper.html`)
- **Triggers:** "prototype", "interactive", "playable", "playground", "test states". Suppressed by "quick"/"draft".
- For testing only — never pushed to Figma. Static HTML is the source of truth.

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
