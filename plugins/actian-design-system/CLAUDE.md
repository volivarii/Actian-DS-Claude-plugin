# Actian Design System 2026 — Claude Code Rules

Follow these rules for every Figma-to-code task in this project.

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
| `docs/component-guidelines/*.json` | Extracted via `/sync-guidelines` | Per-component content/design guidelines (44 components) |
| `docs/foundations/*.json` | Extracted via `/sync-guidelines` | Foundation docs: accessibility, borders, color, spacing, typography, etc. |
| `tokens/actian-ds.tokens.json` | Extracted via `/sync-design-system` | W3C DTCG format (source of truth for token values) |
| `docs/meta-kit/variables.md` | Extracted via `/sync-design-system` | DS2026 variable keys (115 vars, 3 themes) |
| `docs/meta-kit/text-styles.md` | Extracted via `/sync-design-system` | DS2026 text styles with font specs |
| `docs/meta-kit/effect-styles.md` | Extracted via `/sync-design-system` | DS2026 effect styles with shadow params |
| `docs/meta-kit/components.md` | Extracted via `/sync-design-system` | Meta Kit component keys and properties |

**Markdown (auto-generated from JSON — for human review):**

| File | Generated from | Purpose |
|------|---------------|---------|
| `docs/content-guidelines.md` | `foundations/content-guidelines.json` | UI copy rules (auto-generated, do not edit) |
| `docs/accessibility-guidelines.md` | `foundations/accessibility.json` | WCAG 2.1 AA standards (auto-generated, do not edit) |
| `docs/token-reference.md` | `tokens/actian-ds.tokens.json` | Human-readable token reference (3 themes) |
| `docs/ds2026-components.md` | Figma MCP extraction | 100 DS2026 component sets |
| `docs/fm-components.md` | Figma MCP extraction | 31 FM Kit component sets |
| `tokens/tokens.css` | `tokens/actian-ds.tokens.json` | CSS custom properties (`--zen-*`) |

**Hand-authored (not synced):**

| File | Purpose |
|------|---------|
| `docs/presentation-guide.md` | Slide templates, voice & tone, chart selection, narrative structure |
| `docs/meta-kit/builders.md` | Shared JS builder functions |
| `references/*.md` | Shared skill references (figma-output, fm-css, layout-spec, token-naming) |


## Versioning (Semantic Versioning)

Both the Claude plugin and the DS Assembler use **semver** (`MAJOR.MINOR.PATCH`).

| Change type | Bump | Examples |
|-------------|------|----------|
| **PATCH** (x.y.Z) | Bug fixes, typo corrections, doc updates, token value changes | Fix sizing bug, update token hex, fix skill typo |
| **MINOR** (x.Y.0) | New features, new skills, new component support, non-breaking additions | Add analyze mode, add new component to registry, add forms layout rules |
| **MAJOR** (X.0.0) | Breaking changes to spec format, registry format, or skill behavior | Change layout spec schema, rename skill commands, restructure files |

**When to bump:**
- Update version in **both** `plugin.json` and `marketplace.json` (Claude plugin)
- Or `manifest.json` + `package.json` (DS Assembler)
- Commit the version bump as part of the feature/fix commit, not as a separate commit
- IMPORTANT: Do not bump version for every small change — batch related changes and bump once

---

## Local Server Management

When serving HTML for local preview or Assembler specs, always use the `ensure-server.sh` utility:

```bash
# From the plugin directory — serves HTML files for local preview
BASE_URL=$(scripts/ensure-server.sh . 8765)

# From the Assembler directory — serves specs + registry
BASE_URL=$(scripts/ensure-server.sh ~/Developer/Actian/Actian-DS-Assembler 8765)
```

The script handles all edge cases:
- If nothing is on the port → starts a new server
- If the right server is already running → reuses it (no restart)
- If a different server is on the port → kills it and starts fresh
- Returns the base URL on stdout

**Never manually run `python3 -m http.server` or `kill` processes.** Use `ensure-server.sh` instead.

---

## Generation Metadata (required for all outputs)

**Every generated output** (HTML specs, flows, presentations, assembler specs) MUST include a visible generation card as the **first element** — before any content cards, screens, or slides. This card is included in the output so the metadata is always visible in Figma.

### HTML outputs (specs, flows, presentations)

Add a generation card as the first child inside the layout container (`.brief-row`, `.flow-row`, or `body`). Use the `.gen-card` class defined in the wrapper templates:

```html
<div class="gen-card" data-name="Generation log">
  <div class="gen-card__label">GENERATED</div>
  <div class="gen-card__field"><span class="gen-card__key">Skill</span> {{skill name}}</div>
  <div class="gen-card__field"><span class="gen-card__key">Prompt</span> {{user prompt, truncated to 200 chars}}</div>
  <div class="gen-card__field"><span class="gen-card__key">Date</span> {{ISO 8601 date+time}}</div>
  <div class="gen-card__field"><span class="gen-card__key">Duration</span> {{prompt to file save}}</div>
  <div class="gen-card__field"><span class="gen-card__key">Model</span> {{model ID}}</div>
  <div class="gen-card__field"><span class="gen-card__key">Plugin</span> v{{plugin version}}</div>
</div>
```

### Assembler JSON specs

Add a `metadata` frame as the first child of the top-level spec:

```json
{
  "type": "frame",
  "name": "Generation log",
  "layout": "vertical",
  "spacing": 4,
  "padding": { "top": 16, "right": 20, "bottom": 16, "left": 20 },
  "fill": "#2D3648",
  "cornerRadius": 8,
  "width": 280,
  "height": "hug",
  "children": [
    { "type": "text", "content": "GENERATED", "style": "label-micro", "fill": "#A0ABC0" },
    { "type": "text", "content": "Skill: {{skill name}}", "style": "label-subtle", "fill": "#CBD2E0" },
    { "type": "text", "content": "{{ISO 8601 date}}", "style": "label-subtle", "fill": "#CBD2E0" },
    { "type": "text", "content": "{{model ID}} · v{{plugin version}}", "style": "label-subtle", "fill": "#CBD2E0" }
  ]
}
```

### `use_figma` outputs (Plugin API)

Build a generation metadata frame as the first sibling before main content. See `references/figma-output.md` for the complete code pattern and field table. The frame must include all 7 fields: GENERATED label, skill name, prompt (truncated to 200 chars), ISO 8601 date, duration, model, and plugin version.

### Field rules

- `prompt` — the user's exact input, truncated to 200 chars if longer
- `generated-at` — use the current date and time when the file is saved (not when the skill starts)
- `duration` — measure from when the user's prompt was received to when the file is written
- `skill` — the skill name from SKILL.md frontmatter
- `model` — the model powering the current session
- `plugin-version` — read from `.claude-plugin/plugin.json`

---

## Token Reference

Token reference docs and files:
- **[`docs/token-reference.md`](docs/token-reference.md)** — Human + AI readable token reference (Markdown)
- **[`tokens/actian-ds.tokens.json`](tokens/actian-ds.tokens.json)** — Source of truth (W3C DTCG format)
- **[`tokens/tokens.css`](tokens/tokens.css)** — CSS custom properties with `--zen-*` prefix, 3 theme modes via `[data-theme]`
- Source Figma: [Actian Design System 2026](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/Actian-Design-System-2026)

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

---

## Forms Layout Rules

Source: [Design Consistency 2026 — Forms](https://www.figma.com/design/Z82GkL5d9Eu1HS5hMiEBBw/Design-consistency-2026?node-id=10939-12809)

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

### Buttons

- DS2026 uses **Hierarchy** variant axis (not `Type`): Primary, Secondary color/gray, Tertiary color/gray, Link color/gray
- FM Kit uses **Type** variant axis: Primary, Secondary, Outline
- Fill color: `theme-primary` → `interactive-dragged-primary` (active/pressed)
- Text on filled: `interactive-enabled-inverse`
- Ghost/text variant label: `text-primary`
- Hover: `interactive-hovered-primary`
- Focus ring: `width-focus` + `interactive-focused-stroke-default`
- Disabled fill: `interactive-disabled-primary`; disabled bg: `interactive-disabled-secondary`
- Border radius: `radius-sm` (default) or `radius-full` (pill)
- Typography: `label-standard`
- Spacing: `spacing-xs` vertical, `spacing-sm`/`spacing-md` horizontal
- Height: `size-2xl` (large) / `size-xl` (medium)
- Additional axes: `Size` (Default/Small), `Icon` (Default/Leading/Trailing/Only), `Destructive` (True/False), `Theme`

### Form Inputs (text, select, datepicker, textarea)

- IMPORTANT: Form input containers must be constrained to **480px max-width** (see Forms Layout Rules above)
- Border: `border-default` at rest → `border-strong` on focus
- Focus ring: `interactive-focused-stroke-default` with `width-focus`
- Background: `background-bg-default`
- Disabled: `background-bg-disabled` bg, `interactive-disabled-primary` border, `text-disabled` text
- Error: `status-error-primary` border + label
- Placeholder: `text-placeholder`
- Typography: `body-standard` (input text), `label-standard` (label), `body-subtle` (hint/error)
- Border radius: `radius-sm`
- Spacing: `spacing-xs` padding

### Badges / Tags / Chips

- Background + text: `category-N-lower` (bg) + `category-N-stronger` (text)
- Or: `status-*-secondary` (bg) + `status-*-primary` (text) for semantic status
- Typography: `label-subtle` or `label-micro`
- Border radius: `radius-full` (pill) or `radius-xs`
- Spacing: `spacing-2xs` vertical, `spacing-xs` horizontal

### Cards / Panels

- Background: `background-bg-default` or `background-bg-grey-1`
- Border: `border-default`, `width-default`
- Border radius: `radius-md` or `radius-lg`
- Shadow: `shadow-xs` at rest, `shadow-sm` on hover/elevated
- Spacing (inner): `spacing-md`, `spacing-lg`

### Tables / Data Grids

- Header bg: `background-bg-grey-2`
- Row bg alternate: `background-bg-grey-1`
- Row hover: `interactive-hovered-secondary`
- Row selected: `interactive-selected-secondary`
- Border: `border-default`, `width-default`
- Header typography: `label-standard`
- Cell typography: `body-standard`
- Spacing: `spacing-xs` vertical, `spacing-sm` horizontal cell padding

### Navigation (sidebar, tabs, top nav)

- Default item text: `text-secondary`
- Active item bg: `interactive-selected-secondary`
- Active item accent: `theme-primary`
- Hover item bg: `interactive-hovered-secondary`
- Typography: `label-standard`
- Spacing: `spacing-xs`, `spacing-sm`
- Active indicator radius: `radius-sm`

### Modals / Dialogs

- Backdrop: `overlay-default`
- Surface: `background-bg-default`
- Shadow: `shadow-xl`
- Border radius: `radius-xl`
- Spacing: `spacing-lg`

### Tooltips / Popovers

- Background: `background-bg-reverse`
- Text: `text-reverse`
- Shadow: `shadow-sm`
- Border radius: `radius-xs` (tooltip) / `radius-md` (popover)
- Typography: `body-subtle`

### Status / Alert Banners

- Background: `status-*-secondary`, accent: `status-*-primary`
- Border radius: `radius-sm`
- Typography: `body-standard` + `label-standard`
- Spacing: `spacing-xs`, `spacing-sm`

### Data Visualization / Charts

- IMPORTANT: Always use `category-1–9` token families for series colors — never hardcode
- Background fills: `category-N-lower` or `category-N-low` (subtle)
- Foreground/stroke: `category-N-strong` or `category-N-stronger`
- Axis labels: `body-micro` / `label-micro`
- Grid lines: `border-default`
- All 9 category colors may shift between themes — ensure the active theme mode is applied

### Links

- Text color (enabled): `theme-primary`
- Text color (visited/clicked): `interactive-selected-primary`
- Text color (disabled): `interactive-disabled-primary`
- Hover bg: `interactive-hovered-secondary`, `radius: 4px`
- Focus bg: `interactive-focused-secondary`, border: `interactive-focused-stroke-default` + `width-focus`, `radius-default`
- Pressed bg: `interactive-pressed-secondary`, `radius: 4px`
- Typography: `body-standard` (Roboto 400 14px/20px, 0.2px tracking)
- Text decoration: `underline solid` in all states
- Padding: `spacing-2xs`
- IMPORTANT: Use links for navigation only — use Ghost Button for actions

### Icons

- Default fill: `icon-default`
- Secondary fill: `icon-secondary`
- Brand fill: `theme-primary`
- Status fills: `status-*-primary`
- Category fills: `category-N-strong`
- Disabled fill: `icon-disabled`
- Reverse fill: `icon-reverse`
- Size: use `Size` tokens (md: 16px default, lg: 24px large)
- IMPORTANT: Icons come from the Figma payload — do not import icon libraries

---

## Quality & Hygiene Checklist

Source: [Actian Design System v1.0.0 — Quality & Hygiene](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/Actian-Design-System-v1.0.0?node-id=14793-7507)

**Apply to ALL skill outputs** — component briefs, generated flows, design audits, created components, and any Figma-bound deliverable. Every output must pass all applicable items before being marked complete. P0 items are blockers.

### Layout & responsiveness

| # | Check | Severity | Pass criteria |
|---|-------|----------|---------------|
| 1 | **Auto Layout** | P0 | Every container uses Auto Layout with correct resizing (Fixed / Hug / Fill). No absolute-positioned children unless intentionally overlaid (e.g., badges, pointers). |
| 2 | **Constraints** | P1 | Pins and alignments are set so the component does not break, overlap, or clip when its parent is resized. Test at 1× and 2× width. |

### States & accessibility

| # | Check | Severity | Pass criteria |
|---|-------|----------|---------------|
| 3 | **States** | P0 | Component includes all applicable interactive states: Enabled, Hovered, Focused, Pressed, Disabled. Selected/Error/Loading where relevant. No missing states. |
| 4 | **Contrast** | P0 | Every foreground/background pair passes WCAG AA — 4.5:1 for normal text, 3:1 for large text and UI elements. Disabled states are exempt but must still be distinguishable. |

### Tokens & styles

| # | Check | Severity | Pass criteria |
|---|-------|----------|---------------|
| 5 | **Style check** | P0 | 100% of colors, fonts, shadows, and border radii reference Variables or Styles. Zero hardcoded hex values, pixel font sizes, or raw shadows. |
| 6 | **Properties** | P1 | Boolean toggles (Show/Hide), Text properties, and Instance swaps are named clearly and descriptively (`showIcon`, `labelText` — not `boolean1`, `prop`). |

### Naming & cleanup

| # | Check | Severity | Pass criteria |
|---|-------|----------|---------------|
| 7 | **Layer naming** | P1 | No auto-generated names ("Frame 102", "Group 7"). Every layer follows `category/name` or a simple descriptor (`Container`, `Leading icon`, `Label`). |
| 8 | **Instance cleanup** | P1 | No detached instances in library pages. All component usages remain linked to their source. |
| 9 | **Hidden layers** | P2 | No invisible or zero-opacity layers left from drafting. Delete anything not needed in the final component. |

### Documentation

| # | Check | Severity | Pass criteria |
|---|-------|----------|---------------|
| 10 | **Component description** | P1 | Every main component has a filled "Description" field visible in the Inspect panel. Description states: what it does, when to use it, and any constraints. Does not conflict with other component descriptions. |

### HTML translation

When generating HTML for local preview or assembler specs, the checklist translates to:

| Figma check | HTML equivalent |
|-------------|-----------------|
| Auto Layout | Use `display: flex` or `display: grid` with appropriate sizing. No fixed pixel widths that break on resize. |
| Constraints | Use relative units, `max-width`, or flex properties — not absolute positioning (except overlays). |
| States | Render all interactive states visually. Include focus ring (`:focus-visible`), hover, pressed, and disabled. |
| Contrast | Verify all text/background pairs against WCAG AA. Use token colors — they are pre-validated. |
| Style check | Reference `--zen-*` CSS custom properties exclusively. Zero raw hex, px font sizes, or inline color values. |
| Properties | Use descriptive `data-name` attributes on every element. Boolean visibility via named classes or props. |
| Layer naming | All `data-name` values are descriptive (`"Page header"`, `"Variant matrix"` — not `"div"`, `"section1"`). |
| Instance cleanup | All component references use the correct library component — no detached or inline duplicates. |
| Hidden layers | No `display: none` or `opacity: 0` elements left from iteration. Delete unused markup. |
| Documentation | Include `<!-- AI CONSUMPTION METADATA -->` comment and descriptive subtitles on every card. |
