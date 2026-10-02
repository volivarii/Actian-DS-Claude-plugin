---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: suggestion-workflow
label: Suggestion workflow
apps:
  - explorer
  - studio
reference: product
screenshots:
  - captures/suggestion-workflow.png
tags:
  - suggestions
  - review
  - approve
  - workflow
  - curate
components:
  - button
  - confirmation
  - text-input
  - read-only-tag
---
Explorer's item page carries 'Submit a suggestion', which opens a New Suggestion modal (`recipes/captures/suggestion-workflow.png`): 'Suggest any modification or enhancement regarding this item. It will be submitted for review by curators.', one text area of 20 to 1000 characters, and Cancel and Submit, Submit disabled while it is empty. Explorer's item page counts them on a Suggestions tab, and a Studio Catalog result carries an 'N suggestions are pending.' chip.
