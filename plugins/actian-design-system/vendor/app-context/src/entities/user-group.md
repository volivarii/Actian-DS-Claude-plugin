---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: user-group
label: User / Group
properties:
  - name
  - email
  - role
  - groups
  - permissions
relationships:
  relatesTo:
    - governance-policy
apps:
  - administration
patterns:
  - search-filtered-table
  - table-with-tabs
---
Identity and role assignments. Groups: Explorer, Data Steward, Super Admin
