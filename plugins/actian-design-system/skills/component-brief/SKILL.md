---
name: component-brief
description: This skill should be used when the user asks to document, brief, or spec a design system component, wants to know the variants/states/tokens for a component, asks for a spec page, or provides a Figma component URL and wants structured documentation.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

<!-- This skill can be invoked directly (/component-brief) or via the DS companion. -->

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

**Card selection:** Default all cards. User can select: `"push 2,4,5"`, `"skip 6 and 7"`, `"generate card 4"`.

**Keywords:** `"preview"` → HTML preview with annotations before push. `"playground"` → interactive component explorer.

## Execution Model

Autonomous through research, data model generation, and Figma push. HTML preview is opt-in (user says "preview"). Default path: research → data model → push to Figma. Two pause points: (1) mode ambiguity, (2) push confirmation if user says "preview".

### DO NOT — hard rules

- **DO NOT dump JSON, code, or file contents in chat.** Write files silently. The user sees tool call summaries.
- **DO NOT pause between steps.** Research → data model → Figma is one uninterrupted sequence after the mode ambiguity gate.
- **DO NOT use TaskCreate or TodoWrite.** Just execute.
- **DO NOT read CLAUDE.md repeatedly.** Read it once or not at all.
- **DO NOT read `plugin.json` until the very end.**

### Speed rules

- ONE parallel batch for research — all reads in a single message
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

## Step 2 — Push to Figma (DETERMINISTIC SCRIPT)

**Default path: data model → brief-to-figma.js → Figma. No HTML step.**

## Step 2 (preview) — Render HTML (opt-in)

**Trigger:** User says "preview" or "playground" in the prompt or at any gate.

If triggered, generate the HTML preview BEFORE pushing:

1. Read the wrapper template, brief-renderer.js, and annotation layer files
2. Assemble the HTML file with embedded brief-data.json + component-specific CSS/JS
3. Write to: `{project_working_directory}/components/[name]/[name]-spec.html`
4. Start server and present preview URL with options:
   - **"push"** / **"push 2,4,5"** — send to Figma
   - **"playground"** — generate interactive playground
   - **"apply annotations"** — click Annotate in preview, then say "apply annotations"
   - **feedback** — fix and re-preview
5. On feedback: edit `brief-data.json` → regenerate HTML → re-serve
6. On "push": proceed to Step 2 (push) above

Token naming: `--zen-*` prefix. Full reference at `../../references/token-naming.md` — read only if needed.

## Step 3 — Render Figma (DETERMINISTIC SCRIPT)

**Do NOT generate the figma-spec manually.** A fixed Node.js script transforms brief-data.json into ready-to-run Figma Plugin API code. The AI only runs the script and passes its output to `use_figma`.

1. Run the code generator script:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/brief-to-figma.js \
     {project_working_directory}/components/[name]/[name]-brief-data.json \
     --target-node-id [nodeId]
   ```
   The script outputs a JSON array of `{ callIndex, code, description }` objects (auto-split to keep each call under ~45KB). It prints the call breakdown to stderr.

2. For each item in the array:
   - Call 1 has `meta.targetNodeId` embedded in the code — creates the wrapper frame, returns `{ wrapperId }`
   - Calls 2+ use `__WRAPPER_ID__` placeholder in the code — replace with the actual `wrapperId` returned from Call 1
   - Pass `code` directly to `use_figma`:
     ```js
     // Call 1 — pass code as-is
     return await (async () => { ${item.code} })();

     // Calls 2+ — substitute the wrapper ID first
     const code = item.code.replace(/__WRAPPER_ID__/g, wrapperId);
     return await (async () => { ${code} })();
     ```
   - Store the `wrapperId` from Call 1's return value

3. After all calls: parity validation (data model counts vs Figma frame counts)

**What the AI does:** Run the script, pass each `code` string to `use_figma`, replace `__WRAPPER_ID__`, store the wrapper ID
**What the AI does NOT do:** Generate node trees, read spec builder references, compute textRanges, decide call splitting

**No reference files needed at runtime.** The script encodes all card-by-card mapping logic. The spec builder reference (`../../references/component-brief/figma-spec-builder.md`) is documentation for maintaining the script — not read by the AI.

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
- **`../../scripts/brief-to-figma.js`** — Deterministic code generator: brief-data.json → Figma Plugin API JS array (used in Step 3)
- **`../../scripts/figma-codegen.js`** — Shared code generation library used by brief-to-figma.js (and flow-to-figma.js, slide-to-figma.js)
