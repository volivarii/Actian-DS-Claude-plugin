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

**Playground detection:** If the user's prompt includes "playground", "interactive", or "test states", generate the playground automatically after Step 2 (no need to offer at the gate).

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
6. `templates/ds-wrapper.html` (CSS framework only — card templates are NOT needed, the renderer builds cards from the data model)
7. `../../references/component-brief/data-schema.md` (data model schema — read this to know the structure for Step 1.5)
8. `WebSearch` for WAI-ARIA Practices pattern for the component type (e.g., "WAI-ARIA dialog pattern", "WAI-ARIA tabs pattern"). Use the first authoritative result (w3.org) to populate the ARIA table in Card 8.

**For Fat Marker mode (5 cards), read these files in parallel:**
1. `get_design_context` on the provided Figma node (visual reference + component key extraction)
2. `../../docs/fm-components.md` (component variants)
3. `../../docs/content-guidelines.md`
4. `../../docs/component-guidelines/<slug>.json` — per-component guidelines (if available)
5. `templates/fm-wrapper.html` (CSS framework only — card templates are NOT needed, the renderer builds cards from the data model)
6. `../../references/component-brief/data-schema.md` (data model schema — read the FM section for Step 1.5)

That's it. No additional research rounds. Proceed immediately to generation.

## Step 1.5 — Generate data model (MANDATORY)

After research completes, structure ALL findings into `[component]-brief-data.json` following the schema in `../../references/component-brief/data-schema.md`.

**This is the ONLY step where the AI makes content decisions.** After this step, both renderers are mechanical.

1. Read `../../references/component-brief/data-schema.md` for the schema contract
2. Populate every card key (`card1_header` through `card9_code`) from research data
3. Ensure:
   - `card2_component.variantMatrix` includes ALL variant rows from the Figma component (not a subset)
   - `card4_tokens.colorTokens` includes ALL states (not just Default + Focused)
   - `card7_content.rules` includes ALL content rules from the component's Figma page
   - `card8_accessibility.requirements` has exactly 6 items for the 2×3 grid
   - `card9_code.tokens` is fully tokenized with syntax types
4. Write to: `{project_working_directory}/components/[name]/[name]-brief-data.json`

**The data model is persisted.** It can be re-used by `/refine`, by feedback loops at the preview gate, and for incremental re-rendering.

## Step 2 — Render HTML from data model (MECHANICAL)

**Do NOT generate HTML by interpreting research directly.** Read `brief-data.json` and apply the row templates from `../../references/component-brief/html-renderer.md`.

1. Read `[name]-brief-data.json`
2. Read `../../references/component-brief/html-renderer.md` for complete card HTML builders
3. Read `templates/ds-wrapper.html` (CSS framework only — no card template files needed)
4. For each card: build HTML from the data model using the card builders in the renderer reference
5. The ONLY AI-interpreted part is Card 2's component-specific CSS and `componentHtml()` function — this requires rendering the actual component in HTML, which varies per component
6. Replace `{{GENERATION_CARD}}`, `{{CARDS}}`, and `{{PAGE_TITLE}}` in the wrapper
7. Write to: `{project_working_directory}/components/[name]/[name]-spec.html`

**MANDATORY: Include the GENERATION LOG** comment block in `<head>` as specified in CLAUDE.md. Read `.claude-plugin/plugin.json` for the version right before writing the file.

### Card selection (parsed from input, never prompted)

Default is **All cards**.

**Actian DS cards** (built from data model — no template files):

| # | Card | `data-name` | Data model key |
|---|------|-------------|----------------|
| 1 | Page header | `"Page header"` | `card1_header` |
| 2 | Actual component | `"Actual component"` | `card2_component` |
| 3 | Anatomy | `"Anatomy"` | `card3_anatomy` |
| 4 | Design tokens | `"Design tokens"` | `card4_tokens` |
| 5 | Component API | `"Component API"` | `card5_api` |
| 6 | Usage guidelines | `"Usage guidelines"` | `card6_usage` |
| 7 | Content guidelines | `"Content guidelines"` | `card7_content` |
| 8 | Accessibility | `"Accessibility"` | `card8_accessibility` |
| 9 | Code specification | `"Code specification"` | `card9_code` |

**Fat Marker cards** (built from data model — no template files):

| # | Card | `data-name` | Data model key |
|---|------|-------------|----------------|
| 1 | Page header | `"Page header"` | `card1_header` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `card2_component` |
| 3 | Design guidelines | `"Design guidelines"` | `card3_design_guidelines` |
| 4 | Content guidelines | `"Content guidelines"` | `card4_content_guidelines` |
| 5 | Anatomy | `"Anatomy"` | `card5_anatomy` |

**How the user selects:**

| Input | Result |
|-------|--------|
| "generate" or "all" or no selection | All cards (default) |
| "generate card 4" or "Design tokens" | Only that one card |
| "generate 2, 4, 9" or "Component, Tokens, Code" | Only those cards |
| "generate 1–5" or "first 5" | Range of cards |
| "skip 6 and 7" or "all except Content and Usage" | All minus excluded |

When generating a subset, only include the selected cards in the HTML `brief-row`. The CSS framework is always included regardless of selection.

### Card 8 — Accessibility (structured format)

Card 8 uses a structured ARIA specification table instead of bullet points. Generate the table from WAI-ARIA Practices research:

| Source | Maps to |
|--------|---------|
| WAI-ARIA "Keyboard Interaction" section | `keyboard` column + Keyboard Interaction sub-section |
| WAI-ARIA "WAI-ARIA Roles, States, and Properties" section | `role` and `label` columns |
| Component anatomy (Card 3) interactive elements | `element` column (one row per interactive element) |
| Logical tab order through elements | `focus-order` column (1, 2, 3...) |
| Role + label + state combined | `announcement` column |

**ARIA table columns:** Element, Role, Label, Focus Order, Keyboard Interaction, Screen Reader Announcement

**Sub-sections in Card 8:**
1. **ARIA (Web)** — always present, structured table
2. **Keyboard Interaction** — summary of key bindings
3. **Contrast Requirements** — foreground/background pairs with ratios
4. **VoiceOver (iOS)** — placeholder: "Needs manual review — add platform-specific behaviors"
5. **TalkBack (Android)** — placeholder: "Needs manual review — add platform-specific behaviors"

**Figma output:** When pushing Card 8 to Figma, use clone-and-fill with the `a11y-spec-row` template from `meta-kit-registry.json` (one clone per table row). Stack rows in a vertical auto-layout frame. Add section headers via the `section-header` template.

**Fallback:** If WAI-ARIA Practices has no pattern for this component, generate the ARIA section from general WCAG rules and mark with: "Derived from general WCAG rules — verify against platform testing."

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
- **DO** include the annotation layer before `</body>`: add `<script src="/_plugin/annotation-loader.js" defer></script>`
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
   > - **"playground"** — generate interactive state playground first
   > - **"apply annotations"** — paste annotation JSON from the browser, I'll fix and re-preview
   > - **feedback** — I'll fix the HTML and re-preview"

3. **Wait for the user's response.** Do not proceed.

4. On feedback: fix the HTML, re-save, re-serve, present the updated preview URL again. Repeat until approved.

**Feedback modifies the data model, not the HTML directly.** When the user requests changes:
1. Edit `brief-data.json` (add/remove/modify the relevant card key)
2. Re-run Step 2 (HTML renderer) from the modified data model
3. Re-serve and re-present the preview

This ensures the Figma output (Step 3) will include the same changes automatically.

5. On approval: proceed to Step 3 with only the approved cards (default: all). If the user requests cards that were not in the HTML (e.g., "push 2,4,5" when only 2,4 were generated), regenerate the HTML with the expanded card set first, re-serve, then proceed to Figma.

This gate costs zero `use_figma` calls. HTML iteration is fast and free — Figma output is expensive and hard to undo.

---

## Step 2.6 — Generate state playground (opt-in)

**Trigger:** The user says "playground" at the preview gate, or included "playground"/"interactive"/"test states" in their original prompt.

**Skip if:** The user said "quick"/"draft", or went straight to "push".

1. Read `../../references/prototype-reference.md` § "Component playgrounds" for generation rules
2. Read `../../templates/component-playground-wrapper.html` for the base template
3. Extract variant axes from the `get_design_context` data collected in Step 1:
   - Each Figma property (State, Selected, Size, Type, etc.) becomes a control group
   - Booleans → toggle button, Enums → segmented bar
4. For each axis combination, render the component variant HTML from Card 2 of the static spec
5. Populate the token readout from the component token mapping in CLAUDE.md
6. Save to: `{project_working_directory}/components/[component-name]/[component-name]-playground.html`
7. Re-present the gate with both URLs:
   > "Static: `http://localhost:8765/components/[name]/[name]-spec.html`
   > Playground: `http://localhost:8765/components/[name]/[name]-playground.html`
   >
   > Toggle states, variants, and themes in the playground, then:
   > - **"push"** — send to Figma
   > - **"push 2,4,5"** — send selected cards
   > - **feedback** — I'll fix and re-preview"

---

## Step 3 — Render Figma from data model (MECHANICAL)

**Do NOT write freehand use_figma code.** Assemble micro-task checklists from the data model and call templates, then pass them to `use_figma`.

### Checklist assembly process (10 calls)

1. Read `[name]-brief-data.json` (same file used by HTML renderer)
2. Read `../../references/component-brief/figma-renderer.md` for the 10 call templates
3. For each call (1-10):
   a. Read the **static call template** (defines sections and Meta Kit components)
   b. **Merge with dynamic data** from the data model — expand `${data}` placeholders into explicit `□` lines with actual values, row counts, hex colors, component keys
   c. Assemble the merged checklist as a `/* */` comment block
   d. Set `use_figma` `description` to: `"Complete ALL micro-tasks in the checklist comment. Every □ item is mandatory. Do NOT skip any."`
   e. Set `use_figma` `code` parameter to: the checklist comment + the AI writes implementation code below it using current Figma MCP skills
4. After all 10 calls: run parity validation (counts from data model vs Figma frame counts)

### What the AI does NOT do:
- Decide which cards to build (the call map decides)
- Decide how many table rows (the data model decides)
- Decide whether to include swatches (the checklist says "Color Swatch #hex" — mandatory)
- Decide whether to use Meta Kit components (the checklist names them with keys)

### What the AI DOES do:
- Translate each `□` line to current Plugin API code
- Use loaded Figma MCP skills (`figma-use`, `figma-generate-library`) for correct API patterns
- Handle auto-layout, font loading, sizing — the HOW, not the WHAT

See `../../references/component-brief/figma-renderer.md` for all 10 call templates and `../../skills/component-brief/component-brief-figma.md` for additional Figma-specific rules (page targeting, token binding, known pitfalls).

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
