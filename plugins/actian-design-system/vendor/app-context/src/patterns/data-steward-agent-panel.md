---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: data-steward-agent-panel
label: Data Steward Agent Panel
apps:
  - studio
tags:
  - ai
  - agent
  - panel
  - curate
  - approval
components:
  - drawer
  - confirmation
  - button
---
Studio's Data Steward Agent (`recipes/captures/data-steward-agent-panel.png`). A sparkle button in the header, left of What's new, opens a panel floating at the bottom right: the title Data Steward with expand and close, a conversation menu (New chat, and the conversations for the current catalog), a welcome on a new chat, and a composer reading 'Give Steward a task' with the catalog it is looking at and a Plan toggle. Its footer reads 'Data Steward Agent is AI and can make mistakes. Please double-check responses.' Administration > Agents enables the agent (Studio Steward) per group.
