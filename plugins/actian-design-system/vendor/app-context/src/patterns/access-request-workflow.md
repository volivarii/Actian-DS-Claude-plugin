---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: access-request-workflow
label: Access request workflow
apps:
  - explorer
  - studio
reference: product
screenshots:
  - captures/access-request-workflow.png
tags:
  - request
  - approve
  - form
  - workflow
  - permissions
components:
  - button
  - dropdown-select-default
  - text-input
  - read-only-tag
---
Explorer's item page carries a Request Access action. It opens 'Create an access request' (`recipes/captures/access-request-workflow.png`): the item's type tag and name, Reason (required, free text), Audience (required, a select), the approvers as avatars, and Close and Create, Create disabled while the form is empty. The approvers are shown, not chosen. Requests are handled on Studio's Access requests page (access-request-management).
