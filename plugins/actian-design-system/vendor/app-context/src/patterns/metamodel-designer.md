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
  - metamodel
  - button
  - text-input
---
Studio's Catalog design page (`recipes/captures/metamodel-designer.png`): tabs Physical & Logical Metamodel, Glossary, Properties and Responsibilities. The first holds a searchable list of item types (type badge, name, Items count, and per-row actions: a template action on most types, an edit action on some, custom types among them) with Create custom type, beside the metamodel diagram, which has Expand the view, Export as image and zoom controls. Each type's template is edited in the template-builder modal.
