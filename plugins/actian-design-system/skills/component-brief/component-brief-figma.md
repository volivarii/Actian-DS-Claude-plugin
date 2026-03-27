# Component Brief — Figma Output Reference

Detailed Figma output requirements for Step 3 of the component-brief skill. Read `../../references/figma-output.md` for shared patterns (token binding, generation metadata, auto-layout).

## P0 Rule: Use real component instances

When briefing an **existing** component (Figma URL provided), MUST import real instances. Never approximate with text placeholders like `[ Save ]` or rectangles.

**Where to use real instances:**
- **Card 2 (Actual component)** — variant matrix cells and theme comparison previews
- **Card 3 (Anatomy)** — Structure (badge overlays), Specs (pink annotations), States (one per state)
- Any other card where the actual component adds clarity

**How:**
1. `get_design_context` on source node → discover component set key
2. `figma.importComponentSetByKeyAsync(key)` or `importComponentByKeyAsync(key)`
3. Find variant: `set.children.find(c => c.name.includes("Type=Primary"))`
4. Create instances: `variant.createInstance()`
5. For states, create separate instances with variant properties or annotate with labels

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
| **Clipped content** | Frame at default FIXED 100px width | `layoutSizingHorizontal = 'FILL'` or `'HUG'` |
| **Text placeholders** | `[ Label ]` instead of real component | Import via `importComponentByKeyAsync` |
| **Specs is a table** | Card 3 Specs as data table | Must be visual annotation with pink lines |
| **A11y cards empty** | Font not loaded for Card 8 text | Load Inter Regular, Bold, + monospace |
| **Erratic column widths** | No explicit widths on column frames | `resize(width, 1)` matching HTML proportions |
| **Cards different heights** | Fixed height instead of auto | `primaryAxisSizingMode = "AUTO"` |
