---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: lineage-graph
label: Lineage Graph
apps:
  - studio
  - explorer
tags:
  - graph
  - canvas
  - lineage
  - dataflow
  - nodes
when: >-
  Use for directional data flow: node cards on a canvas, each naming its source and its
  field count, read left to right. Do not use interactive-graph, whose nodes are
  relationship satellites around one focus rather than a flow.
components:
  - lineage
  - lineage-grouped-node
  - lineage-connecting-line
---
Directional data-flow graph with field-level path highlighting and an incomplete-process filter; rendered from data-process input/output edges.
