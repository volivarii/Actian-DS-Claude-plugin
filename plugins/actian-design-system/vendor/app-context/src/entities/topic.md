---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: topic
label: Topic
properties:
  - name
  - description
  - { name: color, type: string, example: "display color for the topic card" }
relationships:
  groups: catalog-object
apps:
  - studio
  - explorer
---
A curated collection of catalog items for business-user navigation in Explorer (carousel + browse). Created and curated by stewards in Studio. Replaces the deprecated "Category" concept.
