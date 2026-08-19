---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: asset-detail-360
label: 360-degree asset detail view
apps:
  - studio
  - explorer
tags:
  - detail
  - single-object
  - tabs
  - properties
  - stewardship
when: >-
  Use for one catalog object with more peer facets than a screen can hold. Do not use
  faceted-browse, which composes a collection. Do not use search-filtered-table for the
  whole page: that shape is real here but it is the content of one tab, not the page.
components:
  - tabs
  - page-header
  - breadcrumb
  - side-nav
  - drawer-side-panel
  - avatar
  - progress-bar-small
  - tag-default
  - tag-interactive
  - button
  - checkbox
  - empty-state
  - segmented-control
  - dropdown-select-default
  - text-area
  - input-date
---
The page every catalog object opens into. A full-width identity header carries the type and sharing tags, the object name, a status control and an Actions menu, over three metadata lines: technical name, a catalog/category/connection path whose parts are links, and a last-updated date. Below it a tab bar spans the object's facets (General, Fields, Sample Data, Data Quality, Lineage, View 360, Data Model, Activity, Discussions), some carrying a count, any of which is disabled when the source supplies nothing for it. Opposite the tabs sit two avatar stacks, curators and contacts, which summarise the People panel further down.

The body is two columns that scroll independently of each other and of the header. The left column holds the authored narrative: an access-request policy select, a glossary multi-select of removable chips, a description block with a rich-text switch and a use-source checkbox, and a relations section that is empty more often than not. The right column holds a completion meter over a second tab set (Properties, People, Suggestions), and that panel is the densest form in the product: label-and-control pairs mixing selects, multi-selects, plain values, date inputs with a format caption, and unset properties that read "No data has been registered.", closing with a read-only source-properties definition list. People is two role sections with an add action and a grid of avatar, name and remove. Suggestions is a four-way segmented control over cards that each carry an author, a relative time, a status, a comment box and an accept/reject pair.

The defining trait is two independent tab levels over one object, with columns that scroll separately while the header and tab bar stay put. That is what separates it from every list shape here.

Distinct from `faceted-browse`, which composes a collection rather than one object, and from `search-filtered-table`, which is real on this page but is the content of a single tab (Fields) rather than the page itself. Choose this pattern whenever one object has more peer facets than a screen can hold.
