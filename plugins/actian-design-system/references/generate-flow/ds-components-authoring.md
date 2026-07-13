# DS Components Authoring Reference

This reference is for the screen-generator agent when `meta.library:"ds"` is set (i.e., the `--hifi` flag is active). It lists every component in the DS vocabulary that may be authored as an INSTANCE node, which ones have fully-built HTML leaf renderers versus graceful chip fallbacks, the variant axes each component exposes, and the props that the built leaves actually consume. Read this before authoring any DS INSTANCE node.

The DS detail bar is higher than the FM deliberate-simplicity bar. When composing DS-native screens you are expected to supply realistic app-context data, real Action labels, full-detail copy, and meaningful states — not generic placeholders. The hi-fi HTML is the deliverable and must read like a real product screen.

The table below covers the 69 authorable slugs (registry `section:"Components"`). **BUILT** = full CSS-styled HTML leaf renderer. Non-BUILT slugs are still valid to author: when the slug has a vendored appearance doc, the appearance renderer draws its real captured colors (fill, border, text) and, where anatomy resolves a real icon instance, a real SVG glyph (not a placeholder). **chip** = graceful labeled chip (`<span class="ds-component" data-slug="...">`), the last-resort fallback used only when no vendored appearance doc exists for the slug.

## Vocabulary table

| Slug | Name | Status | Variant axes |
|---|---|---|---|
| `account-dropdown` | Account dropdown | **BUILT** | — |
| `alert-banner` | Alert-banner | **BUILT** | Type / Orientation' |
| `alert-inline` | Alert-inline | appearance | Type / Orientation' |
| `app-switcher-dropdown` | App switcher dropdown | **BUILT** | — |
| `avatar` | Avatar | appearance | State / Type |
| `badge` | ✍️ Badge | **BUILT** | Type |
| `bar-graph` | ⛔️ Bar graph | appearance | Property 1 |
| `breadcrumb` | Breadcrumb | **BUILT** | Type |
| `button` | Button | **BUILT** | Intent / Emphasis / Size / State |
| `calendar` | Calendar | **BUILT** | Type / Selection |
| `card-for-grouped-content` | Card for grouped content | appearance | Property 1 |
| `card-for-items` | Card for items | **BUILT** | Type / State |
| `card-for-perimeter` | Card for perimeter | appearance | Property 1 |
| `chat-with-ai-steward` | Chat with AI Steward | **BUILT** | size / history |
| `checkbox` | Checkbox | **BUILT** | Selection / State |
| `checkbox-card` | Checkbox card | appearance | Selection / State |
| `collapse-accordion` | ✍️ Collapse-accordion | appearance | State |
| `confirmation` | Confirmation | appearance | Size |
| `digram-item-types` | Digram, Item types | appearance | Item type / Size |
| `digram-topic` | Digram, Topic | appearance | Type |
| `drawer-side-panel` | Drawer, side panel | appearance | App |
| `dropdown-select-default` | Dropdown, Select, default | **BUILT** | Type / State |
| `empty-state` | Empty state | **BUILT** | Size |
| `error-state` | Error state | appearance | Size |
| `global-header` | Global header | **BUILT** | App type / Breakpoints |
| `glossary-item-hierarchy-diagram` | Glossary item hierarchy diagram | chip | Type |
| `identification-key` | Identification key | appearance | Property 1 |
| `input-date` | Input, date | **BUILT** | Type / States |
| `line-graph` | ⛔️ Line graph | appearance | Property 1 |
| `lineage-connecting-line` | Lineage connecting line | chip | Direction / State |
| `lineage-grouped-node` | Lineage grouped node | appearance | State / Type |
| `lineage-individual-node` | Lineage individual node | appearance | Type / State / Fields |
| `link` | Link | appearance | State |
| `loader` | Loader | **BUILT** | Percent |
| `loader-with-logo` | Loader with logo | appearance | App |
| `loading-skeleton` | Loading skeleton | appearance | Transition |
| `maintenance-state` | Maintenance state | appearance | Size |
| `metamodel-widget` | Metamodel widget | appearance | Type |
| `modal` | Modal | **BUILT** | Size & Type / Dev status |
| `notification` | Notification | **BUILT** | Type |
| `notification-dropdown` | Notification dropdown | chip | Property 1 |
| `page-header` | Page header | **BUILT** | Type |
| `popover` | ⛔️ Popover | **BUILT** | Type |
| `progress-bar-small` | Progress bar small | **BUILT** | Size / Completeness |
| `radio-button` | Radio button | **BUILT** | Selection / State |
| `radio-button-card` | Radio button card | appearance | Selection / State |
| `rich-text` | Rich text | **BUILT** | State |
| `scroll-bar` | Scroll bar | chip | Property 1 |
| `search` | Search | **BUILT** | Type / State |
| `search-dropdown-menu` | Search dropdown menu | appearance | Type |
| `search-filters` | Search filters | appearance | Type |
| `search-result-card` | Search result card | appearance | App / State |
| `segmented-control` | Segmented control | **BUILT** | Type |
| `side-nav` | ✍️ Side nav | **BUILT** | App / View |
| `spinner` | Spinner | appearance | Color mode / Complete |
| `stepper` | Stepper | **BUILT** | State |
| `sticky-footer` | Sticky footer | **BUILT** | Property 1 |
| `table` | ✍️ Table | **BUILT** | Built type |
| `tabs` | Tabs | **BUILT** | Property 1 |
| `tag-catalog` | ✍️ Tag, Catalog | appearance | Type |
| `tag-catalog-item-type` | ✍️ Tag, Catalog item type | appearance | Type |
| `tag-default` | ✍️ Tag, Default | **BUILT** | Color |
| `tag-glossary-item-type` | ✍️ Tag, Glossary item type | appearance | Property 1 |
| `tag-interactive` | ✍️ Tag, Interactive | **BUILT** | State |
| `tag-shared` | ✍️ Tag, Shared | appearance | Property 1 |
| `tag-stage` | ✍️ Tag, Stage | appearance | Color |
| `tag-status` | ✍️ Tag, Status | appearance | Status |
| `text-input` | Text input | **BUILT** | States |
| `toggle` | Toggle | **BUILT** | Toggle position / Selection / State |
| `toolbar` | Toolbar | **BUILT** | Type / Orientation |
| `tooltip` | ⚠️ Tooltip | **BUILT** | Type |
| `whats-new-dropdown` | Whats new dropdown | appearance | Property 1 |

## Built leaf props

The following 19 slugs have real HTML leaf renderers. Prop names are case-sensitive and must match exactly. Omitting a prop uses the renderer's fallback default (shown in parentheses).

### `button`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "button",
  "variant": "Intent=Default, Emphasis=Filled, Size=Default, State=Default",
  "props": {
    "Label": "Save",
    "Leading icon show": false,
    "Trailing icon show": false
  }
}
```

- `variant.Intent`: `Default` | `Critical` (default: `Default`) — use `Critical` for destructive/error actions
- `variant.Emphasis`: `Filled` | `Outlined` | `Ghost` | `Icon-only` (default: `Filled`) — emphasis ladder; `Filled` is the primary CTA, `Outlined`/`Ghost` step down, `Icon-only` for icon-only buttons
- `variant.Size`: `Default` | `Small` (default: `Default`)
- `variant.State`: `Default` | `Hover` | `Focus` | `Pressed` | `Selected` | `Disabled` | `Loading` (default: `Default`)
- `props.Label`: button text (required, never generic — use real action copy)
- `props["Leading icon show"]`: `true` renders the `add` icon before the label
- `props["Trailing icon show"]`: `true` renders a rotated `chevron-up` (chevron-down) after the label

### `text-input`

The text field. (The `input` slug is retired: since the knowledge publish gate
landed, `input` names an icon in Foundations/Icons and is no longer authorable —
never author `dsSlug: "input"`.)

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "text-input",
  "variant": "States=Default",
  "props": {
    "Label": "Name",
    "Placeholder text": "Enter a name",
    "Trailing icon": false
  }
}
```

- `variant.States`: `Default` | `Hover` | `Focus` | `Active` | `Filled` | `Error` | `Warning` | `Disabled` | `Read-only` (default: `Default`; the built leaf styles `Disabled`, other states render the default field)
- `props.Label`: field label (default: `"Label"`)
- `props["Placeholder text"]`: placeholder copy (default: `"Placeholder text"`)
- `props["Trailing icon"]`: `true` renders a chevron-down (used for select-style fields)

### `checkbox`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "checkbox",
  "variant": "Selected=No, State=Default",
  "props": {
    "Label": "Enable notifications"
  }
}
```

- `variant.Selected`: `Yes` | `No` (default: `No`)
- `variant.State`: `Default` | `Hovered` | `Disabled` (default: `Default`)
- `props.Label`: checkbox label text

### `radio-button`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "radio-button",
  "variant": "Format=Default, Selected=No, State=Default",
  "props": {
    "Label": "Weekly",
    "Helper text": "Runs every Monday at 9 AM",
    "Show Helper text": true
  }
}
```

- `variant.Format`: `Default` | `Card format` (default: `Default`)
- `variant.Selected`: `Yes` | `No` (default: `No`)
- `variant.State`: `Default` | `Hovered` | `Disabled` (default: `Default`)
- `props.Label`: radio option text
- `props["Helper text"]`: sub-label text (only shown when `Show Helper text` is truthy)
- `props["Show Helper text"]`: `true` | `false` (default: `false`)

### `toggle`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "toggle",
  "variant": "Toggle location=Left, Selected=No, State=Default",
  "props": {
    "Label": "Dark mode",
    "Helper text": "Applies the dark theme to the UI",
    "Show Helper text": true
  }
}
```

- `variant["Toggle location"]`: `Left` | `Right` (default: `Left`)
- `variant.Selected`: `Yes` | `No` (default: `No`)
- `variant.State`: `Default` | `Hovered` | `Disabled` (default: `Default`)
- `props.Label`: toggle label text
- `props["Helper text"]`: sub-label text (only shown when `Show Helper text` is truthy)
- `props["Show Helper text"]`: `true` | `false` (default: `false`)

### `tag-default`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "tag-default",
  "variant": "Color=Default",
  "props": {
    "Label": "Published",
    "Leading icon show": false
  }
}
```

- `variant.Color`: `Default` | `Gray` | `Pink` | `Purple` | `Blue` | `Teal` | `Green` | `Yellow` | `Orange` | `Red` (default: `Default`)
- `props.Label`: tag text
- `props["Leading icon show"]`: `true` renders a `directory` icon before the label

### `badge`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "badge",
  "variant": "Type=Number",
  "props": {
    "Label": "3"
  }
}
```

- `variant.Type`: `Number` | `Dot` (default: `Number`)
- `props.Label`: count or text (used when `Type=Number`; ignored for `Type=Dot`)

### `search`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "search",
  "variant": "Type=Default, State=Default",
  "props": {
    "Placeholder text": "Search assets…"
  }
}
```

- `variant.Type`: `Default` | `Expanded` (default: `Default`)
- `variant.State`: `Default` | `Focused` | `Filled` | `Disabled` (default: `Default`)
- `props["Placeholder text"]`: search input placeholder (default: `"Search"`)

### `card-for-items`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "card-for-items",
  "variant": "Type=Catalog, State=Default",
  "props": {
    "Eyebrow": "Dataset",
    "Title": "Sales Q1 2025",
    "Category": "Finance",
    "Body": "Monthly revenue and pipeline data for Q1."
  }
}
```

- `variant.Type`: `Catalog` | `Pipeline` | `Connection` (default: `Catalog`)
- `variant.State`: `Default` | `Selected` | `Hovered` (default: `Default`)
- `props.Eyebrow`: small label above the title (default: `"Dataset"`)
- `props.Title`: card title (required — use a real entity name)
- `props.Category`: catalog category shown with a `directory` icon
- `props.Body`: body text paragraph

### `global-header`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "global-header",
  "variant": "App type=Studio, Breakpoints=Desktop",
  "props": {
    "App": "Studio",
    "Account": "JD"
  }
}
```

**Note:** Do not author `global-header` in screen content arrays — the renderer's DS chrome branch supplies it automatically. Only author it if building a custom layout that bypasses DS chrome.

- `variant["App type"]`: `Studio` | `Explorer` | `Admin` (default: `Studio`)
- `variant.Breakpoints`: `Desktop` | `Tablet` | `Mobile` (default: `Desktop`)
- `props.App`: app name displayed in the header brand slot (falls back to variant App type value)
- `props.Account`: avatar initials (default: `"AU"`)

### `side-nav`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "side-nav",
  "variant": "App=Studio, View=Default",
  "props": {
    "Items": "Catalog, Pipelines, Connections, Settings",
    "Active": "Catalog"
  }
}
```

**Note:** Do not author `side-nav` in screen content arrays — the renderer's DS chrome branch supplies it automatically. Only author it if building a custom layout that bypasses DS chrome.

- `variant.App`: `Studio` | `Explorer` | `Admin` (default: `Studio`)
- `variant.View`: `Default` | `Collapsed` (default: `Default`)
- `props.Items`: comma-separated nav item labels
- `props.Active`: label of the active nav item (case-insensitive match; defaults to first item)

### `page-header`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "page-header",
  "variant": "Type=Title + Actions",
  "props": {
    "Title": "Catalog",
    "Description": "Browse and manage your data assets.",
    "Actions": [
      { "label": "New asset", "variant": "primary" },
      { "label": "Import", "variant": "secondary" }
    ]
  }
}
```

- `variant.Type`: `Title only` | `Title + Description` | `Title + Actions` (default: `Title only`)
- `props.Title`: page title (required — use a real page name)
- `props.Description`: subtitle paragraph (shown when present)
- `props.Actions`: array of `{ label: string, variant: "primary" | "secondary" | "tertiary" }` objects. First action is always `primary`.

### `breadcrumb`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "breadcrumb",
  "variant": "Type=Default",
  "props": {
    "Items": "Home, Catalog, Sales Q1 2025"
  }
}
```

- `variant.Type`: `Default` (default: `Default`)
- `props.Items`: comma-separated breadcrumb labels, left-to-right (last item = current page)

### `tabs`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "tabs",
  "variant": "",
  "props": {
    "Items": "Overview, Schema, Lineage, Access",
    "Active": "Overview"
  }
}
```

- `props.Items`: comma-separated tab labels
- `props.Active`: label of the active tab (case-insensitive match; defaults to first item)

### `table`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "table",
  "variant": "Built type=Default",
  "props": {
    "Columns": "Name, Type, Status, Updated",
    "Rows": [
      ["Sales Q1 2025", "Dataset", "Published", "Jun 9, 2025"],
      ["Customer CRM", "Dataset", "Draft", "Jun 7, 2025"],
      ["Revenue Forecast", "Dataset", "Published", "Jun 5, 2025"]
    ]
  }
}
```

- `variant["Built type"]`: `Default` (default: `Default`)
- `props.Columns`: comma-separated column header labels
- `props.Rows`: array of row arrays, each inner array cell corresponding to a column. Realistic row data is required — no "Row 1 / Cell 1" placeholders. Alternatively, a comma-separated string is accepted (each value becomes a single-cell row).

### `modal`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "modal",
  "props": {
    "Title": "Delete data product?",
    "Body": "This removes the product and its lineage links. This action cannot be undone.",
    "Actions": [{ "label": "Delete", "variant": "critical" }, { "label": "Cancel", "variant": "secondary" }]
  }
}
```

- `props.Title` / `props.Body`: dialog heading + supporting copy.
- `props.Actions`: array of bare-label strings or `{label, variant}` objects; first defaults to `primary`, rest `secondary`. Renders a static `role="dialog" aria-modal="true"` over a backdrop. Use `variant:"critical"` for destructive confirmation.

### `empty-state`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "empty-state",
  "props": {
    "Headline": "No data products yet",
    "Body": "Create your first data product to share curated datasets with your team.",
    "Cta": "Create data product"
  }
}
```

- `props.Headline` / `props.Body`: required headline + supporting line.
- `props.Cta`: optional — renders one primary button. Omit for a state with no action.

### `alert-banner`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "alert-banner",
  "variant": "Type=Warning",
  "props": { "Title": "Sync delayed", "Message": "The last catalog sync ran 3 hours ago. Connections may show stale data." }
}
```

- `variant.Type`: `Primary` (info) · `Success` · `Warning` · `Danger`. Drives the status icon (`info-filled`/`success-filled`/`warning-filled`/`error-filled`) and the role (`status`, or `alert` for `Danger`). Unknown values fall back to `Primary`.
- `props.Message`: required body. `props.Title`: optional bold lead.

### `chat-with-ai-steward`

The AI surface panel (Studio / Explorer). Renders an elevated `<aside>` with a sparkle header (`ai` icon + "Generated by AI"), the AI output, a `Source:` citation line, a confidence badge, and a persistent disclaimer footer. See the component guideline (`vendor/components/dist/guidelines/chat-with-ai-steward.json`) for the full pattern.

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "chat-with-ai-steward",
  "variant": "State=Default",
  "props": {
    "Title": "AI Steward",
    "Insight": "Customer Orders joins cleanly to Customer Accounts on customer_id (98% match).",
    "Source": "Customer Accounts",
    "Confidence": "High"
  }
}
```

- `variant.State`: `Default` (answered) | `Generating` (shimmer + Stop, `aria-busy`). Default = `Default`.
- `props.Title`: panel header (default: `"AI Steward"`).
- `props.Insight`: the AI-generated output body (answered state). Required for a meaningful answered panel.
- `props.Source`: catalog asset the insight was derived from — renders the `Source:` citation line. Omit to suppress (and label the output "verify before use" per the guideline).
- `props.Confidence`: `High` | `Medium` | `Low` — renders the confidence badge next to the source. Omit to suppress.

## Available icon slugs

37 icons are currently vendored (incl. `ai` + `stars` for AI surfaces). Use these slug values in `renderIcon()` calls or when setting icon-bearing props. Unknown slugs silently produce no output — verify against this list.

```
add
alert-circle
arrow
arrow-down
back
calendar-2
checkmark-outline
chevron-left
chevron-sort-down
chevron-sort-up
chevron-up
close
cloud-upload
dashboard
directory
dots
download
drag
edit
error-filled
exit
export
filter
home
info-filled
menu
more
pin
settings
simple-check
success-filled
trash
user-single
warning-alt
warning-filled
```

Built leaves that reference icons currently use: `add` (button leading icon), `chevron-up` rotated 180° (button trailing icon, input trailing chevron, breadcrumb separator), `simple-check` (checkbox check mark), `directory` (tag-default leading icon, card-for-items category icon), `chevron-left` rotated 180° (breadcrumb separators).
