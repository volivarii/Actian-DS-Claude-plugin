---
name: component-brief
description: Use this skill whenever the user wants to formally document or specify a design system component. Produces a multi-card HTML spec page covering anatomy, design tokens, component API, usage guidelines, content guidelines, accessibility, and code specification. Supports both 9-card Actian DS (hi-fi) and 5-card Fat Marker (lo-fi) formats. Triggers when the user asks to document, brief, or spec a component, wants to know the variants/states/tokens for a component, asks for a spec page, or provides a Figma component URL and wants it turned into structured documentation for the team.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief and generate an HTML spec page. Supports two modes matching the two design system layers.

> **Content guidelines:** All UI copy in briefs must follow `../../docs/content-guidelines.md`. Read it before writing Cards 6 (Usage guidelines) and 7 (Content guidelines).
> **Accessibility guidelines:** Card 8 (Accessibility) must follow `../../docs/accessibility-guidelines.md` — use the component-specific checklist matching the component type (P0/P1/P2), include WCAG criteria references, contrast ratio table, and keyboard interaction spec. All WCAG 2.1 AA.
> **Quality & hygiene:** Validate all output against CLAUDE.md Quality & Hygiene Checklist before marking complete.
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

> **Mode: Spec.** Be thorough — document every variant, state, and edge case. Structure everything with consistent headings, tables, and numbered lists. Define before building; every decision needs a rationale. Cross-reference tokens, components, and guidelines by name. Include what's out of scope explicitly.

## Modes

Determine the mode from context:

| Signal | Mode |
|--------|------|
| User says "FM", "Fat Marker", "wireframe", "lo-fi" | **Fat Marker** |
| User says "DS2026", "design system", "hi-fi", "production" | **Actian DS** |
| Component exists in FM catalog (`FATMARKER-COMPONENT-CATALOG.md`) AND no DS2026 signals | **Fat Marker** |
| User provides a Figma URL from DS2026 files (`8Yu8wUtPTXsa3iV6R4TmnS`, `l8biHxfarNi1I2RMvVxVOK`, or `fuWLltVXyBrbn6KfBAav12`) | **Actian DS** |
| Figma file name contains "Design System", "DS2026", or "Actian" | **Actian DS** |
| **Default when a Figma URL is provided and no FM signals exist** | **Actian DS** |
| Ambiguous (no URL, no explicit mode) | Ask the user: "Fat Marker (lo-fi wireframe) or Actian DS (hi-fi production)?" |

## Input

The user describes a component or provides a Figma URL. Examples:
- "Draft a brief for the link component" + Figma URL
- "Document FM Alert"
- "We need a notification banner component"

## Execution Model — Run Autonomously

**This skill runs end-to-end without intermediate prompts.** Do NOT pause to ask questions, present drafts, or wait for confirmation between steps. The only acceptable pause is when the mode (FM vs DS) is genuinely ambiguous AND no signals resolve it.

Parse card selection from the user's initial input. If no selection is specified, default to **all cards**. Do not ask "which cards?" — just generate them.

### Speed rules

- **Do NOT use TaskCreate/TaskUpdate/TodoWrite.** No task tracking overhead — just execute.
- **ONE parallel batch for research.** Read all files in a single message with parallel tool calls. Never do serial rounds of research.
- **Do NOT read CLAUDE.md** — the relevant token mappings and rules are already in this skill file and in `../../docs/token-reference.md`.
- **Do NOT read `plugin.json`** — the plugin version for the generation log is: check `.claude-plugin/plugin.json` only once, at the very end, right before writing the file.
- **If a Figma call fails, skip it and proceed.** Do not retry or try alternative approaches — use the screenshot and existing docs instead.
- **Do NOT create directories with mkdir.** Use the Write tool directly — it creates parent directories automatically.

## Step 1 — Research (ONE parallel batch)

Issue ALL of these reads in a **single message** with parallel tool calls. Do not wait for results between reads.

**For Actian DS mode (9 cards), read these files in parallel:**
1. `get_screenshot` on the provided Figma node (for visual reference)
2. `../../docs/token-reference.md` (token values per theme)
3. `../../docs/content-guidelines.md` (for Cards 6-7)
4. `../../docs/accessibility-guidelines.md` (for Card 8)
5. `../../docs/component-guidelines/<slug>.json` — per-component guidelines from Figma (content guidelines, design guidelines, variants, examples). Use the component slug (e.g., `button.json`, `date-picker.json`). If the file doesn't exist, skip it.
6. All 9 card templates: `templates/ds-card-1-page-header.html` through `templates/ds-card-9-code-specification.html`
7. `templates/ds-wrapper.html`

**For Fat Marker mode (5 cards), read these files in parallel:**
1. `get_screenshot` on the provided Figma node
2. `../../docs/fm-components.md` (component variants)
3. `../../docs/content-guidelines.md`
4. `../../docs/component-guidelines/<slug>.json` — per-component guidelines (if available)
5. All 5 card templates: `templates/fm-card-1-page-header.html` through `templates/fm-card-5-anatomy.html`
6. `templates/fm-wrapper.html`

That's it. No additional research rounds. Proceed immediately to generation.

## Step 2 — Generate HTML (immediate)

Draft the brief content and generate the HTML in the same step. Do NOT draft as a separate step — go straight from research results to final HTML output.

**MANDATORY: Include the GENERATION LOG** comment block in `<head>` as specified in CLAUDE.md. Read `.claude-plugin/plugin.json` for the version right before writing the file.

### Card selection (parsed from input, never prompted)

Default is **All cards**.

**Actian DS cards:**

| # | Card | `data-name` | Template file |
|---|------|-------------|---------------|
| 1 | Page header | `"Page header"` | `templates/ds-card-1-page-header.html` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `templates/ds-card-2-actual-component.html` |
| 3 | Anatomy | `"Anatomy"` | `templates/ds-card-3-anatomy.html` |
| 4 | Design tokens | `"Design tokens"` | `templates/ds-card-4-design-tokens.html` |
| 5 | Component API | `"Component API"` | `templates/ds-card-5-component-api.html` |
| 6 | Usage guidelines | `"Usage guidelines"` | `templates/ds-card-6-usage-guidelines.html` |
| 7 | Content guidelines | `"Content guidelines"` | `templates/ds-card-7-content-guidelines.html` |
| 8 | Accessibility | `"Accessibility"` | `templates/ds-card-8-accessibility.html` |
| 9 | Code specification | `"Code specification"` | `templates/ds-card-9-code-specification.html` |

**Fat Marker cards:**

| # | Card | `data-name` | Template file |
|---|------|-------------|---------------|
| 1 | Page header | `"Page header"` | `templates/fm-card-1-page-header.html` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `templates/fm-card-2-actual-component.html` |
| 3 | Design guidelines | `"Design guidelines"` | `templates/fm-card-3-design-guidelines.html` |
| 4 | Content guidelines | `"Content guidelines"` | `templates/fm-card-4-content-guidelines.html` |
| 5 | Anatomy | `"Anatomy"` | `templates/fm-card-5-anatomy.html` |

**How the user selects:**

| Input | Result |
|-------|--------|
| "generate" or "all" or no selection | All cards (default) |
| "generate card 4" or "Design tokens" | Only that one card |
| "generate 2, 4, 9" or "Component, Tokens, Code" | Only those cards |
| "generate 1–5" or "first 5" | Range of cards |
| "skip 6 and 7" or "all except Content and Usage" | All minus excluded |

When generating a subset, only include the selected cards in the HTML `brief-row`. The CSS framework is always included regardless of selection.

### HTML generation (TEMPLATE-DRIVEN)

**CRITICAL: You MUST read the template files and use them as the structural foundation for every card.** Do not generate card HTML from memory or from the descriptions above — the templates are the single source of truth for layout, CSS classes, and structure.

### Assembly process

1. **Read the wrapper template:**
   - Actian DS: `templates/ds-wrapper.html`
   - Fat Marker: `templates/fm-wrapper.html`

2. **For each selected card, read its template file** from the table above.

3. **Replace all `{{PLACEHOLDER}}` markers** in each template with component-specific content. Each template contains HTML comments explaining what to put in each placeholder.

4. **Assemble the final HTML:**
   - Copy the wrapper template
   - Insert the filled card HTML fragments where `<!-- {{CARDS}} -->` appears
   - For Card 2 (Actual component), also inject `{{COMPONENT_SPECIFIC_CSS}}` into a `<style>` block inside the card — these are the CSS classes needed to render the actual component (e.g., `.btn`, `.link`, `.input`)

5. **Save to:** `components/[component-name]/[component-name]-spec.html`

### Rules

- **DO NOT** invent new card structures — use the template exactly as provided
- **DO NOT** change CSS class names, spacing values, font sizes, or colors from the template
- **DO** add component-specific CSS classes inside Card 2 for rendering the actual component
- **DO** add `data-name` attributes to every section div
- Each card auto-sizes to fit content — NEVER use fixed heights that clip or overflow
- For existing components, check `components/*/` for previously generated specs as additional reference

---

## Token Naming Convention

Read `../../references/token-naming.md` for the full `--zen-` prefix mapping table. Use these prefixed names everywhere: spec tables, anatomy callouts, code specification, CSS custom properties.

---

## Step 3 — Output to Figma (default: `use_figma`)

Read and follow the shared output procedure in `../../references/figma-output.md`. This step builds spec cards directly in Figma via Plugin API JavaScript — HTML is for local preview only.

### Card structure

Each spec card is a Figma frame with:

- **Width:** 440px fixed, **height:** hug content
- **Layout:** vertical auto-layout
- **Padding:** 24px all sides
- **Item spacing:** 16px
- **Background:** white with border
  - DS2026: `#FFFFFF` (`--zen-background-bg-default`) fill, `#D9DCE1` (`--zen-border-default`) 1px stroke
  - FM: `#FFFFFF` (`--fm-base-0`) fill, `#D9DCE1` (`--fm-base-300`) 1px stroke
- **Corner radius:** 8px

### Card children

Each card contains these element types as needed:

| Element | Structure |
|---------|-----------|
| **Card number + title** | Text node, bold 18px (e.g., "1 — Page header") |
| **Subtitle** | Text node, regular 14px, secondary color (`--zen-text-secondary` / `--fm-base-600`) |
| **Content sections** | Nested vertical auto-layout frames with 8px spacing |
| **Tables** | Horizontal auto-layout frames with text columns (header row bold, data rows regular) |
| **Color swatches** | Small rectangles (24x24) filled with the token hex value, labeled |
| **Code blocks** | Frame with dark background (`#1E1E1E`) + monospace text (Inter Mono or Roboto Mono, 12px) |

### Grid layout

Cards are arranged in a 3-column grid: an outer vertical wrapper contains row frames (horizontal), each holding up to 3 cards.

```js
// Outer wrapper — vertical auto-layout, holds rows
const wrapper = figma.createFrame();
wrapper.name = "Component Spec: [Name]";
wrapper.layoutMode = "VERTICAL";
wrapper.itemSpacing = 24;
wrapper.primaryAxisSizingMode = "AUTO";
wrapper.counterAxisSizingMode = "AUTO";
wrapper.fills = [];

// Each row — horizontal auto-layout, holds up to 3 cards
function createRow(name) {
  const row = figma.createFrame();
  row.name = name;
  row.layoutMode = "HORIZONTAL";
  row.itemSpacing = 24;
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "AUTO";
  row.fills = [];
  wrapper.appendChild(row);
  return row;
}

const row1 = createRow("Row 1"); // Cards 1–3
const row2 = createRow("Row 2"); // Cards 4–6
const row3 = createRow("Row 3"); // Cards 7–9
```

### Execution steps

1. **Build generation metadata frame first** — follow the generation metadata pattern in `../../references/figma-output.md`. Append it as the first child of the wrapper.
2. **Build each card as a separate `use_figma` call** to stay under the 20KB code limit. Each call creates one card frame and appends it to the appropriate row.
3. **Take a screenshot** with `get_screenshot` after all cards are built and show the result to the user.
4. **Ask for adjustments** — "Here is the spec page in Figma. Want me to adjust anything?"

### Figma target

If the user provided a Figma URL, extract `fileKey` and `nodeId`:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId

Only ask for the target if the user hasn't provided one.

## Step 4 — Assembler path (optional)

If the user says "use Assembler", "create it in Figma with Assembler", or "build the component":

1. Generate a `component-spec.json` from the brief:
   - Component name from Card 1 (Page header)
   - Variants from Card 2 (Actual component) and Card 5 (Component API)
   - Internal layout from Card 3 (Anatomy)
   - Text properties from Card 5 text props (mark as `"isProperty": true`)
   - Library: `"fat-marker"` (if FM mode) or `"ds2026"` (if Actian DS mode)
   - Use nested component instances where appropriate (e.g., buttons, icons)

2. Save to `assembler-specs/component-spec.json`

3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**

4. After creation, remind the user to:
   - Review the component in Figma
   - Publish to library if it's a shared component
   - Run `sync-all.js` to update the registry
