---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: scanner
label: Scanner
properties:
  - name
  - status
  - connections
relationships:
  uses:
    - connection
apps:
  - administration
---
External data ingestion agent that discovers and imports metadata from connections
