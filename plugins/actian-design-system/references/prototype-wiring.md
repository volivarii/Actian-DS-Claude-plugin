# Prototype Wiring Reference

Programmatic Figma prototype wiring via `setReactionsAsync`. Makes flow frames playable in Figma's Presentation mode. Used by generate-flow Step 5.5 (new flows) and standalone wiring (existing flows via Figma URL).

## Two Entry Points

### Fast path (new flows — Step 5.5)

The skill already has screen frame IDs, names, order, and button labels from Step 5. Skip analysis Steps 1-3 and build the wiring plan directly. Run Steps 4-6 only if floating overlays exist.

### Analysis path (existing flows — Figma URL)

User provides a Figma URL. Run the full analysis algorithm below.

1. `get_metadata` on the provided node
2. Full analysis (Steps 1-6)
3. Present wiring plan for approval
4. Execute via `use_figma`
5. Post-wiring report

---

## Analysis Algorithm

Input: flat list of child nodes from `get_metadata` on a flow section frame.

### Step 1 — Classify nodes

For each direct child of the flow section:

| Test | Classification |
|------|---------------|
| Width >= 1400px AND height >= 700px AND contains child named `FM App_header` or `Layout` | **Screen frame** |
| Width >= 1400px AND height < 700px AND (name contains "Cover" OR has only text children) | **Cover card** — skip |
| Name starts with "FM Menu" OR (contains "Menu" AND has child named `FM Menu item`) | **Floating overlay** |
| Name contains "Cursor" or "Pointer" AND width <= 32px | **Annotation** — ignore |
| None of the above | **Unknown** — log and skip |

### Step 2 — Order screens

Sort screen frames by x-position (left-to-right). Assign sequential indices: Screen 1, Screen 2, ... Screen N.

### Step 3 — Detect interactive elements

For each screen frame, walk the node subtree and collect:

| Element | Detection rule | Data to extract |
|---------|---------------|-----------------|
| **FM Button** | Instance where name = "FM Button" | Label text (first TEXT child's characters), x and y relative to screen frame |
| **FM Icon Buttons** | Instance where name = "FM Icon Buttons" | Position, variant type |
| **dots-vertical** | Instance where name = "dots-vertical" | Position — indicates a menu trigger |
| **FM Empty State** | Instance where name = "FM Empty State" containing a FM Button child | The CTA button node inside |
| **Action footer** | Frame where name = "Actions" or "Buttons" AND y-position is in the bottom 100px of screen | All FM Button instances inside it |

### Step 4 — Match floating overlays to screens

For each floating overlay node:

1. Compute the screen x-ranges: each screen spans `[screen.x, screen.x + screen.width]`
2. Check which screen's x-range contains the overlay's x-position
3. If the overlay falls within exactly one screen → assign to that screen
4. If it overlaps two screens → assign to the screen with more x-overlap
5. Record the overlay's absolute x and y for offset calculation in Pattern 4

### Step 5 — Find trigger elements for overlays

For each overlay matched to a screen:

1. Collect all cursor/pointer annotation nodes whose x-position falls in the same screen's x-range
2. If a cursor exists near the overlay's y-position (within 200px vertical): find the interactive element in the screen closest to `(cursor.x, cursor.y)` — that is the trigger
3. If no cursor hint: look for `dots-vertical` instances in the screen; pick the one with the closest y-position to the overlay
4. If no confident match (no cursors, no dots-vertical): flag as "screen-level trigger" — the whole screen frame becomes the trigger

### Step 6 — Infer button destinations

For each FM Button found in Step 3, read the label text and infer destination:

| Label pattern (case-insensitive) | Destination | Confidence |
|----------------------------------|-------------|------------|
| contains "create", "new", "add", "next", "continue", "submit" | Next screen (index + 1) | High |
| contains "cancel", "back", "return", "close" | BACK action | High |
| contains "save", "confirm", "done", "apply", "update" | Last screen in flow (typically the list/table view) | Medium |
| contains "delete", "remove" | BACK action | Medium |
| Unrecognized | Next screen (index + 1) as fallback | Low |

**For the fast path:** the skill already knows screen order and button labels from the HTML generation. Button destination inference still applies but is confirmed by the known screen sequence.

---

## Wiring Plan Format

Present to user before executing:

```
### Prototype wiring plan: [Flow name]

**Screens:** N (+ M covers/annotations skipped)
**Flow starting point:** Screen 1 — "[name]"

**Sequential wiring (high confidence):**
1. Screen 1 → Screen 2 (ON_CLICK whole frame)
2. Screen 2 → Screen 3 ("[button label]" button → NAVIGATE)
...

**Button wiring:**
- Screen N: "[label]" → Screen M (confidence)
- Screen N: "[label]" → BACK (confidence)

**Overlay wiring:**
- Screen N: [trigger element] → [overlay name] overlay (confidence)

**Skipped:**
- N cursor annotations (decorative)
- N cover cards
- [any ambiguous items with explanation]

**Transition:** Dissolve, 300ms, ease-in-out

"wire" — execute as shown
"wire linear" — frame-to-frame only, skip button and overlay wiring
feedback — adjust specific connections
```

**Adjustments the user can make:**
- Change transition: "use smart animate" or "use push left"
- Remove connections: "skip the overlay on screen 5"
- Override destinations: "screen 3 save button should go to screen 7"
- Downgrade: "wire linear" — strips all smart wiring

---

## `use_figma` Code Patterns

### Default transition

```js
const TRANSITION = {
  type: 'DISSOLVE',
  easing: { type: 'EASE_IN_AND_OUT' },
  duration: 0.3
};
```

Configurable per user request. Options: `DISSOLVE`, `SMART_ANIMATE`, `PUSH` (with direction), `MOVE_IN`/`MOVE_OUT` (with direction), `SLIDE_IN`/`SLIDE_OUT` (with direction). Set `transition: null` for instant (no animation).

### Pattern 1 — Frame-to-frame sequential

Wire the whole screen frame. Only used when the screen has NO button-targeted wiring (priority resolution).

```js
await screenNode.setReactionsAsync([{
  trigger: { type: 'ON_CLICK' },
  actions: [{
    type: 'NODE',
    destinationId: nextScreenNode.id,
    navigation: 'NAVIGATE',
    transition: TRANSITION,
    preserveScrollPosition: false
  }]
}]);
```

### Pattern 2 — Button-targeted navigation

Wire a specific FM Button instance to navigate to a destination screen.

```js
await buttonNode.setReactionsAsync([{
  trigger: { type: 'ON_CLICK' },
  actions: [{
    type: 'NODE',
    destinationId: destinationScreenNode.id,
    navigation: 'NAVIGATE',
    transition: TRANSITION,
    preserveScrollPosition: false
  }]
}]);
```

### Pattern 3 — Back / Cancel

Wire a button to go back in prototype history.

```js
await cancelButtonNode.setReactionsAsync([{
  trigger: { type: 'ON_CLICK' },
  actions: [{ type: 'BACK' }]
}]);
```

### Pattern 4 — Floating overlay

Wire a trigger element to show an overlay (floating menu, dropdown, dialog).

```js
// Calculate offset: overlay position relative to trigger in absolute coordinates
const offsetX = overlayNode.absoluteTransform[0][2] - triggerNode.absoluteTransform[0][2];
const offsetY = overlayNode.absoluteTransform[1][2] - triggerNode.absoluteTransform[1][2];

await triggerNode.setReactionsAsync([{
  trigger: { type: 'ON_CLICK' },
  actions: [{
    type: 'NODE',
    destinationId: overlayNode.id,
    navigation: 'OVERLAY',
    transition: {
      type: 'MOVE_IN',
      direction: 'BOTTOM',
      easing: { type: 'EASE_OUT' },
      duration: 0.2
    },
    overlayRelativePosition: { x: offsetX, y: offsetY }
  }]
}]);
```

### Pattern 5 — Flow starting point

Set the first screen as the flow entry point. Preserves any existing flow starting points on the page.

```js
const page = figma.currentPage;
const existingFlows = page.flowStartingPoints || [];
page.flowStartingPoints = [
  ...existingFlows,
  { nodeId: firstScreenNode.id, name: 'FLOW_NAME' }
];
```

### Pattern 6 — Priority resolution

When a screen has button-level wiring, do NOT also wire a frame-level click-to-advance reaction. Otherwise both would fire on click.

```js
// Screens with targeted button wiring: only buttons get reactions
// Screens without targeted buttons: frame-level click-to-advance
const screensWithButtons = new Set(buttonWirings.map(w => w.screenIndex));

for (let i = 0; i < screens.length - 1; i++) {
  if (!screensWithButtons.has(i)) {
    // Pattern 1: frame-level sequential
    await screens[i].setReactionsAsync([{
      trigger: { type: 'ON_CLICK' },
      actions: [{
        type: 'NODE',
        destinationId: screens[i + 1].id,
        navigation: 'NAVIGATE',
        transition: TRANSITION,
        preserveScrollPosition: false
      }]
    }]);
  }
}
```

### Assembly structure

All patterns assembled into one `use_figma` call per flow:

```js
// 1. Navigate to the correct page (if needed)
// 2. Find all screen frames by stored IDs
// 3. Define TRANSITION constant
// 4. Wire frame-level sequential (screens without button targets) — Pattern 1 + 6
// 5. Wire button-targeted navigation — Pattern 2
// 6. Wire back/cancel buttons — Pattern 3
// 7. Wire overlay triggers — Pattern 4
// 8. Set flow starting points — Pattern 5
// 9. Return summary: { screensWired, buttonsWired, overlaysWired, flowName }
```

Keep under 20KB. For flows with >10 screens, split into two `use_figma` calls if needed (sequential wiring in call 1, button + overlay wiring in call 2).

---

## Post-Wiring Report

After execution, present:

```
Wired N screens, M buttons, K overlays.
Flow starting point: "[flow name]"

Test in Figma: select the first screen → Play button

Connections:
- Screen 1 → Screen 2 (frame click)
- Screen 2: "Create policy" → Screen 3
- Screen 7: "Cancel" → Back
- Screen 7: "Save" → Screen 8
- Screen 5: dots-vertical → Menu overlay
```
