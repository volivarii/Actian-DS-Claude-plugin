# DS Assembler — Analyzer & Updater Mode

**Date:** 2026-03-21
**Status:** Draft
**Priority:** Medium
**Author:** Vincent + Claude

## Problem

The `/design-audit` skill produces a read-only report. Fixing issues requires manual work in Figma. The Figma REST API and MCP can read structure but can't modify existing nodes.

## Goal

Add analyze + update capabilities to the DS Assembler Figma plugin, creating a bidirectional loop: Claude reads the design state, decides on fixes, the plugin applies them.

## Users

- **Designers:** Run analysis to check their page against the design system before handoff
- **Claude (via /design-audit):** Reads analysis results, generates update instructions, plugin applies them

## Architecture

```
Claude ←→ localhost:8765 (serve.py) ←→ DS Assembler Plugin
           │
           ├── GET  /registry/...        → plugin reads component registry
           ├── GET  /spec.json           → plugin reads layout spec (assemble mode)
           ├── POST /analysis            → plugin writes analysis results
           ├── GET  /updates.json        → plugin reads update instructions from Claude
           └── POST /update-result       → plugin writes update results
```

serve.py gains POST endpoints. Analysis and update results are saved as JSON files that Claude reads.

## Scope

### Analyze mode

Plugin scans the current page or entire file and reports:

**Variables & tokens:**
- All local variables (collections, modes, values per mode)
- Variables actually used on the page vs defined but unused

**Styles:**
- Local paint, text, effect, grid styles
- Hardcoded values that should use styles/variables

**Components:**
- All component instances on the page
- Source library for each instance
- Variant property values and text overrides
- Detached instances (ad-hoc recreations of library components)
- Non-library nodes that could be library components

**Structure:**
- Auto-layout usage (which frames use it, which don't)
- Sizing modes (fixed vs hug vs fill)
- Spacing consistency

**Output format (JSON):**
```json
{
  "file": { "name": "...", "key": "..." },
  "scope": "page",  // or "file"
  "page": { "name": "...", "id": "..." },
  "instances": [
    {
      "nodeId": "123:456",
      "name": "Button",
      "componentKey": "abc...",
      "componentName": "FM Button",
      "library": "fat-marker",
      "variants": { "Type": "Primary", "Size": "md" },
      "textOverrides": { "Label": "Save" },
      "x": 100, "y": 200, "width": 120, "height": 48
    }
  ],
  "issues": [
    {
      "nodeId": "789:012",
      "type": "hardcoded-color",
      "description": "Rectangle uses #0550DC instead of variable theme-primary",
      "severity": "warning"
    },
    {
      "nodeId": "345:678",
      "type": "detached-component",
      "description": "Frame looks like FM Button but is not a library instance",
      "severity": "error"
    }
  ],
  "stats": {
    "totalNodes": 450,
    "instances": 38,
    "uniqueComponents": 12,
    "hardcodedColors": 5,
    "missingAutoLayout": 3
  }
}
```

### Update mode

Claude generates update instructions. Plugin applies them:

```json
{
  "updates": [
    {
      "nodeId": "123:456",
      "action": "set-variant",
      "props": { "Type": "Secondary" }
    },
    {
      "nodeId": "123:456",
      "action": "set-text",
      "text": { "Label": "Cancel" }
    },
    {
      "nodeId": "789:012",
      "action": "swap-component",
      "componentName": "FM Placeholder",
      "props": {}
    },
    {
      "nodeId": "345:678",
      "action": "replace-with-instance",
      "componentName": "FM Button",
      "props": { "Type": "Primary" },
      "text": { "Label": "Save" }
    }
  ]
}
```

**Update actions:**
- `set-variant` — change variant properties on an existing instance
- `set-text` — change text overrides on an existing instance
- `swap-component` — swap an instance to a different component
- `replace-with-instance` — replace a non-instance node with a library instance
- `delete` — remove a node
- `set-fill` — change fill color to a variable/token
- `set-auto-layout` — convert a frame to auto-layout with specified properties

## Plugin UI additions

New tab or mode selector in the plugin: **Assemble | Analyze | Update**

**Analyze tab:**
- Scope selector: "Current page" or "Entire file"
- "Analyze" button
- Progress bar
- Summary of findings
- Status: "Analysis saved to localhost:8765/analysis"

**Update tab:**
- "Load updates" button (fetches from localhost:8765/updates.json)
- Preview of changes (count + list)
- "Apply" button
- Progress bar
- Undo support (single Cmd+Z undoes all updates)

## serve.py changes

Add POST handler:
```python
def do_POST(self):
    if self.path == '/analysis':
        # Save body to analysis.json
    elif self.path == '/update-result':
        # Save body to update-result.json
```

## Skill integration

### /design-audit (enhanced)

1. User runs `/design-audit` with a Figma URL
2. Claude tells user: "Open DS Assembler → Analyze tab → click Analyze"
3. Plugin scans the page, POSTs results to localhost:8765/analysis
4. Claude reads analysis.json, generates audit report WITH fix suggestions
5. If user says "fix it": Claude generates updates.json
6. User clicks "Load updates → Apply" in the plugin
7. Plugin applies fixes, POSTs results

### /generate-flow (enhanced)

After assembling a flow, auto-analyze the result to verify component usage is correct.

## Out of scope (v1)

- Real-time sync (live watch mode)
- Multi-file analysis
- Custom lint rules in plugin UI
- Diff between two pages
- Version tracking

## Implementation estimate

- **serve.py POST endpoints:** 1 task
- **Analyze mode (plugin):** 2-3 tasks (tree walker, issue detection, POST results)
- **Update mode (plugin):** 2-3 tasks (instruction parser, apply actions, POST results)
- **Plugin UI tabs:** 1 task
- **Skill integration:** 1 task (update /design-audit)

Total: ~8-10 tasks, similar scope to the initial assembler build.
