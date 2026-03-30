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

## Step 3 — Generate the HTML deck

Generate a single HTML file containing all slides as a horizontal row of 1920x1080px frames. Read `../../references/generate-presentation/templates.md` for the complete HTML templates (Cover, Body Full, Body Text+Visual, Section divider, Back cover), geometric background patterns, content area styling, and CSS chart types.

**Key rules:**
- 5 slide types: Cover, Body (Full), Body (Text+Visual), Section divider, Back cover
- All content uses DS Kit tokens (`--zen-*` prefix), Roboto font
- Charts use `--zen-color-category-N-strong` — never hardcode
- Include generation log card as first element
- Include the annotation layer before `</body>`: add `<script src="/_plugin/annotation-loader.js" defer></script>`

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

## Step 6 — Output to Figma (default: `use_figma`)

Only after the user approves the review report.

> **Shared pattern:** Follow the rules in `../../references/figma-output.md` — `hexToRgb` helper, generation metadata frame, font loading, auto-layout, descriptive layer names, and the 20KB-per-call limit all apply.

If the user hasn't provided a target Figma file, ask: "Where should I push this? Provide a Figma file URL, or I can create a new file."

### Slide frame structure

Each slide is a fixed-size frame: **1920 x 1080 px**, with vertical or horizontal auto-layout inside. Font: **Roboto** (DS Kit).

### Slide types

**Cover slide:**
- Background: `theme-primary` gradient
- Title: inverse text, 48px bold
- Subtitle: inverse text at 80% opacity, 24px regular

**Body (Text + Visual):**
- Background: `background-bg-default`
- Two-column layout (text left, visual right)
- Heading: `text-primary`, 32px bold
- Body text: `text-secondary`, 18px regular

**Section divider:**
- Background: `background-bg-grey-2`
- Centered title: 36px bold, `text-primary`

**Back cover:**
- Background: `theme-primary` gradient
- Text: inverse text

For token binding (color variables, text styles, effect styles), follow `../../references/figma-output.md` § "Token binding". Discover style keys via `search_design_system` before writing `use_figma` code. For DS Kit variable keys specifically, see `../../docs/meta-kit/variables.md`.
Read `../../references/generate-presentation/templates.md` § "Figma output" for slide types, charts in `use_figma`, execution sequence, and Meta Kit component keys (Do-Don't Pair, Code Block).

## Step 7 — Parity check

After all `use_figma` calls complete, run the post-push parity check procedure in `../../references/parity-check.md`:

1. `get_screenshot` of each pushed slide
2. Present screenshots alongside the HTML preview URL
3. Run automated checklist (element count, clipping, empty text)
4. Report findings and offer to fix P0 issues
5. Write `.last-push.json` manifest to `{project_working_directory}/presentations/[topic-slug]/.last-push.json`

After parity check completes, ask: "Review in Figma and reply: **'looks good'** or **'fix [specific issue]'**."

## Charts and content quality

Read `../../references/generate-presentation/templates.md` § "Available CSS chart types" for the 8 chart types (stat cards, bar charts, donut, progress bars, timelines, flow diagrams, comparison tables, before/after). All charts use `--zen-color-category-N-strong` tokens.

All slide copy must follow `../../docs/presentation-guide.md`. Key rules: 1 message per slide, headlines as conclusions ("So what?" test), active voice, visual > text, max 6 bullets or 150 words, every metric needs context, narrative arc (situation → complication → resolution → evidence → next steps).
