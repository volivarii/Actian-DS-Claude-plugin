---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: faceted-browse
label: Faceted browse
apps:
  - studio
  - explorer
tags:
  - browse
  - search
  - facets
  - filter
  - results
  - collection
when: >-
  Use when the user narrows a large collection by several independent facets at
  once, each carrying its own count against a live total. Do not use
  search-filtered-table, which is explicitly the single-search-no-facets case,
  and do not use table-with-tabs, where pre-filtering is by one categorical axis
  rather than several.
components:
  - checkbox
  - toggle
  - dropdown-select-default
  - progress-bar-small
  - tag-default
  - button
  - search
  - table
---
Three pane browse over a large item set: app sidebar, a filter rail, and a result list. The rail holds several independent facet groups (a range facet, a counted checkbox list of item types, a boolean toggle, and type-to-search selects), each collapsible. Results are composed cards rather than table rows: each carries type and sharing tags, a title, source metadata, a summary, domain values, a pending-suggestion chip, and a right-hand meta column with a completion meter and a last-updated date. A bulk action bar sits above the list with select-all, batch actions and a sort control.

The defining trait is scale. A live total is shown against the current filter state, and each facet value carries its own count, so narrowing is visible before it is committed. Studio Catalog is the canonical instance.

Distinct from `search-filtered-table`, which is the single-search-input case with no facet rail, and from `table-with-tabs`, where pre-filtering is by one categorical axis rather than several independent ones. Choose this pattern whenever more than one facet narrows the same collection.
