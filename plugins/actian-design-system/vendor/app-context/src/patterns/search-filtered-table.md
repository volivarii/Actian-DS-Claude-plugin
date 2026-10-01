---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: search-filtered-table
label: Search-filtered list table
apps:
  - administration
  - studio
  - explorer
tags:
  - search
  - table
  - list
  - collection
  - single-search
when: >-
  Use for a collection narrowed by an inline search input, with at most a
  Filter menu beside it, most often as the content of a detail tab or an
  administration page. Do not use it for a page with a filter rail: that is
  faceted-browse. If tabs partition the collection, the page is also
  table-with-tabs.
components:
  - search
  - table
---
List table with an inline Search input directly above it and no separate filter sidebar. Common for member directories, group lists, scanner inventories, connection lists. Search filters table contents in place; a Filter button beside it may open a menu of further filters, but there is no rail of facets.
