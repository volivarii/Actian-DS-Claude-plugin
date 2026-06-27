---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: property
label: Property
properties:
  - name
  - { name: type, type: enum, states: [Short text, Rich text, Number, URL, Select, Multi-select, Date, Tag] }
  - { name: importance, type: enum, states: [Standard, Important, Required] }
relationships:
  partOf: template
apps:
  - studio
---
A typed metadata field definition in the catalog metamodel (8 value types). Importance (Standard/Important/Required) feeds the documentation-completion score. Configured in Studio Catalog Design.
