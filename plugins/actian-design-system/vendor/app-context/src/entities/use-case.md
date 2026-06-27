---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: use-case
label: Use Case
properties:
  - name
  - description
relationships:
  justifies: access-request
  relatesTo: data-product
apps:
  - studio
  - explorer
---
A built-in catalog item describing an analytical use case. Required as justification when a consumer submits an access request in Explorer.
