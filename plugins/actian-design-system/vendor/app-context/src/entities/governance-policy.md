---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: governance-policy
label: Governance Policy
properties:
  - name
  - type
  - rules
relationships:
  appliesTo: catalog-object
  assignedTo: user-group
apps:
  - studio
  - administration
---
Access rules, quality rules, compliance constraints
