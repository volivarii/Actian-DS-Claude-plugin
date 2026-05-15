---
title: "Lineage-specific UI"
nav_order: 18
---
# Lineage-specific UI

Lineage views display the origin, transformation history, and downstream dependencies of data assets. The UI uses graph-based visualizations with nodes and edges. Copy in this context must be precise and unambiguous to support data governance workflows.

---

## When to use

- On dataset and column detail pages where traceability is relevant.
- In audit and governance workflows where users need to trace data origin or impact.

## Node labels

- Use the exact asset name as the node label - do not paraphrase or abbreviate.
- Include the asset type as a secondary label below the name. For example, `Orders` with `Table` below it.
- Use sentence case for all labels.

## Edge and relationship labels

- Describe the relationship with a short verb phrase. For example, `Reads from`, `Writes to`, `Transforms`.
- Avoid technical jargon that non-engineer users will not understand.

## Terminology

| Term | Definition |
|---|---|
| Upstream | Assets that provide data to the selected asset |
| Downstream | Assets that consume data from the selected asset |
| Source | The originating system or dataset |
| Transformation | A processing step that modifies or aggregates data |
| Impact | The downstream effect of a change to this asset |
