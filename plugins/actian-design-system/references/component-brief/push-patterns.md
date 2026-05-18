# Brief Push Patterns

Direct Figma Plugin API patterns for pushing component briefs. Each pattern is a standalone `use_figma` call. Read your `brief-data.json` and translate each card to these patterns.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures. Every code block in this document assumes `skillNames: "figma-use"` is set on the call wrapping it.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

---

## CRITICAL — Frame naming is non-optional

Every `figma.createFrame()` call MUST be followed by an explicit
`.name = "..."` assignment. Frames without explicit names default
to the literal string "Frame" in Figma; mass-anonymity is the v1.71.0
regression tell that the eval lane gates on (assertion A1, ≤5%
literal "Frame").

When you adapt a snippet from this doc, copy the `.name` line. When
you write new frames inline, name them with their role
(e.g. `"Token cell — color swatch"`, `"Variation row — Primary"`,
`"Anatomy badge A"`, `"Gutter pill — 8px — --zen-spacing-sm"`).
Generic names like `"Frame"`, `"Container"`, `"Wrapper"` fail the
eval — pick something that reads like a sensible Figma layer label.

This rule applies to component-brief recipes only. Other patterns
(flow generation, hifi conversion) have their own conventions.

---

## CRITICAL — Pattern 3 + Pattern 4 are fallback documentation only

**The canonical path for every table-shaped surface is the
`renderTable` tool — see [render-table-tool.md](./render-table-tool.md).**

- **ALWAYS** invoke `render-figma.js` via the Bash CLI pattern
  documented in `render-table-tool.md` for: Sizing token tables,
  Color token grids (Card 4), Typography token tables, Anatomy
  parts tables.
- **NEVER** inline table construction (token-pill cells, color
  swatches, anatomy rows) directly in
  `mcp__claude_ai_Figma__use_figma`. Inlining reproduces the
  v1.70.x cell-squash regression that five consecutive doc-layer
  patches failed to fix.
- **NEVER rename frames returned by `render-figma.js`** — the
  interpreter sets the table frame's `.name` to exactly
  `"Table (renderTable)"` so the eval lane can detect interpreter
  invocation. Do NOT add suffixes (`"Table (renderTable) — Sizing"`,
  `"Anatomy parts table (renderTable)"`, etc.) and do NOT replace
  the name. The v1.73.0 eval lane measured a 70% renaming rate
  that broke the A8 strict-equality gate; v1.73.1 makes this rule
  explicit. Pass the interpreter's emitted JS verbatim into
  `use_figma`. If you want to label the table for the canvas,
  set the name on the *parent sub-frame* (e.g. the Tokens sub-
  frame's "Sizing" label heading), not on the renderTable frame.
- **FAILURE to invoke `renderTable` is measured by the v1.73.0
  eval lane A8 assertion** — `--runs 5` × 2 fixtures, every
  per-measurement file must report adoption rate ≥ 80%.
- Pattern 3 + Pattern 4 below remain as fallback documentation per
  `MIGRATIONS.md` Rule 1 (parallel change). They are NOT the
  recommended path; they are preserved against the unverified case
  where the renderTable tool itself fails for a reason unrelated
  to AI adoption.

---

## 0. Wrapper Frame (FIRST CALL — copy exactly)

```js
const page = figma.currentPage;
let maxY = 0;
for (const child of page.children) {
  const bottom = child.y + child.height;
  if (bottom > maxY) maxY = bottom;
}

const wrapper = figma.createAutoLayout('HORIZONTAL', {  // ← MUST be HORIZONTAL, cards go side by side
  itemSpacing: 32,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
wrapper.name = "Component Name — Component Brief";
wrapper.x = 0;
wrapper.y = maxY + 200;
wrapper.setSharedPluginData("ds", "wrapperId", wrapper.id);

// CARD WIDTH HUG (v1.70.0+): Both primary AND counter axis sizing must be
// AUTO so the wrapper grows to fit the widest card AND the tallest card.
// Phase 1 + PR 1 smoke (2026-05-06) showed tables clipping at the right
// edge because some intermediate container had FIXED counter-axis sizing.
// The fix is at every level — wrapper (here), supercard outer frame
// (Pattern 1), and content slot (Pattern 1, v1.69.0+).

return { createdNodeIds: [wrapper.id], mutatedNodeIds: [] };
```

**DO NOT use VERTICAL. Brief cards display in a HORIZONTAL row.**

---

## 0b. Generation Log (SECOND CALL — always include)

Every brief MUST start with a GenLog card as the first child of the wrapper. Import by key, set all 6 properties from `meta`.

**Source values from `brief-data.json.meta`, never from this example.** The values shown below are placeholders — using them literally produces wrong GenLog content (e.g., a stale plugin version). The data-model values were sourced in Step 2 from authoritative inputs (`plugin.json`, the runtime model name, etc.) — pass them through verbatim.

**CRITICAL — property keys MUST be hash-suffixed.** GenLog's properties are typed as `Skill#3:0`, `Prompt#3:1`, `Date#3:2`, `Duration#3:3`, `Model#3:4`, `Plugin Version#3:5`. Bare keys (`"Skill"`, `"Prompt"`, etc.) silently fail with `setProperties` errors and require a recovery round-trip via `node.componentProperties` introspection. Use the suffixed keys verbatim — they are stable across Meta Kit publishes (tracked in `vendor/components/dist/registries/metakit.json`).

```js
// IMPORTANT: read these from your brief-data.json `meta` block, not from the example below.
const meta = briefData.meta;

const comp = await figma.importComponentByKeyAsync("a9653f30925367e96dea90093d750bfe70849571");
const inst = comp.createInstance();
inst.name = "Generation Log";
inst.setProperties({
  "Skill#3:0": "Skill: " + meta.skill,                         // "component-brief"
  "Prompt#3:1": "Prompt: component-brief " + meta.component,   // "Prompt: component-brief Button"
  "Date#3:2": meta.generatedAt,                                // ISO 8601
  "Duration#3:3": "Duration: " + meta.duration,
  "Model#3:4": meta.model,
  "Plugin Version#3:5": "v" + meta.pluginVersion              // e.g. "v1.57.2" — MUST come from project plugin.json, never invented
});

const wrapper = await figma.getNodeByIdAsync("<wrapperId>");
wrapper.appendChild(inst);

return { createdNodeIds: [inst.id], mutatedNodeIds: ["<wrapperId>"] };
```

**Fill all 6 properties from `brief-data.json.meta`.** Do NOT skip this card. Do NOT type any value as a literal — every value must originate in the data model.

---

## 1. Card Shell Pattern

Every card (except GenLog) uses the Brief Card component. Import it, select variant, detach, then set title/subtitle on the **nested Card Header instance** (which stays live after detach).

**Title/subtitle are data-driven** — read `cardTitle` and `cardSubtitle` from the card object in `brief-data.json`. Never hardcode card titles in the push step. Recipe titles in `recipes/brief/cardN-*.json` are the canonical source — Step 2 propagates them into the data model.

**Detecting silent setProperties failures (post-v1.66.0).** Meta Kit defaults for the Card Header are now the neutral placeholders `"Card title"` / `"Subtitle text"`. Earlier defaults were real strings (e.g. `"Anatomy"`) which masked failed `setProperties` calls — one failed card looked indistinguishable from a real Anatomy card. With the new neutral defaults, any leak is obvious and identifies the failure precisely. If a pushed card shows `"Card title"` or `"Subtitle text"` verbatim, the failure is upstream — investigate before continuing.

```js
// Inputs from your data model — e.g., briefData.card_anatomy
const cardTitle = card.cardTitle;       // "Anatomy"
const cardSubtitle = card.cardSubtitle; // "Component structure, dimensions, ..."

// Import briefCard set and create variant instance
const set = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
let variant = set.query('[name="Mode=DS, Type=Standard"]').first();
if (!variant) variant = set.defaultVariant || set.children[0];
const inst = variant.createInstance();
inst.name = cardTitle;
const cardFrame = inst.detachInstance();

// CARD WIDTH HUG (v1.70.0+): The detached card frame inherits Meta Kit's
// auto-layout settings, but its counter-axis (vertical) sizing may be
// FIXED if the Meta Kit briefCard component was constrained. Force AUTO
// at the supercard outer frame level so the card grows to fit content.
// Phase 1 + PR 1 smoke showed tables clipping despite content-slot AUTO
// — the fix needed to propagate up to the supercard outer frame too.
if (typeof cardFrame.primaryAxisSizingMode !== "undefined") {
  cardFrame.primaryAxisSizingMode = "AUTO";
}
if (typeof cardFrame.counterAxisSizingMode !== "undefined") {
  cardFrame.counterAxisSizingMode = "AUTO";
}

// Card Header stays as a live instance — set properties on it.
// IMPORTANT (v1.66.4+): match the Card Header instance by NAME SUBSTRING, not
// exact equality. Depending on Meta Kit publish state, the instance may be
// named "Card Header", "Brief Card Header", or "Meta / Chrome / Brief Card
// Header" (full library path). An exact-match selector silently fails, the
// `if (cardHeader)` branch is skipped, no setProperties call runs, and the
// neutral Meta Kit defaults ("Card title" / "Subtitle text") leak into the
// brief.
const cardHeader = cardFrame.query('INSTANCE[name*="Card Header"]').first();
if (!cardHeader) {
  // Loud fail rather than silent leak — Meta Kit structure may have changed.
  throw new Error(
    "Card Shell push: no nested Card Header instance found in detached " +
    "frame. Expected name to contain 'Card Header'. Inspect the variant " +
    "structure and update this selector."
  );
}
cardHeader.setProperties({
  "Title#140:0": cardTitle,
  "Subtitle#140:1": cardSubtitle,
  "Show Subtitle#140:2": Boolean(cardSubtitle)
});

// Read-back verification — catch silent setProperties failures (e.g. property
// IDs renamed in a future Meta Kit publish). If the title still equals the
// neutral default, the property assignment didn't take effect.
const titleNode = cardHeader.query('TEXT[name="Title"]').first();
if (titleNode && titleNode.characters === "Card title") {
  throw new Error(
    "Card Header title shows the Meta Kit default ('Card title') after " +
    "setProperties — the assignment didn't apply. Check property IDs " +
    "(#140:0 / #140:1) against the current Meta Kit publish."
  );
}

// Find content slot for child injection.
// IMPORTANT (v1.66.2+): do NOT override padding / itemSpacing / layoutMode
// here. The detached frame inherits Meta Kit's auto-layout values, and
// those are the source of truth — overriding them in code makes Meta Kit
// edits invisible (the "Card padding doesn't pick up" symptom).
// If a content slot lands without auto-layout (rare, only on legacy
// instances), fix the Meta Kit component rather than re-introducing
// hardcoded values here.
//
// CARD WIDTH HUG FIX (v1.69.0+): the content slot's primary axis sizing
// must be AUTO so the supercard grows to fit the widest table. Phase 1
// smoke (2026-05-06) showed Tokens tables clipping at the right edge
// because the content slot was inheriting a FIXED width from Meta Kit.
// Override here at slot level only — Meta Kit's padding/itemSpacing stay
// intact.
const contentSlot = cardFrame.query('[name="Content"]').first();
if (contentSlot) {
  contentSlot.primaryAxisSizingMode = "AUTO";
  contentSlot.counterAxisSizingMode = "AUTO";
}

// Append to wrapper
const wrapper = await figma.getNodeByIdAsync("<wrapperId>");
wrapper.appendChild(cardFrame);

return {
  createdNodeIds: [cardFrame.id],
  mutatedNodeIds: ["<wrapperId>", ...(contentSlot ? [contentSlot.id] : [])],
  contentSlotId: contentSlot?.id || cardFrame.id,
};
```

**Card Header stays live after detach.** Use `setProperties` with `Title#140:0`, `Subtitle#140:1`, `Show Subtitle#140:2`. For the Page Header variant (card1), use `"Mode=DS, Type=Page Header"` and set `"Component Name#7:2"` (= `card.name`) and `"Description#7:3"` (= `card.description`) instead. The `cardTitle`/`cardSubtitle` fields still apply but are not surfaced visually on Page Header.

### 1d. Section 1 supercard (v1.67.0+)

Section 1 is ONE card with four nested sub-frames inside, not three separate cards. After Pattern 1 creates the card and contentSlot, build sub-frames in the slot:

```js
// Inputs from data: briefData.card_component, .card_anatomy, .card_tokens
// Use cardTitle "Anatomy, variation, tokens & specs" (default in renderer; recipe-overridable).

// v1.87.0: Promise.all parallelizes the font fetches — one round-trip vs N sequential.
// "Semi Bold" with a space — Inter's registered style name (figma-use gotchas).
await Promise.all([
  { family: "Inter", style: "Regular" },
  { family: "Inter", style: "Semi Bold" },
].map(fn => figma.loadFontAsync(fn)));

const slot = await figma.getNodeByIdAsync("<contentSlotId>");

async function appendSubFrame(label, sourceCard) {
  const sub = figma.createAutoLayout('VERTICAL', {
    itemSpacing: 12,
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    fills: [],
  });
  sub.name = label;

  // Heading row — label + optional Draft badge
  const heading = figma.createText();
  heading.fontName = { family: "Inter", style: "Semi Bold" };
  heading.fontSize = 16;
  heading.characters = label;

  if (sourceCard && sourceCard._source === "generated" && sourceCard._authored !== true) {
    // Append a small "DRAFT" tag next to the heading.
    // Wrap heading + tag in a HORIZONTAL frame so they sit on the same row.
    // Note: Pattern 1b's badge construction lives in a separate use_figma
    // call scope and cannot be copy-pasted here — build the tag inline:
    const headerRow = figma.createAutoLayout('HORIZONTAL', {
      itemSpacing: 8,
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      counterAxisAlignItems: 'CENTER',
      fills: [],
    });
    headerRow.name = "Heading + DRAFT tag";
    headerRow.appendChild(heading);
    const tag = figma.createText();
    tag.fontName = { family: "Inter", style: "Semi Bold" };
    tag.fontSize = 10;
    tag.characters = "DRAFT";
    tag.fills = [{ type: "SOLID", color: { r: 0.44, g: 0.49, b: 0.59 } }];
    headerRow.appendChild(tag);
    sub.appendChild(headerRow);
  } else {
    sub.appendChild(heading);
  }

  // Append body content per sub-section type:
  // label === "Anatomy"   → Pattern 9 (Anatomy Diagram with badges + leader lines) + Pattern 3 (parts table)
  // label === "Variation" → variant matrix push (see Pattern 8 — Variant Instance)
  // label === "Tokens"    → color swatch grid + sizing/typography tables (see Pattern 4 + Pattern 3)
  // label === "Specs"     → Pattern 14 (Specs Redline — auto-extracted from instance, with optional card_anatomy.specs override)

  slot.appendChild(sub);
  return sub;
}

// Order matches HTML renderer:
const anatomyFrame = await appendSubFrame("Anatomy", briefData.card_anatomy);
const divider1 = figma.createLine();  // horizontal divider; or reuse cardDivider styling
slot.appendChild(divider1);

const variationFrame = await appendSubFrame("Variation", briefData.card_component);
slot.appendChild(figma.createLine());

const tokensFrame = await appendSubFrame("Tokens", briefData.card_tokens);
if (briefData.card_anatomy && briefData.card_anatomy.specs && briefData.card_anatomy.specs.length) {
  slot.appendChild(figma.createLine());
  await appendSubFrame("Specs", briefData.card_anatomy);
}
```

The supercard's outer Card Header (Title #140:0 / Subtitle #140:1) is set on the cardHeader instance once via Pattern 1, using "Anatomy, variation, tokens & specs" / "Structural breakdown, variants, token bindings, and dimension specs" — or the recipe overrides if specified.

Pattern 1b (Source Badge) applies to the supercard as a whole, derived using the same "most permissive wins" logic the HTML renderer uses (see `pickSection1Provenance` in brief-renderer.js).

---

## 1b. Source Badge Pattern

Every card shell push gains a small text node bound to `card._source`. Add this AFTER Pattern 1 (Card Shell), inside the card title row:

```js
// After card shell created (Pattern 1), inside the card title row:
mcp_use_figma({
  skillNames: "figma-use",
  message: `
    var titleRow = await figma.getNodeByIdAsync('<TITLE_ROW_ID>');
    var badge = figma.createText();
    badge.fontName = { family: "Inter", style: "Medium" };
    badge.characters = card._source === "figma" ? "Source: Figma" :
                        (card._fallback ? "Source: Claude (placeholder)" : "Source: Claude");
    badge.fontSize = 10;
    var color = card._source === "figma" ?
      { r: 0.10, g: 0.36, b: 0.13 } :       // green-700
      (card._fallback ? { r: 0.90, g: 0.32, b: 0 } : { r: 0.42, g: 0.42, b: 0.42 });
    badge.fills = [{ type: 'SOLID', color: color }];
    titleRow.appendChild(badge);
  `
});
```

The badge is informational, not interactive. Renders inline next to card title.

---

## 2. Section Header Pattern

```js
const comp = await figma.importComponentByKeyAsync("f4fd576001f4f1f4606a4efb051d1e4492e378c4");
const header = comp.createInstance();
header.setProperties({
  "title#86:0": "Section Title",
  "subtitle#86:1": "Optional subtitle",
  "Show Subtitle#138:0": false
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(header);
header.layoutSizingHorizontal = "FILL";
return { createdNodeIds: [header.id], mutatedNodeIds: ["<contentSlotId>"] };
```

**Do NOT detach.** Use `setProperties` with hash-suffixed names. Set `"Show Subtitle#138:0": false` to hide the subtitle, `true` to show it.

---

## 3. Table Pattern (API, Sizing, Typography, ARIA, Contrast)

> **Status (v1.73.0 — A3+ experimental gate):** This pattern is **fallback documentation only**. The canonical path for every table-shaped surface is the `renderTable` tool (see `render-table-tool.md`). **ALWAYS** invoke `render-figma.js` via the Bash CLI pattern; **NEVER** inline `appendTokenTagCell` or equivalent construction directly in `mcp__claude_ai_Figma__use_figma`. Inlining reproduces the v1.70.x cell-squash regression that five consecutive patches failed to fix and the v1.72.1 eval lane empirically measured as inter-run variance. This block remains in the document only because of `MIGRATIONS.md` Rule 1 (parallel change) — the helper is preserved as a documented fallback until A3+ adoption is smoke-verified, NOT as a recommended path. The v1.73.0 ship gate requires the eval lane (`--runs 5` × 2 fixtures = 10 measurements) to report renderTable adoption rate ≥ 80% on every measurement.

Build tables row-by-row. Each row is an auto-layout frame with text cells.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

// v1.87.0: Promise.all parallelizes the font fetches — one round-trip vs N sequential
await Promise.all([
  { family: "Inter", style: "Regular" },
  { family: "Inter", style: "Semi Bold" },
  { family: "Fira Code", style: "Regular" },
].map(fn => figma.loadFontAsync(fn)));

const parent = await figma.getNodeByIdAsync("<contentSlotId>");

// Header row
const headerRow = figma.createAutoLayout('HORIZONTAL', {
  itemSpacing: 0,
  fills: [{ type: "SOLID", color: hexToRgb("#F5F5FA") }],
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
});
headerRow.name = "Header Row";

const headers = ["", "Property", "Type", "Default", "Values", "Notes"];
const widths = [50, 140, 100, 120, 200, 350];
for (let i = 0; i < headers.length; i++) {
  const cell = figma.createText();
  cell.characters = headers[i];
  cell.fontName = { family: "Inter", style: "Semi Bold" };
  cell.fontSize = 12;
  cell.fills = [{ type: "SOLID", color: hexToRgb("#595968") }];
  cell.resize(widths[i], cell.height);
  headerRow.appendChild(cell);
}
parent.appendChild(headerRow);
headerRow.layoutSizingHorizontal = "FILL";

// Data rows — one call per row or batch
// Each row: same layout, different text content, "Inter:Regular" font
// REQ/OPT badge: small frame with colored fill + text
return { createdNodeIds: [headerRow.id], mutatedNodeIds: ["<contentSlotId>"] };
```

**Token Tag styling (v1.69.0+, with v1.70.4+ HUG guard restored in v1.71.1):** When a table cell contains a `--zen-*` token name, render the cell as a Token Tag pill instead of plain text. Use the `appendTokenTagCell` helper below — calling it is materially safer than inlining the same construction (smoke history: when the AI inlined the token-tag layout, every variant of the construction crushed cells to 1px; calling the helper directly is the only path that's been smoke-clean).

```js
async function appendTokenTagCell(parentRow, tokenText) {
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  const labelFrame = figma.createAutoLayout('HORIZONTAL', {
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
    cornerRadius: 3,
    fills: [{ type: "SOLID", color: { r: 0.941, g: 0.949, b: 0.984 } }], // ~#F0F2FA
  });
  labelFrame.name = "Token: " + tokenText;

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.fontSize = 12;
  text.characters = tokenText;
  text.fills = [{ type: "SOLID", color: { r: 0.020, g: 0.314, b: 0.863 } }]; // ~#0550DC
  labelFrame.appendChild(text);

  parentRow.appendChild(labelFrame);

  // HUG-after-append guards (v1.70.4+):
  //   1. labelFrame hugs its own content (intrinsic ~17px tall).
  //   2. parentRow MUST hug its tallest child too — this is the load-bearing
  //      fix. Without (2), any row whose cells were sized via cell.resize(w, h)
  //      ends up with FIXED counter-axis sizing (or short intrinsic height
  //      from a single-line text node), and parent.clipsContent = true (frame
  //      default) clips the labelFrame to the row's old ~1px height.
  //
  //      v1.70.0/1/2 patches set HUG on labelFrame only — the labelFrame grew
  //      internally, but the parent row never expanded, so the cell still
  //      visually rendered as a 1px line (the recurring Checkbox/Variation
  //      /Tokens/Sizing/Typography squash observed across multiple smokes).
  if (typeof labelFrame.layoutSizingVertical !== "undefined") {
    labelFrame.layoutSizingVertical = "HUG";
  }
  if (typeof labelFrame.layoutSizingHorizontal !== "undefined") {
    labelFrame.layoutSizingHorizontal = "HUG";
  }
  if (parentRow.layoutMode === "NONE") {
    parentRow.layoutMode = "HORIZONTAL";
  }
  parentRow.counterAxisSizingMode = "AUTO";
  parentRow.counterAxisAlignItems = "CENTER";
  if (typeof parentRow.layoutSizingVertical !== "undefined") {
    parentRow.layoutSizingVertical = "HUG";
  }

  return labelFrame;
}
```

Use this for token-name cells in: parts table (Pattern 9 anatomy parts table), sizing table (Card 1 supercard Tokens sub-frame), typography table (same), contrast row token columns. Plain-text cells remain for non-token columns (Element name, Notes, Value).

---

## 4. Color Swatch Cell Pattern (Card 4 Color Token Grid)

> **Status (v1.73.0 — A3+ experimental gate):** This pattern is **fallback documentation only** for the Card 4 color grid. The canonical path is the `renderTable` `color-swatch` cell type (see `render-table-tool.md`). **ALWAYS** invoke the renderTable tool; **NEVER** inline color-grid construction. Same regression class as Pattern 3 — the v1.72.1 eval lane measured the failure mode as inter-run variance. Preserved per `MIGRATIONS.md` Rule 1 only.

**MANDATORY for Card 4 (Design Tokens) color table.** Build a compact grid: one row per state, one Color Swatch + token name per column. This keeps the table dense and readable.

Each color cell is a small frame containing: Color Swatch instance (colored dot) + token name text.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

const set = await figma.importComponentSetByKeyAsync("da3369932f710386b76ca91a40ebd48d94e3f2e0");
let variant = set.query('[name="Size=Small"]').first();
if (!variant) variant = set.defaultVariant || set.children[0];
const swatch = variant.createInstance();

// Set fill color — the swatch IS the dot (flat 12×12 instance, NO children)
swatch.fills = [{ type: "SOLID", color: hexToRgb("#0550DC") }];

return { createdNodeIds: [swatch.id], mutatedNodeIds: [] };
```

**CRITICAL:** The Color Swatch component is a flat 12×12 instance with NO children — set `.fills` directly on the swatch instance itself. Do NOT use `findOne` to look for a "Dot" or "Color" child — it will return null and the fill will never be set.

**Cell sizing (REQUIRED — prevents hex clipping):** The swatch cell wraps a 12px swatch + a stacked text block (token name 15px + hex 13px ≈ 30px tall). The cell must Hug its content vertically — never fix the height to the swatch dot. Each cell MUST set:

```js
const cell = figma.createAutoLayout('HORIZONTAL', {
  itemSpacing: 8,
  counterAxisAlignItems: 'CENTER',          // vertically center swatch + text block
  primaryAxisSizingMode: 'AUTO',            // Hug width
  counterAxisSizingMode: 'AUTO',            // Hug height — fits the 30px text stack
  fills: [],
});
cell.name = "Token cell — color swatch";

// Swatch (12×12 instance, fills set per above)
cell.appendChild(swatch);

// Text stack (token name on top, hex below)
const textStack = figma.createAutoLayout('VERTICAL', {
  itemSpacing: 2,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
textStack.name = "Token name + hex";
// ... append token-name text node + hex text node ...
cell.appendChild(textStack);
```

Regression guard: if the cell or its parent row uses `counterAxisSizingMode = "FIXED"` or sets a hard `cell.resize(_, 20)`, the second line clips. Always Hug.

**Token Tag styling (v1.69.0+, with v1.70.4+ HUG guard):** The token-name text below the swatch dot must use the Token Tag pill style — same construction as Pattern 3's `appendTokenTagCell`. The hex value text below the token name stays as plain monospace text (it's not a token reference). Replace the `// token-name text node` placeholder with a call to `appendTokenTagCell(textStack, tokenName)` or the inline equivalent.

**Regression guard (v1.70.4+, supersedes v1.70.0):** When inlining the token-tag construction (i.e., not calling `appendTokenTagCell` directly), apply the SAME guards the helper applies — both on the labelFrame (HUG on both axes) AND on the textStack/parentRow (`counterAxisSizingMode = "AUTO"`, `layoutSizingVertical = "HUG"`). v1.70.0–1.70.2 patched only the labelFrame; the parent row stayed at its old ~1px height and clipped the labelFrame visually (the recurring Checkbox/Variation/Tokens/Sizing/Typography squash). The fix MUST hit the parent.

**Table layout:** Build as a header row (state + column names) + data rows. Each data row: state label text + N swatch cells. The data row frame should use `layoutMode = "HORIZONTAL"`, `counterAxisAlignItems = "CENTER"`, and `counterAxisSizingMode = "AUTO"` so it grows to the tallest cell. Batch 2-3 rows per `use_figma` call.

---

## 5. Do/Don't Pair Pattern

```js
const set = await figma.importComponentSetByKeyAsync("28edfacf13e50706586172bd48f8a3ad84d7c263");
let variant = set.query('[name="Mode=DS"]').first();
if (!variant) variant = set.defaultVariant || set.children[0];
const pair = variant.createInstance();
pair.setProperties({
  "Do Label#9:8": "Do — Use sentence case",
  "Don't Label#9:9": "Don't — Use ALL CAPS",
  "Do Example#9:10": "Save changes",
  "Don't Example#9:11": "SAVE CHANGES"
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(pair);
pair.layoutSizingHorizontal = "FILL";
return { createdNodeIds: [pair.id], mutatedNodeIds: ["<contentSlotId>"] };
```

---

## 6. Accessibility Card Pattern

**Layout (v1.66.3+):** Requirements render as a **simple vertical bulleted list** — bold title + plain body, one per row. The previous 2×3 a11y-card grid is retired (visual noise without proportional information density). This matches the simplified HTML renderer (Brief Refresh v2 Phase 1).

```js
// v1.87.0: Promise.all parallelizes the font fetches — one round-trip vs N sequential
// "Semi Bold" with a space — Inter's registered style name (figma-use gotchas).
await Promise.all([
  { family: "Inter", style: "Regular" },
  { family: "Inter", style: "Semi Bold" },
].map(fn => figma.loadFontAsync(fn)));

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0,2),16)/255,
    g: parseInt(h.substring(2,4),16)/255,
    b: parseInt(h.substring(4,6),16)/255
  };
}

const list = figma.createAutoLayout('VERTICAL', {
  itemSpacing: 8,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
list.name = "Requirements";

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(list);
list.layoutSizingHorizontal = "FILL";

// One row per requirement: "Title — body description". The title portion
// is bold; the rest is regular body weight.
for (const req of requirements) {
  const t = figma.createText();
  t.fontName = { family: "Inter", style: "Regular" };
  t.fontSize = 14;
  t.lineHeight = { unit: "PERCENT", value: 160 };
  t.fills = [{ type: "SOLID", color: hexToRgb("#2d3648") }];
  const sep = " — ";
  t.characters = req.title + sep + req.body;
  // Bold + darker color for the title portion only.
  t.setRangeFontName(0, req.title.length, { family: "Inter", style: "Semi Bold" });
  t.setRangeFills(0, req.title.length, [{ type: "SOLID", color: hexToRgb("#101828") }]);
  list.appendChild(t);
  t.layoutSizingHorizontal = "FILL";
}

return { createdNodeIds: [list.id], mutatedNodeIds: ["<contentSlotId>"] };
```

**No more 6-card grid, no per-card code blocks.** The `code` field on each requirement (still in the data schema for back-compat) is ignored by this pattern. If a requirement genuinely needs a code example, surface it in the body text or move it to the ARIA table — don't bring back the grid.

After the requirements list, render the Contrast and ARIA tables (unchanged — Patterns 4 / 8 etc.).

---

## 7. Bullet Row Pattern (Usage: When to use / When not to use)

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

const parent = await figma.getNodeByIdAsync("<contentSlotId>");

// Green "+" bullet for "when to use"
const row = figma.createAutoLayout('HORIZONTAL', {
  itemSpacing: 8,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [],
});
row.name = "Usage row — when to use";

const prefix = figma.createText();
prefix.characters = "+";
prefix.fontSize = 14;
prefix.fontName = { family: "Inter", style: "Regular" };
prefix.fills = [{ type: "SOLID", color: hexToRgb("#16A34A") }]; // green
row.appendChild(prefix);

const label = figma.createText();
label.characters = "Single-line text entry (names, emails, search queries)";
label.fontSize = 14;
label.fontName = { family: "Inter", style: "Regular" };
label.fills = [{ type: "SOLID", color: hexToRgb("#3A3A4A") }];
row.appendChild(label);

parent.appendChild(row);
row.layoutSizingHorizontal = "FILL";

// For "when NOT to use", use "−" prefix with hexToRgb("#DC2626") (red)
return { createdNodeIds: [row.id], mutatedNodeIds: ["<contentSlotId>"] };
```

---

## 8. Variant Instance Pattern (Card 2: Component)

```js
// Import the TARGET component (the one being documented) by node ID
const targetNode = await figma.getNodeByIdAsync("<targetNodeId>");

// For component sets: find specific variant
let variantComp;
if (targetNode.type === "COMPONENT_SET") {
  variantComp = targetNode.query('[name="Type=Standard, State=Default"]').first();
  if (!variantComp) variantComp = targetNode.defaultVariant || targetNode.children[0];
} else {
  variantComp = targetNode;
}

const inst = variantComp.createInstance();
inst.name = "Default variant";

return { createdNodeIds: [inst.id], mutatedNodeIds: [] };
```

For theme comparison frames, set `variableMode` after creating the frame:

```js
const frame = figma.createFrame();
frame.name = "Theme: Actian";
// ... add instance as child ...

// Set variable mode for this frame's scope
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCol = collections.find(c => c.name === "Color");
if (colorCol) {
  const actianMode = colorCol.modes.find(m => m.name === "Actian");
  if (actianMode) frame.setExplicitVariableModeForCollection(colorCol, actianMode.modeId);
}
```

**Variation Matrix construction (v1.70.0+):** When building a 2D state matrix for the Section 1 Variation sub-frame (e.g., Checkbox state matrix with rows = No/Yes/Indeterminate × columns = Default/Hover/Focus/Pressed/Disabled), each cell contains a real component instance. Cells are children of HORIZONTAL row frames. The same regression that bit `appendTokenTagCell` bites here: row sizing crushes child instances to 1px.

> **Rule 8 (figma-use v2.1.26):** Font preload is mandatory before `appendChild` on a
> component instance — the instance carries the component's fonts which may be unloaded.
> The CALLER of `appendVariationCell` MUST preload the instance's fonts before passing it
> to this function. Use the pattern:
> ```js
> // v1.87.0: O(n) Set-based dedup; see figma-push-patterns.md Rule 8 canonical template
> const _seen = new Set();
> const _fonts = [];
> instance.findAll(n => n.type === "TEXT").forEach(t => {
>   const fn = t.fontName;
>   if (!fn || typeof fn !== 'object') return;
>   const key = fn.family + '|' + fn.style;
>   if (_seen.has(key)) return;
>   _seen.add(key); _fonts.push(fn);
> });
> await Promise.all(_fonts.map(fn => figma.loadFontAsync(fn)));
> await appendVariationCell(parentRow, instance);
> ```
> (Source: figma-use/SKILL.md:8)

```js
async function appendVariationCell(parentRow, instance) {
  parentRow.appendChild(instance);
  if (typeof instance.layoutSizingVertical !== "undefined") {
    instance.layoutSizingVertical = "HUG";
  }
  if (typeof instance.layoutSizingHorizontal !== "undefined") {
    instance.layoutSizingHorizontal = "HUG";
  }
  return instance;
}
```

Apply this to every cell in the Variation matrix. Without the guard, Phase 2 PR 1 smoke showed Checkbox cells rendering as ~1px tall horizontal lines instead of the actual 24×24 Checkbox instance.

---

## 9. Anatomy Diagram Pattern (Section 1 Anatomy sub-frame, v1.70.0+)

> **Rule 8 (figma-use v2.1.26):** Font preload is mandatory before any of
> `appendChild`, `insertChild`, `setBoundVariable`, `setExplicitVariableModeForCollection`,
> `setValueForMode`, or `findAll` callbacks if the touched subtree contains
> unloaded fonts. Pre-existing component instances often carry unloaded fonts.
> Pattern 9 creates a component instance from a pre-existing DS component — the
> font preload block below (before `container.appendChild(inst)`) is load-bearing.
> (Source: figma-use/SKILL.md:8)

Single ~4-6KB call. Creates component instance, reads bounding boxes, computes badge positions, draws badges + leader lines.

**CRITICAL: `figmaLayerName` accuracy.** The badge placement algorithm uses `query('[name="<figmaLayerName>"]').first()` to locate each part within the component instance. If a layer name doesn't match, the badge won't be positioned correctly. Before building the data model, use `get_metadata` or `get_design_context` on the target component to read the actual layer names. Common patterns: "Label", "Container", "Icon", "Helper text" — but ALWAYS verify against the real Figma structure.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

// Config
const BADGE_SIZE = 22;
const LINE_WEIGHT = 1.5;
const BADGE_COLOR = hexToRgb("#1A1A2E");
const PADDING = 48;

// 1. Create container
const container = figma.createFrame();
container.name = "Anatomy diagram";
container.fills = [{ type: "SOLID", color: hexToRgb("#FAFAFF") }];

// 2. Create target component instance — render the Enabled/Default state.
//    Per cross-DS convention (Carbon, Material 3, Polaris, Atlassian, Apple HIG),
//    anatomy diagrams always show the resting state. State-conditional parts
//    (focus ring, hover surface) are dropped from the diagram and footnoted
//    in the parts table.
const targetNode = await figma.getNodeByIdAsync("<targetNodeId>");
let variantComp;
if (targetNode.type === "COMPONENT_SET") {
  // Prefer Enabled / Default state; fall back to defaultVariant or first child
  variantComp = targetNode.query('[name*="State=Default"], [name*="State=Enabled"]').first();
  if (!variantComp) variantComp = targetNode.defaultVariant || targetNode.children[0];
} else {
  variantComp = targetNode;
}
const inst = variantComp.createInstance();

// Rule 8 (figma-use v2.1.26): font preload is mandatory before appendChild on a
// pre-existing component instance — the instance carries the component's fonts which
// may be unloaded. Collect unique fontNames from the instance subtree and load them
// all before appending. Without this, Figma silently fails on text operations inside
// the instance (intermittent failures on supercards with pre-existing instances).
// v1.87.0: O(n) Set-based dedup (was O(n²) JSON.stringify) — see figma-push-patterns.md Rule 8.
const _seenP9 = new Set();
const _instFonts = [];
inst.findAll(n => n.type === "TEXT").forEach(t => {
  const fn = t.fontName;
  if (!fn || typeof fn !== 'object') return;
  const key = fn.family + '|' + fn.style;
  if (_seenP9.has(key)) return;
  _seenP9.add(key); _instFonts.push(fn);
});
await Promise.all(_instFonts.map(fn => figma.loadFontAsync(fn)));

container.appendChild(inst);

// 2a. Pick scale factor — heuristic per pickScale (mirrors scripts/lib/anatomy-scale.js):
//     smallest scale in {1,2,3,4} where the smaller axis × scale exceeds 80px.
//     Override via card_anatomy.anatomyScale or component-guidelines/<slug>.json
//     anatomyScale field.
function pickScale(width, height, override) {
  if (override !== null && override !== undefined) {
    if (!Number.isInteger(override) || override < 1 || override > 4) {
      throw new Error("Invalid anatomyScale override: " + override);
    }
    return override;
  }
  const smaller = Math.min(width, height);
  for (let s = 1; s <= 4; s++) {
    if (smaller * s > 80) return s;
  }
  return 4;
}
const scaleOverride = card_anatomy?.anatomyScale ?? null;
const scale = pickScale(inst.width, inst.height, scaleOverride);

// Apply scale by wrapping in a fixed-size frame and resizing.
// (instance.scale() may not be supported on instances in all Plugin API versions.)
inst.x = PADDING;
inst.y = PADDING;
if (scale > 1) {
  const origW = inst.width;
  const origH = inst.height;
  inst.resize(origW * scale, origH * scale);
}
const iw = inst.width;
const ih = inst.height;
container.resize(iw + PADDING * 2, ih + PADDING * 2);

// 2b. Filter anatomy parts: only those whose figmaLayerName is present in the
//     rendered Enabled state get badges; absent parts get footnoted rows in the
//     parts table.
const allLayerNames = new Set();
function collectNames(node) {
  // v1.70.1: skip invisible layers entirely. Without this guard, layers that
  // exist but are hidden in the rendered state (e.g., Checkbox's Check icon
  // in the Unchecked variant) get their name added to allLayerNames, the
  // "drop absent parts" filter passes them through, and badges are placed
  // pointing at empty space.
  if (node.visible === false) return;
  if (node.name) allLayerNames.add(node.name);
  for (const c of (node.children || [])) collectNames(c);
}
collectNames(inst);
const visibleParts = [];
const absentParts = [];
for (const p of (card_anatomy.parts || [])) {
  if (allLayerNames.has(p.figmaLayerName)) visibleParts.push(p);
  else absentParts.push(p);
}

// 3. Read bounding boxes for visible parts (absent parts handled separately)
const partData = [];
for (const p of visibleParts) {
  const layer = inst.query(`[name="${p.figmaLayerName}"]`).first();
  if (!layer) continue;
  const bb = layer.absoluteBoundingBox;
  const cbb = container.absoluteBoundingBox;
  const relX = bb.x - cbb.x;
  const relY = bb.y - cbb.y;
  const cx = relX + bb.width / 2;
  const cy = relY + bb.height / 2;
  // Closest edge — left-then-top tiebreaker (EightShapes Specs convention).
  // Mirrors scripts/lib/anatomy-filter.js pickClosestEdge.
  const distLeft = relX;
  const distTop = relY;
  const distRight = (PADDING + iw) - (relX + bb.width);
  const distBottom = (PADDING + ih) - (relY + bb.height);
  const ordered = [["left", distLeft], ["top", distTop], ["right", distRight], ["bottom", distBottom]];
  let side = ordered[0][0];
  let minDist = ordered[0][1];
  for (let oi = 1; oi < ordered.length; oi++) {
    if (ordered[oi][1] < minDist) { side = ordered[oi][0]; minDist = ordered[oi][1]; }
  }
  partData.push({ ...p, cx, cy, relX, relY, w: bb.width, h: bb.height, side });
}

// 4. Redistribute overflow (max 3 per side)
const sides = { top: [], right: [], bottom: [], left: [] };
for (const pd of partData) sides[pd.side].push(pd);
const sideNames = ["top", "right", "bottom", "left"];
for (let iter = 0; iter < 10; iter++) {
  let moved = false;
  for (const s of sideNames) {
    while (sides[s].length > 3) {
      const overflow = sides[s].pop();
      const target = sideNames.reduce((a, b) => sides[a].length <= sides[b].length ? a : b);
      sides[target].push(overflow);
      moved = true;
    }
  }
  if (!moved) break;
}

// 5. Sort each side by position
sides.top.sort((a, b) => a.cx - b.cx);
sides.bottom.sort((a, b) => a.cx - b.cx);
sides.left.sort((a, b) => a.cy - b.cy);
sides.right.sort((a, b) => a.cy - b.cy);

// 6. Create badges + lines
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
const offset = BADGE_SIZE / 2 + 8;

function createBadge(pd, bx, by, lx, ly) {
  const badge = figma.createEllipse();
  badge.resize(BADGE_SIZE, BADGE_SIZE);
  badge.x = bx - BADGE_SIZE / 2;
  badge.y = by - BADGE_SIZE / 2;
  badge.fills = [{ type: "SOLID", color: BADGE_COLOR }];
  container.appendChild(badge);

  const txt = figma.createText();
  txt.characters = pd.letter;
  txt.fontSize = 11;
  txt.fontName = { family: "Inter", style: "Semi Bold" };
  txt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  txt.textAlignHorizontal = "CENTER";
  txt.resize(BADGE_SIZE, BADGE_SIZE);
  txt.x = bx - BADGE_SIZE / 2;
  txt.y = by - BADGE_SIZE / 2;
  container.appendChild(txt);

  // Leader line
  const dx = lx - bx;
  const dy = ly - by;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > BADGE_SIZE / 2) {
    const line = figma.createLine();
    line.x = bx;
    line.y = by;
    line.resize(dist, 0);
    line.rotation = -Math.atan2(dy, dx) * 180 / Math.PI;
    line.strokes = [{ type: "SOLID", color: BADGE_COLOR }];
    line.strokeWeight = LINE_WEIGHT;
    container.appendChild(line);
  }
}

for (const pd of sides.top) {
  createBadge(pd, pd.cx, PADDING - offset, pd.cx, pd.relY);
}
for (const pd of sides.right) {
  createBadge(pd, PADDING + iw + offset, pd.cy, pd.relX + pd.w, pd.cy);
}
for (const pd of sides.bottom) {
  createBadge(pd, pd.cx, PADDING + ih + offset, pd.cx, pd.relY + pd.h);
}
for (const pd of sides.left) {
  createBadge(pd, PADDING - offset, pd.cy, pd.relX, pd.cy);
}

// 7. Footnote absent parts in the parts table — adds a small text node listing
//    which anatomy parts are state-only and not rendered on the primary diagram.
//    Cross-DS convention (Carbon, M3): state-conditional parts go in a separate
//    "States" subsection; for now we surface them as table footnotes.
if (absentParts.length > 0) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const footnoteFrame = figma.createAutoLayout('VERTICAL', {
    itemSpacing: 2,
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    fills: [],
    paddingTop: 8,
  });
  footnoteFrame.name = "Anatomy state-only parts footnote";
  for (const ap of absentParts) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: "Regular" };
    t.fontSize = 11;
    t.fills = [{ type: "SOLID", color: { r: 0.42, g: 0.42, b: 0.49 } }];
    t.characters = `${ap.letter}. ${ap.name} — only present in interactive states (Hover/Focus/Pressed); see component-guidelines for state-scoped parts`;
    footnoteFrame.appendChild(t);
  }
  container.appendChild(footnoteFrame);
}

// Append container to content slot
const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(container);

return {
  createdNodeIds: [container.id],
  mutatedNodeIds: ["<contentSlotId>"],
  pattern9: {
    scaleApplied: scale,
    scaleSource: scaleOverride !== null ? "override" : "heuristic",
    partsVisible: visibleParts.length,
    partsAbsent: absentParts.length,
  },
};
```

Fill in `parts` array and `<targetNodeId>` / `<diagramVariant>` from `brief-data.json.card3_anatomy`.

---

## 10. Contrast Table Row Pattern

```js
// Each row: element name + foreground swatch + background swatch + ratio text + WCAG badge
const badgeSet = await figma.importComponentSetByKeyAsync("941756541adc6ce21e32e848c2039c64fece0fcf");
let badgeVariant = badgeSet.query('[name="Status=Pass"]').first();
if (!badgeVariant) badgeVariant = badgeSet.defaultVariant || badgeSet.children[0];
const badge = badgeVariant.createInstance();
badge.setProperties({ "Label#44:3": "Pass" });

return { createdNodeIds: [badge.id], mutatedNodeIds: [] };
```

---

## 11. ARIA Spec Row Pattern

```js
const comp = await figma.importComponentByKeyAsync("92ed7bc88cf229782c4b42238aacba1d15f8fd06");
const row = comp.createInstance();
row.setProperties({
  "element#105:0": "Input field",
  "role#105:1": "textbox",
  "label#105:2": "aria-labelledby",
  "focus-order#105:3": "1",
  "keyboard#105:4": "Tab to focus",
  "announcement#105:5": "Name, edit text"
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(row);
row.layoutSizingHorizontal = "FILL";
return { createdNodeIds: [row.id], mutatedNodeIds: ["<contentSlotId>"] };
```

**Do NOT detach** — use `setProperties` with hash-suffixed property names. No font loading needed.

---

## 12. Code Block Pattern (monochrome)

```js
const comp = await figma.importComponentByKeyAsync("1bf10eee1751a46da5f90a9671be6c9abf0073b7");
const block = comp.createInstance();
block.setProperties({
  "Show Header#8:0": true,
  "Header Text#8:1": "radio-group.html",
  "Code#8:2": '<fieldset role="radiogroup">\n  <legend>Options</legend>\n  <input type="radio" name="opt" />\n</fieldset>'
});

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(block);
block.layoutSizingHorizontal = "FILL";
return { createdNodeIds: [block.id], mutatedNodeIds: ["<contentSlotId>"] };
```

**Do NOT detach** — use `setProperties` with hash-suffixed names. Set `"Show Header#8:0": false` to hide the filename bar. Code text renders monochrome automatically.

---

## 13. Research Insights Sub-section Pattern

When `card._research_applied === true`, push a research insights frame INSIDE the card body, AFTER the primary content.

Frame structure:
```
ResearchInsights (Frame, AUTO_LAYOUT vertical, 12px gap, 12px padding)
├── "Cross-DS research" Title (Text, 13px, weight 600)
├── PatternsObserved (Frame, vertical, 4px gap)
│   ├── "Patterns observed" Subtitle
│   └── Bullet list (one Text per pattern)
├── Recommendations (Frame, vertical, 4px gap)
│   └── (same shape as PatternsObserved)
├── Divergences (Frame, AUTO_LAYOUT vertical, amber bg, 8px padding) — only if non-empty
│   ├── "Designer review needed" Subtitle
│   └── For each divergence: "{field}: existing — {existing}; research — {research} ({note})"
└── Sources (Text, 11px, gray) — comma-separated DS names
```

Use Pattern 0 (wrapper frame) approach: small individual `use_figma` calls (~200-2000 bytes each).

```js
// 1. Create the ResearchInsights container
const researchFrame = figma.createAutoLayout('VERTICAL', {
  itemSpacing: 12,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  paddingRight: 12,
  primaryAxisSizingMode: 'AUTO',
  counterAxisSizingMode: 'AUTO',
  fills: [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 1.0 } }], // light blue-tinted bg
  cornerRadius: 6,
});
researchFrame.name = "ResearchInsights";

// v1.87.0: Promise.all parallelizes the font fetches
await Promise.all([
  { family: "Inter", style: "Semi Bold" },
  { family: "Inter", style: "Regular" },
].map(fn => figma.loadFontAsync(fn)));

const title = figma.createText();
title.characters = "Cross-DS research";
title.fontSize = 13;
title.fontName = { family: "Inter", style: "Semi Bold" };
title.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.29 } }];
researchFrame.appendChild(title);

const parent = await figma.getNodeByIdAsync("<contentSlotId>");
parent.appendChild(researchFrame);
researchFrame.layoutSizingHorizontal = "FILL";

return { createdNodeIds: [researchFrame.id], mutatedNodeIds: ["<contentSlotId>"] };
```

```js
// 2. Patterns observed sub-frame (one call per sub-section)
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}
// v1.87.0: Promise.all parallelizes the font fetches
await Promise.all([
  { family: "Inter", style: "Semi Bold" },
  { family: "Inter", style: "Regular" },
].map(fn => figma.loadFontAsync(fn)));

const insights = card.research_insights; // from brief-data.json
const researchFrame = await figma.getNodeByIdAsync("<researchFrameId>");

function buildSubSection(label, items) {
  const frame = figma.createAutoLayout('VERTICAL', {
    itemSpacing: 4,
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    fills: [],
  });
  frame.name = label;
  const sub = figma.createText();
  sub.characters = label;
  sub.fontSize = 11;
  sub.fontName = { family: "Inter", style: "Semi Bold" };
  sub.fills = [{ type: "SOLID", color: hexToRgb("#595968") }];
  frame.appendChild(sub);
  for (const item of items) {
    const bullet = figma.createText();
    bullet.characters = "• " + item;
    bullet.fontSize = 12;
    bullet.fontName = { family: "Inter", style: "Regular" };
    bullet.fills = [{ type: "SOLID", color: hexToRgb("#3A3A4A") }];
    frame.appendChild(bullet);
    bullet.layoutSizingHorizontal = "FILL";
  }
  return frame;
}

if (insights.patterns_observed?.length) {
  const pf = buildSubSection("Patterns observed", insights.patterns_observed);
  researchFrame.appendChild(pf);
  pf.layoutSizingHorizontal = "FILL";
}
if (insights.recommendations?.length) {
  const rf = buildSubSection("Recommendations", insights.recommendations);
  researchFrame.appendChild(rf);
  rf.layoutSizingHorizontal = "FILL";
}

// Collect the IDs of sub-section frames actually appended (pf and/or rf may be absent when list is empty).
const createdSubIds = [...(insights.patterns_observed?.length ? [pf.id] : []), ...(insights.recommendations?.length ? [rf.id] : [])];
return { createdNodeIds: createdSubIds, mutatedNodeIds: ["<researchFrameId>"] };
```

```js
// 3. Divergences frame (only if non-empty) + Sources line
// v1.87.0: Promise.all parallelizes the font fetches
await Promise.all([
  { family: "Inter", style: "Semi Bold" },
  { family: "Inter", style: "Regular" },
].map(fn => figma.loadFontAsync(fn)));

const insights = card.research_insights;
const researchFrame = await figma.getNodeByIdAsync("<researchFrameId>");

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

if (insights._divergences?.length) {
  const df = figma.createAutoLayout('VERTICAL', {
    itemSpacing: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    fills: [{ type: "SOLID", color: hexToRgb("#FEF3C7") }], // amber-100
    cornerRadius: 4,
  });
  df.name = "Divergences";
  const dlabel = figma.createText();
  dlabel.characters = "Designer review needed";
  dlabel.fontSize = 11;
  dlabel.fontName = { family: "Inter", style: "Semi Bold" };
  dlabel.fills = [{ type: "SOLID", color: hexToRgb("#92400E") }];
  df.appendChild(dlabel);
  for (const d of insights._divergences) {
    const drow = figma.createText();
    drow.characters = d.field + ": existing — " + d.existing + "; research — " + d.research + " (" + d.note + ")";
    drow.fontSize = 11;
    drow.fontName = { family: "Inter", style: "Regular" };
    drow.fills = [{ type: "SOLID", color: hexToRgb("#78350F") }];
    df.appendChild(drow);
    drow.layoutSizingHorizontal = "FILL";
  }
  researchFrame.appendChild(df);
  df.layoutSizingHorizontal = "FILL";
}

// Sources line
if (insights.sources?.length) {
  const src = figma.createText();
  src.characters = "Sources: " + insights.sources.join(", ");
  src.fontSize = 11;
  src.fontName = { family: "Inter", style: "Regular" };
  src.fills = [{ type: "SOLID", color: { r: 0.60, g: 0.60, b: 0.65 } }];
  researchFrame.appendChild(src);
  src.layoutSizingHorizontal = "FILL";
}

const createdIds = [...(insights._divergences?.length ? [df.id] : []), ...(insights.sources?.length ? [src.id] : [])];
return { createdNodeIds: createdIds, mutatedNodeIds: ["<researchFrameId>"] };
```

---

## 14. Specs Redline Pattern (Section 1 Specs sub-frame, v1.70.0+)

> **Rule 8 (figma-use v2.1.26):** Font preload is mandatory before any of
> `appendChild`, `insertChild`, `setBoundVariable`, `setExplicitVariableModeForCollection`,
> `setValueForMode`, or `findAll` callbacks if the touched subtree contains
> unloaded fonts. Pre-existing component instances often carry unloaded fonts.
> Pattern 14 creates a component instance from a pre-existing DS component — the
> font preload block below (before `container.appendChild(inst)`) is load-bearing
> and distinct from the annotation font load earlier in the pattern.
> (Source: figma-use/SKILL.md:8)

Auto-extracted dimension annotations rendered in a left-gutter ordinate lane. Replaces the v1.69.0 per-edge placement model which produced label-on-component collisions when N > 1 annotations existed on the same surface (Phase 1 + PR 1 smoke).

**Architecture:** all annotations for a surface are routed to a 220px column to the LEFT of the component. Within that column, label pills are stacked vertically, sorted by the Y-coordinate of the edge they annotate. Each entry is `[Token Tag pill] ──── │` (label + horizontal leader + tick at the component's left edge). Top/bottom annotations get an L-shaped leader (horizontal from gutter, vertical witness to the actual edge). Greedy sort-and-stack guarantees zero collisions by construction. Pattern proven by Zeplin redlines, Carbon Design System anatomy pages, Material 3 anatomy diagrams, and CAD ordinate dimensioning.

**Gutter mode** is the default for N > 1 annotations on a surface. **Inline mode** (the v1.69.0 `buildDimensionAnnotation` algorithm) is preserved as a fallback for N = 1 annotations and for measuring spans BETWEEN two elements (different use case from padding-on-one-frame).

The `card_anatomy.specs[]` field in `brief-data.json` is an **optional override** — if non-empty, those entries drive placement instead of the auto-extracted set. Default flow leaves it empty.

Single ~7-9KB `use_figma` call.

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

const PADDING = 64;
const REDLINE_COLOR = hexToRgb("#FF4D8E");       // pink — industry standard for redlines
const STROKE_WEIGHT = 1;
const ENDCAP_LENGTH = STROKE_WEIGHT + 6;         // figma-measure convention (inline mode only)
const LABEL_GAP = 4;
const GUTTER_WIDTH = 220;                        // px — fits longest token label "--zen-spacing-xxxxx" at Inter 12px
const GUTTER_GAP = 24;                           // px — between gutter right edge and component left edge
const ENTRY_HEIGHT = 28;                         // px — pill ~24 + 4px gap
const TICK_LENGTH = 6;                           // px — short horizontal tick at component left edge

await figma.loadFontAsync({ family: "Inter", style: "Medium" });

// --- Inline pure functions (mirrors scripts/lib/dimension-line.js + token-tag.js) ---

function vectorPathFor(distance, orientation) {
  if (orientation === "horizontal") return "M 0 0 L " + distance + " 0 Z";
  return "M 0 0 L 0 " + distance + " Z";
}

function endcapPositionsFor(distance, orientation) {
  if (orientation === "horizontal") {
    return {
      cap1: { x: 0, y: -ENDCAP_LENGTH / 2, rotation: 90 },
      cap2: { x: distance, y: -ENDCAP_LENGTH / 2, rotation: 90 },
    };
  }
  return {
    cap1: { x: -ENDCAP_LENGTH / 2, y: 0, rotation: 0 },
    cap2: { x: -ENDCAP_LENGTH / 2, y: distance, rotation: 0 },
  };
}

function labelAnchor(distance, orientation, labelW, labelH) {
  if (orientation === "horizontal") {
    return { x: (distance - labelW) / 2, y: -labelH - LABEL_GAP };
  }
  return { x: LABEL_GAP, y: (distance - labelH) / 2 };
}

function tokenTagSpec(text) {
  return {
    text: text,
    bgColor: { r: 0.941, g: 0.949, b: 0.984 }, // ~#F0F2FA
    fgColor: { r: 0.020, g: 0.314, b: 0.863 }, // ~#0550DC
    fontName: { family: "Inter", style: "Medium" },
    fontSize: 12,
    paddingX: 5,
    paddingY: 2,
    cornerRadius: 3,
  };
}

function annotationVariant(prop, autolayout) {
  if (prop === "paddingLeft" || prop === "paddingRight") return "horizontal";
  if (prop === "paddingTop" || prop === "paddingBottom") return "vertical";
  if (prop === "itemSpacing") return autolayout === "HORIZONTAL" ? "horizontal" : "vertical";
  throw new Error("Unknown property: " + prop);
}

function formatLabel(value) {
  return value.token ? `${value.px}px — ${value.token}` : `${value.px}px`;
}

function computeGutterSlots(entries, entryHeight) {
  const slots = [];
  let nextY = 0;
  for (const e of entries) {
    const idealY = e.anchorY - entryHeight / 2;
    let slotY = Math.max(nextY, idealY);
    if (slotY < 0) slotY = 0;
    slots.push({ slotY, anchorY: e.anchorY });
    nextY = slotY + entryHeight;
  }
  return slots;
}

function buildLeaderPath(slotY, anchorY, gutterWidth, gutterGap, tickLength, pillHeight) {
  const labelCenterY = slotY + pillHeight / 2;
  const bendX = gutterWidth + gutterGap;
  const horizontalLine = { x: 0, y: labelCenterY, length: bendX, orientation: "horizontal" };
  let witnessLine = null;
  const diff = Math.abs(labelCenterY - anchorY);
  if (diff > 2) {
    witnessLine = { x: bendX, y: Math.min(labelCenterY, anchorY), length: diff, orientation: "vertical" };
  }
  const tick = { x: bendX, y: anchorY, length: tickLength, orientation: "horizontal" };
  return { horizontalLine, witnessLine, tick };
}

function computeAnchorY(surface, prop, container) {
  const sbb = surface.absoluteBoundingBox;
  const cbb = container.absoluteBoundingBox;
  const sy = sbb.y - cbb.y;
  if (prop === "paddingTop") return sy;
  if (prop === "paddingBottom") return sy + sbb.height;
  // paddingLeft, paddingRight, itemSpacing — anchor at vertical center of surface
  return sy + sbb.height / 2;
}

// --- Build a single dimension annotation (line + caps + label pill) ---

function buildDimensionAnnotation(distance, orientation, labelText) {
  const wrapper = figma.createFrame();
  wrapper.name = "Dimension annotation — " + labelText;
  wrapper.layoutMode = "NONE";
  wrapper.fills = [];
  wrapper.clipsContent = false;

  // Line vector
  const line = figma.createVector();
  line.vectorPaths = [{ windingRule: "NONE", data: vectorPathFor(distance, orientation) }];
  line.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
  line.strokeWeight = STROKE_WEIGHT;
  if (orientation === "horizontal") line.resize(distance, STROKE_WEIGHT);
  else line.resize(STROKE_WEIGHT, distance);
  line.x = 0;
  line.y = 0;
  wrapper.appendChild(line);

  // Endcap ticks
  const caps = endcapPositionsFor(distance, orientation);
  function makeCap(c) {
    const cap = figma.createLine();
    cap.resize(ENDCAP_LENGTH, 0);
    cap.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
    cap.strokeWeight = STROKE_WEIGHT;
    cap.rotation = c.rotation;
    cap.x = c.x;
    cap.y = c.y;
    wrapper.appendChild(cap);
  }
  makeCap(caps.cap1);
  makeCap(caps.cap2);

  // Label pill
  const spec = tokenTagSpec(labelText);
  const labelFrame = figma.createAutoLayout('HORIZONTAL', {
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    paddingLeft: spec.paddingX,
    paddingRight: spec.paddingX,
    paddingTop: spec.paddingY,
    paddingBottom: spec.paddingY,
    cornerRadius: spec.cornerRadius,
    fills: [{ type: "SOLID", color: spec.bgColor }],
  });
  labelFrame.name = "Spec label pill — " + labelText;

  const labelText_ = figma.createText();
  labelText_.fontName = spec.fontName;
  labelText_.fontSize = spec.fontSize;
  labelText_.characters = spec.text;
  labelText_.fills = [{ type: "SOLID", color: spec.fgColor }];
  labelFrame.appendChild(labelText_);
  wrapper.appendChild(labelFrame);

  // Position label after auto-layout has sized it
  const anchor = labelAnchor(distance, orientation, labelFrame.width, labelFrame.height);
  labelFrame.x = anchor.x;
  labelFrame.y = anchor.y;

  // Wrapper sizing — bound the visible area
  if (orientation === "horizontal") {
    wrapper.resize(Math.max(distance, labelFrame.width), labelFrame.height + LABEL_GAP + ENDCAP_LENGTH);
  } else {
    wrapper.resize(labelFrame.width + LABEL_GAP + ENDCAP_LENGTH, Math.max(distance, labelFrame.height));
  }

  return wrapper;
}

// --- Walk the target instance + place annotations ---

const container = figma.createFrame();
container.name = "Specs redline";
container.fills = [{ type: "SOLID", color: hexToRgb("#FAFAFF") }];
container.layoutMode = "NONE";
container.clipsContent = false;

const targetNode = await figma.getNodeByIdAsync("<targetNodeId>");
let variantComp;
if (targetNode.type === "COMPONENT_SET") {
  // <diagramVariant> is runtime-substituted (e.g. "App=Admin, View=Expanded").
  // Components with no State dimension (e.g. Side nav — App/View axes only) return null here;
  // the fallback to defaultVariant / children[0] is the load-bearing safety for those cases.
  variantComp = targetNode.query('[name="<diagramVariant>"]').first();
  if (!variantComp) variantComp = targetNode.defaultVariant || targetNode.children[0];
} else {
  variantComp = targetNode;
}
const inst = variantComp.createInstance();

// Rule 8 (figma-use v2.1.26): font preload before appendChild on component instance.
// The instance carries the target component's fonts which may be unloaded.
// Collect unique fontNames from inst subtree and preload before appending.
// v1.87.0: O(n) Set-based dedup (was O(n²) JSON.stringify) — see figma-push-patterns.md Rule 8.
const _seenP14 = new Set();
const _instFonts14 = [];
inst.findAll(n => n.type === "TEXT").forEach(t => {
  const fn = t.fontName;
  if (!fn || typeof fn !== 'object') return;
  const key = fn.family + '|' + fn.style;
  if (_seenP14.has(key)) return;
  _seenP14.add(key); _instFonts14.push(fn);
});
await Promise.all(_instFonts14.map(fn => figma.loadFontAsync(fn)));

container.appendChild(inst);
// v1.70.1: shift inst right by (GUTTER_WIDTH + GUTTER_GAP) so the left-gutter
// has room INSIDE the container at positive x. Without this shift, the gutter
// lands at negative x and is clipped by the container's default clipsContent=true.
inst.x = GUTTER_WIDTH + GUTTER_GAP + PADDING;
inst.y = PADDING;
container.resize(
  inst.width + GUTTER_WIDTH + GUTTER_GAP + PADDING * 2,
  inst.height + PADDING * 2
);

// Auto-extraction default path (override path described below)
const anatomyParts = card_anatomy.parts || [];
const partNameSet = new Set(anatomyParts.map(p => p.figmaLayerName));

function shouldSurface(node, isTopLevel) {
  if (isTopLevel) return true;
  if (!node.children || node.children.length === 0) return false;
  return node.children.some(c => partNameSet.has(c.name));
}

const surfaces = [];
function walk(node, isTopLevel) {
  if (node.type !== "FRAME" && node.type !== "INSTANCE" && node.type !== "COMPONENT") return;
  if (shouldSurface(node, isTopLevel)) surfaces.push(node);
  for (const c of (node.children || [])) walk(c, false);
}
walk(inst, true);

async function resolveValue(numericPx, boundId) {
  if (!boundId) return { px: numericPx, token: null };
  try {
    const v = await figma.variables.getVariableByIdAsync(boundId);
    if (!v || !v.name) return { px: numericPx, token: null };
    return { px: numericPx, token: v.name };
  } catch (e) {
    return { px: numericPx, token: null };
  }
}

let extractedFrames = 0;
let boundVariablesCount = 0;
let unresolvedVariables = 0;
let tokenTagsRendered = 0;
let annotationCollisions = 0;
let droppedSpecs = 0;
let authorOverrideCount = 0;
const placedAnnotations = []; // for collision detection

// v1.70.1: gutter-rendering helper used by BOTH auto-extract path (Pass 2 below)
// AND override path (when card_anatomy.specs[] is non-empty).
async function buildGutterFromEntries(entries, surface) {
  // entries pre-sorted by anchorY; surface provides bounding-box reference.
  const slots = computeGutterSlots(entries, ENTRY_HEIGHT);
  const sbb = surface.absoluteBoundingBox;
  const cbb = container.absoluteBoundingBox;
  const surfaceX = sbb.x - cbb.x;
  const totalGutterHeight = Math.max(
    slots[slots.length - 1].slotY + ENTRY_HEIGHT,
    sbb.height
  );
  const gutterFrame = figma.createFrame();
  gutterFrame.name = "Specs gutter (" + entries.length + " annotations)";
  gutterFrame.layoutMode = "NONE";
  gutterFrame.fills = [];
  gutterFrame.clipsContent = false;
  gutterFrame.resize(GUTTER_WIDTH + GUTTER_GAP + TICK_LENGTH, totalGutterHeight);
  gutterFrame.x = surfaceX - GUTTER_WIDTH - GUTTER_GAP;
  gutterFrame.y = sbb.y - cbb.y;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const slot = slots[i];

    // Build label pill via tokenTagSpec
    const spec = tokenTagSpec(formatLabel(e.value));
    const labelFrame = figma.createAutoLayout('HORIZONTAL', {
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      paddingLeft: spec.paddingX,
      paddingRight: spec.paddingX,
      paddingTop: spec.paddingY,
      paddingBottom: spec.paddingY,
      cornerRadius: spec.cornerRadius,
      fills: [{ type: "SOLID", color: spec.bgColor }],
    });
    labelFrame.name = "Gutter pill — " + spec.text;
    const labelText = figma.createText();
    labelText.fontName = spec.fontName;
    labelText.fontSize = spec.fontSize;
    labelText.characters = spec.text;
    labelText.fills = [{ type: "SOLID", color: spec.fgColor }];
    labelFrame.appendChild(labelText);
    labelFrame.x = 0;
    labelFrame.y = slot.slotY;
    gutterFrame.appendChild(labelFrame);

    // Build leader (horizontal + optional witness + tick)
    const path = buildLeaderPath(
      slot.slotY,
      slot.anchorY - (sbb.y - cbb.y),
      GUTTER_WIDTH,
      GUTTER_GAP,
      TICK_LENGTH,
      labelFrame.height
    );

    const hLine = figma.createLine();
    hLine.resize(path.horizontalLine.length, 0);
    hLine.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
    hLine.strokeWeight = STROKE_WEIGHT;
    hLine.x = path.horizontalLine.x;
    hLine.y = path.horizontalLine.y;
    gutterFrame.appendChild(hLine);

    if (path.witnessLine) {
      const wLine = figma.createLine();
      wLine.resize(path.witnessLine.length, 0);
      wLine.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
      wLine.strokeWeight = STROKE_WEIGHT;
      wLine.rotation = 90;
      wLine.x = path.witnessLine.x;
      wLine.y = path.witnessLine.y;
      gutterFrame.appendChild(wLine);
    }

    const tick = figma.createLine();
    tick.resize(path.tick.length, 0);
    tick.strokes = [{ type: "SOLID", color: REDLINE_COLOR }];
    tick.strokeWeight = STROKE_WEIGHT;
    tick.x = path.tick.x;
    tick.y = path.tick.y;
    gutterFrame.appendChild(tick);
  }

  container.appendChild(gutterFrame);
  return entries.length;
}

// v1.70.2: override path (when card_anatomy.specs[] is non-empty) BYPASSES
// the auto-extract surface walk entirely. Author intent (the specs[] array)
// drives which measurements to show. Both branches feed the same
// buildGutterFromEntries helper for visual consistency.
const useOverridePath =
  card_anatomy && card_anatomy.specs && card_anatomy.specs.length > 0;
const gutterEntriesPerSurface = [];

if (useOverridePath) {
  // Override path — render card_anatomy.specs[] as a gutter on the top-level instance
  const overrideEntries = [];
  const cbb = container.absoluteBoundingBox;
  for (const spec of card_anatomy.specs) {
    const layer = inst.query(`[name="${spec.layerName}"]`).first();
    if (!layer) {
      droppedSpecs += 1;
      continue;
    }
    // Anchor at the layer's vertical center, relative to container.
    const lbb = layer.absoluteBoundingBox;
    const anchorY = (lbb.y - cbb.y) + lbb.height / 2;
    // Parse the value — accept "24px", "24", or numeric directly.
    const numericPx = parseFloat(String(spec.value).replace(/px$/i, "")) || 0;
    const value = { px: numericPx, token: spec.tokenName || null };
    overrideEntries.push({ value, anchorY });
  }
  if (overrideEntries.length > 0) {
    overrideEntries.sort((a, b) => a.anchorY - b.anchorY);
    const placed = await buildGutterFromEntries(overrideEntries, inst);
    tokenTagsRendered += placed;
    authorOverrideCount = placed;
  }
} else {
  // Auto-extract path — Pass 1 collect, Pass 2 render
  const entriesPerSurface = new Map();
  for (const surface of surfaces) {
    if (surface.layoutMode === "NONE") continue;
    extractedFrames += 1;

    const surfaceEntries = [];
    const props = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "itemSpacing"];
    for (const prop of props) {
      const px = surface[prop];
      if (!px || px === 0) continue;
      const boundId = surface.boundVariables?.[prop]?.id || null;
      const value = await resolveValue(px, boundId);
      if (value.token) boundVariablesCount += 1;
      else if (boundId) unresolvedVariables += 1;
      const anchorY = computeAnchorY(surface, prop, container);
      surfaceEntries.push({ prop, px, value, anchorY, surface });
    }
    if (surfaceEntries.length > 0) entriesPerSurface.set(surface, surfaceEntries);
  }

  for (const [surface, surfaceEntries] of entriesPerSurface) {
    if (surfaceEntries.length === 1) {
      // Inline mode — preserve v1.69.0 single-annotation placement
      const e = surfaceEntries[0];
      const orientation = annotationVariant(e.prop, surface.layoutMode);
      const annotation = buildDimensionAnnotation(e.px, orientation, formatLabel(e.value));
      tokenTagsRendered += 1;
      const sbb = surface.absoluteBoundingBox;
      const cbb = container.absoluteBoundingBox;
      const sx = sbb.x - cbb.x;
      const sy = sbb.y - cbb.y;
      const GAP = 8;
      if (e.prop === "paddingLeft") {
        annotation.x = sx - annotation.width - GAP;
        annotation.y = sy + sbb.height / 2 - annotation.height / 2;
      } else if (e.prop === "paddingRight") {
        annotation.x = sx + sbb.width + GAP;
        annotation.y = sy + sbb.height / 2 - annotation.height / 2;
      } else if (e.prop === "paddingTop") {
        annotation.x = sx + sbb.width / 2 - annotation.width / 2;
        annotation.y = sy - annotation.height - GAP;
      } else if (e.prop === "paddingBottom") {
        annotation.x = sx + sbb.width / 2 - annotation.width / 2;
        annotation.y = sy + sbb.height + GAP;
      } else if (e.prop === "itemSpacing") {
        annotation.x = sx + sbb.width / 2 - annotation.width / 2;
        annotation.y = sy + sbb.height / 2 - annotation.height / 2;
      }
      container.appendChild(annotation);
      gutterEntriesPerSurface.push(0);
    } else {
      // Gutter mode — N > 1 annotations on this surface
      surfaceEntries.sort((a, b) => a.anchorY - b.anchorY);
      const placedCount = await buildGutterFromEntries(surfaceEntries, surface);
      tokenTagsRendered += placedCount;
      gutterEntriesPerSurface.push(placedCount);
    }
  }
}

const parent = await figma.getNodeByIdAsync("<specsSubFrameId>");
parent.appendChild(container);

return {
  createdNodeIds: [container.id],
  mutatedNodeIds: ["<specsSubFrameId>"],
  pattern14: {
    extractedFrames,
    boundVariables: boundVariablesCount,
    unresolvedVariables,
    authorOverrides: authorOverrideCount,
    droppedSpecs,
    annotationCollisions,
    tokenTagsRendered,
    gutterEntriesPerSurface,
  },
};
```

**Author override path (v1.70.2+):** when `card_anatomy.specs[]` is non-empty, the override branch in the main code above BYPASSES the surface walk + auto-extract logic. Entries are built directly from author-supplied specs and rendered through the same `buildGutterFromEntries` helper. This guarantees the override produces real gutter geometry (not a static text table) — the render code is in the main block, not a separate documentation snippet, so there is no instruction-to-coordinate-elsewhere ambiguity.

The override path uses the same gutter geometry as auto-extract — vector lines, label pills, ticks at the component's left edge. Author intent (specs[] entries) drives WHICH measurements to show; the renderer guarantees HOW they look. No improvisation surface for the AI.

If the override entries reference layers that don't exist in the rendered instance (e.g., "Focus ring" in a Default-state Checkbox), they're silently dropped and counted in `droppedSpecs`. Designer can verify via the manifest field.

**Pointer Badge sizing path** — for components with explicit `width` or `height` token bindings on the top-level instance frame, emit a "pointer badge" pill instead of a dimension line. The pointer badge is a single Token Tag pill (no line, no caps) anchored at the instance's closest edge. Build with the same `tokenTagSpec` helper:

```js
const wbid = inst.boundVariables?.width?.id || null;
const hbid = inst.boundVariables?.height?.id || null;
if (wbid || hbid) {
  const wValue = await resolveValue(inst.width, wbid);
  const hValue = await resolveValue(inst.height, hbid);
  // emit pointer-style Token Tag at edge — see Pattern 8 / Pattern 4 for token tag construction details
  // (caller composes the same labelFrame as inside buildDimensionAnnotation, positions at instance edge)
}
```

Skip if both are unbound (most common case).

**Failure modes** (from Phase 2 design spec):

- Component has no autolayout → skip redline render. Emit a primitive text node footnote in the Specs sub-frame: "Auto-extraction unavailable — no autolayout detected on this component."
- `getVariableByIdAsync` returns null → keep raw px, increment `unresolvedVariables`.
- Layer referenced by author-supplied spec doesn't exist → drop spec entry, increment `droppedSpecs` in manifest.
- Two annotations within 8px of each other → increment `annotationCollisions` in manifest. Phase 3 adds proper collision routing.

---

## Push Rules

1. **Each `use_figma` call creates 1-3 nodes max** — keep calls small (200-2000 bytes typical, up to 6KB for anatomy diagram).
2. **Return IDs from every call** — use them in subsequent calls to append children.
3. **Prefer `setProperties` over detach+findOne** — use hash-suffixed property names from `vendor/components/dist/registries/metakit.json`. Only detach when you need to append children into content slots (briefCard, a11yCard). Templates like Swatch Row, A11y Spec Row, Code Block work best as live instances.
4. **No interpreter, no codegen scripts** — push directly from data model.
5. **Detach only when needed** — briefCard and a11yCard must be detached before appending children to content slots. Do NOT detach Swatch Row, A11y Spec Row, Contrast Badge, or Code Block.
6. **Set ALL properties** — never leave default placeholder text. Check `vendor/components/dist/registries/metakit.json` for exact property names with `#hash` suffixes.
