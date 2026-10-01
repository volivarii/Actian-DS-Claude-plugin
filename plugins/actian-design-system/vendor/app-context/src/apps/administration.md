---
# yaml-language-server: $schema=../../../schemas/app-context-app.json
_schema_version: 1
slug: administration
label: Administration
header:
  type: Admin
  actions: [app-switcher, avatar]
sidebar:
  - label: Users and contacts
    id: users-and-contacts
    icon: user-group
  - label: Catalogs
    id: catalogs
  - label: Groups
    id: groups
  - label: Connections
    id: connections
    icon: database
  - label: Scanners
    id: scanners
    icon: scanner
  - label: API keys
    id: api-keys
    icon: api-key
  - label: Agents
    id: agents
    icon: stars
  - label: Policies
    id: policies
    icon: security-services
    children:
      - label: Access requests
        id: policies-access-requests
      - label: Lifecycles
        id: policies-lifecycles
  - label: Maintenance mode
    id: maintenance-mode
    icon: maintenance
useCases:
  - audience: [Administrator]
    jobs:
      - Configure connections and scanners
      - Manage users, groups and permissions
      - Set governance policies and maintenance windows
    patterns: [search-filtered-table, filter-groups-form, table-with-tabs]
---

## Purpose

User management, connections, catalog configuration, system settings

## Signals

- users
- permissions
- connections
- connectors
- settings
- configuration
- system
- LDAP
- SSO
- roles
- groups
- scanners
- API keys
- maintenance
- catalogs
