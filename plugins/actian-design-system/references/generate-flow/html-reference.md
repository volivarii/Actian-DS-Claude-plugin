# Generate Flow — HTML & Figma Output Reference

HTML template structure, FM component rules, and Figma output details for the generate-flow skill.

## Required components per screen

- **FM App_header** — top bar with logo, product label (Admin/Studio/Explorer), avatar
- **FM Side navigation bar** — left sidebar with placeholder items + one active item
- **FM Page Header** — title (+ optional subtitle) at top of content area

## Available components

Refer to `../../docs/generated/fm-components.md` for the full Figma library inventory with component keys.

### Figma library components (importable via `use_figma`)

These exist in the FM Kit Figma library and can be imported with `getComponentByKeyAsync()`:

| Component | Variants | Text overrides | Notes |
|---|---|---|---|
| **FM App_header** | Type: Admin / Explorer / Studio / Actian | — | Set Type to match app context |
| **FM Button** | Type: Primary / Secondary / Outline, Size: md / sm, Shape: Regular / Pill, State: Default / Disabled | `Label` | Set Label to contextual action text, never "Button". **No Icon or Destructive axis** — see FM Kit Limitations below |
| **FM Icon Buttons** | Type: Primary / Secondary / Outline, State: Default / Disabled | — | For icon-only actions (back, close, menu) |
| **FM Text input field** | Type: Empty / Placeholder / Default / Disabled | `Input Text` | **No Error variant** — see Error States below |
| **FM Text Area** | Content: None / Placeholder / Filled | — | No text override — set placeholder via CSS |
| **FM Dropdown** | Type: Placeholder / Open / Disabled / Filled | — | No text override — set text via CSS or custom layer |
| **FM Multi-select dropdown** | Type: Placeholder / Disabled / Open Multi-select / Filled / User Filled | `Dropdown Text` | |
| **FM Search input field** | Type: Empty / Placeholder / Filled | `Input Text` | |
| **FM Input Label** | Disabled: No / Yes, Type: Text / Placeholder | `Label Text`, `Caption Text` | Use Caption Text for helper text or error messages |
| **FM Date input** | State: Default / Open / Placeholder | `Input Text` | |
| **FM Table Cell** | Type: Header / Text / Pill / Placeholder | — | Header for column titles, Pill for status badges, Placeholder for future columns |
| **FM Checkbox** | State: Off / On, Style: Default / Disabled | — | Pair with FM Input Label for labeling |
| **FM Radio button** | State: On / Off, Style: Default / Disabled | — | Pair with FM Input Label |
| **FM Toggle** | State: Off / On, Style: Default | — | **No Disabled style** — pair with text label (use `fm-custom-toggle-row` layout) |
| **FM Badge** | Size: Small / Medium / Large, Type: Icon / Number / Number Expand | — | |
| **FM Tag** | Style: Filled / Outline / Light | — | |
| **FM Chip** | Outline: False / True | — | |
| **FM Alert** | Type: Success / Error / Warning | — | Persistent inline feedback. Left color bar indicates type. For brief confirmations use FM Toast instead |
| **FM Banner** | Single component (no variants) | — | Page-level persistent notice bar. Import via `importComponentByKeyAsync` |
| **FM Dialog** | Single component (no variants) | — | 484px confirmation dialog with title, body, FM Button instances. Import via `importComponentByKeyAsync` (not component set) |
| **FM Stepper** | State: Active / Complete / Upcoming | — | Step indicator for wizard flows. One instance per step in a horizontal row. Complete shows checkmark |
| **FM Menu** | Single component (no variants) | — | Dropdown menu container. Use with FM Menu item children |
| **FM Rich text field** | Single component (no variants) | `Input Text` | Multi-line rich text input with formatting |
| **FM Spinner** | Single component (no variants) | — | Inline loading indicator |
| **FM Tabs** | Single component (no variants) | — | Tab bar container. Use with FM Tab children |
| **FM Toast** | Style: Standard / Outline | — | **Brief confirmations only** — auto-dismissing, overlaid |
| **FM User** | Single component (no variants) | — | User avatar placeholder |
| **FM Page Header** | Type: Title only / Title + Subtitle / Title + Actions | `Title`, `Subtitle` | Use correct variant — don't add buttons outside "Title + Actions" |
| **FM Side navigation bar** | Property 1: Default / Slim | — | |
| **FM Side navigation item** | State: On / Off / Placeholder | `Label` | On = active page, Placeholder = filler items |
| **FM Tab** | State: On / Off / Placeholder | — | On = active tab, Placeholder = future tabs. **No text override** — set label via `findOne(n => n.type === "TEXT").characters` in Figma, or inner text in HTML |
| **FM Empty State** | Property 1: Default / Variant2 | — | Default = centered icon + text. Variant2 = compact. Use Default unless space-constrained. |
| **FM Placeholder** | Type: Label+1line / Label+3lines / Label+6lines / Label+avatars / metric | — | For non-essential content areas in wireframes |
| **FM Progress bar** | Completion: 10% through 100% | — | |
| **FM Menu item** | State: Default / Hover / Active | — | |
| **FM Tooltip** | Position: Left / Right / Top / Bottom (+ corners) | — | |
| **FM Slider** | Progress: 0% / 25% / 50% / 75% / 100% | — | |

### Setting text on components without text overrides

Some FM components (Tab, Table Cell, Toast, Tag, Badge, Empty State, Menu item) have **no named text override property** in Figma. To set contextual text:

**In HTML:** Set inner text directly — `<div class="fm-tab fm-tab--on">Overview</div>`

**In Figma (`use_figma`):** Find the nested text node and set `.characters`:
```js
const textNode = instance.findOne(n => n.type === "TEXT");
await figma.loadFontAsync(textNode.fontName);
textNode.characters = "Overview";
```

Never leave default/generic text like "Tab", "Cell", "Tag" — always set contextual content.

### FM Kit limitations vs DS Kit

These features exist in the DS Kit library but **not in FM Kit**. Handle with workarounds:

| Feature | DS Kit has | FM Kit workaround |
|---|---|---|
| **Button icons** (Leading/Trailing/Only) | `Icon` variant axis | HTML: add icon element inside button. Figma: use FM Icon Buttons for icon-only; for text+icon, build `fm-custom-button-with-icon` (horizontal auto-layout: icon frame + FM Button) |
| **Destructive button** | `Destructive=True/False` | HTML: add `color: var(--fm-text-error)` or red border. Figma: use FM Button Type=Outline and note "destructive" in the screen list — the lo-fi wireframe conveys intent through label text ("Delete", "Remove") |
| **Input error state** | Error variant | See "Error states on form inputs" section below |

### Input state guide

FM Text input field variants and when to use each:

| Variant | When to use | Visual |
|---|---|---|
| `Type=Empty` | Field exists but has no content and no placeholder hint | Empty input, no text |
| `Type=Placeholder` | Field is empty but shows hint text | Grey placeholder text visible (e.g., "Enter hostname") |
| `Type=Default` | Field has user-entered content (filled) | Black text showing the value (e.g., "db.example.com") |
| `Type=Disabled` | Field cannot be edited | Grey background, grey text |

**Screen transitions:** When showing the same form across two screens (e.g., empty → filled), change the Type variant per field:
- Empty form: all inputs `Type=Placeholder`
- Partially filled: changed fields `Type=Default` with Input Text set, unchanged fields stay `Type=Placeholder`
- Error state: errored field `Type=Default` (or `Placeholder` if still empty) + border override, valid filled fields `Type=Default`

FM Dropdown follows the same pattern: `Placeholder` → `Filled` when selected, `Open` when showing options.

**Note:** FM Alert, FM Dialog, and FM Banner are all Figma library components — import directly via `importComponentByKeyAsync()`. No HTML-only components remain.

### Error states on form inputs

FM Text input field has no Error variant. Apply error styling manually:

**HTML:** Add `border-color: var(--fm-text-error)` to the input, set FM Input Label's Caption Text to the error message in error color.

**Figma (`use_figma`):** Use `Type=Default` (filled) and override the border:
```js
inputFrame.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.24, b: 0.24 } }]; // #E53E3E
inputFrame.strokeWeight = 2;
```
Set the FM Input Label's Caption Text to the error message and color it red.

### Feedback component selection guide

| Situation | Use | Why |
|---|---|---|
| Brief success after action | **FM Toast** | Transient, auto-dismiss, doesn't block content |
| Persistent error on page | **FM Alert** (Type=Error) | Stays visible until dismissed or fixed |
| Field-level validation error | **FM Input Label** Caption Text + input border override | Inline, per-field, most specific |
| Page-level persistent notice | **FM Banner** | Full-width, high visibility |
| Destructive action confirmation | **FM Dialog** (Size=Small) | Modal, requires explicit decision |

### Component pairing patterns

| Pattern | Components | Configuration |
|---|---|---|
| **Labeled input** | FM Input Label + FM Text input field | Label above input. Set Label Text, required asterisk if needed. Caption Text for helper/error. |
| **Labeled dropdown** | FM Input Label + FM Dropdown | Same pattern. Dropdown has no text override — set selected value in Figma via custom text node. |
| **Labeled toggle** | `fm-custom-toggle-row` (horizontal flex) + FM Toggle + text label | Toggle component has no built-in label. Build a horizontal row with label text + toggle. |
| **Labeled checkbox** | FM Input Label + FM Checkbox | Or use custom row: text label + checkbox aligned horizontally. |
| **Labeled radio group** | FM Input Label (group label) + multiple FM Radio button rows | Group label above, then vertical stack of radio + label pairs. |
| **Table** | FM Table Cell (Header row) + FM Table Cell (data rows) | Build rows with horizontal auto-layout. Use Pill variant for status badges, Placeholder for future columns. |
| **Navigation with active item** | FM Side navigation bar + FM Side navigation items | Set exactly one item to State=On (matching current page). Use Placeholder for filler items (not Off with generic text). |

## Custom elements

When no FM component fits, build custom elements inline.

**Rules:**
1. **FM first** — check `../../docs/generated/fm-components.md` before going custom
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

  <!-- Research card (REQUIRED if research was conducted — placed after cover, before screens) -->
  <div class="flow-research" data-name="Research: [Feature]">
    <div class="flow-research__title">Research: [Feature]</div>
    <div class="flow-research__section">
      <div class="flow-research__heading">How others handle this</div>
      <ul class="flow-research__list">
        <li><strong>[Product A]:</strong> [approach]</li>
        <li><strong>[Product B]:</strong> [approach]</li>
      </ul>
    </div>
    <div class="flow-research__section">
      <div class="flow-research__heading">Common patterns</div>
      <ul class="flow-research__list">
        <li>[Pattern observation]</li>
      </ul>
    </div>
    <div class="flow-research__section">
      <div class="flow-research__heading">Recommendation</div>
      <p class="flow-research__body">[What to adopt and why]</p>
    </div>
    <div class="flow-research__section">
      <div class="flow-research__heading">Sources</div>
      <ul class="flow-research__list flow-research__list--sources">
        <li>[Source URL or name]</li>
      </ul>
    </div>
  </div>

  <div class="screen"> ... </div>
  <div class="screen"> ... </div>
</div>
```

### Research card CSS

Add these styles when research is included:

```css
.flow-research {
  min-width: 480px;
  max-width: 480px;
  background: var(--fm-base-900, #1a1d23);
  color: var(--fm-base-white, #ffffff);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-self: stretch;
}
.flow-research__title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.flow-research__heading {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--fm-base-400, #9ca3af);
  margin-bottom: 8px;
}
.flow-research__list {
  margin: 0;
  padding-left: 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--fm-base-200, #e5e7eb);
}
.flow-research__list li {
  margin-bottom: 4px;
}
.flow-research__list--sources {
  color: var(--fm-base-400, #9ca3af);
  font-size: 12px;
}
.flow-research__body {
  font-size: 14px;
  line-height: 1.5;
  color: var(--fm-base-200, #e5e7eb);
  margin: 0;
}
.flow-research__section {
  border-top: 1px solid var(--fm-base-700, #374151);
  padding-top: 16px;
}
.flow-research__section:first-of-type {
  border-top: none;
  padding-top: 0;
}
```

## Screen dimensions

- Standard: 1440x960px
- Compact (no sidebar): 1440x700px
- Always include FM App_header (70px) + FM Sidebar (260px) + content area

## Forms layout

- Simple inputs: **480px max-width** container, left-aligned
- Extended elements: **full-width** within content area
- Multi-column: forms stay **fluid**
- Action footer: inside **content area** (not full screen), sticky bottom, primary right, secondary left

### Classifying form elements

| 480px max-width (simple inputs) | Full-width (extended elements) |
|---|---|
| FM Text input field | Data tables (FM Table Cell rows) |
| FM Text Area | Selectable row lists (checkbox + table rows) |
| FM Dropdown | Tile/card selection grids |
| FM Search input field | Color swatch grids |
| FM Date input | File upload zones |
| FM Radio button group | Multi-select lists |
| FM Checkbox group | Transfer lists (two-column drag) |

When both types coexist on one screen, use **separate containers**: 480px wrapper for simple inputs, full-width wrapper for extended elements. Do not wrap the entire form in one width constraint.

## Annotation layer (required)

Every generated HTML file MUST include the annotation layer inline before `</body>`. Read the 3 files from `templates/` and embed directly:

1. `${CLAUDE_PLUGIN_ROOT}/templates/annotation-layer.css` → wrap in `<style>...</style>`
2. `${CLAUDE_PLUGIN_ROOT}/templates/annotation-layer.js` → wrap in `<script>...</script>`
3. `${CLAUDE_PLUGIN_ROOT}/templates/annotation-layer-markup.html` → insert as-is

Also include Alpine.js CDN before the annotation layer (unless already present):

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
<!-- Annotation Layer -->
<style>{annotation-layer.css}</style>
<script>{annotation-layer.js}</script>
{annotation-layer-markup.html}
</body>
```

See `../annotation-reference.md` for full details. Inlining ensures annotations work in all environments (CLI, Desktop, any browser).

Do NOT skip this step. Do NOT read or inline `annotation-layer.html` — the loader handles everything.

## `data-name` attributes (required for annotations)

The annotation layer targets elements with `data-name` attributes. Add `data-name` to **every meaningful element**, not just top-level screens. Designers need to annotate specific components, not entire screens.

**Required depth:**

```html
<div class="screen" data-name="Screen 1: Dashboard">
  <div class="fm-app-header" data-name="App header">...</div>
  <div class="fm-sidebar" data-name="Side navigation">
    <div class="fm-sidebar__item" data-name="Nav: Dashboard">Dashboard</div>
    <div class="fm-sidebar__item" data-name="Nav: Catalog">Catalog</div>
  </div>
  <div class="content-area" data-name="Content area">
    <div class="fm-page-header" data-name="Page header">...</div>
    <div class="fm-search" data-name="Search input">...</div>
    <div class="metrics-row" data-name="Summary metrics">
      <div class="metric-card" data-name="Metric: Pending">...</div>
      <div class="metric-card" data-name="Metric: Approved">...</div>
    </div>
    <table data-name="Request table">
      <thead data-name="Table header">...</thead>
      <tbody data-name="Table body">...</tbody>
    </table>
    <div class="action-footer" data-name="Action buttons">
      <button data-name="Button: Cancel">Cancel</button>
      <button data-name="Button: Submit">Submit</button>
    </div>
  </div>
</div>
```

**Naming convention:** Use descriptive names that match what the designer sees. Prefix with the element type when there are many of the same kind (e.g., "Nav: Dashboard", "Metric: Pending", "Button: Submit").

**Rule of thumb:** If a designer might want to comment on it, it needs a `data-name`.

## Styling rules

- Read `../fm-css-reference.md` — copy exact styles, do not approximate
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

Does NOT need detaching — `contentArea.appendChild()` works. See `../../docs/generated/meta-kit/components.md`.

### Rules for `use_figma` code

1. **Import library components** — never recreate FM components as raw frames
2. **Auto-layout on every frame** — no absolute positioning
3. **Bind library tokens** — follow `../figma-output.md` § "Token binding". Hex fallback only.
4. **Standard screen structure**: FM App_header → horizontal frame → FM Sidebar + Content area
5. **Generation Log** — import key `a9653f30925367e96dea90093d750bfe70849571`, set all 6 properties
6. **Descriptive layer names** — no "Frame 1"
7. **Contextual text content** — no generic placeholders
8. **One row per flow** — all screens in a single horizontal wrapper
9. **App Header variant must match app context** — if the flow is for Studio, set `Type=Studio`. Never leave as default or wrong app. Verify after creation.
10. **Set ALL text properties on every instance** — after `createInstance()`, set every text property (Label, Caption, Title, Input Text). Never leave FM defaults like "Label", "Caption", "Text", "Nav Item". Check by reading back the property value.
11. **Every frame with children MUST have layoutMode** — set `layoutMode = 'VERTICAL'` or `'HORIZONTAL'` BEFORE appending children. Frames without layoutMode collapse to minimum height. This is the #1 cause of invisible content in Figma output.
12. **Append screens to the flow wrapper** — every screen must be a child of the horizontal flow wrapper frame, not a direct child of the page or section. After appending, verify `screen.parent.name` matches the wrapper name.
13. **Split calls by screen** — push one screen per `use_figma` call. Do not batch multiple screens. Pass the flow wrapper frame ID to each call so screens land in the right parent.
14. **Feature focus in Figma matches HTML** — the Figma output must mirror the HTML preview exactly. If the HTML uses placeholder bars for non-feature sidebar items, the Figma output must use `FM Side navigation item` with `State=Placeholder` — not real text labels. If the HTML uses placeholder table rows, use `FM Text Cell` with `Type=Placeholder`. The Figma output is NOT a higher-fidelity version of the HTML — it is a 1:1 translation.

## Token reference

- **`use_figma`**: `../figma-output.md` § "Token binding"
- **HTML**: `--fm-*` from `../fm-css-reference.md` (FM) or `--zen-*` from `../../tokens/tokens.css` (DS Kit)
