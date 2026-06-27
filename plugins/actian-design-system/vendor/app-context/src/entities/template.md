---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: template
label: Template
properties:
  - name
  - { name: item type, type: enum, example: "Dataset, Visualization, Data Process, Custom Item, Glossary Item" }
  - sections
relationships:
  contains: property
apps:
  - studio
---
The documentation structure (ordered sections + properties) applied to an item type. Authored in Studio Catalog Design.
