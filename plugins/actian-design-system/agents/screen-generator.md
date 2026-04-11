---
name: screen-generator
description: |
  Use this agent to generate a batch of flow screens in parallel. Dispatched by generate-flow skill when generating 6+ screens. Each instance produces a partial JSON with its assigned screens.

  <example>
  Context: generate-flow is building an 8-screen flow for data pipeline creation
  user: "Generate a flow for creating data pipelines in Studio"
  assistant: "Dispatching 3 screen-generator agents in parallel for screens 1-3, 4-6, 7-8."
  <commentary>
  8 screens requested — dispatch 3 batches for parallel generation.
  </commentary>
  </example>
model: sonnet
color: cyan
tools: ["Read", "Grep", "Glob", "Write"]
---

# Screen Generator

Generate a batch of flow screens and write the result as a partial JSON file.

## Input

You will receive:
- **Screen numbers** to generate (e.g., "screens 4, 5, 6") with their approved names from the screen list
- **Batch index** (`_index` field — 0-based, for merge ordering)
- **Feature context** — feature name, app, user role, flow description
- **Screen details** — per-screen: name, template, activeNavItem, navItems, pageHeader, content description
- **Output path** for the partial JSON (e.g., `.partial/screens-4-6.json`)
- **Meta object** to include in the partial

## Process

1. Read `references/generate-flow/figma-spec-builder.md` for the content node spec and FM component table
2. Read `recipes/flow/_index.json` — if an archetype matches a screen's purpose, read that recipe and use its skeleton as a starting point
3. For each assigned screen, generate the screen object following the schema exactly
4. Write the partial JSON to the specified output path

## Output format

Write a JSON file containing:
- `meta` — the meta object provided in the prompt (copy as-is)
- `_index` — the batch index (for merge ordering)
- `screens` — array of screen objects for this batch only

Example for screens 4-6:
```json
{
  "meta": { "feature": "Data Pipelines", "app": "Studio", ... },
  "_index": 1,
  "screens": [
    { "name": "Screen 4: Pipeline Detail", "template": "studio", ... },
    { "name": "Screen 5: Edit Pipeline", "template": "studio", ... },
    { "name": "Screen 6: Confirmation", "template": "studio", ... }
  ]
}
```

## Rules

- Generate ONLY the assigned screens — do not generate screens outside your batch
- Follow figma-spec-builder.md for content node types (FRAME, TEXT, INSTANCE, DIVIDER)
- Use FM component refs from the ref table — never hardcode component keys
- Use recipes as accelerators — deviate when the screen needs a novel layout
- All buttons must set `"👁 Leading Icon": false, "👁 Trailing Icon": false`
- Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for push-apart layouts — never Spacer frames
- **Glossary:** If `meta._glossary` is present, use it as the single source for entity names in page headers/breadcrumbs/body text, action verbs in button labels/CTAs, and the active sidebar item. Never invent alternative phrasings for glossary terms.
- **Entity properties:** If generating form fields, table columns, or detail page content for a known entity, read `docs/app-context.json` → `entities[entityId].properties` for standard field names. Use these instead of generic placeholders.
- Feature focus: spotlight the feature, placeholder everything else
- Write the file silently — do not output the JSON to chat
- If you cannot generate a screen (missing information), include a minimal placeholder screen and report DONE_WITH_CONCERNS
