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

## Step 1 — Research (ONE parallel batch, minimal reads)

Issue ALL reads in a **single message** with parallel tool calls. Do NOT read large files that aren't needed until later steps.

**Parse the URL first:** Extract `fileKey` and `nodeId` (convert dashes to colons) per `../../references/figma-output.md` § "Figma URL Parsing".

**Parallel batch 1 — discovery + local reads (ONE message):**
1. `get_metadata(fileKey, nodeId)` — always start here, never `get_design_context` first. Reveals whether the node is a page, component set, frame, etc.
2. `../../docs/component-guidelines/<slug>.json` (if it exists — content/design rules)
3. `../../references/component-brief/data-schema.md` (required — JSON schema contract)

**Then — targeted design context:**
4. From the metadata, find the component set node ID (look for `<component_set>` in the XML). If the URL pointed to a page (`<canvas>`), the component set is a child — use its ID.
5. `get_design_context(fileKey, componentSetNodeId)` — call with the discovered component set node ID, NOT the page ID.

If `get_design_context` still fails, fall back to `get_screenshot(fileKey, nodeId)` + metadata for visual reference.

**Do NOT read these during research:**
- `token-reference.md` — not needed; token names come from `get_design_context` and component-guidelines
- `content-guidelines.md` — not needed; card7 rules come from component-guidelines JSON
- `accessibility-guidelines.md` — not needed; card8 requirements are generated from ARIA patterns knowledge
- Wrapper templates — read in Step 2 only (renderer step)
- HTML renderer reference — not needed (client-side renderer handles it)
- `WebSearch` for ARIA — skip; the AI already knows ARIA patterns for common components. Only search if the component is unusual (e.g., custom chart, non-standard widget)

**Target: 3 parallel reads + 1 targeted read → proceed to Step 1.5 immediately.** Total research should take under 30 seconds.

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
5. **Dispatch `brief-data-validator` agent** in background — validates completeness, catches truncated arrays, hardcoded values, missing fields. Do not wait for result — proceed to Step 2. If the validator finds P0 issues, fix before presenting at the gate.

The data model is persisted — used by feedback loops and incremental re-rendering.

## Step 2 — Render HTML (CLIENT-SIDE RENDERER)

**Do NOT generate card HTML.** The browser renders cards from the data model. You write only the component-specific parts.

Read these in ONE parallel batch (first time only):
1. `[name]-brief-data.json` (already in context from Step 1.5)
2. The wrapper template: `../../templates/ds-wrapper.html` or `../../templates/fm-wrapper.html`
3. `../../scripts/html-renderers/brief-renderer.js`
4. The annotation layer files: `../../templates/annotation-layer.css`, `../../templates/annotation-layer.js`, `../../templates/annotation-layer-markup.html`

Then assemble the HTML file:
1. Start with the wrapper template
2. Replace `{{PAGE_TITLE}}` with `${card1_header.name} — Actian DS Kit Component Brief`
3. Before `</body>`, embed these blocks in order:
   a. `<script type="application/json" id="spec-data">` — paste the full brief-data.json
   b. `<style id="component-css">` — write component-specific CSS for Cards 2-3 (the only AI-interpreted CSS)
   c. `<script id="component-html">` — write the `window.componentHtml = function(variantName, theme) { ... }` function (the only AI-interpreted JS)
   d. `<script>` — paste brief-renderer.js contents (the fixed renderer)
   e. Annotation layer (CSS as `<style>`, JS as `<script>`, markup as-is)
4. Write to: `{project_working_directory}/components/[name]/[name]-spec.html`

**What the AI writes:**
- `componentHtml(variantName, theme)` — returns HTML for a specific variant/state combo (~50-100 lines)
- Component-specific CSS — styles for the component preview (~50-80 lines)

**What the AI does NOT write:**
- Card 1 HTML (page header) — renderer builds from `card1_header`
- Cards 4-9 HTML (tokens, API, usage, content, a11y, code) — renderer builds from data model
- Generation card HTML — renderer builds from `meta`
- Table markup, swatch dots, badges, do/dont cards — all handled by renderer helpers

Token naming: `--zen-*` prefix. Full reference at `../../references/token-naming.md` — read only if needed.

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

## Step 3 — Render Figma (JSON Spec Interpreter)

**Do NOT write freehand use_figma code.** Transform the data model into a figma-spec.json and run it through the fixed interpreter.

1. Read `[name]-brief-data.json` (already in context from Step 1.5)
2. Read `../../references/component-brief/figma-spec-builder.md` — data model → spec mapping
3. Read `../../references/figma-spec-schema.md` — JSON spec format reference
4. Transform: build `figma-spec.json` from the data model following the builder reference
   - All component keys come from the builder reference — never guess
   - All node types come from the schema reference — never write raw Plugin API
   - Dynamic data (variant rows, token rows, props) → expand to spec tree nodes — NEVER summarize as text
   - **Cards 2 and 3 MUST use `LOCAL_INSTANCE`** nodes for real component instances. Declare the target component in `spec.localComponents` using its node ID from `meta.componentKey` or get_metadata discovery.
5. Read `../../scripts/figma-interpreter.js` (fixed ~26KB)
6. Assemble `use_figma` call:
   ```js
   // use_figma code parameter:
   ${interpreterCode}
   const spec = ${JSON.stringify(figmaSpec)};
   return await buildFromSpec(spec);
   ```
7. Call splitting:
   - Call 1: Generation Log + Cards 1-5 (spec tree = first 6 nodes)
   - Call 2: Cards 6-9 (spec tree = last 4 nodes, same imports/variables/styles, `meta.appendToId` = wrapper ID from Call 1)
8. After both calls: parity validation (data model counts vs Figma frame counts)

**What the AI does:** Transform data model → figma-spec.json (pure data, no code)
**What the AI does NOT do:** Write Plugin API code, handle Figma API quirks, import components manually

See also `../../references/component-brief/figma-rules.md` for page targeting, token binding, known pitfalls.

## Step 4 — Parity check

Per `../../references/parity-check.md`:
1. `get_screenshot` of each pushed card
2. **Dispatch `parity-analyzer` agent** with the screenshots + expected card content from the data model. The agent checks for clipping, empty text, missing children, layout collapse.
3. Present screenshots alongside HTML preview URL
4. Merge parity-analyzer findings with your own visual check
5. Report findings, fix P0s
6. Write `.last-push.json` manifest

Ask: "Review in Figma and reply: **'looks good'** or **'fix [specific issue]'**."

## Additional Resources

### Reference Files

Detailed content in `references/component-brief/`:
- **`data-schema.md`** — JSON schema for all 9 DS + 5 FM cards
- **`figma-spec-builder.md`** — Data model → figma-spec.json mapping (primary Figma output path)
- **`html-renderer-legacy.md`** — Legacy server-side card builders (preserved for reference)
- **`html-renderer-fm-legacy.md`** — Legacy FM card builders (preserved for reference)
- **`figma-renderer-legacy.md`** — Legacy micro-task architecture (preserved for reference)
- **`figma-rules.md`** — Figma-specific rules: page targeting, Meta Kit components, token binding, known pitfalls
- **`playground.md`** — Interactive state playground generation (opt-in)

Shared references:
- **`../../scripts/html-renderers/brief-renderer.js`** — Client-side card renderer (~400 lines, embedded in HTML)
- **`../../references/figma-spec-schema.md`** — JSON spec format for the Figma interpreter
- **`../../scripts/figma-interpreter.js`** — Fixed Figma interpreter (~30KB, included in use_figma calls)
