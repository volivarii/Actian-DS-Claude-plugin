---
# yaml-language-server: $schema=../../../schemas/app-context-app.json
_schema_version: 1
slug: studio
label: Studio
header:
  type: Studio
sidebar:
  - label: Dashboard
    id: dashboard
  - label: Catalog
    id: catalog
  - label: Topics
    id: topics
  - label: Import
    id: import
  - label: Access requests
    id: access-requests
  - label: Catalog design
    id: catalog-design
  - label: Analytics
    id: analytics
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

## Users

- Data steward
- Data engineer
- Data architect
- Domain expert

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
