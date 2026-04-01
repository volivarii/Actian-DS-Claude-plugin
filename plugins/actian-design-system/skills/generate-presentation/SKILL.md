---
name: generate-presentation
description: Use when the user asks to create a presentation, make a deck, turn findings or research into slides, build a pitch or report deck, or provides content and wants it presented visually.
argument-hint: "[topic, file path, Figma URL, or description of content]"
---

# Generate Presentation

Generate a structured Figma presentation deck using the official Actian slide templates.

**When NOT to use:** If the user wants a *user flow* or wireframe → use `generate-flow`. If the user wants to *document* a component → use `component-brief`.

> **Presentation guide:** Read `../../docs/presentation-guide.md` before generating any slides — it is the primary reference for slide types, typography, colors, sequencing, voice & tone, charts, and the review report format.
> **Shared rules apply:** Content guidelines, quality & hygiene checklist (Universal + Generate Presentation sections), and generation log format — all per CLAUDE.md.

> **Mode: Implement with review gate.** Build first, explain after. Move fast through research, outlining, and HTML generation without pausing for confirmation. But always pause at Step 5 (review report) before pushing to Figma — wrong slides in Figma are costly to fix. Keep status updates to milestones only.

## Input

The user provides one or more of:
- A **topic or description** ("Create a presentation about our Q1 design system progress")
- **Input files** — PDFs, markdown docs, research notes, meeting transcripts
- **Figma content** — URLs to designs, flows, components, or audit results
- A **brief or outline** — bullet points, agenda, or structure they want followed

## Execution Model

**Autonomous through generation.** Do NOT pause to present outlines for approval or ask clarifying questions between Steps 1–4. Infer audience, goal, and structure from the input. The only acceptable pause before Step 5 is when the input is genuinely too thin to generate anything (e.g., user said "make a deck" with zero topic or content).

**Review gate at Step 5.** Always present the review report and wait for approval before pushing to Figma.

**Defaults:** Audience = team update. Goal = inform. Slide count = 8–15 based on content density.

### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | 5-8 slides, stat cards only (no complex charts) |
| No qualifier (default) | Standard | 8-15 slides, full chart selection |
| "production", "final" | Production | 8-20 slides with speaker notes, slide-by-slide quality check |

## Step 1 — Gather and understand content

Before writing slides:

1. **Read all input material** — files, URLs, Figma nodes. Extract key points, data, visuals.
2. **Identify the audience** — infer from context, default to "team update"
3. **Identify the goal** — infer from content, default to "inform"
4. **Product context** — Read `../../references/app-context.md` for correct terminology, entity names, and app references. Use exact Actian terms (e.g., "Data Intelligence Platform" not "the tool", "Studio" not "admin panel").
5. **Topic research** (Standard/Production tier) — `WebSearch` for relevant data, stats, benchmarks, or industry context to give charts real substance and claims real evidence. Skip for Draft tier.

Only ask questions if the input is genuinely empty (just a topic with no content at all). Otherwise, infer and proceed.

## Step 2 — Create the outline (internal)

Plan the slide outline internally. Do NOT present it to the user for review — go straight to HTML generation.

**Template selection rules:**
- Slide 1 is always **Cover**
- Last slide is always **Back cover**
- Use **Section divider** to separate major topics (at least 2 for decks > 8 slides)
- Use **Body (Full)** for charts, diagrams, screenshots, component previews, full-width visuals
- Use **Body (Text+Visual)** when written explanation accompanies a visual
- Target 1 key message per slide
- Typical deck: 8–15 slides. Under 8 feels thin, over 20 feels heavy. Adjust to content density.

## Step 3 — Generate the HTML deck (CLIENT-SIDE RENDERER)

Build the HTML file using the presentation renderer. The AI writes only body content per slide — slide chrome (cover gradient, section dividers, back cover) is rendered client-side.

1. Build `slide-data.json` from the outline:
   - `meta`: skill, topic, prompt, date, duration, model, pluginVersion
   - `slides[]`: each with type (cover/section/body-full/body-text-visual/back-cover) + type-specific data
   - Cover/section/back-cover slides: pure data (title, subtitle, topic) — no HTML needed
   - Body slides: use structured `content[]` array for charts (stat-cards, bar-chart, progress-bars, comparison-table, timeline) or `contentHtml`/`bodyHtml`/`visualHtml` for custom content
2. Read `../../references/generate-presentation/templates.md` for slide content rules, chart types, DS Kit token usage
3. Read `../../scripts/html-renderers/presentation-renderer.js`
4. Assemble HTML file with presentation CSS + `<div id="deck-container"></div>` + embedded JSON as `<script type="application/json" id="spec-data">` + renderer JS + annotation layer
5. Write to: `{project_working_directory}/presentations/[topic-slug]/[topic-slug]-deck.html`

**Key rules:**
- 5 slide types: Cover, Body (Full), Body (Text+Visual), Section divider, Back cover
- All content uses DS Kit tokens (`--zen-*` prefix), Roboto font
- Charts use `--zen-color-category-N-strong` — never hardcode chart colors
- Use structured content elements where possible — raw HTML only for novel content
- Generation log card rendered by the renderer from `meta`
- Include annotation layer inline before `</body>` — see `../../references/annotation-reference.md`

## Step 4 — Save, serve, and preview

1. Save to: `{project_working_directory}/presentations/[topic-slug]/[topic-slug]-deck.html` (absolute path based on user's project directory, never relative to the plugin)
2. Start local server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
3. Tell the user: "Preview at `http://localhost:8765/presentations/[topic-slug]/[topic-slug]-deck.html`"

## Step 5 — Present the review report

**MANDATORY: Always present a full review report before offering to send to Figma.** Never skip this step.

Follow the review report format defined in `../../docs/presentation-guide.md`:

1. **Deck summary** — slide count, section count, estimated duration
2. **Slide-by-slide breakdown table** — #, template type, headline, content summary, charts/visuals used
3. **Quality checklist** — verify every headline passes "So what?", 1 message per slide, metrics have context, charts use DS Kit tokens, active voice, narrative arc
4. Present the preview URL and ask:
   > "Preview: `http://localhost:8765/presentations/[topic-slug]/[topic-slug]-deck.html`
   >
   > Review the breakdown above and the slides, then reply:
   > - **"push"** — send all slides to Figma
   > - **"push 1,3,5-8"** — send only those slides to Figma
   > - **"apply annotations"** — paste annotation JSON from the browser, I'll fix and re-preview
   > - **feedback** — I'll fix the HTML and re-preview"

**Wait for the user's response.** Do not proceed. If changes are requested, apply them to the HTML, re-serve, and present an updated report. Repeat until approved.

## Step 6 — Output to Figma (slide-to-figma.js)

Only after the user approves the review report.

**Do NOT write freehand Figma specs.** Use the `slide-to-figma.js` script — it builds correct slide frames, gradients, and variable bindings deterministically, then generates self-contained Figma plugin JS code.

1. Read `../../references/generate-presentation/figma-spec-builder.md` — input schema + chart patterns
2. Write `slide-data.json` to the project directory:
   - `meta`: title, targetNodeId, prompt, duration, model, pluginVersion, generatedAt
   - `slides[]`: per slide: type (`cover`/`section`/`body-full`/`body-text-visual`/`back-cover`), name, title, content
   - The AI provides only content nodes — the script handles slide frames, gradients, and variables
3. Run: `node ${CLAUDE_PLUGIN_ROOT}/scripts/slide-to-figma.js slide-data.json --target-node-id "<nodeId>"`
4. Script outputs JSON array of `{ callIndex, code, description }` — each `code` is self-contained Figma plugin JS
5. For each call in the array, pass `code` directly to `use_figma`
   - For call 2+: replace `__WRAPPER_ID__` in the code with the `wrapperId` returned from call 1
6. After all calls: parity validation (slide count vs Figma frame count)

If the user hasn't provided a target Figma file, ask: "Where should I push this? Provide a Figma file URL, or I can create a new file."

## Step 7 — Parity check

After all `use_figma` calls complete, run the post-push parity check procedure in `../../references/parity-check.md`:

1. `get_screenshot` of each pushed slide
2. **Dispatch `parity-analyzer` agent** with screenshots + expected slide content
3. Merge findings with your own visual check
4. Report findings and offer to fix P0 issues
5. Write `.last-push.json` manifest to `{project_working_directory}/presentations/[topic-slug]/.last-push.json`

After parity check completes, ask: "Review in Figma and reply: **'looks good'** or **'fix [specific issue]'**."

## Charts and content quality

Read `../../references/generate-presentation/templates.md` § "Available CSS chart types" for the 8 chart types (stat cards, bar charts, donut, progress bars, timelines, flow diagrams, comparison tables, before/after). All charts use `--zen-color-category-N-strong` tokens.

All slide copy must follow `../../docs/presentation-guide.md`. Key rules: 1 message per slide, headlines as conclusions ("So what?" test), active voice, visual > text, max 6 bullets or 150 words, every metric needs context, narrative arc (situation → complication → resolution → evidence → next steps).
