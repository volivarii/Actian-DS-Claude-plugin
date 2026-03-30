# Library Gap Detection

Shared procedure for detecting and logging when a skill builds a custom frame instead of importing a library component. Run this check before building any custom element during `use_figma`.

## When to check

Before building ANY custom element in a `use_figma` call, check both component catalogs:

- **FM Kit** → `../../docs/fm-components.md`
- **DS2026** → `../../docs/ds2026-components.md`

This check is part of the existing `use_figma` step — it is not a separate step.

## Detection logic

1. **Match the element to the catalog by name.** Look up the element's name (or closest equivalent) in both `fm-components.md` and `ds2026-components.md`.

2. **Component EXISTS in catalog:**
   - Check whether the needed variant also exists.
   - If the variant EXISTS → import the library component via `importComponentSetByKeyAsync` or `importComponentByKeyAsync`. Do not build custom.
   - If the variant DOES NOT EXIST → build the closest matching instance, then attach a System marker with gap description `"Missing variant: [variant name]"`.

3. **Component DOES NOT EXIST in catalog:**
   - Build a custom frame.
   - Attach a System marker with gap description `"Missing component: [element name]"`.

4. **Component EXISTS but lacks a needed PROPERTY:**
   - Import the component.
   - Apply the closest available workaround (e.g., swap an inner element, override text, use a sibling variant).
   - Attach a System marker with gap description `"Missing property: [property name]"`.

## Attaching a System marker

After placing a custom or workaround frame, import the Feedback component set and attach a Type=System instance adjacent to the frame.

```js
const FEEDBACK_COMPONENT_KEY = "d5cba21bc3dbf36578665bac89834fbe1ca29ed0";

// Import the Feedback component set
const feedbackSet = await figma.importComponentSetByKeyAsync(FEEDBACK_COMPONENT_KEY);

// Find the System variant
const systemVariant = feedbackSet.children.find(c => c.name.includes("Type=System"));
const marker = systemVariant.createInstance();

// Set text properties using prefix matching
function setProp(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find(k => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}

setProp(marker, "Message", "Missing component: Stepper"); // gap description
setProp(marker, "Target", customFrame.name);              // name of the custom frame

// Position adjacent to the custom frame (8px gap to the right, same y)
marker.x = customFrame.x + customFrame.width + 8;
marker.y = customFrame.y;

// Append to the same parent
customFrame.parent.appendChild(marker);
```

Replace the `Message` value with the appropriate gap description from the detection logic above.

## Logging to library-gaps.json

After attaching a System marker, append an entry to `{project_working_directory}/library-gaps.json`.

### Schema

```json
[
  {
    "date": "2026-03-27T14:32:00Z",
    "skill": "generate-flow",
    "component": "Stepper",
    "severity": "Missing component",
    "gap": "No Stepper component exists in FM Kit or DS2026. Built custom 3-step indicator.",
    "workaround": "Custom auto-layout frame with numbered circles and connector lines.",
    "fileKey": "<from .figma-keys.json>",
    "nodeId": "1234:5678",
    "count": 1
  }
]
```

### Field definitions

| Field | Type | Description |
|-------|------|-------------|
| `date` | ISO 8601 string | Timestamp when the gap was logged or last updated |
| `skill` | string | Slug of the skill that triggered the gap (e.g., `generate-flow`, `create-component`) |
| `component` | string | Name of the missing or incomplete component |
| `severity` | enum | One of: `Missing component`, `Missing variant`, `Missing property`, `General` |
| `gap` | string | Human-readable description of what is missing |
| `workaround` | string | What was built instead, and how |
| `fileKey` | string | Figma file key where the gap was encountered |
| `nodeId` | string | Node ID of the custom frame that replaced the library component |
| `count` | integer | How many times this gap has been hit (starts at 1) |

### Deduplication rule

Before appending a new entry, check whether an entry with the same `component` + `gap` already exists.

- **If it exists** → increment `count` by 1 and update `date` to the current timestamp. Do not add a new entry.
- **If it does not exist** → append a new entry with `count: 1`.

## File location

Write to:

```
{project_working_directory}/library-gaps.json
```

This is the user's project working directory (where flows, specs, and presentations are written) — not the plugin directory.

## Integration pattern

The library gap check is embedded inside the existing `use_figma` step, not added as a separate step. Skills do not need to add a new step number. Include the following note in the `use_figma` planning phase:

```
Before building any custom frame: check ../../docs/fm-components.md and
../../docs/ds2026-components.md. Follow the detection logic in
@references/library-gap-detection.md. Attach a System marker and log to
library-gaps.json for any element built custom instead of imported.
```

## Feedback component visual spec

Two variants are defined. The `Type=System` variant is used by this procedure. The `Type=Designer` variant is used for human-authored annotations.

### Type=Designer

| Property | Value |
|----------|-------|
| Width | 280px |
| Background | `#EFF6FF` |
| Left border | 4px solid `#3B82F6` |
| Border radius | 6px |
| Padding | 12px top/bottom, 16px left/right |
| Label text | "FEEDBACK", 10px Inter Bold, uppercase, `#3B82F6` |
| Message text | 13px Inter Regular, `#1E3A5F` |
| Target text | 12px Inter Medium, `#6B7280` |
| Opacity | 1.0 |

### Type=System

| Property | Value |
|----------|-------|
| Width | 200px |
| Background | `#FFF7ED` |
| Left border | 3px solid `#F59E0B` |
| Border radius | 4px |
| Padding | 8px top/bottom, 12px left/right |
| Label text | "LIBRARY GAP", 9px Inter Bold, uppercase, `#B45309` |
| Message text | 11px Inter Regular, `#78350F` |
| Target text | 10px Inter Medium, `#9CA3AF` |
| Opacity | 0.85 |
