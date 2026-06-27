---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: contact
label: Contact
properties:
  - name
  - { name: email, type: string, example: "person email" }
relationships:
  hasResponsibility: responsibility
apps:
  - studio
  - explorer
  - administration
---
A person assigned a responsibility on a catalog item (e.g. Owner, Steward). Distinct from a user-group; surfaces on the item detail "People" section.
