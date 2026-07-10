---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: table-with-tabs
label: Tab-filtered dashboard table
apps:
  - administration
  - studio
components:
  - page-header
  - tabs
  - table
---
Page header → Tabs → Table layout. Tabs split the table by status (Active / Pending / Archived), type (My / Shared / All), or role-scoped view. Used for admin dashboards, queue views, and any list where users mentally pre-filter by category before scanning rows.
