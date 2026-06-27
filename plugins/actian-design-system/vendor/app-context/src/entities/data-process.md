---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: data-process
label: Data Process
properties:
  - name
  - description
  - { name: job status, type: enum, states: [Created, Processing, Processed] }
relationships:
  hasInputs: dataset
  hasOutputs: dataset
  produces: lineage
apps:
  - studio
  - explorer
---
A transformation/pipeline catalog item. Its input/output connections to datasets (and custom items) generate the horizontal data lineage graph; supports field-level lineage.
