# Component Brief — Figma Output Reference

Detailed Figma output requirements for Step 3 of the component-brief skill. Read `../../references/figma-output.md` for shared patterns (token binding, generation metadata, auto-layout).

## P0 Rule: Use real component instances

When briefing an **existing** component (Figma URL provided), MUST import real instances. Never approximate with text placeholders like `[ Save ]` or rectangles.

**Where to use real instances:**
- **Card 2 (Actual component)** — variant matrix cells and theme comparison previews
- **Card 3 (Anatomy)** — Structure (badge overlays), Specs (pink annotations), States (one per state)
- Any other card where the actual component adds clarity

**How — local vs library component:**

The user's Figma URL points to a specific component. That component may be **local** (defined in the same file) or from an **external library**. You MUST use the correct method:

**Case 1: Component is in the SAME file as the output target** (most common for test/copy files)

```js
// Use getNodeByIdAsync — the component already exists in this file
const componentSet = await figma.getNodeByIdAsync(nodeId); // nodeId from user's URL
// componentSet.type === 'COMPONENT_SET' → has variant children
// componentSet.type === 'COMPONENT' → single component, no variants
const variant = componentSet.children.find(c => c.name.includes("State=Default"));
const instance = variant.createInstance();
```

**Case 2: Component is from an external library** (e.g., user references DS2026 library directly)

```js
// Use importComponentSetByKeyAsync — fetches from published library
const componentSet = await figma.importComponentSetByKeyAsync(componentKey);
const variant = componentSet.children.find(c => c.name.includes("Type=Primary"));
const instance = variant.createInstance();
```

**How to decide:** The user's URL contains a `fileKey`. If it matches the output target file → Case 1. If the component is from a different file (library) → Case 2.

**Detection in `use_figma`:**

```js
// Try local first — if the node exists in this file, use it directly
const localNode = await figma.getNodeByIdAsync(nodeId);
if (localNode && (localNode.type === 'COMPONENT_SET' || localNode.type === 'COMPONENT')) {
  // Case 1: local component — use directly
  const componentSet = localNode;
} else {
  // Case 2: external library — import by key
  const componentSet = await figma.importComponentSetByKeyAsync(componentKey);
}
```

**P0: Never use `importComponentSetByKeyAsync` for components that exist locally in the file.** This will import the published library version, which may differ from the local copy (different variants, properties, or styling).

Fallback: placeholder frame with dashed border + "Component instance — import manually". Never `[ Button ]`.

## Card structure (Meta Kit)

Import `Meta / Chrome / Brief Card` (key: `3dbb732730af0754210cde7af35e5236a2502843`) and detach before adding content.

```js
const briefCardSet = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
const variant = briefCardSet.children.find(c => c.name === "Mode=DS, Type=Standard");
const instance = variant.createInstance();
setProp(instance, "Title", "Design tokens");
setProp(instance, "Subtitle", "Color, sizing, and typography tokens");
const card = instance.detachInstance();
card.name = "Design tokens";
const content = card.findOne(n => n.name === "Content");
```

**Frame naming** — rename each detached card:

| Card | Frame name |
|------|-----------|
| 1 | `Page header` |
| 2 | `Components` |
| 3 | `Anatomy` |
| 4 | `Design tokens` |
| 5 | `Component API` |
| 6 | `Usage guidelines` |
| 7 | `Content guidelines` |
| 8 | `Accessibility` |
| 9 | `Code specification` |

Do NOT leave cards named `"Meta / Chrome / Brief Card"`.

For `setProp` helper and component keys, see `../../docs/meta-kit/components.md`.
For `buildSpecTable`, `buildStateGrid`, see `../../references/meta-kit/builders.md`.

## Variable binding

Follow `../../references/figma-output.md` § "Token binding". Discover keys via `search_design_system`:
- **DS2026**: color variables, text styles (`textStyleId`), effect styles (`effectStyleId`)
- **FM**: color styles (`fillStyleId`), text styles (`textStyleId`)
- **Fallback**: hex only if file isn't connected to library

## Card children elements

**Match the HTML templates** — omissions are P0 bugs.

| Element | Structure | Where used |
|---------|-----------|------------|
| **Card title** | Text node, bold 24px | Every card header |
| **Subtitle** | Text node, regular 18px, secondary color | Every card header |
| **Section headings** | Text node, bold 16px, with 1px `#E2E7F0` divider above | Sub-sections |
| **Body text** | Text node, regular 14px, secondary color, max-width fill | Descriptions |
| **Tables** | Header row (bold 12px, `#F5F5FA` bg), data rows (regular 14px). Fixed column widths. | Cards 3, 4, 5, 8 |
| **Color swatch dots** | 12×12 rectangle, cornerRadius 3, token hex fill, in horizontal auto-layout next to text. **Never omit.** | Cards 2, 4, 8 |
| **Pink dimension lines** | 1px `#E91E8C` rectangles (brackets) + 11px `#E91E8C` labels. **Never omit from Specs.** | Card 3 |
| **REQ/OPT badges** | Auto-layout frame: REQ = `#FEF3F2` bg + `#C10C0D` text. OPT = `#F5F5FA` bg + `#888888` text. Bold 10px uppercase. | Card 5 |
| **Typography specimens** | Actual styled text at documented font size/weight/family | Card 4 |
| **Code blocks** | `#1E1E2E` bg, 16px padding, 12px monospace with syntax colors | Cards 8, 9 |
| **Do/Don't pairs** | Side-by-side: green bar (`#047800`, 4px) + red bar (`#C10C0D`, 4px) | Cards 6, 7 |
| **Component instances** | P0 — real library instances via `importComponentSetByKeyAsync()`. Never text placeholders. | Cards 2, 3 |
| **Pass/Exempt badges** | Pass = green `#047800`, Exempt = `#9C2000`, bold 12px | Card 8 |

## Per-card content requirements

Figma output MUST match HTML. Omitting content is a P0 bug.

**Card 2 — Actual component:**
- [ ] Variant matrix: ALL rows the HTML has, not just first two
- [ ] Each cell = real imported component instance
- [ ] Theme comparison: 3 cards (Actian, Studio, Explorer) with instance + swatch dots

**Card 3 — Anatomy:** ALL 4 sub-sections:
1. **Structure** — real instance + lettered badges (A, B, C...) + legend
2. **Specs** — **MANDATORY.** Real instance + pink `#E91E8C` dimension lines. NOT a table.
   - 1px `#E91E8C` bracket lines + 11px measurement labels
3. **States** — horizontal row of real instances per state. Text-only NOT acceptable.
4. **Parts reference** — table: Part | Element | Token | Notes

**Card 4 — Design tokens:** ALL 3 sub-sections:
1. Color tokens table with **mandatory swatch dots** (12×12, cornerRadius 3)
2. Sizing & spacing table: Property | Token | Value
3. Typography specimens at documented font specs

**Card 5 — Component API:**
- [ ] Props table: REQ/OPT | Property | Type | Default | Values | Notes
- [ ] **Mandatory REQ/OPT badges**
- [ ] Monospace property names, purple types (`#C792EA`), green defaults (`#C3E88D`)

**Card 6 — Usage guidelines:** When to use (+), When NOT to use (−), Do/Don't pairs.

**Card 7 — Content guidelines:** Content rules + inline Do/Don't. Optional terminology table.

**Card 8 — Accessibility:**
- [ ] 2×3 grid: Role, Keyboard, Focus ring, Touch target, Disabled state, Color independence
- [ ] Each: colored icon square (36px, NOT emoji) + title + body + code block. **Load fonts first.**
- [ ] Contrast ratio table with swatch dots + WCAG AA badges
- [ ] Pass = green, Exempt = brown

**Card 9 — Code specification:** Full CSS in dark code block with syntax highlighting.

## Page targeting

**CRITICAL:** Output must land on the correct page, not the Cover page.

If the user provided a Figma URL with a `node-id`, navigate to that node's page first:

```js
// Extract nodeId from URL (convert "-" to ":" in node-id param)
const targetNode = await figma.getNodeByIdAsync(nodeId);
if (targetNode) {
  // Walk up to the page
  let page = targetNode;
  while (page && page.type !== 'PAGE') page = page.parent;
  if (page) await figma.setCurrentPageAsync(page);
}
```

If no node-id is provided, ask the user which page to target. Never default to the first page (Cover).

## Layout

```js
const wrapper = figma.createFrame();
wrapper.name = "Component Spec: [Name]";
wrapper.layoutMode = "HORIZONTAL";
wrapper.itemSpacing = 32;
wrapper.primaryAxisSizingMode = "AUTO";
wrapper.counterAxisSizingMode = "AUTO";
wrapper.fills = [];
```

Generation metadata first child, then 9 cards in order.

## Execution steps

1. Import Generation Log component, set properties, append as first child
2. Build each card as a separate `use_figma` call (20KB limit)
3. **Parity check** before presenting:
   - Card 2: variant row count matches HTML
   - Card 3: all 4 sub-sections (Structure, **Specs with pink lines**, States, Parts)
   - Card 4: swatch dots visible
   - Card 5: REQ/OPT badges rendered
   - Card 8: contrast table with swatches + badges
   - Missing anything → fix before proceeding
4. Screenshot with `get_screenshot`, show to user
5. Ask for adjustments

## Known pitfalls

| Bug | Cause | Fix |
|-----|-------|-----|
| **Empty text nodes** | `.characters` set without font loaded | `await figma.loadFontAsync(...)` first |
| **Clipped content (width)** | Frame at default FIXED 100px width | `layoutSizingHorizontal = 'FILL'` or `'HUG'` |
| **Clipped content (height=1px)** | Missing `layoutSizingVertical` after appending to parent auto-layout | Add `frame.layoutSizingVertical = 'HUG'` after every `parent.appendChild(frame)` |
| **Wrong page** | Frames created on Cover page instead of target | Navigate to target page first with `figma.setCurrentPageAsync(page)` — see "Page targeting" section |
| **Text placeholders** | `[ Label ]` instead of real component | Import via `importComponentByKeyAsync` |
| **Specs is a table** | Card 3 Specs as data table | Must be visual annotation with pink lines |
| **A11y cards empty** | Font not loaded for Card 8 text | Load Inter Regular, Bold, + monospace |
| **Erratic column widths** | No explicit widths on column frames | `resize(width, 1)` matching HTML proportions |
| **Cards different heights** | Fixed height instead of auto | `primaryAxisSizingMode = "AUTO"` + `layoutSizingVertical = 'HUG'` after appendChild |
