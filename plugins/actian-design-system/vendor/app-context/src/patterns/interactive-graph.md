---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: interactive-graph
label: Interactive graph visualization
apps:
  - studio
  - explorer
tags:
  - graph
  - canvas
  - nodes
  - explore
  - visualization
when: >-
  Use for a graph the user pans, zooms and expands node by node, on a canvas with its own
  floating tool rail. Do not use lineage-graph, which is the directional data-flow case with
  its own node card; this one is radial and relationship-shaped.
components:
  - lineage-individual-node
  - lineage-grouped-node
  - lineage-connecting-line
---
Used for lineage (DAG), View 360 (radial knowledge graph), and Data Model (ER diagram). Nodes are clickable.
