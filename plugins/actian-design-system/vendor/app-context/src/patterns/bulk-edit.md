---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: bulk-edit
label: Bulk Edit
apps:
  - studio
tags:
  - bulk
  - edit
  - collection
  - batch
  - multi-select
components:
  - table
  - checkbox
  - button
  - modal
---
Multi-item batch update from Studio's Catalog (`recipes/captures/bulk-edit-menu.png`). Selecting results turns the bulk bar's count into 'N selected' and its Edit menu offers Assign curators, Add Contacts, Manage Properties, Manage Glossary Items and Edit lifecycle stage. Manage Properties is a modal (`recipes/captures/bulk-edit.png`): a banner naming how many Items are selected, a warning that only the Items the user can curate are modified, a drop target for the properties to change on the left, the available properties grouped on the right, and Confirm, disabled until a property is dropped.
