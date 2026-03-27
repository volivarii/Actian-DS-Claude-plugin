# Generate Flow — HTML & Figma Output Reference

HTML template structure, FM component rules, and Figma output details for the generate-flow skill.

## Required components per screen

- **FM App_header** — top bar with logo, product label (Admin/Studio/Explorer), avatar
- **FM Side navigation bar** — left sidebar with placeholder items + one active item
- **FM Page Header** — title (+ optional subtitle) at top of content area

## Available components

Refer to `../../docs/fm-components.md` for the full inventory. Key ones:
- FM Button (Primary/Secondary/Outline)
- FM Text input field, FM Text Area, FM Dropdown, FM Search input field
- FM Input Label (with required asterisk where needed)
- FM Table Cell (Header/Text/Pill/Placeholder)
- FM Badge, FM Tag, FM Chip
- FM Checkbox, FM Radio button, FM Toggle
- FM Alert (Success/Error/Info/Warning)
- FM Banner (for persistent page-level notices)
- FM Toast (for brief confirmations)
- FM Dialog (for modal confirmations)
- FM Empty State (for zero-data screens)
- FM Placeholder (for non-essential content areas)
- FM Menu (for dropdown action menus)
- FM Tabs (for tabbed content)

## Custom elements

When no FM component fits, build custom elements inline.

**Rules:**
1. **FM first** — check `../../docs/fm-components.md` before going custom
2. **Follow FM conventions** — `--fm-*` CSS vars, FM spacing scale (4-32px), Inter font, FM radius/border
3. **Prefix with `fm-custom-`** — e.g., `fm-custom-chart`, `fm-custom-timeline`
4. **Comment what it represents** — `<!-- Custom: [what and why] -->`
5. **Keep it lo-fi** — charts = labeled rectangles with axis lines, not D3

## Flow structure in HTML

**One row per flow.** Never split across rows. Use `flex-wrap: nowrap`.

```html
<div class="flow-row">
  <!-- Generation card (first element in first flow-row only) -->
  <div class="flow-cover">
    <div class="flow-cover__feature">[Feature]</div>
    <div class="flow-cover__flow">Flow: [Sub-flow]</div>
    <div class="flow-cover__user">User: [Role]</div>
  </div>
  <div class="screen"> ... </div>
  <div class="screen"> ... </div>
</div>
```

## Screen dimensions

- Standard: 1440x960px
- Compact (no sidebar): 1440x700px
- Always include FM App_header (70px) + FM Sidebar (260px) + content area

## Forms layout

- Simple inputs: **480px max-width** container, left-aligned
- Extended elements (rows, tiles, tables): **full-width**
- Multi-column: forms stay **fluid**
- Action footer: inside **content area** (not full screen), sticky bottom, primary right, secondary left

## Styling rules

- Read `../../references/fm-css-reference.md` — copy exact styles, do not approximate
- Load Inter font from Google Fonts
- Screen labels: 12px, #888

---

## Figma output — `use_figma` (default)

Imports published library components via `getComponentByKeyAsync()`. Instances arrive with Figma variables intact.

### Screen scaffolding (Meta Kit)

Import `Meta / Chrome / Flow Screen` instead of building manually:

```js
const flowScreenSet = await figma.importComponentSetByKeyAsync("2ca7c756ad54e81219104d3a270ba8eb9eeffcf6");
const stdVariant = flowScreenSet.children.find(c => c.name === "Size=Standard");
const screen = stdVariant.createInstance();
const contentArea = screen.findOne(n => n.name === "Content Area");
```

Does NOT need detaching — `contentArea.appendChild()` works. See `../../docs/meta-kit/components.md`.

### Rules for `use_figma` code

1. **Import library components** — never recreate FM components as raw frames
2. **Auto-layout on every frame** — no absolute positioning
3. **Bind library tokens** — follow `../../references/figma-output.md` § "Token binding". Hex fallback only.
4. **Standard screen structure**: FM App_header → horizontal frame → FM Sidebar + Content area
5. **Generation Log** — import key `a9653f30925367e96dea90093d750bfe70849571`, set all 6 properties
6. **Descriptive layer names** — no "Frame 1"
7. **Contextual text content** — no generic placeholders
8. **One row per flow** — all screens in a single horizontal wrapper

## Token reference

- **`use_figma`**: `../../references/figma-output.md` § "Token binding"
- **HTML**: `--fm-*` from `../../references/fm-css-reference.md` (FM) or `--zen-*` from `../../tokens/tokens.css` (DS2026)
