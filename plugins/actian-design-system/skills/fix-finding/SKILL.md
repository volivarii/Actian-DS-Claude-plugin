---
name: fix-finding
description: Fix a single design-audit finding in Figma. Takes a finding from the design-audit JSON output and applies the fix via use_figma. Supports fix types: swap-instance (replace with library component), bind-tokens (bind variable/style), align-variant (switch variant), compose-from-primitives (build from library). Triggers when the user asks to fix a specific audit finding, apply a fix, or resolve a design system violation.
argument-hint: "[finding ID or description from audit report]"
---

# Fix Design System Finding

Apply a single fix from a `/design-audit` report to a Figma file.

> **Mode: Write.** This skill modifies the Figma file via `use_figma`. Each fix is atomic — one finding, one fix, one verification.

## Why this skill exists

`/design-audit` identifies problems. This skill fixes them. Together they form an audit→fix pipeline that progressively brings designs into compliance with DS2026.

## Input

The user provides either:
- A finding ID from a previous audit report (e.g., "Fix finding #3")
- A description of the issue (e.g., "Fix the hardcoded blue on the login button")
- A Figma URL + description of what to fix

If the audit JSON is available in conversation context, use it directly. Otherwise, ask the user to run `/design-audit` first.

## Fix types

### swap-instance
Replace an ad-hoc element with the correct library component.

1. Identify the target node via `get_design_context` or node ID from audit
2. Find the correct library component via `search_design_system`
3. Import component: `figma.importComponentByKeyAsync(key)`
4. Create instance and position at the same location as the original
5. Copy over any text content from the original
6. Delete the original node

### bind-tokens
Bind a variable or style to a node property.

1. Identify the target node
2. Import the correct variable: `figma.variables.importVariableByKeyAsync(key)`
3. Bind to fill: `node.setBoundVariable('fills', 0, variable)`
4. Or import style: `figma.importStyleByKeyAsync(key)` and assign `node.fillStyleId = style.id`
5. Call `setExplicitVariableModeForCollection` on nearest ancestor (ghost mode prevention)

### align-variant
Switch a component instance to the correct variant.

1. Identify the instance node
2. Read current properties: `instance.componentProperties`
3. Set the correct variant: `instance.setProperties({ "Property": "Value" })`

### compose-from-primitives
Build a complex element from library primitives when no single component matches.

1. Import required primitive components via `search_design_system` + `importComponentByKeyAsync`
2. Create a container frame with auto-layout
3. Set explicit sizing: `layoutSizingHorizontal = 'HUG'`
4. Compose primitives inside the container
5. Position at the original element's location
6. Delete the original

### blocked
Cannot be auto-fixed. Present the finding details and explain why manual intervention is needed. Possible reasons:
- Design decision required (e.g., which variant to use)
- Component doesn't exist in the library
- Layout change would break surrounding elements
- Multiple valid fixes exist

## Verification

After every fix:
1. Call `get_screenshot` on the fixed node to verify visually
2. Compare against the expected state from the audit finding
3. Report success or failure

## Output

Single-line confirmation per fix:
```
✓ Finding #3 fixed (bind-tokens, confidence 0.95): Bound theme-primary to Button fill
```

If the fix fails or produces unexpected results:
```
✗ Finding #3 failed: [reason]. Manual review needed.
```

## Batch mode

When the user asks to "fix all auto-fixable findings":
1. Filter findings where `autoFixable: true`
2. Sort by severity (P0 first)
3. Apply fixes sequentially (never parallel `use_figma`)
4. Report summary: "Fixed N/M findings. K blocked."
