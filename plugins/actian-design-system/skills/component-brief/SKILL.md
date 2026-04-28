---
name: component-brief
description: Generate a structured brief for a DS component with cards (variants, tokens, API, usage, a11y). Accepts Figma URL or component name.
argument-hint: "[Figma URL or component name] [generate N,N,N] [--include-states]"
---

# Component Brief

Generate a structured component brief with HTML spec page and Figma output. Pipeline: research → data model → present options → push.

## Flags

| Flag | Type | Default | Behavior |
|------|------|---------|----------|
| `--include-states` | bool | off | Appends a state matrix card to the brief, generated from the component's documented states. Card lays out all interactive + content states (default, hover, focus, active, disabled, loading, empty, error, populated) using real component instances from the registry. |

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

**Recipe guidance:** Before generating each card's data, read `recipes/brief/_index.json` and the recipe for each selected card from `recipes/brief/`. Follow the recipe's `sections` guidance, `qualityRules` for correctness, and `minimums` for completeness. The component guidelines JSON provides the content; the recipe defines the structure and quality bar.

Generate the complete `brief-data.json` directly. Reference `references/component-brief/data-schema.md` (already loaded in Step 1) and `examples/brief-data-example.json` for expected structure. Include only selected cards.

Write: `{project_working_directory}/components/[name]/[name]-brief-data.json`

**Critical — avoid truncation:** Each card's data must be complete. Common truncation traps:
- `card2_component.variantMatrix` — include ALL variant rows, not just 2-3 examples
- `card4_tokens.colorTokens` — include ALL token bindings for the component
- `card5_api.properties` — include ALL properties from the component guidelines
- `card8_accessibility.requirements` — must have exactly 6 items (2 per column × 3 rows)

**Inline validation after writing:** Check the file you just wrote:
- Every selected card key exists and is non-empty
- No `"..."`, `"etc"`, or `"and more"` in any value (truncation signals)
- All token names use `--zen-` prefix (DS Kit) or `--fm-` prefix (FM)
- No hardcoded hex values in token fields
- `card8_accessibility.requirements` has exactly 6 items (if card 8 selected)
If P0 issues found, fix them immediately before proceeding.

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

## Step 3 — Push to Figma (direct calls)

Read your `brief-data.json` and push directly to Figma using small `use_figma` calls. Read `../../references/component-brief/push-patterns.md` for all patterns. Read `../../references/figma-push-patterns.md` for core patterns (wrapper frame, hexToRgb, etc.). Always pass `skillNames: "figma-use"` to every call.

**Push sequence** (each step is one small `use_figma` call, ~200-2000 bytes; anatomy diagram ~4-6KB):

1. Create wrapper frame (Pattern 0 from component-brief/push-patterns.md — MUST be HORIZONTAL)
2. Create GenLog instance (Pattern 0b — import by key, set 6 meta props, append to wrapper)
3. For each card in the data model:
   a. Create card shell (import briefCard set, set variant + title + subtitle, detach, find content slot)
   b. Populate content: translate data model fields to Plugin API calls using component-brief/push-patterns.md
   c. Card 3 anatomy: use the anatomy diagram pattern (~4-6KB inline call)
   d. Card 4 tokens: compact grid table — one row per state, Color Swatch per cell. Set `.fills` directly on swatch instance (flat, no children). Use `setProperties` for Section Headers (Pattern 2).
   e. Card 8 accessibility: MUST create Requirements grid (Pattern 6) with all 6 a11y cards at 512px wide BEFORE the contrast/ARIA tables — do NOT skip the requirement cards. Use Contrast Badge `setProperties` and A11y Spec Row `setProperties`.
4. After all cards pushed, report to user with count

**Rules:**
- Each `use_figma` call creates 1-3 nodes max — keep calls small
- Return IDs from every call — use them in subsequent calls to append children
- If a call fails, skip that element and continue
- Do NOT run `brief-to-figma.js` — push directly from your data model
- Do NOT read any `.js` files, manifests, or scaffolds
- Code blocks (Cards 8, 9) render as monochrome — single color `#BABED8`, no per-token coloring

### Pushing specific cards only

Read only the relevant card keys from `brief-data.json` and push those cards. Skip the rest.

### Incremental update

To fix a specific card: edit the data model, then re-push just that card using the same patterns. Use `figma.getNodeByIdAsync` to find and remove the old card frame before pushing the replacement.

## Step 4 — Parity check (opt-in)
Manifest includes `sourceHash` (of brief-data.json), `componentKeys` (from push), and `tokenHash` (of tokens file). See `references/parity-check.md` for hash computation.

Only run if the user says "check parity", "screenshot check", or "verify output". Do NOT run automatically after push.

When triggered: per `../../references/parity-check.md` — screenshot each card, dispatch `parity-analyzer`, fix P0s.

## Key rules

Write files silently (never dump in chat). Research → data model → gate runs uninterrupted. If a Figma call fails, skip and proceed.

## References

`references/component-brief/`: `data-schema.md` (JSON schema, 9 DS + 5 FM cards), `figma-rules.md` (pitfalls), `playground.md` (explorer). `references/component-brief/push-patterns.md` (Figma push). `references/quality-tiers.md` (tiers).
