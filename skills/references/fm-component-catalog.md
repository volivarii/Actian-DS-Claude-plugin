# Fat Marker Component Library — Catalog

> 42 components for low-fidelity flow mockups in the Actian Design System 2026.
> Source file: [Page mockups](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn/Page-mockups?node-id=304-3063)

---

## Layout & Navigation

### FM App_header
Top-level application header bar. Contains the Actian logo, product label, and user avatar. Use at the top of every screen mockup.

- **Variants:** `Admin` · `Studio` · `Explorer` · `Actian`
- **Node:** `502:38169`

### FM Side navigation bar
Vertical sidebar navigation panel (260px wide). Contains navigation items with placeholder labels and an active-state highlight. Use on the left side of every screen that has a persistent nav. Always pair with FM App_header above it.

- **Node:** `502:38648`

### FM Side navigation item
Individual row inside the sidebar.

- **Variants:** `On` (active/selected with brand-colored indicator) · `Off` (default idle) · `Placeholder` (grey bar for non-essential items)
- **Node:** `502:38703`

### FM Tabs
Horizontal tab bar for switching between content sections within a page. Place below the page header, above the content area. Contains multiple FM Tab instances.

- **Node:** `502:38675`

### FM Tab
Individual tab within an FM Tabs bar.

- **Variants:** `On` (active, with underline indicator) · `Off` (inactive) · `Placeholder` (grey bar for non-essential tabs)
- **Node:** `502:38748`

### FM Sidepanel
Slide-in panel that appears from the right edge of the screen. Used for detail views, edit forms, or secondary actions without leaving the current page. Contains header, tabs, content area, and action buttons.

- **Node:** `502:38370`

### FM Menu
Dropdown menu container that appears on click (e.g., from a button or icon). Contains a list of FM Menu items. Use for action menus, context menus, or "Create new" dropdowns.

- **Node:** `502:38532`

### FM Menu item
Individual row inside an FM Menu.

- **Variants:** `Default` (idle) · `Active` (selected/current) · `Hover` (pointer over)
- **Node:** `502:38685`

### FM Multi-select menu item
Menu item with a checkbox for multi-selection.

- **Variants:** `On` (checked) · `Off` (unchecked) · `User Off` (unchecked with user avatar — for people pickers)
- **Node:** `502:38694`

---

## Page Structure

### FM Page Header
Page title displayed at the top of the content area, below the title bar.

- **Variants:** `Title only` (for list/table pages like Policies, Catalog) · `Title + Subtitle` (for form pages and detail views where guidance text is needed)
- **Properties:** `Title` (text) · `Subtitle` (text) · `Subtitle visible` (boolean)
- **Typography:** Inter SemiBold 24px/34.32px `#101828` (title) · Inter Regular 14px/22.88px `#475467` (subtitle)
- **Usage:** Present in every screen — 24 instances in the Policies flow
- **Node:** `916:2162` (captured)

### FM Placeholder
Grey placeholder block representing content that isn't the focus of the current flow. Use to fill areas where real content isn't needed to tell the story.

- **Variants:** `Label+1line` · `Label+3lines` · `Label+6lines` · `Label+avatars` · `metric`
- **Node:** `502:38657`

### FM Empty State
Centered illustration + message shown when a page or section has no data yet. Use for first-time-use screens or zero-result states.

- **Variants:** `Default` · `Variant2`
- **Node:** `502:38469`

### FM Table example
Pre-built example of a full data table with headers, rows, and cell content. Use as a starting point when mocking up list/table views — copy and customize the cells.

- **Node:** `502:38361`

### FM Table Cell
Individual cell within a data table.

- **Variants:** `Header` (column header with bold label) · `Text` (standard text content) · `Pill` (cell containing a tag/badge) · `Placeholder` (grey bar placeholder)
- **Node:** `502:38666`

---

## Form Controls

### FM Input Label
Label placed above form inputs. Shows the field name with an optional required asterisk and optional caption text.

- **Properties:** `labelText` (string) · `required` (boolean — shows red asterisk) · `caption` (boolean) · `captionText` (string)
- **States:** Enabled · Disabled (all text switches to `#A8A8BD`)
- **Typography:** Inter Medium 14px/16px `#1A202C` (label) · Inter Bold 12px `#D92D20` (asterisk) · Inter Regular 12px/16px `#6D6D6D` (caption)
- **Usage:** Always placed above an input with ~6px gap — 45 instances in Policies flow
- **Node:** `917:2162` (captured)

### FM Text input field
Single-line text input.

- **Variants:** `Default` (empty with border) · `Placeholder` (with hint text) · `Empty` (focused/active) · `Disabled` (greyed out)
- **Node:** `502:38505`

### FM Text Area
Multi-line text input for longer content like descriptions or comments.

- **Variants:** `Filled` (with content) · `None` (empty) · `Placeholder` (with hint text)
- **Node:** `502:38610`

### FM Rich text field
Text area with a formatting toolbar (bold, italic, lists, etc.). Use for fields that support rich text editing like descriptions or documentation content.

- **Node:** `502:38619`

### FM Search input field
Text input with a search icon.

- **Variants:** `Empty` (just the icon) · `Placeholder` (with "Search..." hint) · `Filled` (with search term entered)
- **Node:** `502:38628`

### FM Date input
Date picker input field.

- **Variants:** `Default` (with a date value) · `Placeholder` (with hint text) · `Open` (calendar dropdown visible)
- **Node:** `502:38637`

### FM Dropdown
Single-select dropdown.

- **Variants:** `Placeholder` (hint text) · `Filled` (value selected) · `Open` (options list visible) · `Disabled` (greyed out) · `User Filled` (with user avatar)
- **Node:** `502:38487`

### FM Multi-select dropdown
Dropdown that allows selecting multiple values, shown as chips/tags inside the field.

- **Variants:** Same as FM Dropdown plus `Open Multi-select` (with checkboxes in the options list)
- **Node:** `502:38487`

### FM Checkbox
Square checkbox for boolean or multi-select choices.

- **Variants:** `On`/`Off` × `Default`/`Disabled`
- **Node:** `502:38415`

### FM Radio button
Circular radio button for single-select choices within a group.

- **Variants:** `On`/`Off` × `Default`/`Disabled`
- **Node:** `502:38424`

### FM Toggle
On/off switch for binary settings.

- **Variants:** `On` (active, filled) · `Off` (inactive)
- **Node:** `502:38433`

### FM Slider
Horizontal slider for selecting a value within a range.

- **Variants:** `0%` · `25%` · `50%` · `75%` · `100%`
- **Node:** `502:38442`

---

## Actions & Buttons

### FM Button
Primary action trigger. The most-used component in the kit (119 instances in Policies flow).

- **Variants:** Size (`sm`/`md`) × Shape (`Regular`/`Pill`) × Type (`Primary`/`Secondary`/`Outline`) × State (`Default`/`Disabled`)
- **Node:** `502:38397`

### FM Icon Buttons
Square button containing only an icon (no text label).

- **Variants:** `Primary`/`Secondary`/`Outline` × `Default`/`Disabled`
- **Usage:** Compact actions like "more options", "edit", "delete" in toolbars or table rows
- **Node:** `502:38478`

---

## Feedback & Status

### FM Alert
Inline notification bar for transient feedback after an action completes. Auto-width, no CTA button. Distinct from FM Banner — Alert is brief and dismissable, Banner is persistent and page-wide.

- **Variants:** `Success` (grey-blue bg, check icon) · `Error` (red bg, x icon) · `Info` (blue bg, info icon) · `Warning` (yellow bg, triangle icon)
- **Typography:** Inter Regular 16px/22px `#1A202C`
- **Specs:** height 48px · padding 12px 16px · gap 12px · radius 6px · shadow `0px 2px 8px rgba(0,0,0,0.2)`
- **Usage:** 5 instances in Policies flow — all success confirmations
- **Node:** `915:2162` (captured)

### FM Banner
Full-width notification bar pinned to the top of the content area. Contains icon + message + optional CTA button. Use for persistent, important notices like "This draft is only visible to you" or compliance warnings.

- **Node:** `502:38388`

### FM Toast
Small floating notification that appears at the top-right corner.

- **Variants:** `Standard` (filled bg) · `Outline` (bordered)
- **Usage:** Non-blocking confirmations like "Saved successfully" or "Item deleted"
- **Node:** `502:38730`

### FM Badge
Numeric or icon indicator, typically on navigation items or tabs.

- **Variants:** Size (`Small`/`Medium`/`Large`) × Type (`Icon`/`Number`/`Number Expand`)
- **Usage:** Show counts (unread items, pending requests)
- **Node:** `502:38379`

### FM Tag
Small label for categorization or status.

- **Variants:** `Filled` (solid bg) · `Light` (subtle bg) · `Outline` (bordered)
- **Usage:** Table cells, card headers, or detail views for metadata like status, type, or category
- **Node:** `502:38721`

### FM Chip
Compact, removable label — similar to a tag but interactive.

- **Variants:** `Outline=true` (bordered) · `Outline=false` (filled)
- **Usage:** Inside multi-select dropdowns or filter bars to show selected values
- **Node:** `502:38406`

### FM Progress bar
Horizontal bar showing completion percentage.

- **Variants:** `10%` through `100%` in 10% increments
- **Usage:** Upload progress, onboarding completion, data quality scores
- **Node:** `502:38514`

### FM Spinner
Loading indicator (circular). Use as a placeholder while content is being fetched or an action is processing.

- **Node:** `502:38523`

### FM Tooltip
Small floating label that appears on hover to explain an element.

- **Variants:** 12 positions — `Top` · `Top Left` · `Top Right` · `Bottom` · `Bottom Left` · `Bottom Right` · `Left` · `Left Top` · `Left Bottom` · `Right` · `Right Top` · `Right Bottom`
- **Node:** `502:38739`

---

## Overlays

### FM Dialog
Modal dialog with a darkened backdrop. Use for confirmations ("Are you sure?"), destructive action warnings, or compact forms that require focused attention. Contains title, body text, and action buttons.

- **Node:** `502:38460`

---

## People & Identity

### FM User
User avatar with name/email label. Use in headers, comment threads, assignment fields, or people pickers to represent a specific user.

- **Node:** `502:38496`

### FM Cursor
Mouse cursor overlay to indicate interaction in a mockup. Place on top of interactive elements to show where the user is clicking.

- **Variants:** `Pointer` (default arrow) · `Link` (hand) · `Text` (I-beam) · `Dragging` (grab)
- **Node:** `502:38451`

---

## Reference Sheets

### Icons
Icon library sheet containing all available icons used across the Fat Marker kit. Reference this when you need to find an icon for buttons, menu items, or status indicators. Do not import external icon packages — all icons come from this sheet.

- **Node:** `304:3064`

### Text Styles
Typography reference sheet showing all text styles used in the Fat Marker kit (headings, body, labels, captions) with their font, weight, size, and line-height values.

- **Node:** `304:3069`
