---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: activity-timeline
label: Activity timeline
apps:
  - studio
tags:
  - timeline
  - history
  - chronological
  - audit
  - single-object
when: >-
  Use for the system's chronological record of what changed on one object, grouped by date.
  Do not use discussion-threads, which is authored conversation rather than a log, and do
  not use a table: the unit is a sentence about a change, not a row.
components:
  - avatar
---
Chronological timeline with date headers, user avatars, action descriptions.
