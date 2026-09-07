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
  appliesTo:
    - catalog-object
    - user-group
apps:
  - studio
  - administration
patterns:
  - search-filtered-table
---
Access rules, quality rules, compliance constraints
