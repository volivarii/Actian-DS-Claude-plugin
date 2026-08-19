---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: metamodel-designer
label: Metamodel Designer
apps:
  - studio
tags:
  - configure
  - canvas
  - split
  - editor
  - drag-drop
when: >-
  Use when a configurable structure is edited beside a live picture of itself: a searchable
  list of types on one side, a canvas on the other, with the canvas carrying its own zoom
  and export controls. Do not use a plain form; the picture is half the screen.
components:
  - metamodel-widget
  - button
  - text-input
---
Drag-and-drop configuration of templates and properties per item type in Studio Catalog Design.
