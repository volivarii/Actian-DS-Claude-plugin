---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: discussion-thread
label: Discussion Thread
properties:
  - author
  - content
  - replies
  - created at
relationships:
  belongsTo:
    - catalog-object
apps:
  - studio
  - explorer
patterns:
  - discussion-threads
---
Conversation thread on Dataset detail pages
