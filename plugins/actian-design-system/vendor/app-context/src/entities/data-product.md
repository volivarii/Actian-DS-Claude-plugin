---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: data-product
label: Data Product
properties:
  - name
  - description
  - { name: sharing, type: enum, states: [Shared, Not shared] }
  - { name: lifecycle stage, type: enum, states: [Not staged, Draft, In Review, Approved], example: "configurable per tenant; these are the stages seen in Studio" }
  - { name: input ports, type: reference, example: "links to Input Port entities" }
  - { name: output ports, type: reference, example: "links to Output Port entities" }
  - { name: datasets, type: reference, example: "1–N linked Datasets" }
  - contacts
  - attachments
  - { name: apiVersion, type: string, example: "ODPS descriptor version" }
  - { name: kind, type: string, example: "DataProduct" }
relationships:
  contains:
    - input-port
    - output-port
    - dataset
apps:
  - studio
  - explorer
patterns:
  - asset-detail-360
  - faceted-browse
  - marketplace-browsing
---
Curated, business-ready asset. Contains Input Ports and Output Ports. Shared to the marketplace (Share / Unshare; there is no Publish) and described by an ODPS YAML descriptor; its lifecycle stage is separate from sharing and configurable per tenant; access requests target the output-port level (each governed by a data-contract).
