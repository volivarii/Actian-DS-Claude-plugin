---
title: "Format spec"
nav_exclude: true
search_exclude: true
---
# Content guidelines format spec

This file defines how content guideline markdown files should be formatted when generating deliverables - either as a consolidated Word document or as Figma presentation slides.

---

## Markdown source structure

Each section file follows this pattern:

```
# {N}. {Section title}

{One-sentence description of the component and its purpose}

---

## {N}.{M} {Subsection title}  ← only if section has subsections

### When to use  ← H3 subsection headers
### Style
### Behavior
### Do / Don't  ← always a table

| Do | Don't |
|---|---|
| ... | ... |
{: .do-dont-table}

### Examples  ← optional; always a table

| Element | Example text |
|---|---|
| ... | ... |
```

---

## Figma output

When generating Figma slides from these files:

### Slide structure
- One slide per H1 section (use `/generate-presentation` skill)
- Title slide: section number + title
- Content slides: one per H2 or major content block

### Component mapping
| Markdown element | Figma component |
|---|---|
| H1 title | Presentation / Section title frame |
| H2 heading | Presentation / Slide title |
| H3 heading | Presentation / Body heading |
| Paragraph | Presentation / Body text |
| Bullet list | Presentation / Bullet list |
| Do/Don't table | Presentation / Do-Don't comparison card |
| Example table | Presentation / Example table card |

### Color coding
- "Do" examples: green border `#4CAF50`
- "Don't" examples: red border `#F44336`
- Section header accent: Actian primary `var(--zen-color-theme-primary)`

---

## Generating outputs

### Figma presentation
```
/generate-presentation content guidelines
```
Claude will:
1. Read each section file
2. Map content to Figma presentation components
3. Push slides to Figma via the MCP

### Querying guidelines
Ask the Actian Design System plugin directly:
- "What is the correct label for the back button in a stepper?"
- "How should empty states be written?"
- "What words should we avoid in UI copy?"
