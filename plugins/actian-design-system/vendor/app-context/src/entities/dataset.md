---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: dataset
label: Dataset
properties:
  - name
  - description
  - { name: orphan, type: enum, states: [Present, Orphan] }
  - { name: import date, type: date, example: "when the dataset was imported by a scan" }
  - { name: deletion date, type: date, example: "set when removed from the source connection" }
  - { name: documentation completion, type: number, example: "percentage (0–100)" }
relationships:
  hasFields: field
  discoveredVia: connection
  exposedVia: output-port
apps:
  - studio
  - explorer
---
A dataset asset contained by a data product; a type of catalog object. Has a schema of Fields; becomes an orphan when removed from its source connection.
