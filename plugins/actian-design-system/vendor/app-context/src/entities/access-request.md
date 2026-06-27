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
  - { name: status, type: enum, states: [Pending, Accepted, Rejected, Granted, Error, Closed] }
  - created at
relationships:
  targetsOutputPort: output-port
  requiresJustification: use-case
apps:
  - studio
  - explorer
---
Consumer request for data-product/item access, submitted in Explorer with a required use-case justification. Accepted ≠ Granted (provisioned); processing happens in external systems (ServiceNow/Jira/owner) and status is tracked in Explorer.
