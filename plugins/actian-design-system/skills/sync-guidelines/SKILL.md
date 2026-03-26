---
name: sync-guidelines
description: "DEPRECATED: Use /sync-design-system instead. Supports all the same operations: 'sync Button' for single component, 'sync foundations' for foundation pages, 'sync all' for everything. This skill redirects to /sync-design-system."
argument-hint: "[component name, 'foundations', or 'all']"
---

# Sync Guidelines — DEPRECATED

This skill has been merged into `/sync-design-system`, which provides the same guideline extraction plus component, variable, style, and token sync.

## Use instead:

- **Single component:** `/sync-design-system Button`
- **Multiple components:** `/sync-design-system Button, Modal, Table`
- **Foundations only:** `/sync-design-system foundations`
- **All guidelines + foundations:** `/sync-design-system guidelines`
- **Everything (components, tokens, guidelines, foundations):** `/sync-design-system all`

The `/sync-design-system` skill uses the same JSON output format, same extraction approach, and same `component-guidelines/*.json` + `foundations/*.json` output locations.
