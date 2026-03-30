# Component Brief — Figma Output Reference

Detailed Figma output requirements for Step 3 of the component-brief skill. Read `../figma-output.md` for shared patterns (token binding, generation metadata, auto-layout).

## Data Model-Driven Rendering (MANDATORY)

**All Figma output MUST be driven by `brief-data.json`**, generated in Step 1.5. Do NOT write freehand `use_figma` code that interprets research directly.

**Renderer reference:** `../component-brief/figma-renderer.md` — contains copy-paste-ready `use_figma` code recipes for every card. Follow these recipes exactly.

**Data model schema:** `../component-brief/data-schema.md` — defines the JSON structure consumed by the renderer.

The renderer recipes use the data model arrays to determine content. Card row counts, variant states, token tables, Do/Don't pairs — all come from the JSON. The AI does not make content decisions during Figma rendering.

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

**Case 2: Component is from an external library** (e.g., user references DS Kit library directly)

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

## Card structure (Meta Kit) — MANDATORY

**Every card MUST use `Meta / Chrome / Brief Card`** (key: `3dbb732730af0754210cde7af35e5236a2502843`). Never build raw frames as card shells.

**Card 1 (Page header)** uses the **Page Header** variant:

```js
const briefCardSet = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");

// Card 1 — Page Header variant (NOT Standard)
const pageHeaderVariant = briefCardSet.children.find(c => c.name === "Mode=DS, Type=Page Header");
const phInstance = pageHeaderVariant.createInstance();
setProp(phInstance, "Component Name", "Radio Button");
setProp(phInstance, "Description", "Radio buttons let users select one option...");
const pageHeader = phInstance.detachInstance();
pageHeader.name = "Page header";
```

**Cards 2-9** use the **Standard** variant:

```js
const standardVariant = briefCardSet.children.find(c => c.name === "Mode=DS, Type=Standard");
const instance = standardVariant.createInstance();
setProp(instance, "Title", "Design tokens");
setProp(instance, "Subtitle", "Color, sizing, and typography tokens");
const card = instance.detachInstance();
card.name = "Design tokens";
const content = card.findOne(n => n.name === "Content");
```

**Frame naming** — rename each detached card:

| Card | Variant | Frame name |
|------|---------|-----------|
| 1 | `Mode=DS, Type=Page Header` | `Page header` |
| 2 | `Mode=DS, Type=Standard` | `Components` |
| 3 | `Mode=DS, Type=Standard` | `Anatomy` |
| 4 | `Mode=DS, Type=Standard` | `Design tokens` |
| 5 | `Mode=DS, Type=Standard` | `Component API` |
| 6 | `Mode=DS, Type=Standard` | `Usage guidelines` |
| 7 | `Mode=DS, Type=Standard` | `Content guidelines` |
| 8 | `Mode=DS, Type=Standard` | `Accessibility` |
| 9 | `Mode=DS, Type=Standard` | `Code specification` |

Do NOT leave cards named `"Meta / Chrome / Brief Card"`. Do NOT build raw frames as card shells.

For `setProp` helper and component keys, see `../../docs/meta-kit/components.md`.
For `buildSpecTable`, `buildStateGrid`, see `../meta-kit/builders.md`.

## Variable binding

Follow `../figma-output.md` § "Token binding". Discover keys via `search_design_system`:
- **DS Kit**: color variables, text styles (`textStyleId`), effect styles (`effectStyleId`)
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
| **Color swatch dots** | **Use `Meta / Content / Color Swatch`** (Size=Small). Import, create instance, bind fill to token variable. 12×12, in horizontal auto-layout next to text. **Never omit.** | Cards 2, 4, 8 |
| **Pink dimension annotations** | **Use `Meta / Content / Dimension Annotation`** (Horizontal/Vertical). Import, set Value property. **Never use plain text for specs.** | Card 3 |
| **Pointer badges (A, B, C)** | **Use `Meta / Content / Pointer Badge`** (Direction variant). Import, set Label property. For anatomy structure callouts. | Card 3 |
| **REQ/OPT badges** | Auto-layout frame, **horizontal, min-width 50px**: REQ = `#FEF3F2` bg + `#C10C0D` text. OPT = `#F5F5FA` bg + `#888888` text. Bold 10px uppercase. **Text must stay on one line.** | Card 5 |
| **Typography specimens** | Actual styled text at documented font size/weight/family | Card 4 |
| **Code blocks** | `#1E1E2E` bg, 16px padding, 12px monospace with syntax colors | Cards 8, 9 |
| **Do/Don't pairs** | **Use `Meta / Content / Do-Don't Pair`** (Mode=DS). Import, set Do Label, Don't Label, Do Example, Don't Example. **Never build as raw frames with colored bars.** | Cards 6, 7 |
| **Component instances** | P0 — real library instances via `importComponentSetByKeyAsync()`. Never text placeholders. | Cards 2, 3 |
| **Pass/Exempt badges** | Pass = green `#047800`, Exempt = `#9C2000`, bold 12px | Card 8 |

## Per-card content requirements

Figma output MUST match HTML. Omitting content is a P0 bug.

**Card 2 — Actual component:**
- [ ] Variant matrix: ALL rows the HTML has, not just first two
- [ ] Each cell = real imported component instance
- [ ] Theme comparison: 3 cards (Actian, Studio, Explorer) with instance + swatch dots

**Card 3 — Anatomy:** ALL 4 sub-sections:
1. **Structure** — real instance + **`Meta / Content / Pointer Badge`** (key: `7e066fc21d9a2bbbcd1149113787cf59140162d4`) for lettered callouts (A, B, C...). Import the component set, pick Direction variant, set Label property. Place badges pointing at component parts. Add legend below.
2. **Specs** — **MANDATORY.** Real instance + **`Meta / Content / Dimension Annotation`** (key: `49bf6a1b210a403ba145a3fdee9b1994eb54069a`) for pink measurement callouts. Import Horizontal/Vertical variants, set Value property (e.g., "16px", "8px"). NOT a text list. NOT a table.
3. **States** — horizontal row of real instances per state (use `buildStateGrid` or clone `state-column` template). Text-only NOT acceptable.
4. **Parts reference** — table via `buildSpecTable`: Part | Element | Token | Notes

**Card 4 — Design tokens:** ALL 3 sub-sections:
1. Color tokens table — use **`Meta / Content / Color Swatch`** (key: `da3369932f710386b76ca91a40ebd48d94e3f2e0`, Size=Small variant) as inline swatch dots next to each color value. Import the component, create instances, bind fills to the token variable. **Never omit swatch dots.**
2. Sizing & spacing table via `buildSpecTable`: Property | Token | Value
3. Typography specimens at documented font specs — render actual styled text at the specified font size/weight/family

**Card 5 — Component API:**
- [ ] Props table via `buildSpecTable`: REQ/OPT | Property | Type | Default | Values | Notes
- [ ] **REQ/OPT badges as inline auto-layout frames** — REQ = `#FEF3F2` bg + `#C10C0D` text, OPT = `#F5F5FA` bg + `#888888` text. Bold 10px uppercase. Must be **horizontal** layout with padding so text stays on one line. **Column width for REQ/OPT must be at least 50px** to prevent text wrapping.
- [ ] Monospace property names, purple types (`#C792EA`), green defaults (`#C3E88D`)

**Card 6 — Usage guidelines:** When to use (+), When NOT to use (−), Do/Don't pairs using **`Meta / Content / Do-Don't Pair`** (key: `28edfacf13e50706586172bd48f8a3ad84d7c263`, Mode=DS variant). Import the component set, set `Do Label`, `Don't Label`, `Do Example`, `Don't Example` properties. **Never build Do/Don't as raw frames with colored bars.**

**Card 7 — Content guidelines:** Content rules + **`Meta / Content / Do-Don't Pair`** for inline examples. **MUST include all content guideline rules from the component's Figma page** (extracted via `get_design_context` in Step 1). If the Figma page has 6 content rules, Card 7 must have 6 rules. Do not summarize or skip rules.

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
| **REQ/OPT text wraps vertically** | Column too narrow or badge is vertical layout | Badge frame: `layoutMode = 'HORIZONTAL'`, `resize(50, 1)`, `counterAxisSizingMode = 'AUTO'`. First column min 50px width |
| **Page header is raw frame** | Forgot to use Brief Card Page Header variant | Card 1 MUST use `Mode=DS, Type=Page Header` variant of Brief Card |
| **Do/Don't as raw frames** | Built colored bars manually instead of importing | MUST use `Meta / Content / Do-Don't Pair` component |
| **Anatomy specs as text list** | Listed dimensions as text instead of visual annotations | MUST use `Meta / Content / Dimension Annotation` + `Pointer Badge` components |
| **Missing swatch dots** | Built token table without Color Swatch instances | MUST use `Meta / Content / Color Swatch` (Size=Small) next to every color value |
| **Content guidelines incomplete** | Only included generic rules, skipped component-specific ones | Extract ALL rules from the component's Figma page via `get_design_context` |
