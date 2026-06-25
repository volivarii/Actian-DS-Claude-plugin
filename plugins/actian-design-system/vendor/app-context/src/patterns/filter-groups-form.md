---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: filter-groups-form
label: Filter-groups edit form with sticky footer
apps:
  - administration
---
Edit-group / permission / role configuration pattern. Page header + top inputs section + one or more collapsible filter-group sections, each containing label rows with toggle switches, plus optional slot cards for nested config (Checkbox + Toggle stacks). Sticky footer pinned at the bottom for save/cancel actions. Used when administrators configure access bundles or named groups with many fine-grained permissions.
