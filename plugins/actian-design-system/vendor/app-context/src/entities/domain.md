---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: domain
label: Domain
properties:
  - name
  - description
relationships:
  containsCatalogObjects: catalog-object
apps:
  - studio
  - explorer
---
Organizational/business unit owning a set of data assets
