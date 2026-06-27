---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: data-contract
label: Data Contract
properties:
  - name
  - quality thresholds
  - access rules
  - validation rules
  - { name: apiVersion, type: string, example: "ODCS descriptor version" }
  - { name: schema, type: reference, example: "fields with logicalType/physicalType/primaryKey" }
relationships:
  attachedTo: output-port
apps:
  - studio
---
Formal agreement on an Output Port (ODCS YAML descriptor) defining schema, quality thresholds, access permissions, and validation rules.
