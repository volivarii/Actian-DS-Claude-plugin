---
name: generate-presentation
description: Generate a full Figma presentation deck from input files, research, Figma content, or a topic description. Uses the Actian presentation templates (Cover, Body, Section, Back cover). Use when user asks to create a presentation, slide deck, pitch deck, report deck, or wants to turn research/findings/content into slides. Also triggers when user says "make a deck", "presentation for", "slides about", or provides content and asks to present it.
argument-hint: "[topic, file path, Figma URL, or description of content]"
---

# Generate Presentation

Generate a structured Figma presentation deck using the official Actian slide templates.

> **Presentation templates:** Read `references/presentation-templates.md` (in the skills directory) before generating any slides. It contains the exact specs for all 5 slide types, typography, colors, and sequencing rules.
> **Content guidelines:** All slide copy must follow `references/content-guidelines.md` — sentence case, concise labels, no jargon without definition.
> **Quality & hygiene:** Before marking any output complete, validate against the Quality & Hygiene Checklist in CLAUDE.md — all 10 items must pass for Figma-bound deliverables.

> **Mode: Implement.** Build first, explain after. Output working artifacts, not commentary. Move fast — make reasonable decisions instead of asking for every detail. Favor complete output over perfect output; the cleanup pass handles polish. Keep status updates to milestones only.

## Input

The user provides one or more of:
- A **topic or description** ("Create a presentation about our Q1 design system progress")
- **Input files** — PDFs, markdown docs, research notes, meeting transcripts
- **Figma content** — URLs to designs, flows, components, or audit results
- A **brief or outline** — bullet points, agenda, or structure they want followed

## Step 1 — Gather and understand content

Before writing slides:

1. **Read all input material** — files, URLs, Figma nodes. Extract key points, data, visuals.
2. **Identify the audience** — ask if not obvious: executive summary? Team update? External pitch? Workshop?
3. **Identify the goal** — what should the audience know, feel, or do after seeing this deck?
4. **Check CLAUDE.md** — what tokens, conventions, and guidelines apply?

If the input is thin (just a topic), ask 2–3 quick questions:
- Who is the audience?
- What are the 3–5 key points to cover?
- Any specific visuals, data, or Figma designs to include?

## Step 2 — Create the outline

Present a slide-by-slide outline before generating. Each entry shows:

```
Slide N — [Template type] — "[Slide title]"
  Content: [1-line description of what goes on this slide]
```

**Template selection rules:**
- Slide 1 is always **Cover**
- Last slide is always **Back cover**
- Use **Section divider** to separate major topics (at least 2 for decks > 8 slides)
- Use **Body (Full)** for charts, diagrams, screenshots, component previews, full-width visuals
- Use **Body (Text+Visual)** when written explanation accompanies a visual
- Target 1 key message per slide
- Typical deck: 8–15 slides. Under 8 feels thin, over 20 feels heavy. Adjust to content density.

Ask: "Does this outline look right? Want to add, remove, or reorder anything?"

## Step 3 — Generate the HTML deck

Once the outline is approved, generate a single HTML file containing all slides as a horizontal row of 1920x1080px frames, ready for Figma capture.

### Slide dimensions and capture setup

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- AI CONSUMPTION METADATA -->
  <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
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

## Step 4 — Save and serve

1. Save to: `presentations/[topic-slug]/[topic-slug]-deck.html`
2. Start local server: `BASE_URL=$(.claude-plugin/scripts/ensure-server.sh . 8765)`
3. Tell the user: "Preview at `http://localhost:8765/presentations/[topic-slug]/[topic-slug]-deck.html`"

## Step 5 — Capture to Figma (optional)

If the user provides a target Figma file:

1. Ensure the local HTTP server is running on port 8765
2. Call `generate_figma_design` with `outputMode: "existingFile"` and the target file key/node
3. Open the HTML file with the capture hash URL
4. Poll until capture completes
5. Share the Figma link with the user

## Step 6 — Iterate

After the user reviews:
- Adjust slide content, reorder, add/remove slides
- Refine visuals based on feedback
- Re-capture to Figma if needed

## Content quality rules

- **1 message per slide** — if you can't summarize the slide's point in one sentence, split it
- **No wall of text** — body text max 6 bullet points or 150 words per slide
- **Headlines that communicate** — "Q1 adoption grew 40%" not "Q1 Results"
- **Visual > text** — prefer diagrams, charts, and screenshots over paragraphs
- **Consistent terminology** — use the same terms throughout, following content-guidelines.md
- **Sentence case** for all text except proper nouns
- **Source attribution** — if data comes from a specific source, add a small footnote (Roboto 16px, `#717D96`, bottom-left)
