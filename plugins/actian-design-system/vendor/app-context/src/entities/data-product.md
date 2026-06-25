---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: data-product
label: Data Product
properties:
  - name
  - description
  - status
  - input ports
  - output ports
  - datasets
  - contacts
  - attachments
relationships:
  hasInputPorts: input-port
  hasOutputPorts: output-port
  hasDatasets: dataset
apps:
  - studio
  - explorer
---
Curated, business-ready asset. Contains Input Ports and Output Ports. Published to marketplace.
