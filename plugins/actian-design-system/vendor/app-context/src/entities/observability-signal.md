---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: observability-signal
label: Observability Signal
properties:
  - quality score
  - freshness
  - usage count
relationships:
  belongsTo:
    - catalog-object
apps:
  - studio
  - explorer
patterns:
  - analytics-dashboard
---
Quality score, freshness, usage stats attached to assets
