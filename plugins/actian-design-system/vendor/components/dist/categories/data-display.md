---
# yaml-language-server: $schema=../../../schemas/category-defaults.json
_schema_version: 1
slug: data-display
label: Data Display
authoring_status: engineer-seed
confidence:
  anatomy: low
  variants: medium
  motion: medium
  a11y: high
last_reviewed: 2026-05-12

anatomy:
  - { name: Container, description: the bounding surface — frames the data presentation }
  - { name: Title or heading (optional), description: identifies what the data represents }
  - { name: Primary content, description: the data itself — text, value, chart, table cells, badge label }
  - { name: Supporting metadata (optional), description: timestamps, units, counts, attribution }
  - { name: Visual indicator (optional), description: color dot, icon, badge, or status pill }
  - { name: Action affordance (optional), description: expand, drill-in, dismiss, or copy }

variants:
  - { axis: Density, values: [compact, comfortable, spacious] }
  - { axis: Status, values: [neutral, info, success, warning, error] }
  - { axis: State, values: [default, hover, selected, loading, empty] }

motion_refs:
  - { ref: skeleton-loading, note: rows/cards reveal with skeleton placeholders during load }
  - { ref: staggered-entrance, note: lists, tables, search-result-cards enter with staggered fades }
  - { ref: accordion-expand-collapse, note: collapsible cards/sections expand at the accordion pace }

accessibility:
  - { ref: color-contrast, note: status colors must have a non-color cue (icon, label, pattern) }
  - { ref: typography }
  - { ref: data-tables, note: tables and graphs must reflow or scroll horizontally; never clip }
  - { ref: aria-labels, note: tables use thead/tbody/scope; charts expose data tables for screen readers }
  - { ref: focus-keyboard }
---

# Data Display — design rationale

Components in this category present information rather than collect it. Members (31): `avatar`, `badge`, `bar-graph`, `card`, `collapse-accordion`, `digram-item-types`, `digram-topic`, `glossary-item-hierarchy-diagram`, `identification-key`, `line-graph`, `lineage-connecting-line`, `lineage-grouped-node`, `lineage-individual-node`, `metamodel-widget`, `page-header`, `perimeter-card`, `progress-bar-small`, `scroll-bar`, `search-result-card`, `segmented-control`, `table`, `tag-catalog`, `tag-catalog-item-type`, `tag-default`, and additional lineage/diagram primitives.

## Reference patterns

- **Polaris** — DataTable, ResourceList, Card, Badge, Avatar
- **Material** — Cards, Data Tables, Chips, Badges, Progress Indicators
- **Carbon** — DataTable, Tile, Tag, Progress Bar, ProgressIndicator

## Why these defaults

This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

## Notes for refining authors

- `table` likely needs its own component-level extension: `Header row`, `Column header`, `Cell`, `Selection control`, `Sort indicator`, `Pagination`.
- Graph components (`bar-graph`, `line-graph`) need `Axis`, `Legend`, `Data point`, `Tooltip` extensions.
- Lineage + diagram primitives (`lineage-*`, `digram-*`) may not all belong in this category long-term — they're closer to canvas/graph primitives. Flag during team review.
- `progress-bar-small` and `scroll-bar` are arguably feedback/system primitives — re-evaluate placement.
