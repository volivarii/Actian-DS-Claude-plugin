---
name: component-brief
description: This skill should be used when the user asks to document, brief, or spec a design system component, wants to know the variants/states/tokens for a component, asks for a spec page, or provides a Figma component URL and wants structured documentation.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief with HTML spec page and Figma output. Supports two modes matching the two design system layers.

**When NOT to use:** To *build* a new component → use `create-component`. To *audit* a design → use `design-audit`.

> **Shared rules apply:** Content guidelines (Cards 6-7), accessibility guidelines for Card 8, quality checklist (Universal + Component Brief), generation log format — all per CLAUDE.md.

## Modes

| Signal | Mode |
|--------|------|
| "FM", "Fat Marker", "wireframe", "lo-fi" | **Fat Marker** |
| "DS Kit", "design system", "hi-fi", "production" | **Actian DS** |
| Figma URL from DS Kit files | **Actian DS** |
| Component in FM catalog and no DS Kit signals | **Fat Marker** |
| Default when Figma URL provided | **Actian DS** |
| Ambiguous | Ask: "Fat Marker (lo-fi) or Actian DS (hi-fi)?" |

## Quality tiers

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "draft", "sketch" | Draft | Cards 1-5 only, simplified tables |
| No qualifier | Standard | All cards, full Meta Kit components |
| "production", "final" | Production | Standard + variable binding + golden reference |
| Re-generation after feedback | Production | Auto-upgrade |

## Cards

**Actian DS (9 cards):**

| # | Card | Data model key |
|---|------|----------------|
| 1 | Page header | `card1_header` |
| 2 | Actual component | `card2_component` |
| 3 | Anatomy | `card3_anatomy` |
| 4 | Design tokens | `card4_tokens` |
| 5 | Component API | `card5_api` |
| 6 | Usage guidelines | `card6_usage` |
| 7 | Content guidelines | `card7_content` |
| 8 | Accessibility | `card8_accessibility` |
| 9 | Code specification | `card9_code` |

**Fat Marker (5 cards):**

| # | Card | Data model key |
|---|------|----------------|
| 1 | Page header | `card1_header` |
| 2 | Actual component (Locked) | `card2_component` |
| 3 | Design guidelines | `card3_design_guidelines` |
| 4 | Content guidelines | `card4_content_guidelines` |
| 5 | Anatomy | `card5_anatomy` |

**Card selection:** Default all cards. User can select at input or preview gate: `"push 2,4,5"`, `"skip 6 and 7"`, `"generate card 4"`.

## Execution Model

Autonomous through research and rendering, pauses at Step 2.5 for user review before Figma push. Two pause points: (1) mode ambiguity, (2) Step 2.5 preview gate.

### Speed rules

- No TaskCreate/TodoWrite — just execute
- ONE parallel batch for research — all reads in a single message
- Do NOT read CLAUDE.md — relevant rules are in this file and references
- Do NOT read `plugin.json` until the very end
- If a Figma call fails, skip and proceed
- Do NOT create directories with mkdir — Write tool creates them

## Step 1 — Research (ONE parallel batch)

Issue ALL reads in a **single message** with parallel tool calls:

**Actian DS mode:**
1. `get_design_context` on the Figma node
2. `../../docs/token-reference.md`
3. `../../docs/content-guidelines.md`
4. `../../docs/accessibility-guidelines.md`
5. `../../docs/component-guidelines/<slug>.json`
6. `../../templates/ds-wrapper.html` (CSS framework only)
7. `../../references/component-brief/data-schema.md`
8. `WebSearch` for WAI-ARIA Practices pattern

**Fat Marker mode:**
1. `get_design_context` on the Figma node
2. `../../docs/fm-components.md`
3. `../../docs/content-guidelines.md`
4. `../../docs/component-guidelines/<slug>.json`
5. `../../templates/fm-wrapper.html` (CSS framework only)
6. `../../references/component-brief/data-schema.md`

No additional research rounds. Proceed to Step 1.5.

## Step 1.5 — Generate data model (MANDATORY)

Structure ALL research into `[component]-brief-data.json` following `../../references/component-brief/data-schema.md`.

**This is the ONLY step where the AI makes content decisions.** After this, both renderers are mechanical.

1. Read the schema contract
2. Populate every card key from research data
3. Ensure completeness:
   - `card2_component.variantMatrix` — ALL variant rows (never truncate)
   - `card4_tokens.colorTokens` — ALL states
   - `card7_content.rules` — ALL content rules from Figma page
   - `card8_accessibility.requirements` — exactly 6 items (2x3 grid)
   - `card9_code.tokens` — fully tokenized with syntax types
4. Write to: `{project_working_directory}/components/[name]/[name]-brief-data.json`

The data model is persisted — used by feedback loops and incremental re-rendering.

## Step 2 — Render HTML (MECHANICAL)

**Do NOT generate HTML by interpreting research.** Read `brief-data.json` and build cards from the renderer reference.

1. Read `[name]-brief-data.json`
2. Read the appropriate renderer:
   - DS: `../../references/component-brief/html-renderer.md`
   - FM: `../../references/component-brief/html-renderer-fm.md`
3. Read the wrapper template (`../../templates/ds-wrapper.html` or `../../templates/fm-wrapper.html`)
4. Build each card's HTML from the data model using the card builders in the renderer
5. The ONLY AI-interpreted part: Card 2's component-specific CSS + `componentHtml()` function
6. Replace `{{GENERATION_CARD}}`, `{{CARDS}}`, `{{PAGE_TITLE}}` in the wrapper
7. Include annotation layer inline before `</body>` — see `../../references/annotation-reference.md`
8. Write to: `{project_working_directory}/components/[name]/[name]-spec.html`

Token naming: read `../../references/token-naming.md` for the `--zen-*` prefix mapping.

## Step 2.5 — Preview gate (BLOCKING)

1. Start server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
2. Present preview URL and options:
   - **"push"** / **"push 2,4,5"** — send to Figma
   - **"playground"** — generate interactive playground first
   - **"apply annotations"** — read browser annotations, fix and re-preview
   - **feedback** — fix and re-preview
3. **Wait for response.** Do not proceed.
4. On feedback: edit `brief-data.json` → re-run Step 2 → re-serve (ensures Figma gets same changes)
5. On "playground": see `../../references/component-brief/playground.md`

## Step 3 — Render Figma (MECHANICAL)

**Do NOT write freehand use_figma code.** Assemble micro-task checklists from data model + call templates.

1. Read `[name]-brief-data.json`
2. Read `../../references/component-brief/figma-renderer.md` for the 11 call templates
3. For each call:
   a. Read the **static call template** (sections + Meta Kit components)
   b. **Merge with dynamic data** — expand `${data}` into explicit `□` lines
   c. Assemble as `/* */` comment block in `use_figma` code
   d. Set description: `"Complete ALL micro-tasks. Every □ item is mandatory."`
   e. AI writes implementation code below the checklist
4. After all calls: parity validation (data model counts vs Figma frame counts)

**What the AI does NOT do:** decide which cards, how many rows, whether to include swatches/badges.
**What the AI DOES do:** translate each `□` to current Plugin API code using Figma MCP skills.

See also `../../references/component-brief/figma-rules.md` for page targeting, token binding, known pitfalls.

## Step 4 — Parity check

Per `../../references/parity-check.md`:
1. `get_screenshot` of each pushed card
2. Present screenshots alongside HTML preview URL
3. Check element count, clipping, empty text
4. Report findings, fix P0s
5. Write `.last-push.json` manifest

Ask: "Review in Figma and reply: **'looks good'** or **'fix [specific issue]'**."

## Additional Resources

### Reference Files

Detailed content in `references/component-brief/`:
- **`data-schema.md`** — JSON schema for all 9 DS + 5 FM cards
- **`html-renderer.md`** — DS card HTML builders from data model
- **`html-renderer-fm.md`** — FM card HTML builders from data model
- **`figma-renderer.md`** — 11 micro-task call templates for Figma output
- **`figma-rules.md`** — Figma-specific rules: page targeting, Meta Kit components, token binding, known pitfalls
- **`playground.md`** — Interactive state playground generation (opt-in)
