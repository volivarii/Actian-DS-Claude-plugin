---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: template-builder
label: Drag-and-drop template builder
apps:
  - studio
tags:
  - configure
  - builder
  - templates
  - editor
components:
  - metamodel
  - button
  - text-input
---
A modal on Studio's Catalog design page, opened from an item type's template action in the Physical & Logical Metamodel list (`recipes/captures/template-builder.png`). Titled '<Item type> Template', it carries an information banner, a New section action, the template's sections on the left (each a capitals heading with a remove action, its properties in order, and a 'Drop a property here' target), the property list on the right to drag from, and a single Confirm.
