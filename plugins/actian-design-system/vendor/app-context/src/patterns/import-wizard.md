---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: import-wizard
label: Multi-step import wizard
apps:
  - studio
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
7-step horizontal stepper: Data source → Connection → Items → Curator → Contact → Category → Confirm. Each step is a numbered circle with a label and a one-line helper beneath it, and a persistent action bar at the foot of the page carries Back and Next, with Next disabled until the step is satisfied. Step one is a grid of radio cards, one per data source, each with the source's logo.

Corrected 2026-08-18 from the running product: this record previously said 6 steps and named "Data Product" as the sixth. There are 7, the first is Data source, and the sixth is Category. `components` also gained the radio
cards of step one and the persistent action bar, which the corrected prose described and the
machine-read field did not. The action bar was named by its then-current slug `sticky-footer`; Figma renamed
it to `action-bar`, and that rename landed alongside the registry in one branch on 2026-08-24 (#526),
which is why this record now names `action-bar`.
