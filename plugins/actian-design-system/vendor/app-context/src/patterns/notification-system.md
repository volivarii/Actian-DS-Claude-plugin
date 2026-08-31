---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: notification-system
label: Notification system
apps:
  - studio
  - explorer
  - administration
tags:
  - notifications
  - popover
  - panel
  - alerts
when: >-
  Use for an unread counter that opens an anchored popover of recent events, each with a
  status icon and a click-through. Do not use right-sliding-drawer: this does not take over
  the side of the screen, and it is dismissed by clicking away.
components:
  - toast
  - notification-dropdown
  - global-header
---
Bell icon with unread counter. Three notification types with click-to-action redirects.
