---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: activity-timeline
label: Activity timeline
apps:
  - studio
reference: product
screenshots:
  - captures/activity-timeline.png
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
---
Chronological timeline on an item's Activity tab (`recipes/captures/activity-timeline.png`): month headings, a date marker per day on a vertical line, and one sentence per event led by an icon, such as '<user> changed the stage from 'Approved' to 'In Review''. The product draws no avatar on an event.
