---
name: component-brief
description: Draft a structured component brief (9-card Actian DS or 5-card Fat Marker) and generate an HTML spec page. Use when user asks to document, brief, or spec a component.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief and generate an HTML spec page. Supports two modes matching the two design system layers.

> **Content guidelines:** All UI copy in briefs must follow `docs/content-guidelines.md`. Read it before writing Cards 6 (Usage guidelines) and 7 (Content guidelines).
> **Accessibility guidelines:** Card 8 (Accessibility) must follow `docs/accessibility-guidelines.md` — use the component-specific checklist matching the component type (P0/P1/P2), include WCAG criteria references, contrast ratio table, and keyboard interaction spec. All WCAG 2.1 AA.
> **Quality & hygiene:** Before marking any output complete, validate against the Quality & Hygiene Checklist in CLAUDE.md — all 10 items must pass for Figma-bound deliverables.
> **Generation log:** Every generated file MUST include a `<!-- GENERATION LOG -->` comment block with: prompt (user's exact input, max 200 chars), generated-at (ISO 8601), duration (prompt to file save), skill name, model, and plugin-version. See CLAUDE.md for the exact format.

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
- **Do NOT read CLAUDE.md** — the relevant token mappings and rules are already in this skill file and in `docs/design-system.md`.
- **Do NOT read `plugin.json`** — the plugin version for the generation log is: check `.claude-plugin/plugin.json` only once, at the very end, right before writing the file.
- **If a Figma call fails, skip it and proceed.** Do not retry or try alternative approaches — use the screenshot and existing docs instead.
- **Do NOT create directories with mkdir.** Use the Write tool directly — it creates parent directories automatically.

## Step 1 — Research (ONE parallel batch)

Issue ALL of these reads in a **single message** with parallel tool calls. Do not wait for results between reads.

**For Actian DS mode (9 cards), read these files in parallel:**
1. `get_screenshot` on the provided Figma node (for visual reference)
2. `docs/design-system.md` (token values per theme)
3. `docs/content-guidelines.md` (for Cards 6-7)
4. `docs/accessibility-guidelines.md` (for Card 8)
5. All 9 card templates: `templates/ds-card-1-page-header.html` through `templates/ds-card-9-code-specification.html`
6. `templates/ds-wrapper.html`

**For Fat Marker mode (5 cards), read these files in parallel:**
1. `get_screenshot` on the provided Figma node
2. `docs/fm-component-catalog.md` (component variants)
3. `docs/content-guidelines.md`
4. All 5 card templates: `templates/fm-card-1-page-header.html` through `templates/fm-card-5-anatomy.html`
5. `templates/fm-wrapper.html`

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

When generating a subset, only include the selected cards in the HTML `brief-row`. The CSS framework and capture script are always included regardless of selection.

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

All design tokens displayed in briefs MUST use the `--zen-` prefix following this pattern:

```
--zen-<type>-<name>

Types:
  color     → --zen-color-base-brand, --zen-color-text-primary, --zen-color-interactive-hovered-secondary
  spacing   → --zen-spacing-xs, --zen-spacing-md
  radius    → --zen-radius-default, --zen-radius-full
  shadow    → --zen-shadow-xs, --zen-shadow-md
  size      → --zen-size-md, --zen-size-xl
  width     → --zen-width-default, --zen-width-focus
  font      → --zen-font-body-standard, --zen-font-label-standard
```

Map from raw Figma tokens to `--zen-` prefixed names:
- `theme-primary` → `--zen-color-theme-primary`
- `interactive-hovered-secondary` → `--zen-color-interactive-hovered-secondary`
- `interactive-focused-stroke-default` → `--zen-color-interactive-focused-stroke-default`
- `spacing-xs` → `--zen-spacing-xs`
- `radius-default` → `--zen-radius-default`
- `width-focus` → `--zen-width-focus`
- `shadow-xs` → `--zen-shadow-xs`
- `size-xl` → `--zen-size-xl`
- `body-standard` → `--zen-font-body-standard`
- `label-standard` → `--zen-font-label-standard`

Use these prefixed names everywhere: spec tables, anatomy callouts, code specification, CSS custom properties.

---

## Step 3 — Capture to Figma

If the user wants to push the spec to Figma, capture it automatically. Do NOT give up or suggest manual workarounds.

### Figma target

If the user already provided a Figma URL, extract `fileKey` and `nodeId` from it:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId

Only ask for the target if the user hasn't provided one.

### Capture flow

1. **Serve the HTML file locally:**
   ```bash
   BASE_URL=$(scripts/ensure-server.sh . 8765)
   ```

2. **Call `mcp__plugin_figma_figma__generate_figma_design`** (or `mcp__claude_ai_Figma__generate_figma_design` — whichever is available) with:
   - `outputMode: "existingFile"`
   - `fileKey` from the user's target file
   - `nodeId` from the user's target page
   - The localhost URL for the served HTML spec
   - If creating a new file: `outputMode: "newFile"` and `fileName`

3. **Poll for completion** with `captureId` every 5 seconds (up to 10 times) until status is `completed`

4. **Share the Figma link** with the user

### CRITICAL rules

- **NEVER delegate Figma capture to a subagent.** Subagents do NOT have access to MCP tools. Call `generate_figma_design` directly in the main conversation.
- **ALWAYS** call `generate_figma_design` — it IS available in both Claude Code and Claude Desktop. The tool name is `mcp__plugin_figma_figma__generate_figma_design` or `mcp__claude_ai_Figma__generate_figma_design`.
- **NEVER fall back to `use_figma`** to build cards programmatically. The capture tool renders the HTML as-is with full CSS fidelity. Building cards with the Plugin API produces inferior results.
- **NEVER** give up and suggest manual workarounds (browser, copy/paste, extensions)
- **NEVER** tell the user to open the HTML manually in a browser
- **NEVER** suggest installing browser extensions or Figma plugins for capture
- **NEVER** capture to the first page of a file without a nodeId
- **NEVER** use the `claude -p` CLI workaround — call the MCP tool directly
- Each `captureId` is single-use — one capture per page

## Step 4 — Create in Figma (optional)

If the user says "create it in Figma", "build the component", or "make it real":

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
