---
# yaml-language-server: $schema=../../../schemas/app-context-app.json
_schema_version: 1
slug: studio
label: Studio
header:
  type: Studio
  context:
    label: Catalog
    value: Default
  search:
    scope: Default
    placeholder: Search your items...
  actions: [whats-new, notifications, app-switcher, avatar]
sidebar:
  - label: Dashboard
    id: dashboard
    icon: dashboard
    group: main
  - label: Catalog
    id: catalog
    icon: catalog
    group: main
  - label: Topics
    id: topics
    icon: book-bookmark
    group: main
  - label: Import
    id: import
    icon: download
    group: create
    children:
      - label: Select a data source
        id: import-data-source
      - label: Select a file
        id: import-file
  - label: New Item
    id: new-item
    icon: add
    group: create
    kind: action
  - label: Access requests
    id: access-requests
    icon: data-access-request
    group: admin
    position: bottom
  - label: Catalog design
    id: catalog-design
    icon: catalog-design
    group: admin
    position: bottom
  - label: Analytics
    id: analytics
    icon: analytics
    group: admin
    position: bottom
useCases:
  - audience: [Data steward, Data architect]
    jobs:
      - Govern and curate the catalog
      - Manage lineage and the business glossary
      - Enrich metadata and design catalog structure
    patterns: [asset-detail-360, search-filtered-table, table-with-tabs]
  - audience: [Data steward, Data engineer]
    jobs:
      - Import and connect data sources
      - Review and resolve access requests
      - Track stewardship activity
    patterns: [import-wizard, access-request-management, activity-timeline]
---

## Purpose

Data governance, catalog management, stewardship, lineage, glossary admin, metadata enrichment

## Signals

- steward
- govern
- curate
- lineage
- glossary admin
- metadata
- enrich
- template
- ontology
- knowledge graph
- catalog management
- import
- topics
- watchlist
- analytics
- catalog design
