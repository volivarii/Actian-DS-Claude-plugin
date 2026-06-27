---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: data-product
label: Data Product
properties:
  - name
  - description
  - { name: status, type: enum, states: [Draft, Published, Deprecated] }
  - { name: input ports, type: reference, example: "links to Input Port entities" }
  - { name: output ports, type: reference, example: "links to Output Port entities" }
  - { name: datasets, type: reference, example: "1–N linked Datasets" }
  - contacts
  - attachments
  - { name: apiVersion, type: string, example: "ODPS descriptor version" }
  - { name: kind, type: string, example: "DataProduct" }
relationships:
  hasInputPorts: input-port
  hasOutputPorts: output-port
  hasDatasets: dataset
apps:
  - studio
  - explorer
---
Curated, business-ready asset. Contains Input Ports and Output Ports. Published to the marketplace via an ODPS YAML descriptor; access requests target the output-port level (each governed by a data-contract).
