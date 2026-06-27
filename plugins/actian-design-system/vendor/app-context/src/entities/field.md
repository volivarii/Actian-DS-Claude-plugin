---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: field
label: Field
properties:
  - name
  - { name: type, type: enum, example: "string, integer, decimal, date, boolean" }
  - { name: nullable, type: enum, states: [Nullable, Not null] }
  - { name: key, type: enum, states: [Primary key, Foreign key, Business key, None] }
  - description
relationships:
  belongsTo: dataset
apps:
  - studio
  - explorer
---
A column within a dataset's schema. Auto-created on import; participates in field-level lineage. Business keys (BK) are editable by Data Stewards.
