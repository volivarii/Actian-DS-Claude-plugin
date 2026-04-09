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

## Step 3 — Push to Figma

Read `references/figma-push-patterns.md` for component keys and patterns. Read your `[name]-brief-data.json` and push incrementally using small `use_figma` calls. Always pass `skillNames: "figma-use"` to every call. Look up component keys from `docs/metakit.json` (briefCard, templates, genLog).

**Push sequence:**

### Call 1: Create wrapper
Navigate to target page, create wrapper frame (name: "Component Spec: [name]"), return `wrapperId`.

### Call 2: GenLog
Import genLog by key, create instance, set props from meta, append to wrapper.

### Calls 3+: Each card (one call per card)

**CRITICAL — briefCard structure:** Every card (2-9) is a briefCard instance. The briefCard component has a "Content" child frame. You MUST place card-specific content INSIDE this Content frame, not as siblings:

```js
// 1. Import and instantiate
const set = await figma.importComponentSetByKeyAsync(BRIEF_CARD_KEY);
const variant = set.findChild(n => n.name === "Mode=DS, Type=Standard");
const inst = (variant || set.defaultVariant || set.children[0]).createInstance();
inst.resize(1200, inst.height);

// 2. Set properties BEFORE detach (use exact hash names from metakit.json)
inst.setProperties({ "Title#7:0": cardTitle, "Subtitle#7:1": cardSubtitle });

// 3. Detach
const card = inst.detachInstance();
card.name = "Card N: Title";

// 4. Find Content slot and configure it
const content = card.findOne(n => n.name === "Content");
while (content.children.length) content.children[0].remove();
content.layoutMode = "VERTICAL";
content.itemSpacing = 16;
content.paddingTop = 48;
content.paddingRight = 80;
content.paddingBottom = 48;
content.paddingLeft = 80;
content.primaryAxisSizingMode = "AUTO";
content.counterAxisSizingMode = "AUTO";
card.primaryAxisSizingMode = "AUTO";

// 5. Build content and append INTO the Content frame
const section = figma.createFrame();
section.name = "My Section";
// ... build content ...
content.appendChild(section);  // ← INTO content, NOT card

// 6. Append card to wrapper
const wrapper = await figma.getNodeByIdAsync(wrapperId);
wrapper.appendChild(card);
```

**Card 1 (Header):** Use variant `"Mode=DS, Type=Page Header"`. Set all text properties from card data. No contentSlot needed — Card 1 is just a styled header instance.

**Cards 2-9:** Use variant `"Mode=DS, Type=Standard"`. Follow the Content slot pattern above. Build section titles, tables, annotations etc. and append them into the Content frame.

**Card-specific notes:**
- **Card 3 (Anatomy):** Four sections:
  1. **Structure** — ANATOMY_DIAGRAM with letter badges (A, B, C...) on the component. NO dimension annotations here.
  2. **Specs** — SPECS_DIAGRAM with real `dimAnnotation` and `pointerBadge` Meta Kit instances positioned on a second component instance. Each spec entry needs: `value` (e.g. "24px"), `layerName` (for positioning), and `orientation` (Horizontal/Vertical) or `direction` (Left/Right/Up/Down). Minimum 2 specs.
  3. **Parts reference** — Table with Part letter, Element, Token (--zen-*), and Notes columns.
  4. **States** — Horizontal row of real component instances per interactive state.
- **Card 4 (Tokens):** Use template keys (tableHeaderRow, tableDataRow, swatchRow) for token tables. Import templates, clone, detach, fill text slots.
- **Card 6 (Usage):** Import doDontPair instances for do/don't examples.
- **Card 9 (Code):** Code block frame should be `layoutSizingHorizontal = "FILL"` to span full card width.

**Rules:**
- Return IDs from every call — use them to append children in subsequent calls
- If a call fails, skip that card and continue
- Do NOT run `brief-to-figma.js` — push directly from your data model
- Do NOT read any `.js` files, manifests, or scaffolds

## Incremental update

To fix a specific card: re-read the data model, delete the old card frame in Figma, push the corrected card with small direct calls.

## Step 4 — Parity check (opt-in)

Only run if the user says "check parity", "screenshot check", or "verify output". Do NOT run automatically after push.

When triggered: per `../../references/parity-check.md` — screenshot each card, dispatch `parity-analyzer`, fix P0s.

## Key rules

Write files silently (never dump in chat). Research → data model → gate runs uninterrupted. If a Figma call fails, skip and proceed.

## References

`references/component-brief/`: `data-schema.md` (JSON schema, 9 DS + 5 FM cards), `figma-spec-builder.md` (data→Figma mapping), `figma-rules.md` (pitfalls), `playground.md` (explorer). `references/quality-tiers.md` (tiers).
