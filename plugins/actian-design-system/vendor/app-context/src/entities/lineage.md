---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: lineage
label: Lineage
properties:
  - source
  - target
  - transformation
relationships: {}
apps:
  - studio
  - explorer
patterns:
  - lineage-graph
---
Field-level transformation tracking from source to downstream
