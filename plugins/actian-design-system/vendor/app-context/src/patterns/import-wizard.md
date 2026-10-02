---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: import-wizard
label: Multi-step import wizard
apps:
  - studio
reference: product
screenshots:
  - captures/import-wizard.png
tags:
  - wizard
  - stepper
  - import
  - create
  - sequence
when: >-
  Use when creating something requires an ordered sequence the user cannot complete out of
  order, with a numbered stepper and a persistent back/next action bar. Do not use a plain
  form: the defining trait is that each step narrows what the next one can offer.
components:
  - stepper
  - button
  - text-input
  - dropdown-select-default
  - radio-card
  - action-bar
---
7-step horizontal stepper: Data source → Connection → Items → Curator → Contact → Data Product → Confirm, under the page title Import Items (`recipes/captures/import-wizard.png`). Each step is a numbered circle with a label and a one-line helper beneath it (Select a data source, Select a connection, Select the Items, Assign curators, Add a contact to your items, Associate a Data Product), and a persistent action bar at the foot of the page carries Back and Next, with Next disabled until the step is satisfied. Step one is a grid of radio cards, one per data source, each with the source's logo.
