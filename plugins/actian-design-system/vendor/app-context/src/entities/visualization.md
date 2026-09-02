---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: visualization
label: Visualization
properties:
  - name
  - { name: source tool, type: enum, example: "Power BI, Tableau, Looker, Qlik" }
  - description
  - contacts
relationships:
  derivedFrom:
    - dataset
  uses:
    - connection
apps:
  - studio
  - explorer
---
A BI report or dashboard catalog item (Power BI, Tableau, Looker, Qlik…), auto-discovered by a connector and surfaced in lineage. Distinct from a dataset.
