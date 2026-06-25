---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: connection
label: Connection
properties:
  - name
  - type
  - status
  - provider
relationships:
  discoversCatalogObjects: catalog-object
apps:
  - administration
---
Configuration for a data source connector (93+ pre-built)
