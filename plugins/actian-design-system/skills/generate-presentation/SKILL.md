---
name: generate-presentation
description: Use this skill whenever the user wants to create a presentation or slide deck. Takes input files, research notes, Figma content, or a topic description and produces a complete Figma deck using Actian presentation templates (Cover, Body, Section, Back cover) with data visualizations and DS2026 styling. Triggers when the user asks to create a presentation, make a deck, turn findings or research into slides, build a pitch or report deck, or provides content and wants it presented visually.
argument-hint: "[topic, file path, Figma URL, or description of content]"
---

# Generate Presentation

Generate a structured Figma presentation deck using the official Actian slide templates.

> **Presentation templates:** Read `../../docs/presentation-templates.md` before generating any slides. It contains the exact specs for all 5 slide types, typography, colors, and sequencing rules.
> **Presentation content guidelines:** Read `../../docs/presentation-content-guidelines.md` before writing any slide copy. It defines voice & tone, headline rules, data formatting, chart selection, narrative structure, and the review report format. This is the primary content reference for this skill.
> **Content guidelines:** General UI copy rules in `../../docs/content-guidelines.md` — sentence case, terminology, and formatting also apply.
> **Quality & hygiene:** Run through `../../references/quality-checklist.md` — check the **Universal** section plus the **Generate Presentation** section. Fix issues inline before presenting to the user.
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

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
4. **Check CLAUDE.md** — what tokens, conventions, and guidelines apply?

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

Generate a single HTML file containing all slides as a horizontal row of 1920x1080px frames for local preview.

### Slide dimensions and layout

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- AI CONSUMPTION METADATA -->
  <style>
    body { margin: 0; padding: 40px; background: #E0E0E0; display: flex; gap: 40px; }
    .slide { width: 1920px; height: 1080px; flex-shrink: 0; position: relative; overflow: hidden; }
  </style>
</head>
<body>
  <!-- Slides go here -->
</body>
</html>
```

### Template HTML patterns

**Cover slide:**
```html
<div class="slide" data-name="Cover — [Title]"
     style="background: linear-gradient(80deg, #090952 2%, #1414B8 107%);">
  <!-- BG graphic: use CSS geometric shapes or captured SVG -->
  <div style="position:absolute;top:88px;left:80px;font-family:'Roboto',sans-serif;font-size:40px;font-weight:500;color:white;">[Topic]</div>
  <div style="position:absolute;top:166px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:130px;font-weight:500;color:white;line-height:1.02;">[Title]</div>
  <div style="position:absolute;top:341px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:60px;font-weight:400;color:white;line-height:1.02;">[Subtitle]</div>
  <div style="position:absolute;top:931px;left:80px;font-family:'Roboto',sans-serif;font-size:32px;font-weight:400;color:white;">[Date]</div>
  <div style="position:absolute;top:980px;left:80px;font-family:'Roboto',sans-serif;font-size:32px;font-weight:400;color:white;">[Creators]</div>
  <!-- Actian pyramid placeholder bottom-right -->
  <div style="position:absolute;bottom:65px;right:80px;width:80px;height:68px;display:flex;align-items:center;justify-content:center;">
    <div style="width:0;height:0;border-left:28px solid transparent;border-right:28px solid transparent;border-bottom:48px solid rgba(255,255,255,0.3);"></div>
  </div>
</div>
```

**Body (Full content):**
```html
<div class="slide" data-name="[Slide title]" style="background:white;">
  <div style="position:absolute;top:64px;left:80px;width:1760px;font-family:'Roboto',sans-serif;font-size:56px;font-weight:400;color:#12131F;line-height:1.03;">[Title]</div>
  <div style="position:absolute;top:187px;left:79px;width:1761px;height:829px;background:#F5F5FA;border-radius:4px;display:flex;align-items:center;justify-content:center;">
    <!-- Content: charts, tables, diagrams, screenshots -->
  </div>
</div>
```

**Body (Text + Visual):**
```html
<div class="slide" data-name="[Slide title]" style="background:white;">
  <div style="position:absolute;top:64px;left:80px;width:1760px;font-family:'Roboto',sans-serif;font-size:56px;font-weight:400;color:#12131F;line-height:1.03;">[Title]</div>
  <div style="position:absolute;top:187px;left:80px;width:549px;height:829px;font-family:'Roboto',sans-serif;font-size:24px;font-weight:400;color:black;line-height:1.3;">
    <!-- Body text, bullet points, key takeaways -->
  </div>
  <div style="position:absolute;top:187px;left:685px;width:1155px;height:829px;background:#F5F5FA;border-radius:4px;display:flex;align-items:center;justify-content:center;">
    <!-- Visual: diagram, screenshot, component preview -->
  </div>
</div>
```

**Section divider:**
```html
<div class="slide" data-name="Section — [Title]"
     style="background: linear-gradient(80deg, #EEEEFD 2%, #CBDAFF 107%);">
  <!-- Light BG graphic -->
  <div style="position:absolute;top:361px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:60px;font-weight:400;color:#12131F;line-height:1.02;">[Topic]</div>
  <div style="position:absolute;top:449px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:130px;font-weight:500;color:#12131F;line-height:1.02;">[Title]</div>
</div>
```

**Back cover:**
```html
<div class="slide" data-name="Back cover"
     style="background: linear-gradient(80deg, #090952 2%, #1414B8 107%);">
  <!-- BG graphic -->
  <div style="position:absolute;top:421px;left:80px;width:1760px;font-family:'Roboto',sans-serif;font-size:152px;font-weight:500;color:white;line-height:1.02;">Thank you</div>
  <!-- Actian pyramid placeholder -->
  <div style="position:absolute;bottom:65px;right:80px;width:80px;height:68px;display:flex;align-items:center;justify-content:center;">
    <div style="width:0;height:0;border-left:28px solid transparent;border-right:28px solid transparent;border-bottom:48px solid rgba(255,255,255,0.3);"></div>
  </div>
</div>
```

### Content inside body slides

For the content areas (#F5F5FA placeholders), generate actual content based on the input material:

- **Data/metrics** — render as simple charts (bar charts using divs, donut charts using CSS, stat cards)
- **Bullet points** — clean list with DS2026 styling (Roboto 24px, `#12131F`, line-height 1.5)
- **Figma screenshots** — if the user provided Figma URLs, use `get_screenshot` and embed the image
- **Comparison tables** — use standard table chrome from component-brief (11px uppercase headers, `#717D96`)
- **Timelines** — horizontal or vertical progress indicators
- **Component previews** — render actual components using DS2026 tokens
- **Flow diagrams** — simplified step diagrams using boxes and arrows

Style all content using DS2026 tokens (`--zen-*` prefix) where applicable. For text inside content areas, use Roboto 20–24px at `#12131F` or `#475467`.

### Background geometric pattern

For Cover, Section, and Back cover slides, approximate the Actian geometric pattern using CSS:

```html
<!-- Geometric overlay — 3 diagonal shapes -->
<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">
  <div style="position:absolute;top:-20%;right:-10%;width:60%;height:140%;background:rgba(255,255,255,0.06);transform:rotate(-60deg);border-radius:20px;"></div>
  <div style="position:absolute;top:10%;right:-20%;width:50%;height:120%;background:rgba(255,255,255,0.04);transform:rotate(-60deg);border-radius:20px;"></div>
  <div style="position:absolute;top:-30%;right:5%;width:45%;height:130%;background:rgba(255,255,255,0.08);transform:rotate(-60deg);border-radius:20px;"></div>
</div>
```

For light Section dividers, use the same shapes but with `rgba(0,0,100,0.03)` instead of white.

## Step 4 — Save, serve, and preview

1. Save to: `presentations/[topic-slug]/[topic-slug]-deck.html`
2. Start local server: `BASE_URL=$(scripts/ensure-server.sh . 8765)`
3. Tell the user: "Preview at `http://localhost:8765/presentations/[topic-slug]/[topic-slug]-deck.html`"

## Step 5 — Present the review report

**MANDATORY: Always present a full review report before offering to send to Figma.** Never skip this step.

Follow the review report format defined in `../../docs/presentation-content-guidelines.md`:

1. **Deck summary** — slide count, section count, estimated duration
2. **Slide-by-slide breakdown table** — #, template type, headline, content summary, charts/visuals used
3. **Quality checklist** — verify every headline passes "So what?", 1 message per slide, metrics have context, charts use DS2026 tokens, active voice, narrative arc
4. Ask: **"Review the breakdown above. Want to adjust any slides before I push to Figma?"**

Wait for the user's approval or requested changes. If changes are requested, apply them to the HTML, re-serve, and present an updated report. Repeat until approved.

## Step 6 — Output to Figma (default: `use_figma`)

Only after the user approves the review report.

> **Shared pattern:** Follow the rules in `../../references/figma-output.md` — `hexToRgb` helper, generation metadata frame, font loading, auto-layout, descriptive layer names, and the 20KB-per-call limit all apply.

If the user hasn't provided a target Figma file, ask: "Where should I push this? Provide a Figma file URL, or I can create a new file."

### Slide frame structure

Each slide is a fixed-size frame: **1920 x 1080 px**, with vertical or horizontal auto-layout inside. Font: **Roboto** (DS2026).

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

For token binding (color variables, text styles, effect styles), follow `../../references/figma-output.md` § "Token binding". Discover style keys via `search_design_system` before writing `use_figma` code. For DS2026 variable keys specifically, see `../../docs/meta-kit/variables.md`.
For the shared Do-Don't Pair and Code Block components, see `../../docs/meta-kit/components.md`.
For `buildSpecTable` (data tables in slides), see `../../references/meta-kit/builders.md`.

### Charts in `use_figma`

- **Bar charts** — render as rectangles using `category-N-strong` hex values for each series
- **Data tables** — horizontal auto-layout frames with header row and data rows
- **Complex charts** — create a placeholder frame labeled `"Chart: [description]"` for manual follow-up

### Execution sequence

1. **Generation metadata frame first** — Import `Meta / Chrome / Generation Log` component (key: `a9653f30925367e96dea90093d750bfe70849571`), set all 6 text properties using `setProp()`, place as the first element.
2. **One `use_figma` call per slide** — keep each call under the 20KB limit. Each call creates one 1920x1080 frame with auto-layout contents.
3. **Arrange in horizontal row** — position slides left-to-right with consistent spacing (e.g., 40px gap)
4. **Take screenshot and show user** — use `get_screenshot` on the parent frame or page to show the final result

For best-practice slides, import `Meta / Content / Do-Don't Pair` (key: `28edfacf13e50706586172bd48f8a3ad84d7c263`). Set `Do Label`, `Don't Label`, `Do Example`, `Don't Example` properties.
For code example slides, import `Meta / Content / Code Block` (key: `1bf10eee1751a46da5f90a9671be6c9abf0073b7`). Set `Code` and optionally `Header Text` properties. Detach before appending content if needed.

## Step 7 — Iterate

After the user reviews in Figma:
- Adjust slide content, reorder, add/remove slides
- Refine visuals based on feedback
- Rebuild slides via `use_figma` if needed

## Charts, diagrams, and data visualization

Use charts, diagrams, and data visualizations as the primary content medium — not walls of text. Refer to `../../docs/presentation-content-guidelines.md` for the full chart selection guide, CSS patterns, and styling rules.

**Default behavior:** When input material contains data, metrics, timelines, processes, or comparisons, generate appropriate charts automatically. The chart selection guide in the content guidelines maps each question type to the right chart.

**Available CSS chart types** (no JavaScript dependencies):
- **Stat cards** — single large metric with context (use for hero numbers)
- **Horizontal bar charts** — category comparisons (div-based, width percentages)
- **Donut charts** — parts of a whole (conic-gradient, max 5 segments)
- **Progress bars** — status vs. target (with threshold marker)
- **Timelines** — milestone sequences (horizontal dot + line)
- **Flow diagrams** — process steps (boxes + connecting lines)
- **Comparison tables** — side-by-side feature/option comparison
- **Before/after cards** — delta visualization (two stat cards with arrow)

All charts must use DS2026 category tokens (`--zen-color-category-N-strong`) for series colors. Never hardcode chart colors.

## Content quality rules

All slide copy must follow `../../docs/presentation-content-guidelines.md`. Key rules:

- **1 message per slide** — three points on a slide means zero remembered
- **Headlines as conclusions** — "Q1 adoption grew 40%" not "Q1 Results" (the "So what?" test)
- **Active voice always** — "Customers cut costs by 45%" not "Costs were reduced by 45%"
- **Corporate-friendly tone** — confident, clear, precise, human. No hype, no jargon stacking, no filler intros.
- **Visual > text** — prefer charts, diagrams, and screenshots over paragraphs
- **Max 6 bullets** or 150 words per slide in text areas
- **Every metric needs context** — comparison, benchmark, or target
- **Narrative arc** — situation → complication → resolution → evidence → next steps
- **Source attribution** — if data comes from a specific source, add a small footnote (Roboto 16px, `#717D96`, bottom-left)
