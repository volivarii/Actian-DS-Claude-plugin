---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: smart-suggestions
label: Smart suggestions
apps:
  - studio
  - explorer
tags:
  - suggestions
  - ai
  - review
  - curate
  - single-object
when: >-
  Use for machine-proposed metadata awaiting a human decision on one object: a status
  segmented control over cards that each carry an author, a comment box and an accept/reject
  pair. Do not use suggestion-workflow, which is the cross-catalog process rather than this
  panel.
components:
  - tabs
  - badge
  - button
---
AI-powered metadata enrichment: suggestion counts inline, dedicated Suggestions tab.
