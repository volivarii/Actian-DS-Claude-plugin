---
name: component-brief
description: Document a DS component with structured brief cards (variants, tokens, API, usage, a11y). Accepts Figma URL or component name.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief with HTML spec page and Figma output. Pipeline: research → data model → present options → push.

## Mode detection

| Signal | Mode |
|--------|------|
| "FM", "Fat Marker", "wireframe", "lo-fi" | Fat Marker |
| "DS Kit", "design system", "hi-fi", Figma URL from DS Kit, default with URL | Actian DS |
| Component in FM catalog, no DS Kit signals | Fat Marker |
| Ambiguous | Ask: "Fat Marker (lo-fi) or Actian DS (hi-fi)?" |

Keywords: `"preview"` → HTML; `"playground"` → explorer.

## Step 1 — Research (ONE parallel batch)

Parse URL (`fileKey` + `nodeId` per `../../references/figma-output.md`). ONE message: (1) classify-node via `use_figma` (see figma-output.md — returns node type, name, children), (2) `docs/component-guidelines/<slug>.json`, (3) `references/component-brief/data-schema.md`. Then: route based on node type — if PAGE, pick the COMPONENT_SET child from the classification response; if COMPONENT_SET, use directly. Call `get_design_context` on the resolved target. Fallback: `get_screenshot`.

## Step 1.5 — Present card selection

Before generating the data model, present the available cards and let the user choose. Present the card list for the detected mode:

**DS Kit mode (9 cards):**
```
Component brief for [Name] — 9 cards available:

| # | Card | Content |
|---|------|---------|
| 1 | Header | Component name, description, status, metadata |
| 2 | Component | Real library instances — all variants |
| 3 | Anatomy | Structural breakdown with labeled parts |
| 4 | Tokens | Design token bindings (colors, spacing, typography) |
| 5 | API | Component properties, variants, types |
| 6 | Usage | Do/don't examples, when to use, when not to |
| 7 | Content | Copy guidelines, label patterns, error text |
| 8 | Accessibility | WCAG compliance, keyboard, screen reader |
| 9 | Code | Implementation reference with token mapping |

Generate **all 9** or pick specific cards (e.g., "2,4,6").
```

**FM mode (5 cards):**
```
Component brief for [Name] (Fat Marker) — 5 cards available:

| # | Card | Content |
|---|------|---------|
| 1 | Header | Component name, description, metadata |
| 2 | Component | FM library instances — all variants |
| 3 | Design guidelines | Spacing, sizing, layout rules |
| 4 | Content guidelines | Copy patterns, label rules |
| 5 | Anatomy | Structural breakdown |

Generate **all 5** or pick specific cards (e.g., "1,2,5").
```

If the user pre-specifies cards in the prompt (e.g., "brief Button cards 2,4,5"), skip this gate and generate only those cards.

## Step 2 — Generate data model

**Recipe guidance:** Before generating each card's data, read `recipes/brief/_index.json` and the corresponding card recipe from `recipes/brief/`. Follow the recipe's `sections` guidance for what to include, `qualityRules` for correctness, and `minimums` for completeness. The component guidelines JSON provides the content; the recipe defines the structure and quality bar.

**Parallel mode (6+ DS cards selected):** Dispatch 3 `card-generator` agents in parallel:
- Agent A: cards 1, 2, 3 → `{project_working_directory}/components/[name]/.partial/cards-1-3.json`
- Agent B: cards 4, 5, 6 → `{project_working_directory}/components/[name]/.partial/cards-4-6.json`
- Agent C: cards 7, 8, 9 → `{project_working_directory}/components/[name]/.partial/cards-7-9.json`

Each agent receives: card numbers, component name, library, component guidelines JSON content, meta object, output path. Reference `references/component-brief/data-schema.md` and `examples/brief-data-example.json`.

After all 3 complete, merge:
```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/merge-partials.js" \
  --type brief \
  --partials-dir {project_working_directory}/components/[name]/.partial \
  --output {project_working_directory}/components/[name]/[name]-brief-data.json
```

Dispatch `brief-data-validator` in background on the merged file.

**Sequential mode (<6 cards or FM mode):** Write `{project_working_directory}/components/[name]/[name]-brief-data.json` directly per `../../references/component-brief/data-schema.md`. Reference `examples/brief-data-example.json` for the expected structure. Only include selected cards. Dispatch `brief-data-validator` in background.

## Step 2.5 — Present push options (copy verbatim)

```
Brief ready (N cards). Reply:
- **"push [Figma URL]"** — send to Figma
- **"push N,N"** — send specific cards only
- **"preview"** — HTML preview with annotations
- **"playground"** — interactive state explorer
- **feedback** — edit the data model
```

"push" → Step 3. "preview"/"playground" → Step 2.75 then return. Feedback → edit data, re-present.

## Step 2.75 — Render HTML

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js" \
  {project_working_directory}/components/[name]/[name]-brief-data.json \
  --type brief -o {project_working_directory}/components/[name]/[name]-spec.html
```

## Step 3 — Render Figma

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/brief-to-figma.js" \
  {project_working_directory}/components/[name]/[name]-brief-data.json \
  --target-node-id [nodeId] \
  --output-dir {project_working_directory}/components/[name]/.figma-calls
```

Read `manifest.json`. Push scaffold, then each fill directly — cards appear progressively in Figma:

1. Read `scaffold.js` → `use_figma` (creates wrapper + named section frames)
2. For each fill in order: read `fill-N.js` → `use_figma` (builds cards into section — visible immediately)
3. If any fill fails, skip it and continue with the next. Never retry in a loop.

Each `.js` file is pre-assembled (runtime + spec). Never read `runtime.js` or `.json` files at push time.

## Incremental update (when fixing specific cards after initial push)

When the user asks to fix or update specific cards (e.g., "card 3's anatomy is wrong"):
1. Update the card data in the existing `[name]-brief-data.json`
2. Read `.figma-calls/manifest.json` → check `unitMap` for the affected card key (e.g., `unitMap.card3_anatomy`) — this gives the fill index
3. Re-run brief-to-figma.js with `--fill N` where N is the fill index from unitMap:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/brief-to-figma.js" \
     {project_working_directory}/components/[name]/[name]-brief-data.json \
     --target-node-id [nodeId] \
     --output-dir {project_working_directory}/components/[name]/.figma-calls \
     --fill N
   ```
4. Push only the regenerated `fill-N.js` → `use_figma`

## Step 4 — Parity check

Per `../../references/parity-check.md`: screenshot each card, dispatch `parity-analyzer`, fix P0s.

## Key rules

Write files silently (never dump in chat). Research → data model → gate runs uninterrupted. If a Figma call fails, skip and proceed.

## References

`references/component-brief/`: `data-schema.md` (JSON schema, 9 DS + 5 FM cards), `figma-spec-builder.md` (data→Figma mapping), `figma-rules.md` (pitfalls), `playground.md` (explorer). `references/quality-tiers.md` (tiers).
