---
name: sync-guidelines
description: Use this skill to extract per-component guidelines from the DS2026 Figma library into structured JSON. Reads the named frames on each component page (content guidelines, design guidelines, components, ready made examples, screenshots, behavior demo) and produces machine-readable data that other skills can consume. Triggers when the user asks to sync guidelines, extract component docs from Figma, update the component guidelines, or wants to pull the latest content from the design system Figma file.
argument-hint: "[component name, Figma URL, or 'all']"
---

# Sync Guidelines from Figma

Extract per-component documentation frames from the DS2026 Figma library into structured JSON files. This bridges the gap between Figma (where the content designer maintains guidelines) and Claude skills (which need machine-readable content).

> **Mode: Extract + Transform.** Read Figma pages, extract text content, produce structured JSON. Do not generate designs or modify Figma — this is a read-only sync operation.

## Why this skill exists

The DS2026 Figma library contains rich per-component documentation — content guidelines, design guidelines, usage examples, screenshots, and behavior demos. But this content is locked inside Figma as visual layouts. Without extraction, Claude skills can only reference the generic `content-guidelines.md` and miss the component-specific rules that the content designer maintains.

## Input

The user specifies what to extract:

- **Single component:** "Sync guidelines for Button" or a Figma URL to a component page
- **Multiple components:** "Sync guidelines for Button, Text Input, and Modal"
- **All components:** "Sync all guidelines" — extracts every component page in the DS2026 file

## DS2026 Figma file

File key: `l8biHxfarNi1I2RMvVxVOK`
URL: https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/Actian-Design-System-v1.1.0

### Component page structure

Each component page has consistently named top-level frames:

| Frame name | Present | Content type |
|---|---|---|
| `.local - page header with body` | Always | Component name, description |
| `Content guidelines` | Always | Copy rules, terminology, do/don't examples |
| `Components` | Always | Variant state grid |
| `ready made examples` | Always | Pre-built usage patterns |
| `design guidelines` | Most | Visual rules, spacing, layout guidance |
| `Screenshots of use cases` / `Screenshots of current use cases` | Some | Real product screenshots showing the component in context |
| `Behavior demo` | Some | Interaction/animation documentation |

### Internal structure of content frames

Each named frame follows the same pattern:
1. An `.local - section header` instance (title bar — skip this during extraction)
2. A `Body` or `Guidelines` sub-frame containing the actual content:
   - Text nodes (headings, body text, rules)
   - Table structures (`.Row` frames with `Cell`/`Content` sub-frames containing text)
   - Inline component instances (as visual examples — note their variant names)
   - Do/don't pairs (check/cancel icon + text)

## Step 1 — Discover component pages

If extracting all or multiple components, first get the page list:

```bash
curl -s "https://api.figma.com/v1/files/l8biHxfarNi1I2RMvVxVOK?depth=1" \
  -H "X-Figma-Token: $FIGMA_TOKEN"
```

Component pages are children of section headers like `🧱 COMPONENTS`, nested under category pages (Action, Form, Navigation, Data Display, Feedback, Overlays). They have indented names (leading spaces).

Alternatively, use `get_metadata` on the file root to get the page tree.

## Step 2 — Extract each component page

For each component page, use `get_metadata` with the page node ID to discover the top-level frames. Then for each named frame:

1. **Identify the frame** by matching its name against the known frame names
2. **Get the content** using `get_design_context` on the frame — this returns text content and a screenshot
3. **Also get a screenshot** via `get_screenshot` for visual reference

### What to extract from each frame

**Content guidelines frame:**
- Headings (larger/bolder text nodes)
- Body text (rules, explanations)
- Table content (row by row — look for `.Row` frames containing `Cell`/`Content` frames with text)
- Do/don't examples (look for check/cancel icon instances paired with text)
- Terminology pairs (term → definition/usage rule)

**Design guidelines frame:**
- Spacing specifications
- Layout rules
- Visual behavior descriptions
- Sizing constraints

**Components frame:**
- Which variants exist (read from the variant component names: `Type=Primary, Size=Default, State=Default`)
- Which states are documented (Enabled, Hovered, Focused, Pressed, Selected, Disabled)
- Any labels or annotations

**Ready made examples frame:**
- Example names and descriptions
- What patterns they demonstrate

**Screenshots of use cases frame:**
- Screenshot descriptions (from surrounding text or frame names)
- Which product contexts are shown

**Behavior demo frame:**
- Interaction triggers and responses
- Animation descriptions
- State transitions

## Step 3 — Structure the output

Save one JSON file per component to `docs/component-guidelines/`:

```json
{
  "component": "Button",
  "page_id": "9085:24375",
  "extracted_at": "2026-03-25T15:30:00Z",
  "figma_url": "https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK/?node-id=9085:24375",
  "frames_found": ["Content guidelines", "Components", "Screenshots of use cases"],
  "frames_missing": ["design guidelines", "ready made examples", "Behavior demo"],
  "content_guidelines": {
    "sections": [
      {
        "heading": "Terminology for button labeling",
        "content": [
          {
            "term": "Cancel vs Close",
            "rule": "Use 'Cancel' to back out when information has been entered. Use 'Close' for read-only messages."
          },
          {
            "term": "Create vs Add vs Insert",
            "rule": "Use 'Create' for brand new items. Use 'Add' for existing items. Use 'Insert' when ordering matters.",
            "examples": ["Create rule", "Add member", "Insert row"]
          }
        ]
      }
    ]
  },
  "design_guidelines": null,
  "variants": {
    "axes": {
      "Type": ["Primary", "Secondary", "Tertiary", "Icon", "Critical primary", "Critical secondary"],
      "Size": ["Default", "Small"],
      "State": ["Default", "Hovered", "Focused", "Pressed", "Selected", "Disabled"]
    }
  },
  "examples": null,
  "screenshots": {
    "count": 13,
    "contexts": ["Form footer", "Modal actions", "Toolbar", "Stepper navigation"]
  },
  "behavior": null
}
```

### File naming

- One file per component: `docs/component-guidelines/button.json`, `docs/component-guidelines/text-input.json`
- Slugify the component name: lowercase, spaces → hyphens, trim leading whitespace
- Also write an index file: `docs/component-guidelines/_index.json` listing all extracted components with their page IDs and extraction dates

## Step 4 — Generate coverage report

After extraction, present a summary:

```
## Guidelines Extraction Report

Extracted: 12 components
Date: 2026-03-25T15:30:00Z

| Component | Content | Design | Examples | Screenshots | Behavior |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Button | yes | — | — | 13 shots | — |
| Text input | yes | — | — | 6 shots | — |
| Modal | yes | yes | yes | 4 shots | yes |
| ...

### Gaps
- 8 components missing design guidelines
- 15 components missing behavior demos
- 3 components missing ready made examples
```

This helps the content designer see what's documented and what needs work.

## Step 5 — Validate and commit

After extraction:
1. Verify the JSON files are valid: `python3 -c "import json; json.load(open('docs/component-guidelines/button.json'))"`
2. Present the file list and total size to the user
3. Wait for user approval before committing

## Incremental sync

When running on a single component or subset:
- Only extract the specified pages
- Update the corresponding JSON files
- Update `_index.json` with new extraction dates
- Don't touch other component files

## Error handling

- If a frame is empty or has no text content, record it as `null` in the JSON
- If `get_design_context` fails for a frame, fall back to `get_metadata` (text-only, no screenshot)
- If a component page doesn't match the expected structure (no named frames), skip it and note it in the report
- If the Figma API is unavailable, stop and tell the user
