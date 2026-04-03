---
name: generate-presentation
description: Use when the user asks to create a presentation, make a deck, turn findings or research into slides, build a pitch or report deck, or provides content and wants it presented visually.
argument-hint: "[topic, file path, Figma URL, or description of content]"
---

# Generate Presentation

Generate a structured Figma presentation deck using official Actian slide templates. Pipeline: gather content → outline with gate → build slide-data.json → push to Figma. HTML preview is opt-in ("preview").

Read `../../docs/presentation-guide.md` before generating any slides — primary reference for slide types, typography, colors, sequencing, voice & tone, charts, and review report format.

## Step 1 — Gather content

Read all input material (files, URLs, Figma nodes). Infer audience (default: team update), goal (default: inform). Read `../../references/app-context.md` for correct terminology. Standard/Production tier: `WebSearch` for supporting data. Only ask if input is genuinely empty.

## Step 2 — Outline gate (copy verbatim)

Plan the slide outline using 5 slide types: Cover, Body (Full), Body (Text+Visual), Section divider, Back cover. Slide 1 = Cover, last = Back cover, use Section dividers between major topics. Target 1 message per slide, 8-15 slides typical. Then present:

```
Deck outline: N slides (cover + N body + back cover). Reply:
- **approve** or adjust ("drop slide 3", "add a metrics slide")
- **"preview"** -- HTML preview with annotations before pushing
- **"push [Figma URL]"** -- approve and push directly to Figma
```

## Step 3 — Build slide-data.json and push to Figma

1. Build `slide-data.json`: `meta` (title, targetNodeId, prompt, duration, model, pluginVersion, generatedAt, skill) + `slides[]` (type + type-specific data, structured `content[]` nodes for charts). Reference `examples/slide-data-example.json` for expected structure.
2. Read `../../references/generate-presentation/figma-spec-builder.md` — input schema + chart patterns
3. Write to: `{project_working_directory}/presentations/[topic-slug]/slide-data.json`
4. Run:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/slide-to-figma.js" slide-data.json \
     --target-node-id "<nodeId>" \
     --output-dir {project_working_directory}/presentations/[topic-slug]/.figma-calls
   ```
5. Read `manifest.json` → for each call: read `call-N.js` → `use_figma` (self-contained, no ID replacement needed)
6. Parity check per `../../references/parity-check.md`

Never write freehand Figma code. Fix slide-data.json and rerun the script if something is wrong.

### HTML preview (opt-in, trigger: "preview")

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js" \
  slide-data.json --type presentation \
  -o {project_working_directory}/presentations/[topic-slug]/[topic-slug]-deck.html
```

Serve, present review report, accept feedback or "push".

## Key rules

- All content uses DS Kit tokens (`--zen-*` prefix), Roboto font
- Charts use `--zen-color-category-N-strong` — never hardcode chart colors
- 1 message per slide, headlines as conclusions ("So what?" test), max 6 bullets or 150 words
- All slide copy follows `../../docs/presentation-guide.md`

## References

- `references/generate-presentation/figma-spec-builder.md` — input schema, chart patterns
- `references/generate-presentation/templates.md` — 8 CSS chart types, slide type details
- `references/quality-tiers.md` — Draft / Standard / Production tier definitions
- `docs/presentation-guide.md` — voice & tone, narrative arc, review report format
- `references/app-context.md` — Actian terminology
- `references/parity-check.md` — post-push parity check procedure
- `references/quality-checklist.md` — cleanup pass checklist
