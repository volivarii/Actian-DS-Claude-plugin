---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: table-with-tabs
label: Tab-filtered dashboard table
apps:
  - administration
  - studio
tags:
  - table
  - tabs
  - collection
  - status
  - partition
when: >-
  Use when one collection is partitioned by a single categorical axis, usually status or
  ownership, and the tabs are that axis. Do not use faceted-browse, where several
  independent facets narrow at once, and do not use asset-detail-360, whose tabs are facets
  of one object rather than slices of a list.
components:
  - page-header
  - tabs
  - table
---
Page header → Tabs → Table layout. Tabs split the table by status (Active / Pending / Archived), type (My / Shared / All), or role-scoped view. Used for admin dashboards, queue views, and any list where users mentally pre-filter by category before scanning rows.
