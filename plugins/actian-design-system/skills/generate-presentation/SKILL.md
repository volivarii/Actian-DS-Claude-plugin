---
name: generate-presentation
description: Create a Figma presentation deck from content, research, or a topic description. Supports slide templates and chart patterns.
argument-hint: "[topic, file path, Figma URL, or description of content]"
---

# Generate Presentation

Generate a structured Figma presentation deck using official Actian slide templates. Pipeline: gather content → research gate → outline with gate → build slide-data.json → push to Figma. HTML preview is opt-in ("preview").

Read `../../docs/presentation-guide.md` before generating any slides — primary reference for slide types, typography, colors, sequencing, voice & tone, charts, and review report format.

## Step 1 — Gather content

Read all input material (files, URLs, Figma nodes). Infer audience (default: team update), goal (default: inform). Read `../../references/app-context.md` for correct terminology. Only ask if input is genuinely empty.

## Step 1.5 — Research gate

**MANDATORY** unless prompt contains "no research", "skip research", or provides comprehensive source material. Copy verbatim:

```
Should I research this topic before building slides?
- **Yes** — I'll research best practices, data points, and how others present this topic
- **No, here are references:** — share URLs, files, or notes to use as source material
- **No, just build it** — I'll work with what you've provided
```

**Yes** → `WebSearch` for supporting data, competitor framing, industry benchmarks. Merge findings into outline. **References** → analyze provided material, extract key messages. **No** → proceed directly to outline.

## Step 2 — Outline gate (copy verbatim)

Plan the slide outline using 5 slide types: Cover, Body (Full), Body (Text+Visual), Section divider, Back cover. Slide 1 = Cover, last = Back cover, use Section dividers between major topics. Target 1 message per slide, 8-15 slides typical. Then present:

```
Deck outline: N slides (cover + N body + back cover). Reply:
- **approve** or adjust ("drop slide 3", "add a metrics slide")
- **"preview"** -- HTML preview with annotations before pushing
- **"push [Figma URL]"** -- approve and push directly to Figma
```

## Step 3 — Build slide-data.json and push to Figma

1. Build `slide-data.json`: `meta` (title, targetNodeId, prompt, duration, model, pluginVersion, generatedAt, skill) + `slides[]` (type + type-specific data, structured `content[]` nodes for charts). Reference `examples/slide-data-example.json` for expected structure. Before generating each slide, read `recipes/presentation/_index.json` and the corresponding slide type recipe for structure guidance, quality rules, and content constraints.
   - **Parallel mode (6+ slides):** Dispatch `slide-generator` agents in parallel, splitting slides into batches of 3-4. Each agent receives: batch index, slide details (type, title, content description), presentation context, meta object, output path to `.partial/`. After all complete, merge:
     ```bash
     source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
     "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/merge-partials.js" \
       --type presentation --partials-dir {project_working_directory}/presentations/[topic-slug]/.partial \
       --output {project_working_directory}/presentations/[topic-slug]/slide-data.json
     ```
     Sequential mode (<6 slides): build slide-data.json directly as today.
2. Write to: `{project_working_directory}/presentations/[topic-slug]/slide-data.json`
4. Push to Figma — read `references/figma-push-patterns.md` for component keys and patterns. Read your `slide-data.json` and push incrementally using small `use_figma` calls. Always pass `skillNames: "figma-use"` to every call.

   **Push sequence** (each step is one small `use_figma` call):
   1. Navigate to target page + create wrapper frame (name: "Presentation: [title]")
   2. Create Generation Log instance (import genLog by key, set props, append to wrapper)
   3. For each slide in `slide-data.json`:
      a. Import slide template by key (slideCover, slideBodyFull, slideBodyTV, slideSection, slideBack)
      b. Create instance, set text properties (title, subtitle, body, bullet points)
      c. For charts: create chart frames using structured content nodes
      d. Append slide to wrapper
   4. After all slides pushed, report to user with count

   **Rules:**
   - Each `use_figma` call creates 1-3 nodes max — keep calls small
   - Roboto font, DS Kit tokens (`--zen-*`), 1920×1080 slide dimensions
   - Return IDs from every call — use them to append children
   - If a call fails, skip that slide and continue
   - Do NOT run `slide-to-figma.js` — push directly from your data model
   - Do NOT read any `.js` files, manifests, or scaffolds
5. Parity check per `../../references/parity-check.md`

Write small direct Figma Plugin API calls using patterns from `references/figma-push-patterns.md`. Fix slide-data.json and re-push if something is wrong.

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

- `references/generate-presentation/templates.md` — 8 CSS chart types, slide type details
- `references/quality-tiers.md` — Draft / Standard / Production tier definitions
- `docs/presentation-guide.md` — voice & tone, narrative arc, review report format
- `references/app-context.md` — Actian terminology
- `references/parity-check.md` — post-push parity check procedure
- `references/quality-checklist.md` — cleanup pass checklist
