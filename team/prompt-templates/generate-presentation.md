# Prompt Template: Generate Presentation

> Copy this into Claude Desktop when creating a presentation deck. Replace the [bracketed] parts.
> Updated: 2026-03-25

---

## The prompt

```
Create a presentation deck for the following topic:

**Topic:** [e.g., Accessibility Audit Summary Q1 2026]
**Audience:** [e.g., Leadership, Cross-functional team, External stakeholders]
**Goal:** [e.g., Communicate audit findings and remediation plan]

**Input material:**
[Attach files, paste Figma URLs, or describe the content to include. Examples:]
- [file path to a doc, PDF, or spreadsheet]
- [Figma URL to designs or flows]
- [Key bullet points or data to cover]

**Target Figma file:** [paste the Figma file URL where you want the deck delivered]

Use the Actian presentation templates:
- Cover slide (dark gradient + geometric BG)
- Body slides (full content or text + visual split)
- Section dividers (light gradient)
- Back cover ("Thank you")

Guidelines:
- Headlines that communicate value ("Adoption grew 40%" not "Q1 Results")
- Use charts, diagrams, and stat cards — not walls of text
- One message per slide
- Active voice, sentence case, corporate-friendly tone
- Every metric needs context (comparison, benchmark, or target)
- Follow the narrative arc: situation → complication → resolution → evidence → next steps
- Present a full review report before pushing to Figma
```

---

## Prompt without input files (topic only)

```
Create a presentation deck about [topic].

**Audience:** [who will see this]
**Key points to cover:**
1. [first point]
2. [second point]
3. [third point]

**Target Figma file:** [Figma URL]

Use Actian presentation templates. Present the outline first, then generate.
```

---

## Available slide templates

| Template | Use for | Background |
|----------|---------|------------|
| **Cover** | Opening slide | Dark gradient (#090952 → #1414B8) + geometric |
| **Body (Full)** | Charts, diagrams, screenshots, full-width content | White, grey content area (#F5F5FA) |
| **Body (Text+Visual)** | Written content + visual side by side | White, left text + right grey area |
| **Section divider** | Separating major sections | Light gradient (#EEEEFD → #CBDAFF) + geometric |
| **Back cover** | Closing slide | Dark gradient + geometric |

---

## Available chart types

The skill generates CSS-only charts inside body slides — no JavaScript needed:

| Chart type | Best for |
|------------|----------|
| **Stat cards** | Hero metrics (large number + context) |
| **Horizontal bar charts** | Category comparisons |
| **Donut charts** | Parts of a whole (max 5 segments) |
| **Progress bars** | Status vs. target |
| **Timelines** | Milestone sequences |
| **Flow diagrams** | Process steps |
| **Before/after cards** | Delta visualization |
| **Comparison tables** | Side-by-side feature comparison |

---

## What you'll see before Figma capture

The skill always presents a **review report** before pushing to Figma:
- Slide count, section count, estimated duration
- Slide-by-slide breakdown table (template, headline, content, visuals)
- Quality checklist (headlines, metrics, tone, narrative arc)
- You approve or request changes before anything goes to Figma

---

## Tips
- Attach the actual source material (docs, PDFs, spreadsheets) — the more context, the better the deck
- For data-heavy content, the skill auto-generates appropriate charts
- The outline step lets you reorder, add, or remove slides before generation
- Ask for specific chart types: "Use a donut chart for the budget breakdown"
- After capture, you can iterate: "Change slide 7 to use a bar chart instead"
- Target 8–15 slides. Under 8 feels thin, over 20 feels heavy.
