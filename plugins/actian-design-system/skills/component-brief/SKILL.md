---
name: component-brief
description: Use when the user asks to document, brief, or spec a design system component, wants to know the variants/states/tokens for a component, asks for a spec page, or provides a Figma component URL and wants structured documentation.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief and generate an HTML spec page. Supports two modes matching the two design system layers.

**When NOT to use:** If the user wants to *build* a new component in Figma → use `create-component`. If the user wants to *audit* a design → use `design-audit`.

> **Shared rules apply:** Content guidelines (Cards 6-7), accessibility guidelines for Card 8 (component-specific checklist, WCAG 2.1 AA), quality & hygiene checklist (Universal + Component Brief sections), and generation log format — all per CLAUDE.md.

> **Mode: Spec.** Be thorough — document every variant, state, and edge case. Structure everything with consistent headings, tables, and numbered lists. Define before building; every decision needs a rationale. Cross-reference tokens, components, and guidelines by name. Include what's out of scope explicitly.

### Quality tier detection

| Signal in user prompt | Tier | Effect |
|----------------------|------|--------|
| "quick", "rough", "draft", "sketch" | Draft | Cards 1-5 only, simplified tables (5 rows max), no variant matrices |
| No qualifier (default) | Standard | All cards, full Meta Kit components, proper token tables |
| "production", "final", "publish-ready" | Production | Standard + variable binding on all scaffolding + golden reference comparison |
| Re-generation after feedback | Production | Auto-upgrade to production tier |

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

## Execution Model — Autonomous with preview gate

**This skill runs autonomously through research and HTML generation (Steps 1–2), then pauses at Step 2.5 for user review before pushing to Figma (Step 3).** Two pause points: (1) before Step 1 if the mode (FM vs DS) is genuinely ambiguous AND no signals resolve it, and (2) Step 2.5 HTML preview gate. Between gates, do not pause or ask questions.

Parse card selection from the user's initial input. If no selection is specified, default to **all cards**. Do not ask "which cards?" — just generate them. The user can also select cards at the preview gate (e.g., "push 2,4,5").

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
1. `get_design_context` on the provided Figma node (for visual reference AND to extract the component set key for importing real instances in Step 3)
2. `../../docs/token-reference.md` (token values per theme)
3. `../../docs/content-guidelines.md` (for Cards 6-7)
4. `../../docs/accessibility-guidelines.md` (for Card 8)
5. `../../docs/component-guidelines/<slug>.json` — per-component guidelines from Figma (content guidelines, design guidelines, variants, examples). Use the component slug (e.g., `button.json`, `date-picker.json`). If the file doesn't exist, skip it.
6. All 9 card templates: `templates/ds-card-1-page-header.html` through `templates/ds-card-9-code-specification.html`
7. `templates/ds-wrapper.html`

**For Fat Marker mode (5 cards), read these files in parallel:**
1. `get_design_context` on the provided Figma node (visual reference + component key extraction)
2. `../../docs/fm-components.md` (component variants)
3. `../../docs/content-guidelines.md`
4. `../../docs/component-guidelines/<slug>.json` — per-component guidelines (if available)
5. All 5 card templates: `templates/fm-card-1-page-header.html` through `templates/fm-card-5-anatomy.html`
6. `templates/fm-wrapper.html`

That's it. No additional research rounds. Proceed immediately to generation.

## Step 2 — Generate HTML

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

5. **Save to:** `{project_working_directory}/components/[component-name]/[component-name]-spec.html` — always use an absolute path based on the user's project directory, never relative to the plugin.

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

## Step 2.5 — Preview gate (BLOCKING)

After generating the HTML, serve it and present the preview URL. **Do NOT proceed to Figma output until the user approves.**

1. Start local server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
2. Present:
   > "Preview: `http://localhost:8765/components/[name]/[name]-spec.html`
   >
   > Review the cards and reply:
   > - **"push"** — send all cards to Figma
   > - **"push 2,4,5"** — send only those cards to Figma
   > - **feedback** — I'll fix the HTML and re-preview"

3. **Wait for the user's response.** Do not proceed.

4. On feedback: fix the HTML, re-save, re-serve, present the updated preview URL again. Repeat until approved.

5. On approval: proceed to Step 3 with only the approved cards (default: all). If the user requests cards that were not in the HTML (e.g., "push 2,4,5" when only 2,4 were generated), regenerate the HTML with the expanded card set first, re-serve, then proceed to Figma.

This gate costs zero `use_figma` calls. HTML iteration is fast and free — Figma output is expensive and hard to undo.

---

## Step 3 — Output to Figma (default: `use_figma`)

Read `component-brief-figma.md` for the complete Figma output reference: card structure, per-card content requirements, element types, known pitfalls, and execution steps. Also follow `../../references/figma-output.md` for shared patterns.

**Key rules (read the reference for details):**
- **P0: Real component instances** — use the component from the user's URL, never text placeholders
- **P0: Local vs library components** — if the component is in the same file as the output, use `figma.getNodeByIdAsync(nodeId)` to get it directly. Only use `importComponentSetByKeyAsync()` for components from external libraries. See `component-brief-figma.md` for detection pattern.
- **Card shells** — import `Meta / Chrome / Brief Card`, detach, rename to card title
- **Parity check** — Figma output must match HTML exactly; omissions are P0 bugs
- **One `use_figma` call per card** to stay under 20KB limit

If the user provided a Figma URL, extract `fileKey` and `nodeId`. Only ask for target if not provided.

---

## Step 4 — Parity check

After all `use_figma` calls complete, run the post-push parity check procedure in `../../references/parity-check.md`:

1. `get_screenshot` of each pushed card
2. Present screenshots alongside the HTML preview URL
3. Run automated checklist (element count, clipping, empty text)
4. Report findings and offer to fix P0 issues
5. Write `.last-push.json` manifest to `{project_working_directory}/components/[component-name]/.last-push.json`

After parity check completes, ask: "Review in Figma and reply: **'looks good'**, **'fix [specific issue]'**, or run `/refine` later for corrections."
