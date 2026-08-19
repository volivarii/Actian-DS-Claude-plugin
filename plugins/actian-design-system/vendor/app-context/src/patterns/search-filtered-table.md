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
  Use for a collection narrowed by ONE inline search input and nothing else,
  most often as the content of a detail tab rather than as a whole page. Do not
  use it for a page with a filter rail: that is faceted-browse. If tabs
  partition the collection, that is table-with-tabs.
components:
  - search
  - table
---
List table with an inline Search input directly above it (no separate filter sidebar). Common for member directories, group lists, scanner inventories, connection lists. Pairs Page header → Search → Table. Search filters table contents in place; no other facets.
