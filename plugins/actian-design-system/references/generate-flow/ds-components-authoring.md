# DS Components Authoring Reference

This reference is for the screen-generator agent when `meta.library:"ds"` is set (i.e., the `--hifi` flag is active). It lists every component in the DS vocabulary that may be authored as an INSTANCE node, which ones have fully-built HTML leaf renderers versus graceful chip fallbacks, the variant axes each component exposes, and the props that the built leaves actually consume. Read this before authoring any DS INSTANCE node.

The DS detail bar is higher than the FM deliberate-simplicity bar. When composing DS-native screens you are expected to supply realistic app-context data, real Action labels, full-detail copy, and meaningful states — not generic placeholders. The hi-fi HTML is the deliverable and must read like a real product screen.

The table below covers the 69 authorable slugs (registry `section:"Components"`). **BUILT** = full CSS-styled HTML leaf renderer. Non-BUILT slugs are still valid to author: when the slug has a vendored appearance doc, the appearance renderer draws its real captured colors (fill, border, text) and, where anatomy resolves a real icon instance, a real SVG glyph (not a placeholder). **chip** = graceful labeled chip (`<span class="ds-component" data-slug="...">`), the last-resort fallback used only when no vendored appearance doc exists for the slug.

## Vocabulary table

| Slug | Name | Status | Variant axes |
|---|---|---|---|
| `account-dropdown` | Account dropdown | **BUILT** | — |
| `action-bar` | Action bar | **BUILT** | Property 1 |
| `alert-banner` | Alert-banner | **BUILT** | Type / Orientation' |
| `app-switcher-dropdown` | App switcher dropdown | **BUILT** | — |
| `avatar` | Avatar | **BUILT** | State / Type |
| `badge` | ✍️ Badge | **BUILT** | Type |
| `bar-graph` | ⛔️ Bar graph | appearance | Property 1 |
| `breadcrumb` | Breadcrumb | **BUILT** | Type |
| `button` | Button | **BUILT** | Intent / Emphasis / Size / State |
| `calendar` | Calendar | **BUILT** | Type / Selection |
| `card` | Card | appearance | Elevation / Size |
| `card-for-grouped-content` | Card for grouped content | **BUILT** | Property 1 |
| `card-for-perimeter` | Card for perimeter | **BUILT** | Property 1 |
| `chat-with-ai-steward` | Chat with AI Steward | **BUILT** | size / history |
| `checkbox` | Checkbox | **BUILT** | Selection / State |
| `checkbox-card` | Checkbox card | appearance | Selection / State |
| `checkbox-group` | Checkbox group | appearance | Orientation |
| `collapse-accordion` | ✍️ Collapse-accordion | **BUILT** | State |
| `confirmation` | Confirmation | **BUILT** | Size |
| `digram-item-types` | Digram, Item types | **BUILT** | Item type / Size |
| `digram-topic` | Digram, Topic | **BUILT** | Type |
| `drawer-side-panel` | Drawer, side panel | **BUILT** | App |
| `dropdown-select-default` | Dropdown, Select, default | **BUILT** | Type / State |
| `empty-state` | Empty state | **BUILT** | Size |
| `error-state` | Error state | **BUILT** | Size |
| `field` | Field | appearance | Size / State |
| `global-header` | Global header | **BUILT** | App type / Breakpoints |
| `glossary-item-hierarchy-diagram` | Glossary item hierarchy diagram | chip | Type |
| `input-date` | Input, date | **BUILT** | Type / States |
| `label` | Label | appearance | State |
| `line-graph` | ⛔️ Line graph | appearance | Property 1 |
| `lineage-connecting-line` | Lineage connecting line | chip | Direction / State |
| `lineage-grouped-node` | Lineage grouped node | **BUILT** | State / Type |
| `lineage-individual-node` | Lineage individual node | **BUILT** | Type / State / Fields |
| `link` | Link | **BUILT** | State |
| `loader` | Loader | **BUILT** | Percent |
| `loader-with-logo` | Loader with logo | **BUILT** | App |
| `loading-skeleton` | Loading skeleton | **BUILT** | Transition |
| `maintenance-state` | Maintenance state | **BUILT** | Size |
| `message` | Message | appearance | Type |
| `metamodel-widget` | Metamodel widget | **BUILT** | Type |
| `modal` | Modal | **BUILT** | Size & Type / Dev status |
| `notification` | Notification | **BUILT** | Type |
| `notification-dropdown` | Notification dropdown | **BUILT** | Property 1 |
| `page-header` | Page header | **BUILT** | Type |
| `popover` | ⛔️ Popover | **BUILT** | Type |
| `progress-bar-small` | Progress bar small | **BUILT** | Size / Completeness |
| `radio` | Radio | **BUILT** | Selection / State |
| `radio-card` | Radio card | appearance | Selection / State |
| `radio-group` | Radio group | appearance | Orientation |
| `rich-text` | Rich text | **BUILT** | State |
| `scroll-bar` | Scroll bar | **BUILT** | Property 1 |
| `search` | Search | **BUILT** | Type / State |
| `search-dropdown-menu` | Search dropdown menu | **BUILT** | Type |
| `search-result-card` | Search result card | **BUILT** | App / State |
| `segmented-control` | Segmented control | **BUILT** | Property 1 |
| `side-nav` | ✍️ Side nav | **BUILT** | App / View |
| `spinner` | Spinner | **BUILT** | Color mode / Complete |
| `stepper` | Stepper | **BUILT** | State |
| `table` | ✍️ Table | **BUILT** | Built type |
| `tabs` | Tabs | **BUILT** | Property 1 |
| `tag-default` | Tag, Default | **BUILT** | Type |
| `tag-interactive` | Tag, Interactive | **BUILT** | State / Type |
| `tag-item-type` | Tag, Item type | **BUILT** | Property 1 |
| `text-area` | Text area | appearance | States |
| `text-input` | Text input | **BUILT** | States |
| `textfield-buttons` | Textfield buttons | appearance | Property 1 |
| `toggle` | Toggle | **BUILT** | Toggle position / Selection / State |
| `toolbar` | Toolbar | **BUILT** | Type / Orientation |
| `tooltip` | Tooltip | **BUILT** | Type |
| `whats-new-dropdown` | Whats new dropdown | **BUILT** | Property 1 |

## Built leaf props

<!-- BEGIN GENERATED props: node scripts/renderers/render-authoring-props.js -->
All 58 slugs below have real HTML leaf renderers. Prop names are case-sensitive and must match
exactly: a name the renderer does not read is **not an error**, it renders an empty slot. A value
in parentheses is the renderer's own fallback when the prop is omitted; a prop with no
parenthesised value renders nothing until you supply it. 177 prop bindings in total.

The last column is measured rather than documented: the substrate renders every variant value and
compares the output, so a value listed there is decoration. Selecting it changes the label and
nothing else. Prefer the value it points at, or ask for the variant to be built.

| Slug | Props (fallback) | Variant axes | Renders the same as |
|---|---|---|---|
| `account-dropdown` | `Email`, `Items`, `Name` ("Account user") | none | none |
| `alert-banner` | `Message` ("Info"), `Title` | `Type` = Info / Success / Warning / Error<br>`Orientation'` = Horizontal / Vertical | Vertical = Horizontal |
| `app-switcher-dropdown` | `Items` | none | none |
| `avatar` | `Count` ("3"), `Initials` ("AV") | `State` = Default / Hovered / Focused / Pressed / Disabled / Selected<br>`Type` = One group / Two groups / Default | Hovered = Default<br>Focused = Default<br>Pressed = Default<br>Selected = Default |
| `badge` | `Label` | `Type` = Number / Dot | none |
| `breadcrumb` | `Items` | `Type` = Default | none |
| `button` | `Label`, `Leading icon show`, `Trailing icon show` | `Intent` = Default / Critical<br>`Emphasis` = Filled / Outlined / Ghost / Icon-only<br>`Size` = Default / Small<br>`State` = Default / Hover / Focus / Pressed / Expanded / Disabled / Loading | Icon-only = Filled<br>Hover = Default<br>Focus = Default<br>Pressed = Default<br>Expanded = Default<br>Loading = Default |
| `calendar` | `Month` ("June 2026") | `Type` = Single date select / Date / Month / Single<br>`Selection` = Single / Range / Year | Date = Single date select<br>Month = Single date select<br>Single = Single date select<br>Year = Single |
| `card-for-grouped-content` | `Body`, `Show info icon`, `Title` ("Grouped content") | `Property 1` = Default | none |
| `card-for-items` | `Body` ("Body goes here. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse nec lacus urna."), `Category` ("Catalog"), `Eyebrow` ("Dataset"), `Title` ("Title") | `Type` = Catalog / Item / item type / Glossary type / Topic<br>`State` = Default / Hover / Focus / Pressed / Selected | Item = Catalog<br>item type = Catalog<br>Glossary type = Catalog<br>Topic = Catalog<br>Hover = Default<br>Focus = Default<br>Pressed = Default |
| `card-for-perimeter` | `Completeness` ("50"), `Counter` ("23"), `Initials`, `Item type` ("Dataset"), `Item type initials`, `Label`, `Name` ("Dataset") | `Property 1` = Default | none |
| `chat-with-ai-steward` | `Confidence`, `Context`, `Greeting`, `Insight` ("This dataset has three upstream sources and feeds two published reports. Review its lineage before changing the schema."), `Source`, `State`, `Title` ("AI Steward") | `size` = Default / Drawer<br>`history` = Closed / Open | Open = Closed |
| `checkbox` | `Label` ("Label") | `Selection` = Unchecked / Indeterminate / Checked<br>`State` = Default / Hover / Focus / Pressed / Disabled | Hover = Default<br>Focus = Default<br>Pressed = Default |
| `collapse-accordion` | `Body`, `Title` ("Advanced settings") | `State` = Collapsed / Expanede | none |
| `confirmation` | `Body` ("The selected items will be imported into the catalog. You will be notified once the import is complete."), `Cta` ("Open the catalog"), `Headline`, `Illustration` ("illustration-success"), `Primary`, `Secondary` ("Learn more"), `Title` ("Success!") | `Size` = Large | none |
| `digram-item-types` | `Initials`, `Label` | `Item type` = Dataset / Data process / Data product / Field / Output port / Use case / Visualization / Category / Custom 1 / Custom 2 / Custom 3 / Custom 4 / Custom 5 / Custom 6 / Custom 7 / Custom 8 / Custom 9 / Custom 10 / Custom 11 / Custom 12 / Custom 13 / Custom 14 / Custom 16 / Glossary 1 / Glossary 2 / Glossary 3 / Glossary 4 / Glossary 5<br>`Size` = Small / Default / Large | Custom 1 = Category<br>Custom 2 = Data process<br>Custom 3 = Output port<br>Custom 5 = Data product<br>Custom 6 = Output port<br>Custom 8 = Custom 7<br>Custom 13 = Custom 12<br>Custom 14 = Custom 12<br>Glossary 1 = Use case |
| `digram-topic` | `Initials`, `Label` | `Type` = Light purple / Dark purple / Light blue / Dark blue / Light green / Dark green / Yellow / Orange / Red / Dark orange | none |
| `drawer-side-panel` | `Name` ("Name"), `Show Back`, `Type` ("Dataset") | `App` = Studio / Explorer | none |
| `dropdown-select-default` | `Description`, `Helper`, `Label` ("Label"), `Placeholder` ("Select…"), `Value` | `Type` = Default / Search/Multiple / With avatar / Compact/Custom<br>`State` = Default / Hover / Focus / Active / Filled / Disabled | Search/Multiple = Default<br>With avatar = Default<br>Compact/Custom = Default<br>Hover = Default<br>Focus = Default<br>Active = Default<br>Filled = Default |
| `empty-state` | `Body` ("Create policies to define how your platform operates."), `Cta` ("Create policy"), `Headline` ("No policies available"), `Illustration` ("illustration-empty-state"), `Primary`, `Secondary` ("Learn more"), `Title` | `Size` = Large / Medium / Small | Medium = Large<br>Small = Large |
| `error-state` | `Body` ("There was an error creating your item. Please try again in a moment."), `Cta`, `Illustration` ("illustration-error-state"), `Primary` ("Try again"), `Secondary` ("Go back"), `Title` ("Something went wrong") | `Size` = Large / Medium | none |
| `global-header` | `Account` ("AU"), `App`, `Context` ("Catalog"), `ContextValue` ("Default"), `Logo` ("actian-pyramid"), `Search` | `App type` = Explorer / Admin / Studio<br>`Breakpoints` = XL / L / M / S / XS | L = XL<br>M = XL<br>S = XL<br>XS = XL |
| `input-date` | `Helper`, `Label` ("Date"), `Placeholder text` ("MM/DD/YYYY") | `Type` = Single date / Date range<br>`States` = Enabled / Hovered / Focused / Error / Disabled / Fille / Activ | Hovered = Enabled<br>Focused = Enabled<br>Error = Enabled<br>Fille = Enabled<br>Activ = Enabled |
| `lineage-grouped-node` | `Child initials`, `Child label`, `Item type initials` ("DS"), `Label`, `Title` | `State` = Default / Expanded<br>`Type` = Main item / Sub item | Sub item = Main item |
| `lineage-individual-node` | `Item type initials` ("PB"), `Label`, `Title` | `Type` = Main item / Sub item<br>`State` = Default / Selected / Disabled<br>`Fields` = Collapsed / Expanded | none |
| `link` | `Label` ("Link") | `State` = Default / Hover / Focus / Pressed / Expanded / Visited / Disabled | none |
| `loader` | `Label` ("Loading") | `Percent` = 99% / 10% / Percent3 | 10% = 99%<br>Percent3 = 99% |
| `loader-with-logo` | `Label` ("Loading") | `App` = Actian Data Intelligence / Studio / Explorer / Admin | none |
| `loading-skeleton` | none | `Transition` = 1 / 2 | none |
| `maintenance-state` | `Body` ("Reports may be unavailable. Refresh or check back when the maintenance window is complete."), `Cta` ("Create policy"), `Headline` ("Scheduled maintenance in progress until 12:00 PM EST"), `Illustration` ("illustration-maintenance"), `Primary`, `Secondary` ("Learn more"), `Title` | `Size` = Large | none |
| `metamodel-widget` | `Item type initials`, `Label`, `Section body`, `Show Section`, `Title` | `Type` = Dataset / Business Term / Data Process / Field / Visualisation | none |
| `modal` | `Actions`, `Body`, `Title` ("Dialog") | `Size & Type` = 700px setting / 1200px / 900px create / 900px edit / 700px create / 450px warning / 450px confirm<br>`Dev status` = 🟢 Ready | 1200px = 700px setting<br>900px create = 700px setting<br>900px edit = 700px setting<br>700px create = 700px setting<br>450px warning = 700px setting<br>450px confirm = 700px setting |
| `notification` | `Action`, `Message` ("Item deleted") | `Type` = Default / Critical | none |
| `notification-dropdown` | `Empty` ("You're all caught up."), `Header` ("Notifications"), `Items` | `Property 1` = Empty / List | none |
| `page-header` | `Actions`, `Description`, `Title` ("Page title") | `Type` = Default / Details page / Explorer home / Explorer detail | Details page = Default<br>Explorer home = Default<br>Explorer detail = Default |
| `popover` | `Body`, `Show info icon`, `Title` ("Popover") | `Type` = Interaction guide / Advanced search | none |
| `progress-bar-small` | `Percent` | `Size` = Default / Large<br>`Completeness` = 0% / 100% / 50% | none |
| `radio` | `Helper text`, `Label` ("Label"), `Show Helper text` | `Selection` = Unselected / Selected<br>`State` = Default / Hover / Focus / Pressed / Disabled | Hover = Default<br>Focus = Default<br>Pressed = Default |
| `rich-text` | none | `State` = Expanded / Default | none |
| `scroll-bar` | `Label` ("Scroll region"), `Length`, `Orientation`, `Position` | `Property 1` = Default | none |
| `search` | `Placeholder text` ("Search") | `Type` = Explorer home / Global header / Inline<br>`State` = Hovered / Focused / Filled / Active / Dsiabled / Default | Global header = Explorer home<br>Inline = Explorer home<br>Focused = Hovered<br>Filled = Hovered<br>Active = Hovered<br>Default = Hovered |
| `search-dropdown-menu` | `Heading`, `Items`, `Query` ("orders"), `Results` | `Type` = No result / Before typed / After typed / Explorer home | none |
| `search-result-card` | `Body`, `Catalog` ("Catalog"), `Description` ("A product is anything that can be offered to a market that might satisfy a want or need by potential customers."), `Featured property 1` ("Business Domain: IT"), `Featured property 2` ("Source Application: App 120"), `Glossary initials` ("VH"), `Glossary label` ("Vehicle"), `Stage` ("Stage"), `Tech name` ("[Financial Summary EY2024]"), `Title` ("Financial Summary EY2024"), `Type` ("Category") | `App` = Explorer / Studio<br>`State` = Default / Hover / Focus / Pressed / Selected | Studio = Explorer<br>Hover = Default<br>Pressed = Default |
| `segmented-control` | `Active`, `Items`, `Segments` | `Type` = Default | none |
| `side-nav` | `Active`, `Groups`, `Items` | `App` = Admin / Studio<br>`View` = Collapsed / Expanded | Studio = Admin |
| `spinner` | `Label` ("Loading") | `Color mode` = On light bg / On dark bg<br>`Complete` = 50% / 75% / 100% / 25% | 75% = 50%<br>100% = 50%<br>25% = 50% |
| `stepper` | `Body`, `Step` ("1"), `Title` ("Connect source") | `State` = Complete / Active / Default / State5 | State5 = Default |
| `sticky-footer` | `Primary` ("Save"), `Secondary` ("Cancel") | `Property 1` = Default | none |
| `table` | `Columns`, `Rows` | `Built type` = By columns / By rows | By rows = By columns |
| `tabs` | `Active`, `Items` | `Property 1` = Default | none |
| `tag-default` | `Label`, `Leading icon show` | `Type` = Default / Catalog / Shared / Stage-1 / Stage-2 / Stage-3 / Stage-4 / Stage-5 / Stage-6 / Stage-7 / Stage-8 / Status-error / Status-warning / Status-success | none |
| `tag-interactive` | `Label`, `Leading icon show`, `Trailing icon show` | `State` = Default / Disabled / Focus / Hover / Pressed<br>`Type` = Dismissible / Selectable / Dropdown-expanded / Dropdown / Selectable-selected | Focus = Default<br>Hover = Default<br>Pressed = Default<br>Selectable = Dismissible<br>Dropdown-expanded = Dismissible<br>Dropdown = Dismissible<br>Selectable-selected = Dismissible |
| `tag-item-type` | `Counter` ("00"), `Label`, `Show Counter`, `Show counter` | `Property 1` = Glossary-1 / Glossary-2 / Glossary-3 / Glossary-4 / Glossary-5 / Category / Custom-1 / Custom-2 / Custom-3 / Custom-4 / Custom-5 / Custom-6 / Custom-7 / Custom-8 / Custom-9 / Custom-10 / Custom-11 / Custom-12 / Custom-13 / Custom-14 / Custom-15 / Dataset / Data process / Data product / Field / Output port / Use case / Visualization | none |
| `text-input` | `Label` ("Label"), `Placeholder text` ("Placeholder text"), `Trailing icon` | `States` = Default / Hover / Focus / Active / Filled / Error / Warning / Disabled / Read-only | Hover = Default<br>Focus = Default<br>Active = Default<br>Filled = Default<br>Error = Default<br>Warning = Default<br>Read-only = Default |
| `toggle` | `Helper text`, `Label` ("Label"), `Show Helper text` | `Toggle position` = On right (default) / On left<br>`Selection` = Off / On<br>`State` = Default / Hover / Focus / Pressed / Disabled | On left = On right (default)<br>Hover = Default<br>Focus = Default<br>Pressed = Default |
| `toolbar` | `Show View scale` | `Type` = Single / Combined / Group<br>`Orientation` = Horizontal / Vertical | Combined = Single<br>Group = Single |
| `tooltip` | `Body` ("Body line text lorem ipsum dolor sit amet, consectetur") | `Type` = Default | none |
| `whats-new-dropdown` | `Detail`, `EmptyLabel` ("No release updates"), `Items`, `Title` ("What's new") | `Property 1` = Drilldown1 / Drilldown2 / Empty / List | Drilldown2 = Drilldown1 |

<!-- END GENERATED props -->

## Worked examples

The table above says what each renderer ACCEPTS. The sections below say what is GOOD, which the
contract cannot know: which variant to reach for, what real copy looks like, when a component is the
wrong choice. They cover a subset by design, and they are hand-authored, so regenerating the table
above never touches them. A slug with no worked example is still fully authorable: take its props
and variant axes from the table.

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

### `radio`

```json
{
  "type": "INSTANCE",
  "library": "ds",
  "dsSlug": "radio",
  "variant": "Selection=Unselected, State=Default",
  "props": {
    "Label": "Weekly",
    "Helper text": "Runs every Monday at 9 AM",
    "Show Helper text": true
  }
}
```

- `variant.Selection`: `Unselected` | `Selected` (default: `Unselected`)
- `variant.State`: `Default` | `Hover` | `Focus` | `Pressed` | `Disabled` (default: `Default`)
- `props.Label`: radio option text

The slug was `radio-button` and the axes were `Format` / `Selected` until the 2026-07-23
breaking sync: Figma renamed the component to "Radio" (same `dsKey`) and the earlier
form-control rework had already deleted the `Format` axis and renamed `Selected` to
`Selection`. Authoring the old names now yields a fallback chip instead of a radio.
`props.Label` / `Helper text` are what the HTML leaf renderer consumes; on the Figma side the
component exposes `Show glyph` and `Show description` instead, so do not treat this props list
as the Figma property contract.
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
