# Actian Design System 2026 — Component Reference

Auto-generated from Figma REST API on 2026-03-24.
77 component sets, 728 individual components.

Source: [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK)
Last modified: 2026-03-24T18:15:47Z

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
-         Calendar — 2 component sets
-         Checkbox — 1 component sets
-         Dropdown / Select — 1 component sets
-         Filters  — 1 component sets
-         Radio button — 1 component sets
-         Rich text (existing) — 1 component sets
-         Search — 2 component sets
-         Text input — 1 component sets
-         Toggle control — 1 component sets
- Navigation 
-         Breadcrumbs — 1 component sets
-         Global header — 3 component sets
-         Side nav — 1 component sets
-         Stepper — 1 component sets
-         Tab — 1 component sets
-         Traffic light — 1 component sets
- Data Display
-         Avatar — 1 component sets
-         Badge — 1 component sets
-         Card — 3 component sets
-         Collapse (Accordion) — 1 component sets
-         Data viz: glossary item hierarchy — 1 component sets
-         Data viz: lineage — 2 component sets
-         Data viz: metamodel — 1 component sets
-         Data viz: progressive bar — 1 component sets
-         Data viz: toolbar — 1 component sets
-         Data viz: WIP all others
-         Digram — 2 component sets
-         Page header  — 1 component sets
-         Scroll bar — 1 component sets
-         Segmented control (Button group) — 1 component sets
-         Search result card  — 1 component sets
-         Tag (Identification key) — 9 component sets
-         Table — 1 component sets
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
- Local components
- ---
- ---

---

## Breakpoint, grid & structure

### L grid

- Variants: **Property:** `Default` · `Side nav collapsed` · `Side nav expanded`
- Node: `12054:30598` | Key: `8601f7461f9b21847400f69ebb63d7f591119987`

### M grid

- Variants: **Property 1:** `Default` · `Sid nav collapsed`
- Node: `12054:30576` | Key: `ed642e9bb87c7b5e1cdab020943ad2f999374a39`

### S grid

- Variants: **Property 1:** `Default`
- Node: `14744:8072` | Key: `15772025d13a090b6327442a396f6f9757858031`

### XL grid

- Variants: **Property:** `Default` · `Side nav collapsed` · `Side nav expanded`
- Node: `12054:30623` | Key: `d6b83246f85c6e57d45bbd35ec6d8acab2e16488`

### XS grid

- Variants: **Property 1:** `Default`
- Node: `14744:8073` | Key: `e939d776621f097562d024535a10d5c011fd493c`

## Button

### Button
Primary trigger for a specific action or form submission. Use "Primary" for the main task, "Secondary" for alternative actions, and "Ghost/Tertiary" for low-priority tasks.

Primary: "Use as the single most important action on a screen. Limit to one per view (e.g., 'Submit', 'Pay Now')."
Secondary: "Use for supporting actions that are not the main goal of the page (e.g., 'Cancel', 'Back')."
Tertiary/Ghost: "Use for low-emphasis actions or repeated items in a list (e.g., 'View Details', 'Learn More')."
Critical: "Use specifically for actions that result in data loss or permanent changes. Usually styled in Red."

- Variants: **Type:** `Primary` · `Secondary` · `Tertiary` · `Icon` · `Critical primary` · `Critical secondary` | **Size:** `Default` · `Small` | **State:** `Default` · `Hovered` · `Focused` · `Pressed` · `Selected` · `Disabled`
- Text overrides: `Label`
- Node: `7206:2643` | Key: `5a6d10d26bef3cc83955bf32a318c6b4682f25d3`

## Link

### Link
A Link visually represents clickable text or elements that navigate users to other pages, sections, or resources. It appears colored to indicate interactivity and follows accessibility and design standards for clarity and usability.

Used for navigation to a different page, an external URL, or to trigger a secondary action within a sentence. Not to be used for primary form submissions.

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

### Input, date
Used for selecting a single date, a date range, or a specific point in time. Best for scheduling or historical data entry.

- Variants: **Type:** `Single date` · `Date range` | **States:** `Enabled` · `Hovered` · `Focused` · `Error` · `Disabled` · `Fille` · `Activ`
- Node: `8194:7305` | Key: `9eafdb6242837b591ba5f39959150b53e40ef02d`

## Checkbox

### Checkbox with label
Used for binary choices (on/off) or when a user can select multiple options from a list of related items.

- Variants: **Selected:** `Yes` · `Indeterminate` · `No` | **State:** `Enabled` · `Hovered` · `Focused` · `Pressed` · `Disabled`
- Node: `9478:17216` | Key: `f88de6fe161264680045b2b5ec77d311b1b3adb6`

## Dropdown / Select

### Dropdown, Select, default
Use when there are 5+ options or space is limited. Ideal for selecting one item from a pre-defined list (e.g., Country, State).

- Variants: **Type:** `Default` · `Search/Multiple` · `With avatar` · `Compact/Custom` | **State:** `Default` · `Hovered` · `Focused` · `Active` · `Filled` · `Disabled`
- Node: `13972:708` | Key: `1140aec3d572e3fbda362723cd7137ac2f0ce9bd`

## Filters

### Search filters
A collection of inputs used to narrow down a dataset or search results. Should be placed above or to the left of the content it controls.

- Variants: **Type:** `Explorer` · `Studio`
- Node: `9660:49637` | Key: `919ddc42563055f1d9f34b662fb806eb66763980`

## Radio button

### Radio button
Used for mutually exclusive choices where the user must select exactly one option from a small list (2–5 items).

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

## Toggle control

### Toglge

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

### Card

- Variants: **Property 1:** `Default`
- Node: `14782:29281` | Key: `3b8d2c7adc118fdd5f31e68440fa35e952fee92e`

### Perimeter card

- Variants: **Property 1:** `Default`
- Node: `14783:7565` | Key: `c1672b025b85c4ed0ddc645d89aa202803a95f07`

### Tile, Item
A flexible container for grouping related information. Use for dashboard summaries or items in a grid that require an overview.

- Variants: **Type:** `Catalog` · `Item` · `item type` · `Glossary type` · `Topic` | **State:** `Default` · `Hovered` · `Focused` · `Pressed`
- Node: `7613:7853` | Key: `95764c702b7dcb1dc2e2aef2cd5ee46b27a5cf30`

## Collapse (Accordion)

### Collapse-accordion
Use to hide/show secondary information to reduce vertical clutter. Best for FAQs or detailed settings sections.

- Variants: **State:** `Closed` · `Open`
- Node: `8292:80` | Key: `8253d19d70a3b835653049d90b4fdf97b26a31c8`

## Data viz: glossary item hierarchy

### Glossary item hierarchy diagram

- Variants: **Type:** `Default`
- Node: `14747:30242` | Key: `ccb3fbc9c238527e5fa4998e8fd6ae9b5c31b7da`

## Data viz: lineage

### Lineage connecting line

- Variants: **Direction:** `Down` · `Straight` · `up` · `Up` | **State:** `Default` · `Selected` · `Disabled`
- Node: `14747:20085` | Key: `553bdc1ba26f3b30988997771dcf74f275eb12d3`

### Lineage widget

- Variants: **Type:** `Main item` · `Sub item` | **State:** `Default` · `Selected` · `Disabled` | **Fields:** `Collapsed` · `Expanded`
- Node: `14747:19902` | Key: `5904351595c9b5b263bb5891bd1ed038fbaff636`

## Data viz: metamodel

### Metamodel widget

- Variants: **Type:** `Dataset` · `Business Term` · `Data Process` · `Field` · `Visualisation`
- Node: `14747:23588` | Key: `6b29851b99078abe643d2c6873e8e1a89f8ff0b4`

## Data viz: progressive bar

### Progress bar small
Visualizes the completion percentage of a task.  Use as a static visualization like a bar graph to show the completeness.

- Variants: **Size:** `Default` · `Large` | **Completeness:** `0%` · `100%` · `50%`
- Node: `14136:1615` | Key: `3ad726123245a1052e193ff80b894ba98b9a3e52`

## Data viz: toolbar

### Toolbar

- Variants: **Type:** `Single` · `Combined` · `Group` | **Orientation:** `Horizontal` · `Vertical`
- Node: `14335:16907` | Key: `96683d78ad981aacc04a5b6c7c2b0f0f1d631516`

## Digram

### Digram, Item types
Works like tags but contains only 2 letters (initials of category name)

- Variants: **Item type:** `Dataset` · `Data process` · `Data product` · `Field` · `Output port` · `Use case` · `Visualization` · `Category` · `Custom 1` · `Custom 2` · `Custom 3` · `Custom 4` · `Custom 5` · `Custom 6` · `Custom 7` · `Custom 8` · `Custom 9` · `Custom 10` · `Custom 11` · `Custom 12` · `Custom 13` · `Custom 14` · `Custom 16` · `Glossary 1` · `Glossary 2` · `Glossary 3` · `Glossary 4` · `Glossary 5` | **Size:** `Default` · `Large`
- Node: `14007:23209` | Key: `1705ad4e55489bb9ca0f203be5bd0edbd77e82b2`

### Digram, Topic

- Variants: **Type:** `Light purple` · `Dark purple` · `Light blue` · `Dark blue` · `Light green` · `Dark green` · `Yellow` · `Orange` · `Red` · `Dark orange`
- Node: `14128:3800` | Key: `c5cccb155896a560523120f96888c1d64374b562`

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

### Segmented control
Use for mutually exclusive options that impact the immediate view. Best for 2–4 options (e.g., "Week / Month / Year").

- Variants: **Type:** `Default`
- Node: `7618:5187` | Key: `062274018b2daab1c45c7e634c95c5a4eaa42b69`

## Search result card

### Search result card
A specialized card variant optimized for scannability during a search. Highlights relevant metadata and matching keywords.

- Variants: **App:** `Explorer` · `Studio` | **State:** `Default`
- Node: `12932:3259` | Key: `0549dc90f04862d64b5b4f8808f26f4968327ce9`

## Tag (Identification key)

### Identification key
Use for identification keys. Can be interactive (removable) or static metadata.

- Variants: **Property 1:** `Default`
- Node: `14349:15323` | Key: `3bf340c5e6f49afc5b73140935558a558b3e8855`

### Tag, Catalog
Use for catalog types. Can be interactive (removable) or static metadata.

- Variants: **Type:** `Default`
- Node: `13812:22309` | Key: `a28b5c2f8b2b9fe218a7fc6674e43c3baacb24c2`

### Tag, Catalog item type
Use for physical metamodel item types. Can be interactive (removable) or static metadata.

- Variants: **Type:** `Category` · `Dataset` · `Data process` · `Data product` · `Field` · `Output port` · `Use case` · `Visualization`
- Node: `11300:8312` | Key: `40393216be9b998d35ac0b4bd63929ccbc4de25e`

### Tag, Default
Use for categorizing or labeling items (e.g., "Design", "In Progress"). Can be interactive (removable) or static metadata.

- Variants: **Color:** `Default` · `Pink` · `Purple` · `Indigo` · `Yellow` · `Lime` · `Teal` · `Orange` · `Gray`
- Text overrides: `Label`
- Node: `7257:3037` | Key: `69c8a031b8b1f1703474cc000eaeb14611f0319c`

### Tag, Glossary item type
Use for glossary item types. Can be interactive (removable) or static metadata.

- Variants: **Property 1:** `Default`
- Node: `13812:22308` | Key: `639773a27d790a489c5e115360b64c7d05a45ac3`

### Tag, Interactive

- Variants: **State:** `Default` · `Hovered` · `Pressed` · `Selected` · `Disabled` · `Focused`
- Node: `13845:33759` | Key: `19d8ed0dd3f5dc406017130026a6229f121f169d`

### Tag, State
Use for data lifecycle stages. Can be interactive (removable) or static metadata.

- Variants: **Color:** `Gray` · `Orange` · `Indigo` · `Purple` · `Lime` · `Teal` · `Yellow` · `Pink`
- Node: `8655:10279` | Key: `2f4ae1cc7f2d610179a68b2c1b6e25d4900bd8bc`

### Tag, Status
Use for status. Can be interactive (removable) or static metadata.

- Variants: **Status:** `Fail` · `Warning` · `Success` · `Loading` · `Maintenance` · `Scheduled` · `Queued` · `Stopped` · `Sleeping` · `Offline` · `Pending`
- Node: `7257:3705` | Key: `1663e13e4fe1648aeef7bf6978f7faeea14a4c17`

### Tag, Updated
Use for indicating something is recently updated. Can be interactive (removable) or static metadata.

- Variants: **Type:** `Default`
- Node: `13812:22307` | Key: `7a867b11eaec8c2cffd3a7cd21da62f66516e771`

## Table

### Table
Use for large datasets requiring comparison, sorting, and filtering. Supports complex rows with multi-type data (text, badges, actions).

"If data is null, display the 'Empty State' illustration variant with a 'Create New' call to action."

- Variants: **Type:** `Default`
- Node: `14077:2711` | Key: `82307fa1e9783c4a5daba4d3c954d2faf48b9dd0`

## Alert (banner)

### Alert-banner
Static, high-visibility message placed at the top of a page or section. Use for persistent system-level information (Success, Info, Warning, Error) that doesn't disappear automatically.

- Variants: **Type:** `Informational` · `Success` · `Critical` · `Warning`
- Node: `13732:3056` | Key: `9717f500f425975f63c0eb2f9c1e434ff010f24b`

## Empty state

### Confirmation
A placeholder shown when success. Must include an illustration, a clear title, and a "Call to Action" button to help the user get started.

- Variants: **Size:** `Large`
- Node: `13871:32310` | Key: `41a7ce5d67baa4a49843fc0768bee6df42f945a7`

### Empty state
A placeholder shown when a container has no content (e.g., empty search, no messages). Must include an illustration, a clear title, and a "Call to Action" button to help the user get started.

- Variants: **Size:** `Large` · `Medium` · `Small`
- Text overrides: `Title content`, `Body content`
- Node: `9230:22073` | Key: `0adc6b54a212315ebb16db7f5eea388276a1587b`

### Error state
A placeholder shown when a container has an error. Must include an illustration, a clear title, and a "Call to Action" button to help the user get started.

- Variants: **Size:** `Large` · `Medium`
- Node: `13087:34544` | Key: `a219aa99ab9712f911f391af8dd623c18b281ccb`

### Maintenance state
A placeholder shown when maintenance. Must include an illustration, a clear title, and a "Call to Action" button to help the user get started.

- Variants: **Size:** `Large`
- Node: `13871:32311` | Key: `4c187d32a069682c44d5ccd8744b9fe0709c894a`

## Loading (Loader, Spinner, Skeleton)

### Loader
Indicates a background process is active. Use loader for large components or large section within a page

- Variants: **Percent:** `99%` · `10%` · `Percent3`
- Node: `7372:2195` | Key: `0cf73cc20fd0120418e60d904cff641ff38f4840`

### Loader with logo
Indicates a background process is active. Use loader with logo in transition between apps or logging in or out to reduce perceived wait time

- Variants: **App:** `Actian Data Intelligence` · `Studio` · `Explorer` · `Admin`
- Node: `14294:7650` | Key: `688ff5c70f4d617faa022058078d47d6bafde817`

### Loading skeleton
Indicates a background process is active. Use Skeleton for page-level transitions to reduce perceived wait time.

- Variants: **Transition:** `1` · `2`
- Node: `14294:8086` | Key: `b798100889bf79e5b9b3c0bb28bafe9713342871`

### Spinner
Indicates a background process is active. Use Spinner for small, localized actions like button clicks.

- Variants: **Complete:** `50%` · `75%` · `100%` · `25%`
- Node: `7372:2170` | Key: `c4958a4a5d7aaac4fd262e3609204e7c110e3129`

## Maintenance banner

### Maintenance banner
A specialized Alert variant for scheduled downtime or degraded performance.

- Variants: **Type:** `Default`
- Node: `13868:11535` | Key: `0b2532c1213a748aea1559458099a058bd486959`

## Notification (Toast)

### Notification
Small, temporary overlay that appears at the edge of the screen. Use for non-critical confirmations (e.g., "Item saved"). Automatically dismisses after 3–5 seconds.

- Variants: **Type:** `Default` · `Critial`
- Node: `13868:11595` | Key: `590d2373b688235e8da72732919d2f874eee6cda`

## Drawer (Side panel)

### Drawer, side panel
A container that slides from right side of the screen. Use for secondary tasks that require high focus but need to maintain the context of the main page.

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

### Actian Data Intelligence

- Variants: **Type:** `Explorer` · `Data Intelligence` · `Studio` · `Admin` | **Orientation:** `Horizontal` · `Vertical`
- Node: `7764:7617` | Key: `2e53061b856da7a42b2328279d16718d252e0780`

### Actian Data Observability

- Variants: **Color:** `Full colo` · `White` | **Layout:** `Vertical` · `Horizontal`
- Node: `7764:7671` | Key: `5f5d2ac2d74db9854ad09510d7b237090afd8a76`

### Actian pyramid

- Variants: **Color:** `Full color` · `White`
- Node: `7764:7688` | Key: `84e6abe2e5b7dbe96a859397f557249922560413`

### Component 1

- Variants: **Layout:** `Horizontal` · `Vertical`
- Node: `8927:9233` | Key: `21e6d9f1dc0fd84b226c3a52649eb25bfb45105b`

### Data Intelligence Dev Logo

- Variants: **Property 1:** `Dev Actian Data Intelligence Admin` · `Dev Actian Data Intelligence Explorer` · `Dev Actian Data Intelligence Studio`
- Node: `12770:6655` | Key: `528044aaf9ab8b637aa37e94f67e60c5363cf751`

### Zeenea logo

- Variants: **Type:** `Dev Logo Explorer` · `Dev Logo Studio` · `Dev Logo Zenea Corporate` · `Favicon Zeenea 1` · `Logo Explorer` · `Logo Studio` · `Logo Zenea Corporate` · `Favicon Explorer` · `Favicon Studio`
- Node: `12770:6651` | Key: `b1071930165c007be3fe93de3f881d09794235ce`

## Standalone Components

###         Alert (banner)

- **Type=Critical** — Key: `e5403f7e8d8e885e4499279266c8899544399415`
- **Type=Informational** — Key: `5cbcbd676a3f4687691b2153885635c50fea230e`
- **Type=Success** — Key: `66aebc399ceebe68fb0ea657c49e21493be62ef7`
- **Type=Warning** — Key: `d811d12f1c014676252427380b491f84cb659707`

###         Avatar

- **State=Default, Type=Default** — Key: `1ad9d11c9a4497eff097afa28d88ce0b64f5d0f8`
  Profile avatar 
- **State=Default, Type=One group** — Key: `37c617b560321849cc9760d4f80d43cbd1817df5`
- **State=Default, Type=Two groups** — Key: `4c6241ec968eeae9d91edc194bc00919117b1ef9`
- **State=Disabled, Type=Default** — Key: `bc72d9f0213c9a8dc04ae5ba0aafe5a2f81c2b55`
  Profile avatar 
- **State=Focused, Type=Default** — Key: `277c7c764205dacfec89a07163cbb3fc118c6bcf`
  Profile avatar 
- **State=Hovered, Type=Default** — Key: `4ee07df7a99a411c05ce1b208c005846ee05a1a7`
  Profile avatar 
- **State=Pressed, Type=Default** — Key: `97f0e3dc9ed8b81817cae02ed38244d9658de37e`
  Profile avatar 
- **State=Selected, Type=Default** — Key: `c4024901c63f74fe4cf99665d4a610222b083964`
  Profile avatar 

###         Badge

- **Type=Dot** — Key: `73a1e7b5b7be5771d61027f4dfa085c3241a9a14`
- **Type=Number** — Key: `ace990d859a8fa961fc00a30e97ea1ec23903efe`

###         Breadcrumbs

- **Type=Default** — Key: `c32ff5e17107ecc01c983a8c0623d2229740c880`

###         Button

- **Type=Critical primary, Size=Default, State=Default** — Key: `102fe069b903c4c965e7e6b38040976b47be2b33`
- **Type=Critical primary, Size=Default, State=Focused** — Key: `39974d6a30dd6e89b591df0201f1cb61db65c0b1`
- **Type=Critical primary, Size=Default, State=Hovered** — Key: `9f4e02afc444e0787770de91bbe89079b1b46b83`
- **Type=Critical primary, Size=Default, State=Pressed** — Key: `a5fdf5ee5df41444cf95a7a4e35214c8f95f4b7d`
- **Type=Critical secondary, Size=Default, State=Default** — Key: `df1b7db08b3c217e7d9fe49bee720fcfb80e8648`
- **Type=Critical secondary, Size=Default, State=Focused** — Key: `380d54e58421d488e947f5548a70dc60778bbfde`
- **Type=Critical secondary, Size=Default, State=Hovered** — Key: `2ee0a739658a46239ff9e45c39db72f4b9a683b6`
- **Type=Critical secondary, Size=Default, State=Pressed** — Key: `01bd071600e4be61aa5c448728228b64dd0b729a`
- **Type=Icon, Size=Default, State=Default** — Key: `6bd0fa7714f94b26c84cefe3b513b4771fe17bd5`
- **Type=Icon, Size=Default, State=Disabled** — Key: `3427a5f411a0e336066aedae21f6a364f0381d65`
- **Type=Icon, Size=Default, State=Focused** — Key: `fa954a415356a4a6ce998a2ad2288dfd168e686e`
- **Type=Icon, Size=Default, State=Hovered** — Key: `d009d0a924c6b3e6075ee8b4e105e9e745de13c1`
- **Type=Icon, Size=Default, State=Pressed** — Key: `dc57a89b7630bee7beca75b7d7f096710ff1158f`
- **Type=Icon, Size=Default, State=Selected** — Key: `8a38b7d1481dc465e3d840a4553c1c41143e53c9`
- **Type=Icon, Size=Small, State=Default** — Key: `57f5ecfdc45ba5c35cfcbb6c50980826590a60a4`
- **Type=Icon, Size=Small, State=Disabled** — Key: `c24eb2d008e2caf8783f8295263092a8cbfbde27`
- **Type=Icon, Size=Small, State=Focused** — Key: `a5ae7bdf7bcf1ad9391dbc58fddb2d74e5cf35ce`
- **Type=Icon, Size=Small, State=Hovered** — Key: `1a8752f9e5f317ac5b585cb42e2fc0c38472f0b1`
- **Type=Icon, Size=Small, State=Pressed** — Key: `24a1f30fc042d7351d7887587b6b249809721ec7`
- **Type=Icon, Size=Small, State=Selected** — Key: `0140f4bdcee73bde80769b6089fe28696235e0ed`
- **Type=Primary, Size=Default, State=Default** — Key: `89511c62b855774612665f5b912084bc92638807`
- **Type=Primary, Size=Default, State=Disabled** — Key: `7f67a165d4460ca3a5b51226b09c79c70596207b`
- **Type=Primary, Size=Default, State=Focused** — Key: `d9c842f84049e904be4d20104daaa043a5d2ff34`
- **Type=Primary, Size=Default, State=Hovered** — Key: `3be5dc30508fef5d8389b9e059022ddb8b90ec2e`
- **Type=Primary, Size=Default, State=Pressed** — Key: `da4fa235e14eb46fc360ad3bc974617f9411608a`
- **Type=Primary, Size=Default, State=Selected** — Key: `b44a6cdb7d73827e7c9b7953b64bcd2f44cc1a78`
- **Type=Primary, Size=Small, State=Default** — Key: `ec2b8238a17e6cb38f7bd0bb6c8fca0d13f51472`
- **Type=Primary, Size=Small, State=Disabled** — Key: `bf94406a97305f5e601033c73728123b5554428a`
- **Type=Primary, Size=Small, State=Focused** — Key: `f3b6d6757f922ae264c8b4feee082772dbea2f9f`
- **Type=Primary, Size=Small, State=Hovered** — Key: `89060512fdc80b34f1b8affed61f6abc817e17dc`
- **Type=Primary, Size=Small, State=Pressed** — Key: `3d89d748978867d93b1d654ec998f3f67648f488`
- **Type=Primary, Size=Small, State=Selected** — Key: `c3f9f2b68a19ae3e82243d3d1f9b746e8b2117af`
- **Type=Secondary, Size=Default, State=Default** — Key: `6c04d34ca580f1ab2a565894f7ac150ba0250998`
- **Type=Secondary, Size=Default, State=Disabled** — Key: `157507ee4e0d304eaad706785deab05d99d6eb71`
- **Type=Secondary, Size=Default, State=Focused** — Key: `cb9cd8d532d5b111425bea49efe112131467f6dc`
- **Type=Secondary, Size=Default, State=Hovered** — Key: `fc1e75f2337e75b9395e06c98ecec69628170c21`
- **Type=Secondary, Size=Default, State=Pressed** — Key: `7580f70fcf20470ca1a6b9b35c471973dc3601f4`
- **Type=Secondary, Size=Default, State=Selected** — Key: `c5bf6fea6519f360d17badd504c5d83bf968a724`
- **Type=Secondary, Size=Small, State=Default** — Key: `b55879fa077f77eb5eea1328f91bb78f0c28d1f9`
- **Type=Secondary, Size=Small, State=Disabled** — Key: `cc2bcdbb227a97607bf5083b44d9a7a87e03e35b`
- **Type=Secondary, Size=Small, State=Focused** — Key: `a31bea51fcdfbb2cbf5baeb2db6b5213f1c2010d`
- **Type=Secondary, Size=Small, State=Hovered** — Key: `1ef63dc3d082f6c063d374f0ce07818869513012`
- **Type=Secondary, Size=Small, State=Pressed** — Key: `36cfc1b52d4d3c169e4326532ab7de83f79e4d28`
- **Type=Secondary, Size=Small, State=Selected** — Key: `ba0428d1409b33223facde99cca220be44b812e3`
- **Type=Tertiary, Size=Default, State=Default** — Key: `b00c66bbc2c1624eabc21e616abc31446734a17c`
- **Type=Tertiary, Size=Default, State=Disabled** — Key: `681b73b6a87df7d7de2e082022f1b4e22d4bbb78`
- **Type=Tertiary, Size=Default, State=Focused** — Key: `683da9120fc99ac355451b4ee48a742748b305de`
- **Type=Tertiary, Size=Default, State=Hovered** — Key: `992b57d29a243acda3301a10fdf64ced72288ada`
- **Type=Tertiary, Size=Default, State=Pressed** — Key: `917531d9c76535c1162787d277a3b8116336be95`
- **Type=Tertiary, Size=Default, State=Selected** — Key: `660d244e7685518439cc2bb2499e0b6261bf71d4`
- **Type=Tertiary, Size=Small, State=Default** — Key: `b0f151b1b5b0fa7dc895c6a9e1d7f96015cf593a`
- **Type=Tertiary, Size=Small, State=Disabled** — Key: `266858288e4da56fdc8539717de645f71fa37db5`
- **Type=Tertiary, Size=Small, State=Focused** — Key: `2da1f8ed5a0f503dc57c0b04009612add716a1e1`
- **Type=Tertiary, Size=Small, State=Hovered** — Key: `a13407bbfb73363202396431f30bf3539462862c`
- **Type=Tertiary, Size=Small, State=Pressed** — Key: `677a753e27dd6ca214791b0c5d1352f8ab1f86a8`
- **Type=Tertiary, Size=Small, State=Selected** — Key: `037d4172f826a544a9d41ea0e962f4da854cf8d9`

###         Calendar

- **Selection=Year, Type=Single** — Key: `a5d500b9c04e4faca63ce58d3387581bb4b18f34`
- **Type=Date range, States=Enabled** — Key: `2ade20e90c5acc98bef4b83acd4a1689b5edfc07`
- **Type=Date, Selection=Range** — Key: `958cdef74beb090900cd7e6a1d34723cd3170ca5`
- **Type=Month, Selection=Single** — Key: `4af54ad11bf7a18dbba43ae62581d811c6dba8ae`
- **Type=Single date select, Selection=Single** — Key: `5140c149128a8352521eef63c9b14ce635364b9f`
- **Type=Single date, States=Activ** — Key: `28723406299f812f6b1f1e8231a524e1bca01930`
- **Type=Single date, States=Disabled** — Key: `255748da6558e15466aff627a4f5ff2d9cf0ceff`
- **Type=Single date, States=Enabled** — Key: `c3af6a5fb3bc167cbe71125e17700fc503db73ae`
- **Type=Single date, States=Error** — Key: `c0ff971971785d59b77f08b6b2e8e5b3c07490f2`
- **Type=Single date, States=Fille** — Key: `3c2afdfff6fa5f0d86a928948e230e707e6b405f`
- **Type=Single date, States=Focused** — Key: `021c06fe60ab192f16d7ac4d895e513b3d9b6a40`
- **Type=Single date, States=Hovered** — Key: `9e2b715ad2dd7ad3f6fe8670a1c5890287d406d8`

###         Card

- **Property 1=Default** — Key: `aa1974476257fdfad2d0b631c83f71ca64e0d810`
- **Property 1=Default** — Key: `c5d01d9189464a5dcc7fc48cd08136aaad010b54`
- **Type=Catalog, State=Default** — Key: `5649eceed8174a46c4bc3d93d849742f1cd99471`
- **Type=Catalog, State=Focused** — Key: `569b449657264a65f9d8d11658932cbacb6b0c28`
- **Type=Catalog, State=Hovered** — Key: `83ba0f7fd4dc46464d9b8825f51517b0bd570258`
- **Type=Catalog, State=Pressed** — Key: `8d00c75520a0416cf5dc8c61aa2a425af896a1ed`
- **Type=Glossary type, State=Default** — Key: `e22fa401d8831704fb34496dd03f99c10e91d5df`
- **Type=Glossary type, State=Focused** — Key: `472229609dcadf2d014e5f57f5dda650529b6579`
- **Type=Glossary type, State=Hovered** — Key: `80efd202c9b3c8861b1353e6da4b5dace0bbf72d`
- **Type=Glossary type, State=Pressed** — Key: `5cfe78fab9833859dd5a20f78bfea0129a456c74`
- **Type=item type, State=Default** — Key: `6cf75e1c1bc3d3b61aaeb85a7d41f60948639d90`
- **Type=item type, State=Focused** — Key: `6a764adcef6c94ec6aa92183450bc147ce7c726d`
- **Type=item type, State=Hovered** — Key: `23a3d434c57cf80f7c18e8fdec6883c5aab78deb`
- **Type=item type, State=Pressed** — Key: `6f60d0d3d7992105456034bdc16f71513cbd540c`
- **Type=Item, State=Default** — Key: `3f92c24c9f7112e6211b4967c8d7a0a0144c75de`
- **Type=Item, State=Focused** — Key: `eafe2cafb3830b03f8ff6a9b1a049b3463aa9bb5`
- **Type=Item, State=Hovered** — Key: `789a076d35ab8145cb5a17aba5ae618f4b86b40a`
- **Type=Item, State=Pressed** — Key: `7db2711010e7c5b23f9a707397165abc0eb0e826`
- **Type=Topic, State=Default** — Key: `f0d5fb391bf357db47140d02e181316a76cd0df2`
- **Type=Topic, State=Focused** — Key: `78b58fff925c762b7f869bd9ac6384604f223344`
- **Type=Topic, State=Hovered** — Key: `7c9c8e419d07f2d6a479470b7f19a665b09f50be`
- **Type=Topic, State=Pressed** — Key: `4e0b29541f47b9363a5bb61ae75a9f397d686f97`

###         Checkbox

- **Selected=Indeterminate, State=Disabled** — Key: `e8daa4e4d95a1a0c2d31678b3cf88baa2fee36ff`
- **Selected=Indeterminate, State=Enabled** — Key: `5fd9614067347151fdb65d2833271dcea640eb02`
- **Selected=Indeterminate, State=Focused** — Key: `251e2cbc5258868fc4c5657fd2d44d80ae8560e6`
- **Selected=Indeterminate, State=Hovered** — Key: `07c4b4d81303dd4282df5f352a42ffb007931af8`
- **Selected=Indeterminate, State=Pressed** — Key: `8e0107545bf2bca8fb95059cc568fd48c9dd8fea`
- **Selected=No, State=Disabled** — Key: `0ca2d43e73aa180fd5c8ff69f298b3f978c9d5db`
- **Selected=No, State=Enabled** — Key: `8c54618038d158bf17ecbd5a131d2aca73781f69`
- **Selected=No, State=Focused** — Key: `3fdf6ac547d915ee41cc2b6663d5779790333710`
- **Selected=No, State=Hovered** — Key: `e2489b69666a849e4c3174fb3c44df6e8666f6c3`
- **Selected=No, State=Pressed** — Key: `b3cdd5a4188ca01a0deef93449998767180bc3bb`
- **Selected=Yes, State=Disabled** — Key: `a21590f9cb247d293a1da2bf85fb451cf1c67953`
- **Selected=Yes, State=Enabled** — Key: `890988b6111c33d31ee20454f8b0eadd4a06352a`
- **Selected=Yes, State=Focused** — Key: `6e695f55c73f07f8d5ab47c2d2f1596f502b239f`
- **Selected=Yes, State=Hovered** — Key: `592cbd28b21f945d1f4bd1099a3e0c209fdece52`
- **Selected=Yes, State=Pressed** — Key: `3b84a862722842bedf41a1b9b378c7e78ee45fa6`

###         Collapse (Accordion)

- **State=Closed** — Key: `ac4310bd2e8c908812f50721f3deea37afe317dc`
- **State=Open** — Key: `8a7037527bbcc95f0300ee38551aa4506f1c6768`

###         Data viz: glossary item hierarchy

- **Type=Default** — Key: `589059440a078bfe879a21b056edfe16be6b12c2`

###         Data viz: lineage

- **Direction=Down, State=Default** — Key: `8b14d860013e394906529d0b3aaf2712573de2a0`
- **Direction=Down, State=Disabled** — Key: `63d3208972db88ce4e939c122e33c505babe8324`
- **Direction=Down, State=Selected** — Key: `5655352fcc812ed7e8a57c040788376f16c14610`
- **Direction=Straight, State=Default** — Key: `f52eca2f74e5a0485c9dd3936562113ec875a997`
- **Direction=Straight, State=Disabled** — Key: `76ac5ec9cc7aac3969b414caa090b99e0c9b6b85`
- **Direction=Straight, State=Selected** — Key: `b9d7e2436a9ea08c39af940af5291f02a1dc4314`
- **Direction=Up, State=Default** — Key: `7d0bfc09874b71e270c31bac65247110096669fe`
- **Direction=up, State=Disabled** — Key: `bdbab4dcc0a0cf9492d2b9be42aff111c3b34b13`
- **Direction=up, State=Selected** — Key: `1c3a531d01bdcc59e1913ee3b84a40183718fb2f`
- **Type=Main item, State=Default, Fields=Collapsed** — Key: `a623b5b7e1862757155561d2c87c040b4f6f966d`
- **Type=Main item, State=Default, Fields=Expanded** — Key: `7e5db17c7e48f063b02a23e2d869f2367ea2ce50`
- **Type=Main item, State=Selected, Fields=Collapsed** — Key: `9f322a457243c6113c216c7bb5d4862b8062bb38`
- **Type=Main item, State=Selected, Fields=Expanded** — Key: `d4cead5b9a498d0dde9970e2e5ba4037b0b97552`
- **Type=Sub item, State=Default, Fields=Collapsed** — Key: `b5f4ab560f388c9afbd01e287c86d418236506b5`
- **Type=Sub item, State=Default, Fields=Expanded** — Key: `52200b551e9b35182c928e1121aa07ea0e861dec`
- **Type=Sub item, State=Disabled, Fields=Collapsed** — Key: `cb41e923594975e2c8b0ce4c70e674ce460f52e9`
- **Type=Sub item, State=Selected, Fields=Collapsed** — Key: `06c0078cfb6e2805cc27f2eae557b30956e7c684`
- **Type=Sub item, State=Selected, Fields=Expanded** — Key: `adf516e5780bc0b80c1168197f6ca0494d761d22`

###         Data viz: metamodel

- **Type=Business Term** — Key: `ec941b22dc8808ea4513fae205bdd610e8f5d9dc`
- **Type=Data Process** — Key: `5f076f10828140a7275b0d9ea568aa65313f767a`
- **Type=Dataset** — Key: `a0b121e1c277128873219d602a9b7fca0aed4a6c`
- **Type=Field** — Key: `2b2d79b7b8c112371b4c82f5c287448970df2719`
- **Type=Visualisation** — Key: `5fe086de2b4b41d08689c1510d54f2ea6d309ea3`

###         Data viz: progressive bar

- **Size=Default, Completeness=0%** — Key: `11f631cbe2320b59cc8b27d606eb1985d20cc60d`
- **Size=Default, Completeness=100%** — Key: `75058385581cfbbd0a5974fcd883b6a2991dcf4f`
- **Size=Default, Completeness=50%** — Key: `28f5836dced8f3122df8326b8690776d6adce367`
- **Size=Large, Completeness=0%** — Key: `a23480db315350e7d90c1221f8e91d6ecf8ea5cb`
- **Size=Large, Completeness=100%** — Key: `6a5a725736bf6f0a4f0c30bc4e34d8a11dfd4dce`
- **Size=Large, Completeness=50%** — Key: `300d3bcc3d7c990cbe6333148ef86ac7f94cdf62`

###         Data viz: toolbar

- **Type=Combined, Orientation=Horizontal** — Key: `681b2fd1dcf569be14b85dacc3e999ebb54ab927`
- **Type=Combined, Orientation=Vertical** — Key: `04dc3dd0a724a2b83058d20b73898f539739b657`
- **Type=Group, Orientation=Horizontal** — Key: `9ebcf495138f0f1bdd001c52bff3e753b1f8a82e`
- **Type=Group, Orientation=Vertical** — Key: `c5f8471168d30d2258a19045872616407d2d9d50`
- **Type=Single, Orientation=Horizontal** — Key: `5a6cf3926d8ed0c14c3e5d9b1d8309cb6d75fc39`

###         Digram

- **Item type=Category, Size=Default** — Key: `c289d6eb00a07802793f015521bedb8386a64836`
- **Item type=Category, Size=Large** — Key: `06e6924fbd98acd62f0a58bf69704071266b9257`
- **Item type=Custom 1, Size=Default** — Key: `f1fef9f460f15442b351e2060bcb86cd1bf6ffed`
- **Item type=Custom 1, Size=Large** — Key: `4199e244a3073ec4101d3c4a4439d5b49dfc506b`
- **Item type=Custom 10, Size=Default** — Key: `c8a7311828d441497d8c060ff9406fd8d9d49898`
- **Item type=Custom 10, Size=Large** — Key: `2beaf22b53d93da680b99336f5608d6940466ebe`
- **Item type=Custom 11, Size=Default** — Key: `6aae3e51462a8eb08d946d9efd17c6137a3e6c76`
- **Item type=Custom 11, Size=Large** — Key: `964286a7233457080e8ac1e49f847ded56ec0383`
- **Item type=Custom 12, Size=Default** — Key: `9082c4cd72c00c1720da7bb40fb7a7d102232b8b`
- **Item type=Custom 12, Size=Large** — Key: `93409a189864b948330fc4d4a591df6db1233072`
- **Item type=Custom 13, Size=Default** — Key: `e4814e42df91681bd2980b5dd0b9e4637ff08c0b`
- **Item type=Custom 13, Size=Large** — Key: `bb18334807ec0e4b6f8637cba76f781111cc665d`
- **Item type=Custom 14, Size=Default** — Key: `2d1b5865fcaebb4338ecd4b61d6bf23320ef4483`
- **Item type=Custom 14, Size=Large** — Key: `bf32cd27642d2fa324200bd797d3f2baaf363844`
- **Item type=Custom 16, Size=Default** — Key: `92600dc6022d18fb6b7485f5bded1a403b609f3c`
- **Item type=Custom 16, Size=Large** — Key: `bd51d52d3e41dfd28d5b0d9cf42cf437fb68ca19`
- **Item type=Custom 2, Size=Default** — Key: `da265c46b7fa4aaaf2bdb3e6359c0f46f4310030`
- **Item type=Custom 2, Size=Large** — Key: `4a2c27520c819f215a4813d7d8ccb315f8ae482e`
- **Item type=Custom 3, Size=Default** — Key: `2ed14f9388af1c1ecd5687ce0e3f712a9732c3be`
- **Item type=Custom 3, Size=Large** — Key: `4f09a0dfa69c917543a97d0706a7cfc2c11a6577`
- **Item type=Custom 4, Size=Default** — Key: `dcde951116b58a0a3f3e54f7588445307ba088a4`
- **Item type=Custom 4, Size=Large** — Key: `762eb519f92aa9193de1db3a89b451548ba368c7`
- **Item type=Custom 5, Size=Default** — Key: `0bf837df51ddcdef124949035f1e7e6bf0710c91`
- **Item type=Custom 5, Size=Large** — Key: `38caa01b3b7da87027b02b547691a06460ea5dae`
- **Item type=Custom 6, Size=Default** — Key: `f546de5a97452f95a09de1a593eb7721f923b280`
- **Item type=Custom 6, Size=Large** — Key: `c56b84ee30626d1036815cd88937a897e10c7723`
- **Item type=Custom 7, Size=Default** — Key: `30335bdebf597eb90c9a64556473acc2a4f4807f`
- **Item type=Custom 7, Size=Large** — Key: `c47aecb97adb5ef4d97e293b876bd351a47d47fa`
- **Item type=Custom 8, Size=Default** — Key: `2190b256ef0940b00b5bd1d59adb63a3fa340440`
- **Item type=Custom 8, Size=Large** — Key: `f6de74711a94c2b91a5f638c2186194b04e25b39`
- **Item type=Custom 9, Size=Default** — Key: `528274b04a48bde9cc71cd1b224037aa88b6e8f3`
- **Item type=Custom 9, Size=Large** — Key: `3ab1d45d35c5b55e988bfe11314d25aec61edb3a`
- **Item type=Data process, Size=Default** — Key: `2d0e74acd312ce15682be8cd4ff5330b4dffc237`
- **Item type=Data process, Size=Large** — Key: `4c9f1d79b4acf82c77c1efaa500e74bc7a552fe2`
- **Item type=Data product, Size=Default** — Key: `feccb0e3cb342e694fbb0dc7f14c73ace2128cf2`
- **Item type=Data product, Size=Large** — Key: `a9dbc62737166830f3d3eccab478756993b72cba`
- **Item type=Dataset, Size=Default** — Key: `9fa25c61a910bae7152fa04269ba0535baabb17c`
- **Item type=Dataset, Size=Large** — Key: `271a4ac3f8ac311ed213390f50ff6c5ba463ed5e`
- **Item type=Field, Size=Default** — Key: `b4473a7571254ed60da14745a9b90c1b35c1ae89`
- **Item type=Field, Size=Large** — Key: `af294d1aed84676bd074940f3e5f95d6e4de6938`
- **Item type=Glossary 1, Size=Default** — Key: `29309d3d8fe7ba60b05332a4e2e733205d84278d`
- **Item type=Glossary 1, Size=Large** — Key: `a335938943cd831a354dd6e27f314b5c092a735a`
- **Item type=Glossary 2, Size=Default** — Key: `3245e0dfe77e775b95690b0a33f975cda0084414`
- **Item type=Glossary 2, Size=Large** — Key: `759c812a4a4e6a08093a09b08511367ec1782b3a`
- **Item type=Glossary 3, Size=Default** — Key: `08042d8678969f7f9d30be0541003032aa545646`
- **Item type=Glossary 3, Size=Large** — Key: `3fbec229d081cef090721f5206ffbe717929ca6f`
- **Item type=Glossary 4, Size=Default** — Key: `3a99bdca51fd940a73e61d8df6355dc6c0a0446d`
- **Item type=Glossary 4, Size=Large** — Key: `279216db38aa1b6a53a4e1312b1f066c9ad99b8e`
- **Item type=Glossary 5, Size=Default** — Key: `e4bef11ec02025c9d17e95f8c63804460652927a`
- **Item type=Glossary 5, Size=Large** — Key: `f2bf764ec3bef8fe3f5a1f271b7f293490e749f1`
- **Item type=Output port, Size=Default** — Key: `2624a45499e010ecd89cc180c7cd55de01f4076a`
- **Item type=Output port, Size=Large** — Key: `e3b4e63f4005f391fb243fbabff20d1b59daf032`
- **Item type=Use case, Size=Default** — Key: `000d7686721ed535ba5935bd4042cb0b17a12fe2`
- **Item type=Use case, Size=Large** — Key: `bd241a744ac3b6329fb2e4a14d85ce7a03e40dc2`
- **Item type=Visualization, Size=Default** — Key: `f746fb3db021d8dfcc2080268e89a25adeff2d9c`
- **Item type=Visualization, Size=Large** — Key: `07a925ae98a0f27f5d67317ed1a7e9a5e98196ee`
- **Type=Dark blue** — Key: `4338f8c4aa3b00e19561c6388d7b62d814a97e62`
- **Type=Dark green** — Key: `3e912b575a4849192fd865022464661520984953`
- **Type=Dark orange** — Key: `0f9a7b54a05af2b5d504fc1930eb78cacc959a20`
- **Type=Dark purple** — Key: `c3bf7704861e5005aafb922d02138a7468dad591`
- **Type=Light blue** — Key: `8ba509f1a8847ad01e9a9a91abc2094ddf66f641`
- **Type=Light green** — Key: `3c3b0ae168d3ededd61062aa5dc43f252434671c`
- **Type=Light purple** — Key: `3b29b817c6c8c66fc71ea0e5fb055bea1ed90c70`
- **Type=Orange** — Key: `12883ceb1f38e344d62954df5851c0ee79fdacbe`
- **Type=Red** — Key: `9167ccb8b6f8068ee1459222c886781fafd7845d`
- **Type=Yellow** — Key: `77197ad84956f421873fbb780e3f31d57976ef1f`

###         Drawer (Side panel)

- **App=Explorer** — Key: `23995367b9bad1f5b43032c60dcc0ba2fa86bfc5`
- **App=Studio** — Key: `756e393922db6e135a5a774f66088a38058c265b`

###         Dropdown / Select

- **Type=Compact/Custom, State=Active** — Key: `a0e7090190b1fc4f5293b530337fc486f71055c6`
- **Type=Compact/Custom, State=Default** — Key: `def798476f5bd8b290e5a12bcba91186631d8bb4`
- **Type=Compact/Custom, State=Focused** — Key: `5b9e756011aa40eb975590772098f61da53978c4`
- **Type=Compact/Custom, State=Hovered** — Key: `a45b525989decfe248fecac07d2316a8555c9372`
- **Type=Default, State=Active** — Key: `046310a45b9247181cc97f195720b8f4caf3dc59`
- **Type=Default, State=Default** — Key: `6a3378f23f40c55608cf03013e33740bd0620357`
- **Type=Default, State=Disabled** — Key: `a42e1ff601646059d4eb66f8084de3337d1095b2`
- **Type=Default, State=Filled** — Key: `422b83ffa09d7d4f45578fbfeebba692bfbfd288`
- **Type=Default, State=Focused** — Key: `481432d46dfa4a690bbf1165d76d0f7310f59e1b`
- **Type=Default, State=Hovered** — Key: `1d6a9536d0f9b83bd3388ae856ab839ebc97e77a`
- **Type=Search/Multiple, State=Active** — Key: `08ce251dd9028548b3a823c1abeb9604b1341430`
- **Type=Search/Multiple, State=Default** — Key: `0798a4db94778f00765dca18c46d5601b5d6c51e`
- **Type=Search/Multiple, State=Filled** — Key: `681747ed5eac0277f4619d1c77e16d86528f6dc3`
- **Type=Search/Multiple, State=Focused** — Key: `a26fd1c9f7a8539999122cb057e9d4db7b587c9b`
- **Type=Search/Multiple, State=Hovered** — Key: `6e1490aeddb27d135fd1bb5e656dbc5df78ee5d0`
- **Type=With avatar, State=Active** — Key: `a6ef870e8c3b01f3101f62b30d41622a43636bfe`

###         Empty state

- **Size=Large** — Key: `56c8289f7813a2d1d8649e369f42bb56a7dde6f1`
- **Size=Large** — Key: `511bd120d27d3a5007850641123c1419bc9cbf5b`
- **Size=Large** — Key: `15cbfe5da8e0570989bce12982bcd840bc9b8f22`
- **Size=Large** — Key: `530c4f4568d2dd180d403c0a6754f6e170dbe6dd`
- **Size=Medium** — Key: `fd0eaed3e24bc2df73c36a3d79f4add9653ef6be`
- **Size=Medium** — Key: `08de9835cb374a493678c56554fcfd023ff02652`
- **Size=Small** — Key: `a5c14fbe5d4d53b78b0f01cab3eafbdf81e255d2`

###         Filters 

- **Type=Explorer** — Key: `72f2c9d4ce1ac2d6388183c0bb4c50c916bd4940`
- **Type=Studio** — Key: `d665b8b117f1c35f0d7cba351fdd92761a9b7dc3`

###         Global header

- **Account dropdown** — Key: `487b25247d05a6f9d36a4c7b9f5177ca2017348e`
- **App switcher dropdown** — Key: `09baf67bef9191d0b5303b52c1c3159eefba3843`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **App type=Admin, Breakpoints=L** — Key: `a67c3ae7ae404b517d123a8f658dcf22606ee326`
- **App type=Admin, Breakpoints=M** — Key: `9c5e8a9e505c399c4d2120fbb8ada5c6de054587`
- **App type=Admin, Breakpoints=S** — Key: `df76d9cd9091a1fc7cc92b88865c11a5f11526c4`
- **App type=Admin, Breakpoints=XL** — Key: `5b8dfaba9f1244d8c63cb0bd2415dd2c7356a2fe`
- **App type=Admin, Breakpoints=XS** — Key: `f44c8438e426b3a59144a7b92c95a4e0a205f716`
- **App type=Explorer, Breakpoints=L** — Key: `dc69f502d30eedc8ee24249aedf82ebdd2870a2d`
- **App type=Explorer, Breakpoints=M** — Key: `e6507a2f365850d8cf3bd0a458c72d58c9d2c3a0`
- **App type=Explorer, Breakpoints=S** — Key: `5ad4c0c79d47c6a3838e6ea2ef1b1d7f5620f24c`
- **App type=Explorer, Breakpoints=XL** — Key: `e031e459a0ee6f3aff94dc2adb52c1ef7743f393`
- **App type=Explorer, Breakpoints=XS** — Key: `b031bff459e53962e1d96aa65c2d384b0d23ebe1`
- **App type=Studio, Breakpoints=L** — Key: `8acf1baa5233364cbed4da2aef12b42b69021cb7`
- **App type=Studio, Breakpoints=M** — Key: `980d2f6dee974ff5dc96c668af5943ecb8d2478c`
- **App type=Studio, Breakpoints=S** — Key: `985529399e6b912bf3fdb3ccb548e99fd2cf54d6`
- **App type=Studio, Breakpoints=XL** — Key: `0f9b3026fef6ae3ffe22171175d52fd14c26751f`
- **App type=Studio, Breakpoints=XS** — Key: `9fdb86b267d04f888e2275d16d9f6d6a8138fae5`
- **Property 1=Drilldown1** — Key: `40d434da9fedde917fa7bfadf24467946ada2107`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Property 1=Drilldown2** — Key: `5450fdc81a90b30f303dddb91f646c3c9a25569f`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Property 1=Empty** — Key: `ffd24c6d16790391c22ff80dbc67e4402d0a8dc4`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Property 1=Empty** — Key: `0746fbfa6e1abbb1c5cb47d1d49e9b5acff199c2`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Property 1=List** — Key: `75435f0f0dbc2c73558a9d62a6e5fddd64b344eb`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Property 1=List** — Key: `fa83f436163d61742e5dbc2ea1adea0e3ed6093e`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,

###         Link

- **State=Disabled** — Key: `a0f3de14150aa49a3b7fc75e83532440d663bd00`
- **State=Enabled** — Key: `50924aab315f05f5ac57a925fab7829fd43d8a16`
- **State=Focused** — Key: `1ee943f2bbb179a7f1a014150afaae595db9236d`
- **State=Hovered** — Key: `34a32db207beb0a63e9c63a8e955877601572a17`
- **State=Once clicked** — Key: `2b29f9497867b759c5ef7f913dc5e663baec4f1e`
- **State=Pressed** — Key: `2b50a2ccb7f5d313f5e5ddc14a70cac081875b95`

###         Loading (Loader, Spinner, Skeleton) 

- **App=Actian Data Intelligence** — Key: `eba7f0452e12e6529cc3c850b7ede80c412c1690`
- **App=Admin** — Key: `9fbe598133f5f30461e992aac4870c4a2e502e0a`
- **App=Explorer** — Key: `042978183688575c58baf3ac7deb221a608b0000`
- **App=Studio** — Key: `773ff49432f8fd30912664a6f37f8070bee4ee8c`
- **Complete=100%** — Key: `a11a1745945e079aa5aecc05751c772a92ecc922`
- **Complete=25%** — Key: `6996152fb3fc67f0903dc7b5fa0f8a36ce2cc6dd`
- **Complete=50%** — Key: `f40847bb18fe5aa75db59aeea79f2d252bebdbe2`
- **Complete=75%** — Key: `e3da8c4aac225e52663cad2cf767af8fc806e607`
- **Percent=10%** — Key: `a75f1a5790e55d3dc3a26464ae9bcdf713b18e19`
- **Percent=99%** — Key: `5a864e55a8fefe767f36a9a385b9a5de94dda013`
- **Percent=Percent3** — Key: `8f7cc090a60e1d8652b6b6e571c7ff2877e6ebc0`
- **Transition=1** — Key: `afbb0ced870407dfe5dcc750ab7881a914332c6f`
- **Transition=2** — Key: `c88bdca9cdd04709651a3e95d8383a94cf2683d7`

###         Maintenance banner

- **Type=Default** — Key: `27b758699a9fd71facb127aba7840987276b912b`

###         Modal

- **Size & Type=1200px** — Key: `85be4452da282ea4a1caf3f039760061f6b1815f`
- **Size & Type=450px confirm** — Key: `485dfa0e8c3f1ffa4639dd7b0effe1bb4cfc4688`
- **Size & Type=450px warning** — Key: `7aa3724d7e9bbb97894527c6fb02ee77b6fa9741`
- **Size & Type=700px create** — Key: `8ac5108a07aac00408593f72d2a9c4c0d0106a53`
- **Size & Type=700px setting** — Key: `bc46142665d3333d67039a0beb4b1cf6c1fe24e5`
- **Size & Type=900px create** — Key: `1a3b4c10b586d264fc0b3f4b4e0feb23d401bfc0`
- **Size & Type=900px edit** — Key: `204595a0ff59a115e24b970394db3c5f9552704a`

###         Notification (Toast)

- **Type=Critial** — Key: `2d5da231781d1c5d806ca2e3325e30075619448a`
- **Type=Default** — Key: `fc15ad136e54360c51090b1cabf5bb0e2e008147`

###         Page header 

- **Type=Default** — Key: `b368ce636789de7dd02e1d5543de2e50d31ab7a3`
- **Type=Details page** — Key: `0967a66265836fe1245c30c3320a3d527b90b0f6`
- **Type=Explorer detail** — Key: `9e00cebe8c99e620b6eb3eddd708900165467184`
- **Type=Explorer home** — Key: `727e80ee2b835468179abbbea1ade88cff6e1cb0`

###         Popover

- **Type=Advanced search** — Key: `643eff42f5542aa1e1e5913ad61a920a18d8a373`
- **Type=Interaction guide** — Key: `ce815b28f9d12924a1fa9fa3fa72f3c460184c6f`

###         Radio button

- **Format=Card format, State=Default, Selected=No** — Key: `34dc4649264059502e64cb3aee49708f86bc7d60`
- **Format=Card format, State=Default, Selected=Yes** — Key: `aa64f190bbaa62cde5bb0b12f433a6adbaacfa22`
- **Format=Card format, State=Disabled, Selected=No** — Key: `6ff396d7f27d604f50ddacef80d504c3c04c556b`
- **Format=Card format, State=Disabled, Selected=Yes** — Key: `4d99740a42a0959cac6313ccc6167997a82d2961`
- **Format=Card format, State=Focused, Selected=No** — Key: `5fe10281649656014044e83866ad808c8c6da329`
- **Format=Card format, State=Focused, Selected=Yes** — Key: `201100d8ea53fbcb38056de8c348e9221c9734ef`
- **Format=Card format, State=Hovered, Selected=No** — Key: `d1caccf3eda6d00c428cc91be958ae61d3543cd7`
- **Format=Card format, State=Hovered, Selected=Yes** — Key: `ddf3c5343cc643b2275e47291d459514d3ccb7af`
- **Format=Card format, State=Pressed, Selected=No** — Key: `299ed8e159592e5545794a177330dedb0d2023a0`
- **Format=Card format, State=Pressed, Selected=Yes** — Key: `88ad82bcbe1cf228743cd9042a337d4e39dd57ce`
- **Format=Default, State=Default, Selected=No** — Key: `22c94fb9379963c1f2338e44e15f6a9ae50d72af`
- **Format=Default, State=Default, Selected=Yes** — Key: `d7add3cd7d3763e3d16b4bf4ac8bd9545d7178ad`
- **Format=Default, State=Disabled, Selected=No** — Key: `9c455b5559182e2ec2de1c862013e78d16248a79`
- **Format=Default, State=Disabled, Selected=Yes** — Key: `25b5ab4b5f36f622a2790f3820057eda41ed42e3`
- **Format=Default, State=Focused, Selected=No** — Key: `ae95ab157f135844c8e27eb63fac7257af4c5754`
- **Format=Default, State=Focused, Selected=Yes** — Key: `85eaa039f702e8fd26057cfeb91c1161f419a3b4`
- **Format=Default, State=Hovered, Selected=No** — Key: `3bd8c95143cf50ee24e8d968ea647afc218bcfb6`
- **Format=Default, State=Hovered, Selected=Yes** — Key: `27d670d4d9c714d3e1dc9aae1c5b309a52c61081`
- **Format=Default, State=Pressed, Selected=No** — Key: `99a4c19987ff15a678950c8998418337ca728f89`
- **Format=Default, State=Pressed, Selected=Yes** — Key: `8efcbf41670576d0ae77452c79e4a0c6c934e433`

###         Rich text (existing)

- **State=Default** — Key: `a199b60d5fe04b395d1f56fc452fc14d33ff35f1`
- **State=Expanded** — Key: `e229bfc49fccfe4aa951cdca9896e86d6ca69f32`

###         Scroll bar

- **Property 1=Default** — Key: `5a21d10de437499880e8a745a762e16009e1fcaa`

###         Search result card 

- **App=Explorer, State=Default** — Key: `266a4d1ded89edd886854c850e568257a627d881`
- **App=Studio, State=Default** — Key: `18d447be33c2f9f32fdca400f8531c8a023efdd2`

###         Search

- **Type=After typed** — Key: `60a3aa8679fa0376aee2cf16e1b0cc7537d372a8`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Type=Before typed** — Key: `97af9df5195898050d932a52a1d7996c5c796c1f`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Type=Explorer home** — Key: `049da250f7156144a59eca8f8c1182e43c14def4`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,
- **Type=Explorer home, State=Active** — Key: `6fe675d6f65fd239c7fb410384500fabc5921b0b`
- **Type=Explorer home, State=Default** — Key: `7dfc347dd3115c5196b922682833eb0d7b39cc20`
- **Type=Explorer home, State=Dsiabled** — Key: `369899776b2d496a9b666aeb77fbb5da24c1bb02`
- **Type=Explorer home, State=Filled** — Key: `7b7b3ff1e7b01c9678f17504f1090deae5845307`
- **Type=Explorer home, State=Focused** — Key: `03e430a54dd08025b55c02a7205baa1561de9bec`
- **Type=Explorer home, State=Hovered** — Key: `efa08267418862f862b01810ccc610661664bb3b`
- **Type=Global header, State=Active** — Key: `8f1f3a9a6dc8b42c2177289b02bb2d84a4dc52f4`
- **Type=Global header, State=Default** — Key: `22082717cef362f82da0d341b570fde20d32cd8a`
- **Type=Global header, State=Dsiabled** — Key: `3e8cb9e592ea5cd48fc8fc74e8d45f98a0973a31`
- **Type=Global header, State=Filled** — Key: `0eafefbfbacd2d5e24941c9bab620b290ffd2c2e`
- **Type=Global header, State=Focused** — Key: `752d43f87cc82a501ff810f7c7415d9eb62330fd`
- **Type=Global header, State=Hovered** — Key: `8c4621f0bc818cc0251d59d1a35db6a90f9b7b28`
- **Type=Inline, State=Active** — Key: `54a709464e92b8f18de60ab291ed4fe4da91f505`
- **Type=Inline, State=Default** — Key: `b852a6a4ee4442bcc70d384fa1d58a79e17176a0`
- **Type=Inline, State=Dsiabled** — Key: `013576978e2969561f3765af6bc3d84a93ee00d0`
- **Type=Inline, State=Filled** — Key: `882baffe8dda0e438b03578852b68b225091be17`
- **Type=Inline, State=Focused** — Key: `377afd90a94de34c3a0860cd1bbab387b8050aa7`
- **Type=Inline, State=Hovered** — Key: `7fc67f203487ecaeac1245e3f756b0662e80a8c2`
- **Type=No result** — Key: `4a8c4b7004f391d7347f720c05c777688b5f6eab`
  Menu: -4 Density 
Menus display a list of choices on a temporary surface. They appear when users interact with a button,

###         Segmented control (Button group)

- **Type=Default** — Key: `b4d36abfe1043c86a74903008f4560be67b54e9a`

###         Side nav

- **App=Admin, View=Collapsed** — Key: `297530384c044102d39f25a972cffd5f48a70b00`
- **App=Admin, View=Expanded** — Key: `c965886e96bde7ad20a9dc1259af0f8ad4ad15a0`
- **App=Studio, View=Collapsed** — Key: `b2c851ebcf6f1a91399bb5329b7f4327498af3ef`
- **App=Studio, View=Expanded** — Key: `307352e0fb63731cc027d36ac8ddf117293ae4c3`

###         Stepper

- **State=Active** — Key: `b8b215ea8fa1510a770614768e67a70edee8336e`
- **State=Complete** — Key: `46e19c80608b7a98f5f0c44185195a22b0292e0d`
- **State=Default** — Key: `911afd3eb244132f5a33bb197c988c0bba036b52`
- **State=State5** — Key: `303fd362ae9d6a359bd24fdb3f915f489f0f2531`

###         Sticky footer

- **Property 1=Default** — Key: `8e442c841e0adb644fb1a1a779b29406881b1ae4`

###         Tab

- **Property 1=Default** — Key: `f7c2d559b6cadba2002dc304bd4f71924cb4a27a`

###         Table

- **Type=Default** — Key: `ec885215f6b5bd6167be27bbe719b175eb66e57f`

###         Tag (Identification key)

- **Color=Default** — Key: `ce2f8cc105432b11153ff3e7a74052a15da99baf`
- **Color=Gray** — Key: `752b2de4c840cf1961ab9a48d6b90bbaaee788b5`
- **Color=Gray** — Key: `e0524703beb0b1708c4256ad25670e120dd003e7`
- **Color=Indigo** — Key: `3a1c6cf905dd00f0ca5a9ee73a2723ff450dc887`
- **Color=Indigo** — Key: `db1bea735074dad15d49f3cf60067c552e020a50`
- **Color=Lime** — Key: `e8e6b452cb8be16cd3518215f72c1c77beed08c6`
- **Color=Lime** — Key: `f3a0680bd9340912285d4f0f0268c497cdd6738d`
- **Color=Orange** — Key: `4c621297010c3ad3d52e8447f0d79a0e841b0fbf`
- **Color=Orange** — Key: `94d503d45b2d0748146419fecd8673896ffc1a88`
- **Color=Pink** — Key: `4f84432a29b8f8c301083e41f294e7babe8f4e9c`
- **Color=Pink** — Key: `5401608a83409270bc3e56a6b2733c0b72124b11`
- **Color=Purple** — Key: `891e3d1c722536e0f5d9f261678202be7b502f31`
- **Color=Purple** — Key: `9525d14fa2e56c8ae586a6a26cfb61b554ae0984`
- **Color=Teal** — Key: `4a7f4db8deb482df5eb84151cf7fdfeb436c3d9f`
- **Color=Teal** — Key: `f7b1cf85074e8ac3e437f306399169713605f6c7`
- **Color=Yellow** — Key: `0863f29da6e37fbd3dee995f51320ac5bd7cf185`
- **Color=Yellow** — Key: `de4426bf42b6ddcf20c54ddd3ac8ea00d794fd01`
- **Property 1=Default** — Key: `fff06ba00e1d5317d3112c722a8434f765194909`
- **Property 1=Default** — Key: `55088cf45c7ee10b5e6ad9377551a299428f50d7`
- **State=Default** — Key: `039d7410dc30000f974880724cb9cdb579754fad`
- **State=Disabled** — Key: `95726cc41d8dbcab21a5298e315426efc635bdb2`
- **State=Focused** — Key: `ae4bd0fa1fe16acf59ab93df59fb2edad7d0b54d`
- **State=Hovered** — Key: `26e279d4ccf647386e1cc9a9a8e635819d45a72e`
- **State=Pressed** — Key: `6f848def68fcfc0a451b361dc1d173620b731f21`
- **State=Selected** — Key: `8e16907f1bd26ce82211a38ccf2a6eed6f33b42f`
- **Status=Fail** — Key: `1af8f001acd07177c5cfee0f7ef3d890e5ede2a9`
- **Status=Loading** — Key: `55b96c3d50c13572ee142079694f25d2f0010c4d`
- **Status=Maintenance** — Key: `2ebadd1d2d66875721c614c0b9522a8c540ba794`
- **Status=Offline** — Key: `aeae458eae862a25dd1e8f115b14ab1295026a94`
- **Status=Pending** — Key: `a3670d7f218750675d71d3d12584120770d60b17`
- **Status=Queued** — Key: `f528fc006eb010abeeb1a020dfeb417000321444`
- **Status=Scheduled** — Key: `948c2d05ef4c70b5556acadb02b82a6d87955e2f`
- **Status=Sleeping** — Key: `a508c8008040a4ec0ac11d3eddbb4ccf5dfa25a0`
- **Status=Stopped** — Key: `5ed52bb25383163088fc3581cf42428a6cf7f6d8`
- **Status=Success** — Key: `6175ca53d5f14e79d83761a2b78b42bdbd7dac09`
- **Status=Warning** — Key: `051085b71163ee59e74a46bf62b1ba2463afd9d9`
- **Type=Category** — Key: `d03ce9a950264b9c189a0400164873a5f5915539`
- **Type=Data process** — Key: `e631ee980c52995b98ab42c99c98c58985bda50a`
- **Type=Data product** — Key: `778569e55254c43d0b7423f7b690117590215286`
- **Type=Dataset** — Key: `50f8ba743de5f4fed3db577fa3ff19c7d4ff0dfb`
- **Type=Default** — Key: `6b999f84bc1c7836d51aa3b517a7b68deccfe22d`
- **Type=Default** — Key: `c648b822c2f6dd4905ba64adb160acd79f623393`
- **Type=Field** — Key: `4694615a15d0ad23024752edfbec6a7d56b3d6ef`
- **Type=Output port** — Key: `e92758c801f81595b5307b30f55e6ff32da67ff2`
- **Type=Use case** — Key: `42e9ddc18e89de2071347cedc2d2e3952b5cb4ab`
- **Type=Visualization** — Key: `59fa7a14a39e4ec833d3dcfc4c263568355ec929`

###         Text input

- **States=Active** — Key: `705e7c215d4b72230178b28c94ba6034cd84e2c5`
- **States=Default** — Key: `c95cee8c59de35b2cbb66c50f5397fa2a9c45a04`
- **States=Disabled** — Key: `4fbf010a787d4c124b96c194852d853e2fa17878`
- **States=Error** — Key: `ffd95742c960e865b2dd88165b23e2e72f0b510f`
- **States=Filled** — Key: `9b5500e6ef5384ab614d97b88be9053cdfa63979`
- **States=Focused** — Key: `74d60caafa6a198b752e004a4dff98ac51ff5350`
- **States=Hovered** — Key: `4e21f61d6de1738d47fbc57766bb71c0bb41b26a`
- **States=Read-only** — Key: `935e6b5979d3c9c2231265ec20273db5204909f3`

###         Toggle control

- **Type=Default, State=Default, Selected=No** — Key: `afc7916a4743ba28dd69de55ffc34f946718dc9b`
- **Type=Default, State=Default, Selected=Yes** — Key: `f33307da34b0cee05ae50462a6dccf040e431a3f`
- **Type=Default, State=Disabled, Selected=No** — Key: `6e954501b8e019b046878d0dfc23b37262bce2c1`
- **Type=Default, State=Disabled, Selected=Yes** — Key: `5da52d78b14525266b986dee2b963b867b2417d5`
- **Type=Default, State=Focused, Selected=No** — Key: `0764707604d9439016ce93590b0c54ae3978ea04`
- **Type=Default, State=Focused, Selected=Yes** — Key: `ec4af32aeb4617feb8f08659c3e4eae35f2edf63`
- **Type=Default, State=Hovered, Selected=No** — Key: `497d3d4b437bb10f864d71a8690bb5344a9f26a2`
- **Type=Default, State=Hovered, Selected=Yes** — Key: `61d13109ff4a150340fc3092c33fe014178c965b`
- **Type=Default, State=Pressed, Selected=No** — Key: `857cd6b5067f30d647eef929faf2c3c69820645d`
- **Type=Default, State=Pressed, Selected=Yes** — Key: `77549afb99f83bf1fdbad3667f114d6dc7d6cb51`

###         Tooltip

- **Type=Default** — Key: `b36b2406753f81a38dc29731eb262dda640e83c4`
  A brief, descriptive text box triggered by hover or focus. Use for clarifying icons or providing short context for a spe

###         Traffic light

- **Type=Default** — Key: `000d95d3373afe5fb3a24223e64cf08d585fc976`
- **Type=Green** — Key: `ed5aa24b17be59afe7b9e3b2aeb824d70d7c4b10`
- **Type=Orange** — Key: `352e312097d5dec19bfdb60897637ef78d1e60cf`
- **Type=Red** — Key: `c1958a0fb3d20247030e9ccbe94de90f9278053a`

### Breakpoint, grid & structure

- **Property 1=Default** — Key: `40c22ceb0c13e3d0b42f52d68d0cc6b31d699c3e`
- **Property 1=Default** — Key: `0892c771829c8e81c9d1b667f168980c9c1bb315`
  Layout template with expanded navigation region
- **Property 1=Default** — Key: `06c58fafe40868767254cd70707f0c96bf1c547c`
- **Property 1=Sid nav collapsed** — Key: `1d5974dc39089380707dfa512b8a4d89f2ac7521`
  Layout template with expanded navigation region
- **Property=Default** — Key: `1dfac09ff35b50f560e2b191869eb41f638cc5e5`
  Layout template with expanded navigation region
- **Property=Default** — Key: `f320c3f7fcb22e2c503e2ee20efa7b5dbd5a1c8b`
  Layout template with expanded navigation region
- **Property=Side nav collapsed** — Key: `5ec1709582e9c410d82f79007833761e2ab18efc`
  Layout template with expanded navigation region
- **Property=Side nav collapsed** — Key: `f4b9778617a03b30bff246219ec56a70da75177e`
  Layout template with expanded navigation region
- **Property=Side nav expanded** — Key: `b99979a91cc1a691ce2371aa95e27f95c6a8fe0e`
  Layout template with expanded navigation region
- **Property=Side nav expanded** — Key: `0bb3ddf2dcd962cbdb9691413fa36764cadeeeeb`
  Layout template with expanded navigation region

### Content guidelines

- **Content Checklist** — Key: `0bb0c240447d3cdb04072e7f65b60fe0bb9b8e47`

### Icons

- **add** — Key: `33ab1534db5a1d5619a29735d2a0ac87514819b9`
- **add** — Key: `2b10108613a16fe36ada2420f992f0240b076804`
- **add-circle** — Key: `1aa9aeb58cfd76045aef34c67c9137a659eb4c5d`
- **adlsgen1** — Key: `7a4697cd3f8b40eec2dd6122528b4b7d6ef0a57c`
- **adobe-analytics** — Key: `dbbd381b0a1be15cf5f3c68aa1348c5fda1fbb1c`
- **alert** — Key: `3ef4d9930695bc99abbbf055d853f986227ae5c5`
- **alert-circle** — Key: `750fb2b2080f030bcf753f1c2c18c811c5aeaa8a`
- **alteryx** — Key: `d3e7905afc2b7bb22a7ecc47cad59047ae0a5f5b`
- **amazons3** — Key: `1e44db8dac0e0e37e46dea409150cc762967166f`
- **analytics** — Key: `2cd31a798fd279626c6235902e21b17d6850db19`
- **api** — Key: `d7bfb59b3cc1a6b3adccab62c95f2a39fa6b75e7`
- **api-key** — Key: `f0f6ca388b8ac7bb5a0b3dea5b3d5ec30c6d0293`
- **applications** — Key: `3ba99b342a17c51b99638e6b4aea3a91948ff578`
- **arrow** — Key: `1c31323fdcdaafe18878eb8206c3300f36bd6274`
- **arrow-alt** — Key: `3a4fe9f03c3754d97f2fc5e8a472052a9fd4c9d7`
- **arrow-down** — Key: `43009d0b38b304e97c5716c0a32ccc3951851872`
- **asleep** — Key: `c0411afed99b56a1af98f59d40aec05db7c5fb95`
- **atlas** — Key: `34094ec015b8f74b80ea36bdeb8a42621b1ba85f`
- **avro** — Key: `0befe2863bac449e778bf81429105d046babd9b8`
- **award-04** — Key: `9c4aea9aed18f57b7ed4bf55bc71d6910d2d0109`
  award, medal, certification, certificate, badge
- **Aws-glue-etl** — Key: `24387b65e7be808a58716cf4ba7d0efcde7835b9`
- **awsredshift** — Key: `649bf64d3b0e9c773340edb70013935d1a8bd275`
- **Azure** — Key: `6edb5b6d977105b79bc5582de729ba6c74bb64bf`
- **azure-cosmosdb** — Key: `8fee2e9541d05300c5e325040c728e1cdb1553af`
- **azure-datafactory** — Key: `b93938019c6aa4c9e65b5baa21449fdab334b366`
- **azure-purview** — Key: `cfa72ef29d4b52b47af23c07b24301003e1a97b9`
- **azure-synapse** — Key: `27569cb7f6fc253c56855b733654a6848381ccce`
- **back** — Key: `3626cb4ae78e5ad1bbc79bb3b04ef9d0323dbf9f`
- **bigquery** — Key: `f2105b90a8f205ee78b02428b71cc2720fc451f6`
- **bin-type** — Key: `fe0c2ab0c4128c555979c33682a6f3df40fb0b76`
- **book-bookmark** — Key: `37bb27238ac422fd734919a3193c3c7564f1ce7c`
- **book-bookmark** — Key: `b5e398041c92e0830c652775f440c06226403d04`
- **book-edit** — Key: `5375571bf48c287ec6f4c68bc4323db53466cf36`
- **boolean-type** — Key: `e3dffdffb222be75a098c850a0ad155e1ad47eef`
- **brightness-contrast** — Key: `f6cb9d9b6a1a428237a5d845543c565524cd4eb0`
- **calendar** — Key: `805cb80b498052ea49f63c3123e9491808d6d8ef`
- **calendar** — Key: `decde3b78f16d02045516de4e4d8255d67d73cfc`
- **calendar 2** — Key: `1d990e9286ab35da2957194c28722e72873aec3b`
- **cassandra** — Key: `64f0499f24c5111550584447b3de34a9c84a87ae`
- **catalog-design** — Key: `1e008db8c2582d72bc8688a4eec84b2da83506c1`
- **catalogs** — Key: `bf59f59271f2a5fb0945e406629aefeb72775468`
- **chart--bar** — Key: `dde572f16c897c96ae7bc7a82532276fe87b7410`
- **chart--pie** — Key: `a88e1c87f86fa2dc376dfa5b0b890e5a6d3d50f5`
- **checkmark--outline** — Key: `e5b3de9a4f7a367b4ef924486daa999145e62f46`
- **chevron--left** — Key: `7940e22ca8c7fb72312b009bbc5d622c45dfc58f`
- **chevron--sort** — Key: `5687e6bce59274d7ad7e3f2c17a3c2dabb78288d`
- **chevron--sort--down** — Key: `666ef728fee0b8d31fd69757fdd75b2426abf2c6`
- **chevron--sort--up** — Key: `749e5cda3c174a61f8dad42b2f9466b1f08325c4`
- **chevron--up** — Key: `5b4eaa7ccb12d95aad45cc332dfb5633dd5ce9b4`
- **circle-dash** — Key: `b317fa0913e7862fe3f7dbd2e0d8f5f49758c234`
- **ckan** — Key: `f9c6c20e5ac993e4b8076f57b60fb1e73f1a159b`
- **close** — Key: `09bac5a4cba0cbd89819dbe34afadc5db046f29d`
- **cloud--upload** — Key: `3b7f9b2a31b3cabd34d954ee87fda44ea7e1713f`
- **cognos** — Key: `0b730d656419391189e409335af5a9c6a8019eb3`
- **cognos-bi** — Key: `ee8c45ab057d92ce74a177352d4a9efbd18c6aec`
- **connected** — Key: `1af7f48fd97a924fbefe8516b1f41bc63c25a5dc`
- **cosmosdb** — Key: `0472d1847ae41798e082c2e92e67a89b9b7b3a70`
- **couchbase** — Key: `18d92d20e28ab07a7fabb9c77b7a051a5281c7f2`
- **csv** — Key: `d8466fafc7cf179f5440b19a5579b0771268e766`
- **csv-custom-item** — Key: `b586b682af40afee24332f84fcdf266054c40e9d`
- **cursor-arrow** — Key: `c65a6ebe918fb33c8b6d0c9fa986dad1d62abbd6`
- **cursor-hand** — Key: `90e85e25cda17c3f4967ef87bffa50a3daba7325`
- **dashboard** — Key: `5d18c47639d77f1042c9e0bc2ccde8fcab2156d6`
- **data--structured** — Key: `b5370a64062dc0d1ed1f42a936ef87023738f284`
- **data-access-request** — Key: `9c4bda0c1c0521899b4019980ff9d248850fa215`
- **data-file-question** — Key: `952165dd5316a81b1e8ee351e98c9cc489a3b863`
- **data-model** — Key: `0fcfb9923b572949f296c019646f8ec17d6297b9`
- **data-product-output-port** — Key: `f74e10a2fe4608a484e1c40f1c1bdf2ad96ead1f`
- **database** — Key: `eb4d7d43a2ef5bae16611e36a2da213bd07e27ba`
- **database-check** — Key: `d94160526fbf06fff8a2be78f3449d5711a1f15e`
- **databricks** — Key: `cd02bd7ff749c214daaa1784989449d469923b64`
- **dataiku** — Key: `7cf3d9f654cc100cd73c2f57aa5aebfbf6787ded`
- **dataset** — Key: `080e8e3e95430d11d6aaec7537143d437b0dbd75`
- **dataset** — Key: `63e281850a887cc85989c9fad99761493790915f`
- **db2** — Key: `0b899d3557aad4e25d5153edc1bd7476eddb89ee`
- **db2--database 1** — Key: `54d6a72ebdceefca172f85fa0b25279e58c99636`
- **dbt** — Key: `120f28794fbc5ce6b7a8f0e405a3c8d58ab3cdaf`
- **denodo** — Key: `b2c1c1149efbd4f9da9aa7f0598e494e2a5f94bf`
- **dictionnary** — Key: `391bd61cec5cb74f9db7c92fab0afc483c75db5b`
- **directory** — Key: `64b2045e4c431df3c913363c7ae6d98bc44434d6`
- **directory** — Key: `c97a2b5506aafe95c2e4964752e4522b247e609b`
- **disconnected** — Key: `a5726c79041ba23ea9615c4c8af7a7dedde9eb4f`
- **discussion** — Key: `4544a1b4ee7ecc05c3c18662aabb8b1aa0abebe0`
- **dots** — Key: `d4bf02099fcf80e9f1956149da15460fe1ae13a7`
- **download** — Key: `3a3acebe888e3a87c03831ab720ad5639c358af6`
- **download** — Key: `6e95f8cd495baaa3db3e1f4435182f4717aad5f0`
- **drag** — Key: `f4dd4a86dfd0f91cce381eaa51abaa14a84785d3`
- **edit** — Key: `2f0c909fda47237325e20a1fc1c3d6eea2b05cd6`
- **elasticsearch** — Key: `f891e01a197b6befba71d802e4461f512211dbe1`
- **error-filled** — Key: `53bac27f6b0e802b7f07de2c4a853502c6e93475`
- **erwin-data-modeler** — Key: `aeb340980e131eb2396223b512cf707231dc4186`
- **event--time-type** — Key: `d056a594413fcd44887aca52b86d9df25f0cbd0c`
- **exit** — Key: `e0ea887336f377ba397b25d988a54cf79eec6e4e`
- **exploration** — Key: `8220d30e69ebd1f255417f5871137cff0bcd7f99`
- **export** — Key: `30f1a5a8b08475a4f5a39757da5417cae238f3c1`
- **export** — Key: `d6ab31d568212dca630643adb1d54e302535b70f`
- **favorite** — Key: `5ab08e77426cace71669963cfecc7164391598b3`
- **favorite-filled** — Key: `f356489882aa4ddfc7e099e006510d6fdda704df`
- **filter** — Key: `ce37c828e8be322438e3530c7680d1eee95af253`
- **filter-text** — Key: `eeb978ec0554b3df748891134e68c1c98137b480`
- **float-type** — Key: `6db7c938fc9015d08e43e7b1de61438c6fb3534a`
- **GCP** — Key: `284e1f84d23761db66c0b103e33d39dd6ce705cf`
- **gcpcloudstorage** — Key: `3c8a16f6928da03e6cf20f4d642622738adf0e30`
- **generic-jdbc** — Key: `77e6d3ce1ac243842e028983ebeb9735ad5a5e31`
- **geo-point-type** — Key: `8260b27df19484714fd96a17eef967ad126b8266`
- **glossary** — Key: `e47a036e8d2cce3968395f79cc96fdcc70bcf275`
- **google-cloud** — Key: `d12a8061cfd85561bfea6763765c06144bf6e985`
- **graph-merge** — Key: `b715dbd163131f360146e6044d9f8743045a973b`
- **greenplum** — Key: `7f6e32e201a4930cebf3e0daf022b615c8ff2a74`
- **hbase** — Key: `f8fc1e18fe0008cc9ab4c1d4522d349a8c8a4470`
- **hdfs** — Key: `0a110a850bce8693871a43820aa97c75a4d50dbe`
- **help-bubble** — Key: `e842d2ce342d70cf02719cd42d5243744345c402`
- **help-circle** — Key: `2e8edce02b9198b99fe770fab00b636fb20d2f48`
- **help-laptop** — Key: `54a1684fcc8cba3210f64e17f66d7ef3cbabc737`
- **history** — Key: `aaf85298722d8df888197a9174f219b7848cc013`
- **hive** — Key: `d7bd860c86c5152462817fa348a5a95b31349596`
- **home** — Key: `4a8ee163ef4f785c846a3a71344af13b834e02f0`
- **Icon/query-queue** — Key: `dfc61677c57161b2031bdce8733cb4bf6fcfd6fa`
- **image** — Key: `b3f1a7f5ef3d50822c84ce0f6d745428607d9023`
- **impala** — Key: `509d80540cc3f4f98eaadecd7d3fce23156c0a3b`
- **influxdb** — Key: `6230a2f34af32a060501ea1dd427519c42f1544c`
- **info** — Key: `01923eb6557a8612cf500c74a0ba5b32e37317e3`
- **info-filled** — Key: `a593edf42eb81c2dfa8c4b0be8eac76b14cdffeb`
- **informatica** — Key: `181f865b3a16ad0c0846ec99c3d247c7e00c6541`
- **input** — Key: `e044df9621b9fec28326d9e35e61326bcdc7b324`
- **integer-type** — Key: `8b6d13a33e18de3483b3b330d23abc5e69aefe56`
- **jdbc** — Key: `2eab8c23231f3114d9e6f807aa2c7af59096760b`
- **json** — Key: `5eb160e5222aef02c4a1b58cded4b59ac01461d3`
- **kafka** — Key: `7a1a2ec3308c062ff10e03a345a30006eca88716`
- **layers-front** — Key: `548f9b5398eaff3804a4912550fc4c944881b465`
- **layers-front (Curator indicator)** — Key: `e7e0adbbf7e0f8b9b3fc45c839f381b029859715`
- **lifecycle-policy** — Key: `b1f0c9b1baad043881f1d2401a93aa1c8cce4791`
- **lineage** — Key: `32f4f89b2ced8ccc35f19f9f68b4b7b3a4386119`
- **link-type** — Key: `30958f1f13ddf3866556b37ab570a09de2b2a26c`
- **list-bullets** — Key: `69ddc5d1660da5b9f5ae1eac95b5dda1e1299b37`
- **list-numbers** — Key: `b731322950354840772eadaac3abb71d45aca649`
- **local-filesystem** — Key: `333ebe2a0ef4ef3a276b457ef37c1b015c43630e`
- **looker** — Key: `af489ca915a8382cd9f9681d53397544ba3e031a`
- **mail** — Key: `6db8438579e807864e92cd7f61d5dfe1db9dd841`
- **maintenance** — Key: `71d837e04ce0a29b69d9e5c67362bbcf0b896e19`
- **map** — Key: `c79f5921936c1c9b69477d09ce5c1d7ae7d24863`
- **mapr** — Key: `441ba64eaf7ec1455c161e9a521f4bbbc58883c7`
- **mariadb** — Key: `540d66058ac4d43e6ef391db84fd60e1024a7114`
- **matillion** — Key: `573cc53c470e350189a4d086626ac5793c6930cf`
- **maximize** — Key: `b06f115e9d2e0d3544b1b319cc96e501449e5d5f`
- **menu** — Key: `f55f4bc6e00be7b6c3dabbc2e426c9660964a1d4`
- **microstrategy** — Key: `5c6ddb092e57ebb317f35d12911c102a02e1e6d8`
- **minimize** — Key: `ed365ef9760849fa471fb84b4d7603c1052399bf`
- **misuse--outline** — Key: `c7ecb9c454db552f8ca3630707c86a877e13e32c`
- **mongodb** — Key: `a7e4c3250458b92b70085dd66d67f00a3d469c6d`
- **more** — Key: `bfa5a189503a3916f7196a5acc18ebef6466a009`
- **move** — Key: `62e026e024bd84bf9bcdd4cba5ec039616e6cca8`
- **ms-teams** — Key: `81a01c66cbe81c13afecfa19f590d503a1b1bbf6`
- **mysql** — Key: `922921454de5a5943c3cebc212f93f6ec36ea114`
- **netezza** — Key: `5a04491296f24a38a3364f6650782d09e2658fca`
- **null-sign** — Key: `585087e1ea2d421dcaec6ac1db468c8f502ad6d2`
- **open** — Key: `f0af6e82dbffbc929018959ff7fbb609226fecaf`
- **openapi** — Key: `5ea85665e7f62e75c15adad3e5d664d1cf8cc059`
- **opendatagouv** — Key: `1f9939148afb1d1de4a5b30424c5c3cb65fc43a3`
- **oracle** — Key: `ff67de75ab0fb3d8f723920383ca5e1c0f814a68`
- **orc** — Key: `c7cfce05b00f904438450b13149512599d244ba8`
- **output** — Key: `e16258e8231434bb180aa71804bdb92dfbffce77`
- **palantir** — Key: `1eed846e38780486f829603992558032bb091d72`
- **paragraph-justify** — Key: `7dbcda5b9d1a14cd7205b1a1a5faf3b34f9ab22f`
- **parquet** — Key: `4f9256edece6ebcead263d5c3c0e55354febaefb`
- **pending** — Key: `f312fc0c5b45f54eb9081e0b0878f346801af1a4`
- **pii** — Key: `442a010032d021c1bc2cd198f611f49466623430`
- **pin** — Key: `4433057ddb2e2a901f12781f99e3a64b9db47cac`
- **PostgreSQL** — Key: `cbc2bc0a266fabdfb26be4bc406413846501248d`
- **Powerbi** — Key: `0303355bb9f628d8908b8a6b5ea5ccdae0826310`
- **powerbireportserver** — Key: `4f905bd3d9625c8ef3c115a421ec22035a700283`
- **process** — Key: `edc02bc5216a1b8970bf42c0192dbac253613d8d`
- **process** — Key: `dc941ab8d4a5da501b15ec3ebba7f97cce7c4cc4`
- **process csv** — Key: `115c254d8901c11f5dfc8c8575e0a483cb798d51`
- **qlik-sense** — Key: `651160c6a9ac69ff73c400920218e736e72661a4`
- **relation** — Key: `328e40cf262d88c868275a408b432b445bf34888`
- **relation_incoming** — Key: `acc0d738122fb3dae02b1941b9909a3d15c0e0f1`
- **relation_outgoing** — Key: `af3df33d230376a5bb016435dbb7ddecb9d42448`
- **rocket 1** — Key: `b781fde18c452c199f8b699ed092b26d683f9f45`
- **rotate-back** — Key: `e428e49c8dc1b6772d7b569e58fd6fa8a960b85f`
- **safyr-dynamics365** — Key: `a2a71b29edfd47b1f9eaa1a6e4d529da5586e4b6`
- **safyr-dynamicsax** — Key: `c0b105d3e987838f8ecc44b4b7ea7139a968bb79`
- **safyr-ebs** — Key: `4f5e070ee223b4d48d5258f4464312cbf5770530`
- **safyr-jdedwards** — Key: `fb1a310b1c960225e7ff6e8a1681a580f4545bc2`
- **safyr-peoplesoft** — Key: `95920b8206501203714ab6df215cfe9ab33a7a96`
- **safyr-salesforce** — Key: `9d0eae6d7c1c69297306087bc20bea26ad048f66`
- **safyr-sap-bw** — Key: `bfb97def8d0dc7548016b3fe326c75ecdd60c09f`
- **safyr-siebel** — Key: `c653020fdba9ed36178f4b8f95f7cc6f9eb79b4c`
- **sas-database** — Key: `53658ce507819f58078a5ecf3bfb9cfba14cc599`
- **scanner** — Key: `92eba2ab6095c5b95bf4b86d1c056f5e1e39e232`
- **schema** — Key: `f8fffb1cbe411321f66142c020a208b000d15e9d`
- **search** — Key: `5a9dd2549738ac2307fe9fa8ec19be655a06f5d8`
- **security-services** — Key: `99137e55f852dc4f26cf9aa63f1bb560d4f28a2f`
- **server-search** — Key: `4b21aa187b1559d7c4ad33b31e477f7fcfc9975a`
- **settings** — Key: `fa49ba4ce11934ea568dc702f402f52207703e97`
- **shield-lock** — Key: `20d03d16f42b9cb4d84c5ea07f6845c99b8fe7b6`
- **simple-check** — Key: `a660b57404739aba1621b29bbe22ba70f81f4346`
- **Snowflake** — Key: `046781836dd3d72a9f1185981ebb28e0eab09bd9`
- **Snowflake** — Key: `14abdd5e317e35b558549d54270c9f7024dc64ed`
- **soda** — Key: `8b70ba34455ff58757feaa057cb3285e95a2914f`
- **sparkdb** — Key: `2b72bcb632f5072df86561f5d01e65ecf65da80b`
- **spline** — Key: `3dbdcd386e7f39274d56e389f76170660477ac42`
- **splunk** — Key: `cf043dbcd552d71a4a6a3f0aa7a247038c53926a`
- **sqlserver** — Key: `3fb27f1d5613379dcf8ed3d8d28e233cf83b4ed0`
- **stars** — Key: `bdea9d42922a4619f8a317ef616d30055eb789ee`
- **stop--outline** — Key: `aca6ed16c1e6d21fe112ab5619570e5a11f1d5e0`
- **success-filled** — Key: `d864426ee65112314a7925eaa9b5bd883a677100`
- **suggestion** — Key: `b0fdb7c7eb45f51182647cc89b12a5fd6989cafb`
- **sybaseiq** — Key: `1a1c77af7989eeaf683601efd8f4a6110524bff2`
- **Tableau** — Key: `a45329ba671776415a9627ec9eb838052799ede6`
- **tags-add** — Key: `3736725d4f34af19d9cadeacbac382af2aa4685e`
- **talend** — Key: `73fddb359e840a1309191c6fee240bf4749cba0c`
- **target-type** — Key: `131e2264fa0b24b4715953951f3a50677c6c299a`
- **task-list** — Key: `371f35da773bc12bc441d4c36acd98ba8ac23e6e`
- **task-list-multiple** — Key: `fb486ea7bd5611848f79a84fd04ede0cc78869a9`
- **task-list-settings** — Key: `6d75371c1dd77bd21889e1519f9281dd134dca23`
- **teradata** — Key: `5a448c2ada63a64ef111d4d2e6a833dc3e7940b8`
- **text-file** — Key: `8f09539f181a4dbe90a86d6ccfe73ac4d41dd8c8`
- **text-type** — Key: `2cd429a5df61f046748fc20c9e22aea14db8f9c0`
- **thoughtspot** — Key: `9ed31a542256e1d255e30e00bae6c625d8688b00`
- **thumbs-down** — Key: `93686ddb00e20fd0a150c2a9f56986d47abf5db0`
- **thumbs-up** — Key: `5ab3cbd59dee68fabb404966d3be7aa87ed761a5`
- **tibco-datavirtualization** — Key: `c6b80e098e699b0ff94f5722b20ce61170ae7c75`
- **tools** — Key: `2a497ba6f8e5040d5654e86cdc32b90f51eb6849`
- **trash** — Key: `09df4020b9f8d306843fca4159658c8ed4b5e323`
- **undo** — Key: `c4b92f77c463b26299c2eaf52aff41973aaf4b21`
- **unknown-type** — Key: `b120c4277b392ad79c9b1bfc21015fc8d55453e5`
- **upload-file** — Key: `ef39179dc6dda4a55166931b2f11f8b60460d58d`
- **use-with-care** — Key: `946ad814c46b04b4a689b3d09f82bb572af76f36`
- **user-add** — Key: `48c0ce663827e3dddb050be67302b9af9ceb74c0`
- **user-group** — Key: `db200734daac36815be3bf52f078c9e528b15da4`
- **user-info** — Key: `3b2848d77b98a22dfa31033342ae67f84dee3c0b`
- **user-lock** — Key: `1c3ea13966867002325327b01b9c5942ebe8d856`
- **user-single** — Key: `719b2cace9669955bbf05111ee8151ac6b50d3f5`
- **view** — Key: `4e86d04da3c537ed576f6ac221e8a1353b2b4475`
- **view-card** — Key: `d1361c8bdc2347790fcedb0399598585fa4d7054`
- **view-details** — Key: `cf1033712c94e4f740ae4c8de3f907004dc9380f`
- **view-table** — Key: `bfc87e123e2bab1aec590bdfa5799649b37f756a`
- **warning--alt** — Key: `675e323d57c331b8b9936f39687cf68450fd105b`
- **warning-filled** — Key: `1ca9ea45ed67eb11a5f1b4ff9027aaa9b8526073`
- **xml** — Key: `9c83547b7ddb33399a84faf6bea7da6fc8411f7a`
- **zoom-in** — Key: `8743ba1b2c9fa86034a0e389b283e9da6e56d6fd`
- **zoom-out** — Key: `fe8ce8b1dc8f249bb19bbfb2304e20431984452f`
- **zoom-reset** — Key: `61225ecdbe8c2577297b8f190c86ccc3dc874641`
- **zoom-to-fit** — Key: `daac1ce452877e634fcd4d81a9880be63946816a`

### Illustrations & graphics

- **Type=Empty state large** — Key: `1c02b5a758626e97869f45d3bd20a66b4769c842`
- **Type=Empty state medium** — Key: `5a911616c47d6a3b903e03c3d4d1934e346fb1c3`
- **Type=Empty state small** — Key: `c338a9650f989b7a4c21c64164f61a6b37fbfed0`
- **Type=Error state** — Key: `a372f58489ca865d303844c28076d8080606db8b`
- **Type=Error state medium** — Key: `279a6e43ce89d8b2269738826613102f3ac82222`
- **Type=Maintenance** — Key: `f40e291df3b543c36809824dc3ab6418c73694b6`
- **Type=Success** — Key: `7ba93a7fcc2416ede1e3b82e10d44fc5f84118ef`

### Local components

- **Notes/Feedback** — Key: `4f1fba9d4ba4dd56ef8f60b7190456bf824a2089`

### Product logos

- **Color=Full colo, Layout=Horizontal** — Key: `b9a298a2d28fef68a9185ad0ac2ed59e29d3cf38`
- **Color=Full colo, Layout=Vertical** — Key: `b0e55dbfa4fda7c157fb7b31d434d4533fc0f60a`
- **Color=Full color** — Key: `467066e6859ea7a0cd04869b5ea79baf3aa3a3e7`
- **Color=White** — Key: `e9589e62354a3439e664d0444ce042504435f2c0`
- **Color=White, Layout=Horizontal** — Key: `55a414d4f26e16b98636552674e42cab4a31445b`
- **Color=White, Layout=Vertical** — Key: `adde3f9b34b9d2205a08343184beda88aa76fffe`
- **Layout=Horizontal** — Key: `68ad9c46a67670cd833e6d1632897353e57f2936`
- **Layout=Vertical** — Key: `42817ecf5a3942b4c9343679da53e26dda504c19`
- **Property 1=Dev Actian Data Intelligence Admin** — Key: `dac4369fd1c6452e053d19d7015ec7953b152570`
- **Property 1=Dev Actian Data Intelligence Explorer** — Key: `9addf22823dceaf98854552a6b7e56983018f16a`
- **Property 1=Dev Actian Data Intelligence Studio** — Key: `36054686bae470b9b661b076d8e5b07bd4c6fdd5`
- **Type=Admin, Orientation=Horizontal** — Key: `ffa6cadede5454d7c4f991feb37b2596c3be45c3`
- **Type=Admin, Orientation=Vertical** — Key: `b827f94743c2b09da08fba7a0bb5fd40329e76d8`
- **Type=Data Intelligence, Orientation=Horizontal** — Key: `2388a2c02dad4838cc080474610d0d53e94bbaff`
- **Type=Data Intelligence, Orientation=Vertical** — Key: `475d15e336284e7173d169f698a03d2aa812f4db`
- **Type=Dev Logo Explorer** — Key: `9cb2a6ba995220c7e9b24241a8d639cf000e432e`
- **Type=Dev Logo Studio** — Key: `416da871d9b9abd126cbbbca99da0f37faa8524f`
- **Type=Dev Logo Zenea Corporate** — Key: `3885f43c71c84dcb801eab5825925eec1f64d3dd`
- **Type=Explorer, Orientation=Horizontal** — Key: `ceb490a88717c446eaabd90b86208d562daa9092`
- **Type=Explorer, Orientation=Vertical** — Key: `873cee9bb08aac01c60ddc5e460abd5623a98478`
- **Type=Favicon Explorer** — Key: `ea97698031cd8ed74b49b9e30428e6ba14a23f62`
- **Type=Favicon Studio** — Key: `1ce627bf9d44c3450911c7ed027136e7801e2a58`
- **Type=Favicon Zeenea 1** — Key: `fe81004a12422362612afd9a59d93f84920d91e7`
- **Type=Logo Explorer** — Key: `e25befd977af12e0c8577662d9dc9606cb1cab04`
- **Type=Logo Studio** — Key: `59c92910875b277fa2ac3e3a1a3d58528939aaad`
- **Type=Logo Zenea Corporate** — Key: `e2802a2f6710bd070a281d39af1793ee7a6a5f6d`
- **Type=Studio, Orientation=Horizontal** — Key: `fe06dbc6718b1a2272f3783fb86b85e283915f31`
- **Type=Studio, Orientation=Vertical** — Key: `24d4f3caccc646a9efed4c7e054d62ef1eb30896`
