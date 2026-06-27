---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: responsibility
label: Responsibility
properties:
  - name
  - { name: role, type: enum, example: "Data Owner, Data Steward, Reader (tenant-configurable)" }
relationships:
  assignedTo: contact
apps:
  - studio
---
A named contact role-type (Data Owner, Data Steward, Reader…), defined in Studio Catalog Design and assignable to any catalog item. Tenant-configurable.
