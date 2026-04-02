---
name: generate-presentation
description: Use when the user asks to create a presentation, make a deck, turn findings or research into slides, build a pitch or report deck, or provides content and wants it presented visually.
argument-hint: "[topic, file path, Figma URL, or description of content]"
---

<!-- This skill can be invoked directly (/generate-presentation) or via the DS companion. -->

# Generate Presentation

Generate a structured Figma presentation deck using the official Actian slide templates.

**When NOT to use:** If the user wants a *user flow* or wireframe → use `generate-flow`. If the user wants to *document* a component → use `component-brief`.

> **Presentation guide:** Read `../../docs/presentation-guide.md` before generating any slides — it is the primary reference for slide types, typography, colors, sequencing, voice & tone, charts, and the review report format.
> **Shared rules apply:** Content guidelines, quality & hygiene checklist (Universal + Generate Presentation sections), and generation log format — all per CLAUDE.md.

> **Mode: Build and push.** Build first, explain after. Move fast through research, outlining, and data generation without pausing for confirmation. HTML preview is opt-in — the default path is: outline → build slide-data.json → push to Figma. Only generate HTML if the user says "preview".

## Input

The user provides one or more of:
- A **topic or description** ("Create a presentation about our Q1 design system progress")
- **Input files** — PDFs, markdown docs, research notes, meeting transcripts
- **Figma content** — URLs to designs, flows, components, or audit results
- A **brief or outline** — bullet points, agenda, or structure they want followed

## Execution Model

**Autonomous through generation and push.** Do NOT pause to present outlines for approval or ask clarifying questions. Infer audience, goal, and structure from the input. The only acceptable pause is when the input is genuinely too thin to generate anything (e.g., user said "make a deck" with zero topic or content).

**Default path:** outline → build slide-data.json → slide-to-figma.js → push to Figma. No HTML step unless the user says "preview".

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

## Step 3 — Build slide-data.json and push to Figma

**Default path: outline → slide-data.json → slide-to-figma.js → Figma. No HTML step.**

1. Build `slide-data.json` from the outline:
   - `meta`: title, targetNodeId, prompt, duration, model, pluginVersion, generatedAt, skill
   - `slides[]`: each with type (cover/section/body-full/body-text-visual/back-cover) + type-specific data
   - Cover/section/back-cover: pure data (title, subtitle, topic)
   - Body slides: structured `content[]` nodes for charts and content
2. Read `../../references/generate-presentation/figma-spec-builder.md` — input schema + chart patterns
3. Write slide-data.json to: `{project_working_directory}/presentations/[topic-slug]/slide-data.json`
4. Run: `node ${CLAUDE_PLUGIN_ROOT}/scripts/slide-to-figma.js slide-data.json --target-node-id "<nodeId>"`
5. Script outputs JSON array of `{ callIndex, code, description }` — self-contained Figma plugin JS
6. For each call, pass `code` to `use_figma`:
   - Call 1: use as-is (creates wrapper)
   - Call 2+: replace `__WRAPPER_ID__` with `wrapperId` from call 1
7. After all calls: parity check (Step 4)

**Key rules:**
- 5 slide types: Cover, Body (Full), Body (Text+Visual), Section divider, Back cover
- All content uses DS Kit tokens (`--zen-*` prefix), Roboto font
- Charts use `--zen-color-category-N-strong` — never hardcode chart colors

If the user hasn't provided a target Figma file, ask: "Where should I push this? Provide a Figma file URL, or I can create a new file."

### HTML preview (opt-in)

**Trigger:** User says "preview" in the prompt.

If triggered, generate HTML BEFORE pushing:

1. Read presentation-renderer.js and templates
2. Build HTML from the same slide-data.json
3. Write to: `{project_working_directory}/presentations/[topic-slug]/[topic-slug]-deck.html`
4. Start server, present preview URL with options:
   - **"push"** / **"push 1,3,5-8"** — send to Figma
   - **"apply annotations"** — annotate in browser, then say "apply annotations"
   - **feedback** — fix and re-preview
5. Present review report: slide count, breakdown table, quality checklist
6. On feedback: fix slide-data.json → regenerate HTML → re-serve
7. On "push": proceed to push step above

## Step 4 — Parity check

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
