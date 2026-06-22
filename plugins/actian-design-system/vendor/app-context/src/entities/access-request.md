---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: access-request
label: Access Request
properties:
  - requester
  - item
  - use case
  - reason
  - status
  - created at
relationships:
  targetsOutputPort: output-port
apps:
  - studio
  - explorer
---
Consumer request for data product/item access with policy-driven approval workflow
