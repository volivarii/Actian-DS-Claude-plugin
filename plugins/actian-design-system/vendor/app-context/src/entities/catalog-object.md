---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: catalog-object
label: Item
properties:
  - name
  - description
  - { name: item type, type: enum, states: [Dataset, Field, Visualization, Data Process, Data Product, Glossary Item, Custom Item] }
  - { name: completion level, type: number, example: "percentage (0–100) from 4 criteria: description, contact, glossary link, properties filled" }
  - curator
  - contacts
  - { name: last updated, type: date, example: "Last updated: Jan 31, 2025" }
relationships:
  belongsTo:
    - domain
  uses:
    - connection
  contains:
    - metadata
    - lineage
    - discussion-thread
    - suggestion
    - observability-signal
  relatesTo:
    - glossary-item
    - governance-policy
apps:
  - studio
  - explorer
patterns:
  - faceted-browse
  - asset-detail-360
  - activity-timeline
  - bulk-edit
  - right-sliding-drawer
---
Any indexed item in a catalog. Its item type is one of Dataset, Field, Visualization, Data Process, Data Product, Glossary Item or Custom Item; a tenant defines its own custom item types (Studio's Catalog lists Application, Audit, Use Cases and others beside the built-in ones).
