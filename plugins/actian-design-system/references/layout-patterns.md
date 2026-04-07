# Layout Patterns Reference

Canonical page-level composition patterns extracted from production Actian mockups. These patterns define **how components are arranged on a page** — the structural skeleton that both FM (lo-fi) and DS Kit (hi-fi) outputs share.

**Purpose:** When generating flows or designs, reference these patterns instead of inventing layouts from scratch. The pattern defines the structure; the fidelity level determines which component kit fills it.

---

## Grid & Spacing Constants

These values are consistent across all three apps and both fidelity levels.

| Constant | Value | Notes |
|----------|-------|-------|
| **Viewport** | 1440 x 960 px | Standard desktop frame |
| **Global header height** | 64px | All apps |
| **Sidebar width** | 240px | Collapsible; all apps |
| **Content area x-start** | 264px | Sidebar (240) + 24px gap |
| **Content area max-width** | 1152px | From x=264 to x=1416 |
| **Page header y-start** | 88px | 64px header + 24px padding |
| **Content y-start (no tabs)** | ~168px | Below page header |
| **Content y-start (with tabs)** | ~262px | Below page header + tabs |
| **Section gap** | 24px | Between content sections |
| **Card internal padding** | 16px | Standard card body padding |
| **Secondary nav panel** | 277px | When present (e.g., Studio browse) |

### FM vs DS Kit mapping

| Structure | FM (lo-fi) | DS Kit (hi-fi) |
|-----------|-----------|----------------|
| Global header | `fm-app-header` | `Global header` instance |
| Sidebar | `fm-sidebar` + `fm-nav-item` | `Side nav` instance |
| Page header | `fm-page-header` | `Page header` instance |
| Tabs | `fm-tab` row | `Tabs` instance |
| Card container | `fm-frame` with fill + stroke + radius | Frame with `bg-default` fill + `border-strong` stroke + `radius-lg` |
| Input | `fm-input` / `fm-dropdown` | `Input` / `Dropdown, Select` instance |
| Button | `fm-button` | `Button` instance |
| Empty state | `fm-empty-state` | `Empty state` instance |
| Divider | `fm-divider` | Vector divider (1px `border-default`) |
| Toggle | `fm-toggle` | `Toggle` instance |
| Progress bar | `fm-progress-bar` | `Progress bar small` instance |
| Segmented control | `fm-tab` group with active state | `Segmented control` instance |

---

## Pattern 1: Dashboard (Card Grid)

**Used in:** Studio Dashboard, Analytics Dashboard
**Structure:** Multi-column card grid with mixed card sizes

```
+--[Page header: title + subtitle]------------------+
|                                                     |
| +--[Card S]--+  +--[Card M]----------+             |
| | Header 48px|  | Header 48px        |             |
| | ────────── |  | ──────────         |             |
| | Body       |  | Body (list items)  |             |
| |            |  |                    |             |
| +------------+  +--------------------+             |
|                                                     |
| +--[Card L]------------------------+  +--[Card S]--+
| | Header 48px                      |  | Header     |
| | ──────────                       |  | ────────── |
| | Row 60px (repeating)             |  | Stacked    |
| | Row 60px                         |  | cards 64px |
| | Row 60px                         |  |            |
| +----------------------------------+  +------------+
```

### Rules
- Cards use **header (48px) + divider (1px) + body** anatomy
- Card header: title text left-aligned, optional action button right-aligned
- Card sizes: S (~200px wide), M (~570px), L (~790px), sidebar column (~350px)
- Cards align to a flexible grid, not fixed columns
- Empty states inside cards: centered icon + text + optional CTA
- List items in cards: icon + text rows, 24-32px row height
- Watchlist-style rows: 60px tall, leading action + link + meta text + trailing action

### FM content nodes
```json
{
  "type": "FRAME",
  "name": "Dashboard card",
  "layout": { "mode": "VERTICAL", "spacing": 0 },
  "fills": ["#FFFFFF"],
  "cornerRadius": 8,
  "stroke": { "color": "#E0E0E0", "weight": 1, "align": "INSIDE" },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "children": [
    {
      "type": "FRAME",
      "name": "Card header",
      "layout": { "mode": "HORIZONTAL", "spacing": 8, "padding": [12, 16, 12, 16], "primaryAxisAlignItems": "SPACE_BETWEEN" },
      "sizing": { "horizontal": "FILL", "vertical": 48 },
      "children": [
        { "type": "TEXT", "content": "Card title", "font": "Inter:Semi Bold", "size": 14, "color": "#1A1D23" }
      ]
    },
    { "type": "DIVIDER" },
    {
      "type": "FRAME",
      "name": "Card body",
      "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [16, 16, 16, 16] },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "children": []
    }
  ]
}
```

---

## Pattern 2: Browse / Search Results

**Used in:** Studio Catalog, Explorer Catalog
**Structure:** Optional secondary nav + control bar + result list

```
+--[Page header]------------------------------------+
|                                                     |
| +--[2nd Nav]--+  +--[Control bar 40px]------------+|
| | 277px       |  | [ ] Sort by [▾]  | Tags Filters||
| | Tree/filter |  +-----------------------------+   |
| | panel       |  | Search result card 200px    |   |
| |             |  |                             |   |
| |             |  | Search result card           |   |
| |             |  |                             |   |
| +-------------+  +-----------------------------+   |
```

### Rules
- **Control bar**: 40px height, 8px internal padding
  - Composition (left to right): checkbox, "Sort by" label + dropdown, vertical divider, filter/action buttons (Edit, Move to catalog, Delete, Export)
  - Bulk actions appear when checkbox is checked
- **Result cards**: full width of remaining space, 200px tall, contain type badge (color-coded) + title + catalog tag + description + metadata row + status tags (Draft, etc.)

### Studio variant
- **Secondary nav panel**: 277px, tree/category navigation
- **Content starts at x=556** (240px sidebar + 277px secondary nav + gaps)
- **Result width**: ~860px

### Explorer variant
- **Faceted filter panel**: 335px wide (wider than Studio's secondary nav), contains searchable checkbox groups with counts
  - Facet groups: Item type (color-coded badges), Data quality, Data source, Connection, etc.
  - Each group has inline search + "View all (+N)" expandable
  - "Save filters" button top-right of content area
- **Content starts at x=376** (335px filter + 41px gap)
- **Result width**: ~1040px
- **No left sidebar** — filter panel replaces it

### FM content nodes (control bar)
```json
{
  "type": "FRAME",
  "name": "Control bar",
  "layout": { "mode": "HORIZONTAL", "spacing": 8, "padding": [8, 8, 8, 8] },
  "sizing": { "horizontal": "FILL", "vertical": 40 },
  "children": [
    { "type": "INSTANCE", "ref": "fmCheckbox", "variant": "State=Off" },
    { "type": "TEXT", "content": "Sort by", "font": "Inter:Regular", "size": 13, "color": "#6B6B76" },
    { "type": "INSTANCE", "ref": "fmDropdown", "variant": "Type=Filled", "sizing": { "horizontal": 120 }, "props": { "Dropdown Text": "Relevance" } },
    { "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Outline, Size=sm", "props": { "Label": "Filters" } }
  ]
}
```

---

## Pattern 3: Detail Page

**Used in:** Studio Item Detail, Explorer Item Detail
**Structure:** Tabs + content columns (layout varies by app)

### Studio variant (two equal columns)

```
+--[Page header: breadcrumb + title + type badge]---+
+--[Tabs]--------------------------------------------+
|                                                     |
| +--[Column 1: 568px]----+  +--[Column 2: 568px]--+|
| | Section label          |  | Completion level    ||
| | Dropdown (fill)        |  | [████████░░] 72%   ||
| | ──────────             |  |                     ||
| | Description label      |  | Sub-tabs            ||
| | [ ] Use raw editor     |  | ──────────          ||
| | [textarea]             |  | Label               ||
| | ──────────             |  | [Input field]       ||
| | Relation label         |  | [Input field]       ||
| | [Empty state]          |  | [Date input]        ||
| +------------------------+  +---------------------+|
```

### Explorer variant (property sidebar + main content)

```
+--[Type badge] Title  subtitle     [Submit suggestion] [Open in Studio] ☆--+
+--[Default] [source-tag]---------------------------------------------------+
+--[Detail][Fields 1][Data model][Lineage][Data quality][View 360][...]------+
|                                                                             |
| +--[Left sidebar 336px]--+  +--[Main content 1040px]---------------------+|
| | ┌ Featured properties ┐|  | ┌ Description ────────────────────────────┐||
| | | Prop: value          |  | | Long text content...                    |||
| | | Prop: value          |  | └─────────────────────────────────────────┘||
| | └──────────────────────┘|  |                                            ||
| | ┌ Glossary  2 ─────────┐|  | ┌ Data model relations  3 ──[Go to schema]┐|
| | | [BD] Term  [BD] Term |  | | →← is referenced by 0 | ←→ References 3 ||
| | └──────────────────────┘|  | | [empty state]         | [Dataset] Name  ||
| | ┌ Contacts  11 ────────┐|  | |                       | [Dataset] Name  ||
| | | [JD][MA][TV]... +3   |  | └───────────────────────────────────────────┘|
| | | Display details      |  | ┌ Properties  20 ─────────────────────────┐||
| | └──────────────────────┘|  | | Section 1                              |||
| +------------------------+  | |   Property: Property value              |||
|                              | |   Property: Property value              |||
|                              | | Section 2                              |||
|                              | |   Property: Property value              |||
|                              | └─────────────────────────────────────────┘||
|                              +--------------------------------------------+|
```

### Rules (shared)
- **Tabs**: full-width below page header, content starts below tabs at y=232 (Explorer) or y=262 (Studio)
- **Form sections within columns**: separated by dividers, 24px vertical spacing between sections
- **Section anatomy**: label (16px semibold) + optional description + fields
- **Inputs fill their column** — not constrained to 480px (multi-column layout exception per Forms Layout Rules in CLAUDE.md)

### Studio-specific rules
- **Two equal columns**: 568px each, 16px gap between them
- **Left column**: primary content (descriptions, relations, glossary links)
- **Right column**: completion/progress indicator, secondary tabs, metadata form fields
- **Has app sidebar** (240px) — content at x=264

### Explorer-specific rules
- **No app sidebar** — full width below header, content starts at x=24
- **Left property sidebar**: 336px, stacked cards with card anatomy (header 48px + body)
  - Featured properties (key-value list), Glossary (type badges + terms), Contacts (avatar row + "Display details" link)
- **Main content**: 1040px, stacked cards
  - Description card (rich text), Data model relations (two-column split: incoming vs outgoing with type-tagged items), Properties (sectioned key-value rows, 36px each)
- **Page header**: type badge + title + subtitle, right-aligned actions ("Submit a suggestion" outline, "Open in Studio" primary) + favorite star
- **Breadcrumb row**: catalog tag + source tag below title
- **Right column** often has: completion/progress indicator at top, secondary tabs, metadata form fields
- **Left column** often has: primary content (descriptions, relations, glossary links)

---

## Pattern 4: Creation Flow (Form + Selectable Cards)

**Used in:** Studio New Item, New Glossary Term
**Structure:** Form with text inputs + radio card selector grid + sticky footer

```
+--[Page header: title + subtitle]------------------+
|                                                     |
| Section title                                       |
| [Input 480px]                                       |
|                                                     |
| Label                                               |
| Supporting text (full width)                         |
|                                                     |
| +--[Search 480px]-----+ [Segmented control →]      |
|                                                     |
| +--[Radio card grid: 4 columns]-------------------+|
| | ( ) Type A  | ( ) Type B  | ( ) Type C  | ( ) D ||
| | ( ) Type E  | ( ) Type F  |              |      ||
| +--------------------------------------------------+|
|                                                     |
| ══[Sticky footer]══════════════════════════════════ |
| |                          [Cancel]  [Create]     | |
| ════════════════════════════════════════════════════ |
```

### Rules
- **Simple text inputs**: 480px max-width, left-aligned (per Forms Layout Rules)
- **Radio card grid**: full-width (1152px), 4 columns at 268px each, 16px gap
  - Cards are 52px tall with radio button + label + optional description
  - Can wrap to multiple rows
- **Segmented control**: right-aligned in the search/filter row for view switching
- **Sticky footer**: fixed to bottom of viewport
  - Full-width background + stroke
  - Actions right-aligned within 1152px container
  - Primary action rightmost, secondary left of it
  - 64px tall, 16px vertical padding

### FM content nodes (radio card row)
```json
{
  "type": "FRAME",
  "name": "Radio card grid",
  "layout": { "mode": "HORIZONTAL", "spacing": 16 },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "children": [
    {
      "type": "FRAME",
      "name": "Radio card",
      "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [14, 16, 14, 16] },
      "fills": ["#FFFFFF"],
      "cornerRadius": 8,
      "stroke": { "color": "#E0E0E0", "weight": 1, "align": "INSIDE" },
      "sizing": { "horizontal": 268, "vertical": 52 },
      "children": [
        { "type": "INSTANCE", "ref": "fmRadioButton", "variant": "State=Off" },
        { "type": "TEXT", "content": "Type name", "font": "Inter:Medium", "size": 14, "color": "#1A1D23" }
      ]
    }
  ]
}
```

---

## Pattern 5: Data Visualization (Graph Canvas)

**Used in:** Studio Lineage, View 360, Data Model
**Structure:** Toolbar header + canvas area with graph nodes

```
+--[Page header + tabs]-----------------------------+
|                                                     |
| +--[Sub-header 64px]------------------------------+|
| | [Segmented ctrl]          [+ Add lineage btn]   ||
| +--------------------------------------------------+|
| +--[Graph header 64px]----------------------------+|
| | [Dropdown] [Dropdown] [Search]    [Toolbar icons]||
| +--------------------------------------------------+|
| +--[Canvas]---------------------------------------+|
| | [Toolbar]  ┌──────────┐                         ||
| | [  + ]     │  Node A  │───→┌──────────┐         ||
| | [  - ]     └──────────┘    │  Node B  │         ||
| | [ fit]     ┌──────────┐───→└──────────┘         ||
| |            │  Node C  │                          ||
| |            └──────────┘                          ||
| +--------------------------------------------------+|
```

### Rules
- **Sub-header**: 64px, contains view mode switcher (segmented control) + primary action button
- **Graph header**: 64px, contains filter dropdowns + search + toolbar icons
- **Canvas**: fills remaining space, dot grid background
- **Toolbar**: vertical, 32px wide, positioned top-left of canvas with zoom controls
- **Graph nodes (lineage widgets)**: 273 x 117px, connected by directional lines
- **Connecting lines**: horizontal/vertical with right-angle bends, directional arrows

### FM approach
For lo-fi, represent the canvas as a frame with placeholder rectangles for nodes and simple lines. Don't try to render a real graph — show the layout structure:
```json
{
  "type": "FRAME",
  "name": "Graph canvas",
  "layout": { "mode": "VERTICAL", "spacing": 0 },
  "fills": ["#F8F8FC"],
  "sizing": { "horizontal": "FILL", "vertical": "FILL" },
  "children": [
    { "type": "TEXT", "content": "Lineage graph visualization", "font": "Inter:Regular", "size": 13, "color": "#9999A6" }
  ]
}
```

---

## Pattern 6: Table View

**Used in:** Studio Catalog (table mode), Administration Users, Administration Connections
**Structure:** Stacked header bars + full-width data table

```
+--[Page header + tabs]-----------------------------+
|                                                     |
| +--[Header bar 1: 64px]--------------------------+|
| | [Segmented ctrl]               [+ Action btn]  ||
| +------------------------------------------------+|
| +--[Header bar 2: 64px]--------------------------+|
| | [Sub-segment] [Dropdown] [Search ────────]  [⊞]||
| +------------------------------------------------+|
| +--[Table]---------------------------------------+|
| | Col A ▾ | Col B    | Col C    | Col D | Actions||
| |---------|----------|----------|-------|--------||
| | Row 1   | value    | value    | tag   | ⋮     ||
| | Row 2   | value    | value    | tag   | ⋮     ||
| | Row 3   | value    | value    | tag   | ⋮     ||
| +------------------------------------------------+|
```

### Rules
- **Header bars stack**: each 64px, 16px internal padding
  - Bar 1: view mode switcher (segmented control) left, primary action right
  - Bar 2: sub-filters (segmented control or dropdown) + search + toolbar icons
- **Table**: full content width (1152px), no horizontal scroll at standard viewport
- **Table rows**: consistent height, last column is actions (icon button or overflow menu)
- **Sort**: column header click toggles sort direction (indicated by arrow icon)

---

## Pattern 7: Overlays

### Side Panel / Drawer
**Used in:** Studio quick-edit, Explorer quick-view

| Property | Value |
|----------|-------|
| Width | 550px |
| Height | Full viewport below header (896px) |
| Position | Right edge, slides in |
| Shadow | Left-side drop shadow |
| Content | Scrollable body, fixed header with close button |

### Modal
**Used in:** Create forms, confirmation dialogs, settings editors

| Size | Dimensions | Use case |
|------|-----------|----------|
| Large | 900 x ~600px | Complex forms, multi-section editors |
| Medium | 700 x ~580px | Standard create/edit forms |
| Small | 480 x ~300px | Confirmation dialogs, simple inputs |

### Rules
- **Modal header**: title + close button (X), no subtitle in header
- **Modal body**: scrollable if content exceeds height
- **Modal footer**: action buttons right-aligned, cancel left of primary
- **Backdrop**: semi-transparent overlay, click-to-dismiss (except destructive confirmations)

---

## Pattern 8: Sticky Footer (Action Bar)

**Used in:** Any page with a save/submit action (creation flows, settings, bulk edit)

```
══════════════════════════════════════════════════════
|                              [Discard]  [Save]    |
══════════════════════════════════════════════════════
```

### Rules
- **Height**: 64px
- **Position**: fixed to bottom of the viewport, above everything
- **Background**: full-width white with top border (1px `border-strong`)
- **Actions container**: max-width 1152px (or viewport content width), centered
- **Button placement**: primary action rightmost, secondary actions left
- **FM**: use `fm-button--primary` right, `fm-button--outline` left with `primaryAxisAlignItems: "MAX"` on the container

---

## Pattern 9: Explorer Homepage (Search-First Marketplace)

**Used in:** Explorer Homepage
**Structure:** Full-width (no sidebar), hero search + sectioned tile list

```
+--[Global header (teal)]--[Default ▾][Search][Ask AI][Access req][What's new][⊞][TN]--+
|                                                                                        |
| +--[Hero area with decorative wave bg]-----------------------------------------------+|
| |  Discover Your Data Assets                                                         ||
| |  [═══════════════ Search items ═══════════════════════════════]                     ||
| +------------------------------------------------------------------------------------+|
|                                                                                        |
| Marketplace ───────────────────────────────────── [Browse marketplace]                  |
|   Recently shared  2                                                                   |
|   Support copy text                                                                    |
|   +--[Tile 240px]--+  +--[Tile 240px]--+                                              |
|   | Dataset badge   |  | Dataset badge   |                                             |
|   | Title           |  | Title           |                                             |
|   | Catalog         |  | Catalog         |                                             |
|   | Description...  |  | Description...  |                                             |
|   +----------------+  +----------------+                                               |
|                                                                                        |
| Catalog filters  3 ──────────────────────────────────────                              |
|   [Catalog] [Catalog]                                                                  |
|                                                                                        |
| Topics  41 ────────────── [All] [★ Favorites] [Browse all topics]                      |
|   Recently shared  2                                                                   |
|   +--[Topic tile]---+  +--[Topic tile]---+                                             |
|   | [BG] ☆          |  | [TP] ☆          |                                             |
|   | Business Glossary|  | Topic            |                                            |
|   | Description...  |  | Description...  |                                             |
|   +----------------+  +----------------+                                               |
|                                                                                        |
| Catalog item types  53 ──────────────────────────────────────                          |
|   [Tile][Tile][Tile][Tile][Tile][Tile]  [→ carousel fade + next btn]                   |
```

### Rules
- **No sidebar** — Explorer homepage is full-width below the global header
- **Hero area**: decorative teal/cyan wave background, large title (28px), prominent search bar (800px wide)
- **Content starts at x=25**, full width ~1391px (no sidebar constraint)
- **Section anatomy** (repeating):
  - **Section title row** (32px): title text + horizontal divider + right-aligned action (button, segmented control, or link)
  - **Sub-sections**: sub-title (24px) + support copy (24px) + tile grid
- **Tile grid**: 240px wide tiles, 16px gap (256px pitch), left-aligned
  - Tile heights vary by content type: item tiles ~156px, catalog tiles ~44px, topic tiles ~124px, type tiles ~96px
- **Horizontal carousel**: for long tile rows, rightmost tiles fade out with a gradient overlay + circular next button (32px)
- **Section-level controls**: segmented control (All/Favorites), action buttons ("Browse marketplace", "Browse all topics")

### FM approach
Explorer homepage is distinctive — no sidebar, search-first, tile sections. For FM:
- Use full-width screen template (`no-sidebar` or `bare`)
- Represent hero as a frame with title + search input (skip decorative wave)
- Use repeating section frames with title + divider + tile placeholders

### FM content nodes (section)
```json
{
  "type": "FRAME",
  "name": "Section: Marketplace",
  "layout": { "mode": "VERTICAL", "spacing": 16 },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "children": [
    {
      "type": "FRAME",
      "name": "Section title",
      "layout": { "mode": "HORIZONTAL", "spacing": 8, "primaryAxisAlignItems": "SPACE_BETWEEN" },
      "sizing": { "horizontal": "FILL", "vertical": 32 },
      "children": [
        { "type": "TEXT", "content": "Marketplace", "font": "Inter:Semi Bold", "size": 16, "color": "#1A1D23" },
        { "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Outline, Size=sm", "props": { "Label": "Browse marketplace" } }
      ]
    },
    {
      "type": "FRAME",
      "name": "Sub section",
      "layout": { "mode": "VERTICAL", "spacing": 8 },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "children": [
        { "type": "TEXT", "content": "Recently shared  2", "font": "Inter:Semi Bold", "size": 14, "color": "#1A1D23" },
        { "type": "TEXT", "content": "Discover and get access to data assets in the marketplace.", "font": "Inter:Regular", "size": 13, "color": "#6B6B76" },
        {
          "type": "FRAME",
          "name": "Tiles",
          "layout": { "mode": "HORIZONTAL", "spacing": 16 },
          "sizing": { "horizontal": "FILL", "vertical": "HUG" },
          "children": [
            {
              "type": "FRAME",
              "name": "Tile",
              "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [16, 16, 16, 16] },
              "fills": ["#FFFFFF"],
              "cornerRadius": 8,
              "stroke": { "color": "#E0E0E0", "weight": 1, "align": "INSIDE" },
              "sizing": { "horizontal": 240, "vertical": "HUG" },
              "children": [
                { "type": "INSTANCE", "ref": "fmBadge", "variant": "Size=Small", "props": { "Label": "Dataset" } },
                { "type": "TEXT", "content": "Item title", "font": "Inter:Semi Bold", "size": 14, "color": "#1A1D23" },
                { "type": "TEXT", "content": "Description preview...", "font": "Inter:Regular", "size": 13, "color": "#6B6B76" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Combining Patterns

Real screens combine multiple patterns. Common combinations:

| Screen type | Patterns used |
|-------------|--------------|
| Studio dashboard | Pattern 1 (card grid) |
| Explorer homepage | Pattern 9 (search-first marketplace) |
| Catalog browse | Pattern 2 (search) + Pattern 6 (table) or result cards |
| Item detail | Pattern 3 (two-column) |
| New item wizard | Pattern 4 (creation form) + Pattern 8 (sticky footer) |
| Lineage view | Pattern 3 (detail tabs) + Pattern 5 (graph canvas) |
| Settings page | Pattern 3 (two-column) or single-column form + Pattern 8 (sticky footer) |
| Bulk edit | Pattern 6 (table) + Pattern 7 (modal) |
| Quick view | Pattern 6 (table) + Pattern 7 (drawer) |

---

## Forms Layout Rules

Source: Design Consistency 2026 — Forms (file key in `.figma-keys.json` -> `designConsistency`). These rules apply to all generated screens across all skills.

### Simple forms
- Input form containers must be constrained to **480px max-width** on medium and large screens
- Applies to: text inputs, dropdowns, text areas, date pickers, radio groups, checkbox groups
- The 480px container sits left-aligned within the content area

### Extended form elements
- **Selectable rows, tiles, and tables** must be displayed **full-width**
- Follow the grid and max-width rules of the content area (1600px max-width)
- Applies to: multi-select lists, data tables used in forms, tile selectors, card grids

### Multi-column layouts
- Forms should stay **fluid** inside their containers
- Do not constrain to 480px when the form is inside a multi-column layout (e.g., side panel, split view)

### Action footer
- Stick to **bottom** of the page
- Fluid width for background color and stroke
- Actions container constrained to **1600px max-width**
- **Primary actions on the right**, secondary on the left

---

## Usage by Skill

| Skill | How to use this reference |
|-------|--------------------------|
| **generate-flow** | Match screen type to pattern, use FM content nodes as starting point |
| **companion** | Reference patterns when suggesting layouts for new features |
| **design-audit** | Check if existing designs follow these canonical patterns |
| **component-brief** | Show components in context using these layout patterns |
| **create-component** | Ensure new components fit within these structural patterns |
