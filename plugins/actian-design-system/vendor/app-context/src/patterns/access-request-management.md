---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: access-request-management
label: Access request management
apps:
  - studio
tags:
  - queue
  - review
  - approve
  - table
  - requests
when: >-
  Use for the reviewer's side of a request flow: a queue of pending decisions, each row
  carrying its own approve and reject action. Do not use table-with-tabs, whose tabs
  partition one collection; here the filter is a status multi-select and the row itself is
  the unit of work.
components:
  - table
  - table
  - button
  - dropdown-select-default
  - interactive-tag
  - read-only-tag
  - button
---
Table with Requester, Item, Created at, Last updated, Status and Actions, the first four sortable. Each row ends in a decision pair: an outline Reject beside a filled Approve. Above the table, right aligned, a status multi-select holds the active filters as removable chips.

Corrected 2026-08-18 from the running product: this record previously said "Status tabs: Pending / Done". There are no status tabs. Filtering is the multi-select described above, and the values seen were Pending and Error.
