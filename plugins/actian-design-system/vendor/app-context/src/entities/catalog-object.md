---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: catalog-object
label: Catalog Object
properties:
  - name
  - description
  - type
  - completion level
  - quality status
  - owner
  - contacts
  - last modified
relationships:
  belongsTo: domain
  hasMetadata: metadata
  hasLineage: lineage
  hasGlossaryTerms: glossary-term
  hasGovernancePolicies: governance-policy
  hasDiscussionThreads: discussion-thread
  hasSuggestions: suggestion
  hasObservabilitySignals: observability-signal
apps:
  - studio
  - explorer
---
Any indexed item. Types: Dataset, Field, Visualization, Data Process, Data Product, Glossary Item, Custom Item, Category
