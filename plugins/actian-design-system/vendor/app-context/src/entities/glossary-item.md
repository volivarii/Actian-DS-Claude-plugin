---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: glossary-item
label: Glossary Item
properties:
  - name
  - definition
  - linked assets
relationships:
  linkedTo: catalog-object
  parentItem: glossary-item
apps:
  - studio
  - explorer
---
A glossary item — business term, KPI, report, or domain — in the business glossary, linked to technical assets. Glossary item types are tenant-defined, with parent-child hierarchies (e.g. Business Object → Business Attribute); domain is a built-in sub-type.
