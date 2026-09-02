---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: catalog-object
label: Catalog Object
properties:
  - name
  - description
  - { name: type, type: enum, example: "Dataset, Visualization, Data Process, Custom Item, Glossary Item, Data Product" }
  - { name: documentation completion, type: number, example: "percentage (0–100) from 4 criteria: description, contact, glossary link, properties filled" }
  - owner
  - contacts
  - last modified
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
---
Any indexed item. Types: Dataset, Field, Visualization, Data Process, Data Product, Glossary Item, Custom Item
