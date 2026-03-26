# Actian Design System 2026 — Component Reference

Auto-generated from Figma MCP on 2026-03-26.
100 component sets across 47 pages.

Source: [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK)

---

## Pages

- Cover
- Table of contents
- Governance & change log
- ✍️ Ready-to-use mockups
- ✍️ Playground
- -----
- 💎 FOUNDATIONS
- Accessibility
- Borders
- Breakpoint, grid & structure — 5 component sets
- ✍️ Color
- Content guidelines
- Elevation
- Icons
- Interaction & motion
- Spacing
- ✍️ Typography
- Usage example
- ----
- 🧱 COMPONENTS
- Action
-         Button — 1 component sets
-         Link — 1 component sets
-         Sticky footer — 1 component sets
- Form (input & selection)
-         Calendar — 3 component sets
-         Checkbox — 2 component sets
-         Dropdown / Select — 2 component sets
-         Filters  — 1 component sets
-         Radio button — 2 component sets
-         Rich text (existing) — 1 component sets
-         Search — 2 component sets
-         Text input — 2 component sets
-         Toggle control — 2 component sets
- Navigation
-         Breadcrumbs — 1 component sets
-         Global header — 3 component sets
-         Side nav — 2 component sets
-         Stepper — 1 component sets
-         Tab — 2 component sets
-         Traffic light — 1 component sets
- Data Display
-         Avatar — 1 component sets
-         Badge — 1 component sets
-         Card — 4 component sets
-         Collapse (Accordion) — 1 component sets
-         Data viz: glossary item hierarchy — 3 component sets
-         Data viz: lineage — 5 component sets
-         Data viz: metamodel — 3 component sets
-         Data viz: progressive bar — 1 component sets
-         Data viz: toolbar — 1 component sets
-         Data viz: WIP — 1 component sets
-         Digram — 2 component sets
-         Page header  — 1 component sets
-         Scroll bar — 1 component sets
-         Segmented control (Button group) — 2 component sets
-         Search result card  — 1 component sets
-         Tag (Identification key) — 9 component sets
-         Table — 3 component sets
- Feedback
-         Alert (banner) — 1 component sets
-         Empty state — 4 component sets
-         Loading (Loader, Spinner, Skeleton)  — 4 component sets
-         Maintenance banner — 1 component sets
-         Notification (Toast) — 1 component sets
- Overlays
-         Drawer (Side panel) — 1 component sets
-         Modal — 1 component sets
-         Popover — 1 component sets
-         Tooltip — 1 component sets
- ---
- 🎨 BRAND ASSETS
- Illustrations & graphics — 1 component sets
- Marketing icons
- Product logos — 6 component sets
- ---
- ℹ️ OTHER RESOURCES
- White-label services
- Local components — 3 component sets
- ---
- ---

---

## Breakpoint, grid & structure

### M grid

- Variants: **Property 1:** `Default` · `Sid nav collapsed`
- Node: `12054:30576` | Key: `ed642e9bb87c7b5e1cdab020943ad2f999374a39`

### L grid

- Variants: **Property:** `Default` · `Side nav collapsed` · `Side nav expanded`
- Node: `12054:30598` | Key: `8601f7461f9b21847400f69ebb63d7f591119987`

### XL grid

- Variants: **Property:** `Default` · `Side nav collapsed` · `Side nav expanded`
- Node: `12054:30623` | Key: `d6b83246f85c6e57d45bbd35ec6d8acab2e16488`

### S grid

- Variants: **Property 1:** `Default`
- Node: `14744:8072` | Key: `15772025d13a090b6327442a396f6f9757858031`

### XS grid

- Variants: **Property 1:** `Default`
- Node: `14744:8073` | Key: `e939d776621f097562d024535a10d5c011fd493c`

## Button

### Button
Primary trigger for a specific action or form submission. Use "Primary" for the main task, "Secondary" for alternative actions, and "Ghost/Tertiary" for low-priority tasks.

- Variants: **Type:** `Primary` · `Secondary` · `Tertiary` · `Icon` · `Critical primary` · `Critical secondary` | **Size:** `Default` · `Small` | **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Selected` · `Disabled`
- Text overrides: `Label`
- Node: `7206:2643` | Key: `5a6d10d26bef3cc83955bf32a318c6b4682f25d3`

## Link

### Link
A Link visually represents clickable text or elements that navigate users to other pages, sections, or resources.

- Variants: **State:** `Disabled` · `Enabled` · `Focused` · `Hovered` · `Once clicked` · `Pressed`
- Node: `8346:6897` | Key: `433bc17e08514c14ee821f2b03421bad865e0a0e`

## Sticky footer

### Sticky footer
A persistent container at the bottom of the viewport used for high-priority global actions (e.g., Save, Cancel, Next) that must remain visible while scrolling.

- Variants: **Property 1:** `Default`
- Node: `14747:9839` | Key: `de36372be7d1532ee37fbfc43238aed444f6e7c9`

## Calendar

### Calendar

- Variants: **Type:** `Single date select` · `Date` · `Month` · `Single` | **Selection:** `Single` · `Range` · `Year`
- Node: `8211:6664` | Key: `6c61c1469d97020721267a3e1ad209f3cf4c12c3`

### Input date
Used for selecting a single date, a date range, or a specific point in time. Best for scheduling or historical data entry.

- Variants: **Type:** `Single date` · `Date range` | **States:** `Enabled` · `Hovered` · `Focused` · `Error` · `Disabled` · `Fille` · `Activ`
- Node: `8194:7305` | Key: `9eafdb6242837b591ba5f39959150b53e40ef02d`

### .Calendar item

- Variants: **State:** `Default` · `Hovered` · `Focused` · `Selected` · `Disabled`
- Node: `8211:5909` | Key: `d476d5eeedd37586b0f8e025a3bc8c70cc20c5bb`

## Checkbox

### .Checkbox

- Variants: **Selected:** `Unselected` · `Indeterminate` · `Selected` | **State:** `Enabled` · `Hovered` · `Focused` · `Pressed` · `Disabled`
- Node: `7420:3799` | Key: `aa8f60928fc502e8fd2855943617e70578fe58c7`

### Checkbox with label
Used for binary choices (on/off) or when a user can select multiple options from a list of related items.

- Variants: **Selected:** `Yes` · `Indeterminate` · `No` | **State:** `Enabled` · `Hovered` · `Focused` · `Pressed` · `Disabled`
- Node: `9478:17216` | Key: `f88de6fe161264680045b2b5ec77d311b1b3adb6`

## Dropdown / Select

### Dropdown Select default
Use when 5+ options are available or space is limited. Ideal for selecting one item from a pre-defined list.

- Variants: **Type:** `Default` · `Search/Multiple` · `With avatar` · `Compact/Custom` | **State:** `Default` · `Hovered` · `Focused` · `Active` · `Filled` · `Disabled`
- Node: `13972:708` | Key: `1140aec3d572e3fbda362723cd7137ac2f0ce9bd`

### .menu item

- Variants: **Type:** `Selectable item` · `Category` · `Divider` | **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Selected`
- Text overrides: `Label text`
- Node: `7218:2995` | Key: `eab4098398a66550ebd20a27816809c8e4a33ad2`

## Filters

### Search filters
A collection of inputs used to narrow down a dataset or search results. Should be placed above or to the left of the content it controls.

- Variants: **Type:** `Explorer` · `Studio`
- Node: `9660:49637` | Key: `919ddc42563055f1d9f34b662fb806eb66763980`

## Radio button

### .Radio button

- Variants: **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Disabled` | **Selected:** `Yes` · `No`
- Node: `7420:3800` | Key: `c3a8c025928c83fd8da8186f18ad7b5fab69ea4f`

### Radio button
Used for mutually exclusive choices where the user must select exactly one option from a small list (2-5 items).

- Variants: **Format:** `Default` · `Card format` | **State:** `Hovered` · `Focused` · `Pressed` · `Disabled` · `Default` | **Selected:** `No` · `Yes`
- Node: `9474:16884` | Key: `9ceb34116fd119a17b08b9b445a204de28f9d249`

## Rich text (existing)

### Rich text
A multi-line input field that allows for text formatting (bold, links, lists). Use for long-form content like descriptions or comments.

- Variants: **State:** `Expanded` · `Default`
- Node: `9480:17723` | Key: `e904c7b5c3ef6d223d9743546484e5a99b7a7808`

## Search

### Search
A specialized text input designed to query a database or filter a page's content in real-time.

- Variants: **Type:** `Explorer home` · `Global header` · `Inline` | **State:** `Hovered` · `Focused` · `Filled` · `Active` · `Dsiabled` · `Default`
- Node: `8589:11055` | Key: `1b7cd9f309d84560098a2506089a77da8972d470`

### Search dropdown menu

- Variants: **Type:** `No result` · `Before typed` · `After typed` · `Explorer home`
- Node: `8756:9994` | Key: `9e267d055429c3f0e586f2fc787fd8b6fced1629`

## Text input

### Input
Used for single-line alphanumeric data entry (e.g., Name, Email, Phone). Specify the "type" attribute if applicable.

- Variants: **States:** `Default` · `Hovered` · `Focused` · `Active` · `Filled` · `Error` · `Disabled` · `Read-only`
- Text overrides: `Label text`, `Description text`, `Placeholder text`, `Helper text`, `Input text`
- Node: `7238:2487` | Key: `9245f434d92d2a5d54962c51d7e374c87251fc4b`

### .Textfield buttons

- Variants: **Type:** `Default`
- Node: `14241:37663` | Key: `701b1f6d93b336acb724a3496f7f0e33d1301c4f`

## Toggle control

### .Toggle switch

- Variants: **Selected:** `Off` · `On` | **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Disabled`
- Node: `7218:3122` | Key: `824f6d18ca7fa1a03d5843958e4ffb6b0d232c52`

### Toglge
Used for immediate on/off actions.

- Variants: **Toggle location:** `Left` · `Right` | **State:** `Hovered` · `Focused` · `Pressed` · `Disabled` · `Default` | **Selected:** `No` · `Yes`
- Node: `14000:4395` | Key: `4e7793f094eed660e01d8f7c804f2391e72115d2`

## Breadcrumbs

### Breadcrumbs
Use to show the user's current location within a hierarchical multi-level structure. Enables 1-click navigation back to parent pages.

- Variants: **Type:** `Default`
- Node: `13792:15247` | Key: `72976d77668b8e085d716fc8c5bc0bd144cb7274`

## Global header

### Global header
The persistent top-level container for branding, primary site-wide navigation, and user-specific actions (e.g., Profile, Logout).

- Variants: **App type:** `Explorer` · `Admin` · `Studio` | **Breakpoints:** `XL` · `L` · `M` · `S` · `XS`
- Node: `7384:22554` | Key: `e3e1e5d29f092fbd6ba5f0f40141ba55473548a8`

### Notification dropdown

- Variants: **Property 1:** `Empty` · `List`
- Node: `9114:15379` | Key: `927eb804d065b6e2be5f8dfa54643774304d7d6c`

### Whats new dropdown

- Variants: **Property 1:** `Drilldown1` · `Drilldown2` · `Empty` · `List`
- Node: `9114:16794` | Key: `f7040db58ba132df1b3d292a72a003399433765f`

## Side nav

### nav item

- Variants: **Level:** `Top` · `Sub` | **Opened/Closed:** `Opened` · `Closed` · `N/A` | **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Selected` · `Disabled`
- Text overrides: `Name`
- Node: `13599:20027` | Key: `c2bdd8eb008c44f9731c88317cae5437eb89d9ec`

### Side nav
Vertical navigation for primary application modules. Use when the app has many top-level sections or needs to show sub-navigation.

- Variants: **App:** `Admin` · `Studio` | **View:** `Collapsed` · `Expanded`
- Node: `13599:20120` | Key: `3606cc19247f989332aac33953ffdf57c9d1bbdd`

## Stepper

### Stepper
Use to guide a user through a linear process with defined steps (e.g., Onboarding). Indicates current, completed, and upcoming steps.

- Variants: **State:** `Complete` · `Active` · `Default` · `State5`
- Text overrides: `Body`
- Node: `7676:4492` | Key: `9d73595077c798866bf42c87a53893bbdc8d4ce0`

## Tab

### .tab
Secondary tabs label.

- Variants: **Selected:** `No` · `Yes` | **State:** `Default` · `Hovered` · `Focused` · `Pressed`
- Text overrides: `Label text`
- Node: `7279:3166` | Key: `96cfc367aba35f003e9394b76dc2d78ef78ffd9e`

### Tabs
Use to switch between related views within the same context without navigating to a new page. Ideal for organizing content at the same level.

- Variants: **Property 1:** `Default`
- Node: `14747:14818` | Key: `dbd33845613381780e5364600815d9bc983d5230`

## Traffic light

### Traffic light
A status indicator (Red, Amber, Green). Use to communicate system health, task urgency, or a quick "Pass/Fail" summary.

- Variants: **Type:** `Default` · `Green` · `Orange` · `Red`
- Node: `13797:13103` | Key: `4d34e14670144322fcfb202e843dc75534ff917f`

## Avatar

### Avatar
Visual representation of a user or entity. Use "Image" variant if a photo exists, or "Initials" as a fallback.

- Variants: **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Disabled` · `Selected` | **Type:** `One group` · `Two groups` · `Default`
- Node: `7384:14212` | Key: `67e11f5d63bbe3cb24cae7d38ab5e90ee506d266`

## Badge

### Badge
Small status or numerical indicator (e.g., "Active", "New", "+5"). Use for counts or short, non-interactive status labels.

- Variants: **Type:** `Number` · `Dot`
- Node: `12159:16447` | Key: `e8d93a3432951bd42d9b0bb20287eb61262ae10e`

## Card

### Tile Item
A flexible container for grouping related information. Use for dashboard summaries or items in a grid that require an overview.

- Variants: **Type:** `Catalog` · `Item` · `item type` · `Glossary type` · `Topic` | **State:** `Default` · `Hovered` · `Focused` · `Pressed`
- Node: `7613:7853` | Key: `95764c702b7dcb1dc2e2aef2cd5ee46b27a5cf30`

### .card header

- Variants: **Size:** `Default`
- Node: `14782:29244` | Key: `3286cad107e4cf45c9082f2219d7866e44ade09d`

### Card

- Variants: **Property 1:** `Default`
- Node: `14782:29281` | Key: `3b8d2c7adc118fdd5f31e68440fa35e952fee92e`

### Perimeter card

- Variants: **Property 1:** `Default`
- Node: `14783:7565` | Key: `c1672b025b85c4ed0ddc645d89aa202803a95f07`

## Collapse (Accordion)

### Collapse-accordion
Use to hide/show secondary information to reduce vertical clutter. Best for FAQs or detailed settings sections.

- Variants: **State:** `Closed` · `Open`
- Node: `8292:80` | Key: `8253d19d70a3b835653049d90b4fdf97b26a31c8`

## Data viz: glossary item hierarchy

### .Glossary connecting line

- Variants: **Type:** `Going up` · `Straight` · `Going down`
- Node: `14747:30216` | Key: `847d637d3876bc09b7caebb3cf6bafe60ddb6274`

### .Glossary item

- Variants: **Type:** `Main item` · `Sub items` | **State:** `Default` · `Hovered` · `Pressed` · `Focused` · `Selected` · `Disabled`
- Node: `14747:30223` | Key: `93459a98ceecbac2d17cc87dd9c8295d12c485e6`

### Glossary item hierarchy diagram

- Variants: **Type:** `Default`
- Node: `14747:30242` | Key: `ccb3fbc9c238527e5fa4998e8fd6ae9b5c31b7da`

## Data viz: lineage

### Lineage widget

- Variants: **Type:** `Main item` · `Sub item` | **State:** `Default` · `Selected` · `Disabled` | **Fields:** `Collapsed` · `Expanded`
- Node: `14747:19902` | Key: `5904351595c9b5b263bb5891bd1ed038fbaff636`

### .lineage expand collapse control

- Variants: **Icon:** `Expand` · `Collapse` | **State:** `Default` · `Disabled`
- Node: `14747:20046` | Key: `4d518c08b1c4317701ca2a7056fb2edf44ec1db1`

### .lineage field

- Variants: **Type:** `Default`
- Node: `14747:20078` | Key: `bb9837cd08cd8613856a2693a9a92ea178b8e5cf`

### Lineage connecting line

- Variants: **Direction:** `Down` · `Straight` · `up` · `Up` | **State:** `Default` · `Selected` · `Disabled`
- Node: `14747:20085` | Key: `553bdc1ba26f3b30988997771dcf74f275eb12d3`

### .lineage connector icon

- Variants: **State:** `Default` · `Disabled`
- Node: `14747:20113` | Key: `1cb8e9a32c502d2e4951924a5089dc263ec2c7c0`

## Data viz: metamodel

### Metamodel widget

- Variants: **Type:** `Dataset` · `Business Term` · `Data Process` · `Field` · `Visualisation`
- Node: `14747:23588` | Key: `6b29851b99078abe643d2c6873e8e1a89f8ff0b4`

### .metamodel property section

- Variants: **Section:** `Collapsed` · `Expanded`
- Node: `14747:23614` | Key: `6824a56c7907608c733ac5a38228574a25983538`

### .metamodel connecting line

- Variants: **Directon:** `1` · `2` · `3` · `4`
- Node: `14747:23654` | Key: `c092263e488d3f60a7afcabe71badd3c8d91c658`

## Data viz: progressive bar

### Progress bar small
Visualizes the completion percentage of a task. Use as a static visualization like a bar graph to show the completeness.

- Variants: **Size:** `Default` · `Large` | **Completeness:** `0%` · `100%` · `50%`
- Node: `14136:1615` | Key: `3ad726123245a1052e193ff80b894ba98b9a3e52`

## Data viz: toolbar

### Toolbar

- Variants: **Type:** `Single` · `Combined` · `Group` | **Orientation:** `Horizontal` · `Vertical`
- Node: `14335:16907` | Key: `96683d78ad981aacc04a5b6c7c2b0f0f1d631516`

## Data viz: WIP

### .data-viz-legend-item

- Variants: **Property 1:** `Default` · `Focused` · `Hovered` · `Pressed` · `Selected`
- Node: `14747:33310` | Key: `0a5b4776b4199b4a9efc77a76e99e12192e0dac5`

## Digram

### Digram Topic

- Variants: **Type:** `Light purple` · `Dark purple` · `Light blue` · `Dark blue` · `Light green` · `Dark green` · `Yellow` · `Orange` · `Red` · `Dark orange`
- Node: `14128:3800` | Key: `c5cccb155896a560523120f96888c1d64374b562`

### Digram Item types
Works like tags but contains only 2 letters (initials of category name).

- Variants: **Item type:** `Dataset` · `Data process` · `Data product` · `Field` · `Output port` · `Use case` · `Visualization` · `Category` · `Custom 1-16` · `Glossary 1-5` | **Size:** `Default` · `Large`
- Node: `14007:23209` | Key: `1705ad4e55489bb9ca0f203be5bd0edbd77e82b2`

## Page header

### Page header
The title area of a specific page. Should include the Page Title, optional Breadcrumbs, and page-specific primary actions.

- Variants: **Type:** `Default` · `Details page` · `Explorer home` · `Explorer detail`
- Node: `12923:2794` | Key: `ec2418807ba81bd52ab103d34c1bffd82fc0b92c`

## Scroll bar

### Scroll bar
Custom UI for indicating and controlling scroll position within a specific container. Only use when standard browser scroll is insufficient.

- Variants: **Property 1:** `Default`
- Node: `14747:17639` | Key: `374c471abeb21e0693327b61cc12a31a5eeef5ba`

## Segmented control (Button group)

### .segmented control sub component

- Variants: **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Selected` · `Disabled`
- Text overrides: `Label`
- Node: `7618:5084` | Key: `6dc9d9ea5a991e5310dc5a4bb8be4bdbfcc8d0fb`

### Segmented control
Use for mutually exclusive options that impact the immediate view. Best for 2-4 options (e.g., "Week / Month / Year").

- Variants: **Type:** `Default`
- Node: `7618:5187` | Key: `062274018b2daab1c45c7e634c95c5a4eaa42b69`

## Search result card

### Search result card
A specialized card variant optimized for scannability during a search. Highlights relevant metadata and matching keywords.

- Variants: **App:** `Explorer` · `Studio` | **State:** `Default`
- Node: `12932:3259` | Key: `0549dc90f04862d64b5b4f8808f26f4968327ce9`

## Tag (Identification key)

### Tag Default
Use for categorizing or labeling items (e.g., "Design", "In Progress"). Can be interactive (removable) or static metadata.

- Variants: **Color:** `Default` · `Pink` · `Purple` · `Indigo` · `Yellow` · `Lime` · `Teal` · `Orange` · `Gray`
- Text overrides: `Label`
- Node: `7257:3037` | Key: `69c8a031b8b1f1703474cc000eaeb14611f0319c`

### Tag Stage
Use for data lifecycle stages. Can be interactive (removable) or static metadata.

- Variants: **Color:** `Gray` · `Orange` · `Indigo` · `Purple` · `Lime` · `Teal` · `Yellow` · `Pink`
- Node: `8655:10279` | Key: `2f4ae1cc7f2d610179a68b2c1b6e25d4900bd8bc`

### Tag Status
Use for status. Can be interactive (removable) or static metadata.

- Variants: **Status:** `Fail` · `Warning` · `Success` · `Loading` · `Maintenance` · `Scheduled` · `Queued` · `Stopped` · `Sleeping` · `Offline` · `Pending`
- Node: `7257:3705` | Key: `1663e13e4fe1648aeef7bf6978f7faeea14a4c17`

### Tag Catalog item type
Use for physical metamodel item types. Can be interactive (removable) or static metadata.

- Variants: **Type:** `Category` · `Dataset` · `Data process` · `Data product` · `Field` · `Output port` · `Use case` · `Visualization`
- Node: `11300:8312` | Key: `40393216be9b998d35ac0b4bd63929ccbc4de25e`

### Tag Updated
Use for indicating recently updated items. Can be interactive (removable) or static metadata.

- Variants: **Type:** `Default`
- Node: `13812:22307` | Key: `7a867b11eaec8c2cffd3a7cd21da62f66516e771`

### Tag Glossary item type
Use for glossary item types. Can be interactive (removable) or static metadata.

- Variants: **Property 1:** `Default`
- Node: `13812:22308` | Key: `639773a27d790a489c5e115360b64c7d05a45ac3`

### Tag Catalog
Use for catalog types. Can be interactive (removable) or static metadata.

- Variants: **Type:** `Default`
- Node: `13812:22309` | Key: `a28b5c2f8b2b9fe218a7fc6674e43c3baacb24c2`

### Tag Interactive

- Variants: **State:** `Default` · `Hovered` · `Pressed` · `Selected` · `Disabled` · `Focused`
- Node: `13845:33759` | Key: `19d8ed0dd3f5dc406017130026a6229f121f169d`

### Identification key
Use for identification keys. Can be interactive (removable) or static metadata.

- Variants: **Property 1:** `Default`
- Node: `14349:15323` | Key: `3bf340c5e6f49afc5b73140935558a558b3e8855`

## Table

### .Table column

- Variants: **Type:** `Default` · `Tag` · `Actions`
- Node: `8157:4865` | Key: `db1caff50e17787177fac15705bf23bc19e25ec1`

### .Table cell

- Variants: **Type:** `Header` · `Text` · `Tag` · `Action` · `Skeleton`
- Node: `8157:6126` | Key: `9d9bf25d11496aab40b99ea6cb8fd90f7e26a6ef`

### Table
Use for large datasets requiring comparison, sorting, and filtering. Supports complex rows with multi-type data (text, badges, actions).

- Variants: **Type:** `Default`
- Node: `14077:2711` | Key: `82307fa1e9783c4a5daba4d3c954d2faf48b9dd0`

## Alert (banner)

### Alert-banner
Static, high-visibility message placed at the top of a page or section. Use for persistent system-level information that doesn't disappear automatically.

- Variants: **Type:** `Primary` · `Success` · `Warning` · `Danger` | **Orientation':** `Horizontal` · `Vertical`
- Node: `13732:3056` | Key: `9717f500f425975f63c0eb2f9c1e434ff010f24b`

## Empty state

### Empty state
A placeholder shown when no content is available. Must include an illustration, a clear title, and a "Call to Action" button to help the user get started.

- Variants: **Size:** `Large` · `Medium` · `Small`
- Text overrides: `Title content`, `Body content`
- Node: `9230:22073` | Key: `0adc6b54a212315ebb16db7f5eea388276a1587b`

### Error state
A placeholder shown when an error occurs. Must include an illustration, a clear title, and a "Call to Action" button to help the user get started.

- Variants: **Size:** `Large` · `Medium`
- Node: `13087:34544` | Key: `a219aa99ab9712f911f391af8dd623c18b281ccb`

### Confirmation
A placeholder shown when a success action completes. Must include an illustration, a clear title, and a "Call to Action" button.

- Variants: **Size:** `Large`
- Node: `13871:32310` | Key: `41a7ce5d67baa4a49843fc0768bee6df42f945a7`

### Maintenance state
A placeholder shown during maintenance. Must include an illustration, a clear title, and a "Call to Action" button.

- Variants: **Size:** `Large`
- Node: `13871:32311` | Key: `4c187d32a069682c44d5ccd8744b9fe0709c894a`

## Loading (Loader, Spinner, Skeleton)

### Spinner
Indicates a background process is active. Use Spinner for small, localized actions like button clicks.

- Variants: **Complete:** `50%` · `75%` · `100%` · `25%`
- Node: `7372:2170` | Key: `c4958a4a5d7aaac4fd262e3609204e7c110e3129`

### Loader
Indicates a background process is active. Use loader for large components or large section within a page.

- Variants: **Percent:** `99%` · `10%` · `Percent3`
- Node: `7372:2195` | Key: `0cf73cc20fd0120418e60d904cff641ff38f4840`

### Loader with logo
Indicates a background process is active. Use loader with logo in transition between apps or logging in or out to reduce perceived wait time.

- Variants: **App:** `Actian Data Intelligence` · `Studio` · `Explorer` · `Admin`
- Node: `14294:7650` | Key: `688ff5c70f4d617faa022058078d47d6bafde817`

### Loading skeleton
Indicates a background process is active. Use Skeleton for page-level transitions to reduce perceived wait time.

- Variants: **Transition:** `1` · `2`
- Node: `14294:8086` | Key: `b798100889bf79e5b9b3c0bb28bafe9713342871`

## Maintenance banner

### Maintenance banner
A specialized Alert variant for scheduled downtime or degraded performance.

- Variants: **Type:** `Default`
- Node: `13868:11535` | Key: `0b2532c1213a748aea1559458099a058bd486959`

## Notification (Toast)

### Notification
Small, temporary overlay that appears at the edge of the screen. Use for non-critical confirmations (e.g., "Item saved"). Automatically dismisses after 3-5 seconds.

- Variants: **Type:** `Default` · `Critial`
- Node: `13868:11595` | Key: `590d2373b688235e8da72732919d2f874eee6cda`

## Drawer (Side panel)

### Drawer side panel
A container that slides from the right side of the screen. Use for secondary tasks that require high focus but need to maintain the context of the main page.

- Variants: **App:** `Studio` · `Explorer`
- Node: `14294:5758` | Key: `3fe66a28fd56e3dbfd87a6f6be08df327bda27bf`

## Modal

### Modal
A centered dialog that blocks the main content. Use for critical "Stop and Think" actions, confirmations, or complex data entry that must be completed or cancelled before moving on.

- Variants: **Size & Type:** `700px setting` · `1200px` · `900px create` · `900px edit` · `700px create` · `450px warning` · `450px confirm`
- Node: `14175:14426` | Key: `2a2b287c2eb1c1c5e071d190e49f19891c937993`

## Popover

### Popover
A non-modal floating container triggered by a click. Use for displaying a small menu or related content that doesn't fit in a tooltip. Stays open until a user clicks outside.

- Variants: **Type:** `Interaction guide` · `Advanced search`
- Node: `14294:7345` | Key: `6116aac0bacf92b34f2f796633953616ab9efd7c`

## Tooltip

### Tooltip

- Variants: **Type:** `Default`
- Text overrides: `Body`
- Node: `7038:351` | Key: `558adad968a5b5e1e3714307fb19de73d1ac6d21`

## Illustrations & graphics

### Illustration

- Variants: **Type:** `Empty state large` · `Empty state medium` · `Empty state small` · `Error state` · `Maintenance` · `Success` · `Error state medium`
- Node: `8837:9945` | Key: `00302ca7dc4298c719f19ca4766029909ecbeb9d`

## Product logos

### Actian pyramid

- Variants: **Color:** `Full color` · `White`
- Node: `7764:7688` | Key: `84e6abe2e5b7dbe96a859397f557249922560413`

### Actian Data Intelligence

- Variants: **Type:** `Explorer` · `Data Intelligence` · `Studio` · `Admin` | **Orientation:** `Horizontal` · `Vertical`
- Node: `7764:7617` | Key: `2e53061b856da7a42b2328279d16718d252e0780`

### Actian Data Observability

- Variants: **Color:** `Full colo` · `White` | **Layout:** `Vertical` · `Horizontal`
- Node: `7764:7671` | Key: `5f5d2ac2d74db9854ad09510d7b237090afd8a76`

### Component 1

- Variants: **Layout:** `Horizontal` · `Vertical`
- Node: `8927:9233` | Key: `21e6d9f1dc0fd84b226c3a52649eb25bfb45105b`

### Data Intelligence Dev Logo

- Variants: **Property 1:** `Dev Actian Data Intelligence Admin` · `Explorer` · `Studio`
- Node: `12770:6655` | Key: `528044aaf9ab8b637aa37e94f67e60c5363cf751`

### Zeenea logo

- Variants: **Type:** `Dev Logo Explorer` · `Dev Logo Studio` · `Dev Logo Zenea Corporate` · `Favicon Zeenea 1` · `Logo Explorer` · `Logo Studio` · `Logo Zenea Corporate` · `Favicon Explorer` · `Favicon Studio`
- Node: `12770:6651` | Key: `b1071930165c007be3fe93de3f881d09794235ce`

## Local components

### .Pointer with line

- Variants: **Label:** `Number` · `Text` · `Token` | **Line:** `Up` · `Down` · `Left` · `Right`
- Node: `7148:410` | Key: `4d02ff8d5a86a66d96adf3497dab35e7ef75c2fa`

### cell

- Variants: **Property 1:** `Default` · `Color #value` · `Tag`
- Text overrides: `Text`
- Node: `10442:1855` | Key: `29570f59b76e836279c8d76f2309652181042c4d`

### .spec

- Variants: **Type:** `Spacing` | **Size:** `Default` · `Variant2` · `Variant3` · `Variant4` · `Variant5` · `Variant6`
- Node: `13571:27572` | Key: `67a84f1ecfa2a9c815d452feb5f6ffa726eca55d`
