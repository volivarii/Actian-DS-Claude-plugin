---
name: refine
description: Use when the user wants to fix, adjust, or correct Figma output after a push, review Figma comments for actionable fixes, or re-run a parity check on previously pushed content. Works across all output skills (flows, briefs, presentations, components).
argument-hint: "[feedback text] or 'comments' or 'check'"
---

# Refine Figma Output

Apply targeted corrections to previously pushed Figma content — from free-text feedback, Figma comments, or a fresh parity re-check.

**When NOT to use:** If the user wants to *create* new Figma output → use `generate-flow`, `generate-presentation`, or `component-brief`. If the user wants to *audit* for DS compliance → use `design-audit`. If the user wants to fix a specific audit finding → use `fix-finding`. This skill is for iterating on output that already exists in Figma.

> **Mode: Fix with verification. Apply each fix individually, screenshot before and after.**

---

## Input modes

Detect the user's intent from their argument:

| Argument | Mode | Behavior |
|----------|------|----------|
| Free text (e.g., "the header is too tall, fix the button label") | Conversational | Parse text into discrete findings, match to pushed nodes |
| `"comments"` | Figma comment reading | Read comments from Figma via MCP, present numbered list, ask which to fix |
| `"check"` | Parity re-check | Re-run parity check from `../../references/parity-check.md` against the last-pushed content |
| No argument | Ask | Prompt: "What would you like to refine? Share feedback text, type `comments` to pull Figma comments, or type `check` to re-run parity." |

---

## Step 1 — Load context

Before any fixing, load the manifest from the last push.

### Find `.last-push.json`

Search these directories in the user's project working directory, in priority order:

1. `{project_working_directory}/components/flows/.last-push.json`
2. `{project_working_directory}/components/*/.last-push.json` (any subdirectory under `components/`)
3. `{project_working_directory}/presentations/*/.last-push.json`

Pick the file with the most recent `pushedAt` timestamp if multiple files are found.

### Manifest structure

A `.last-push.json` written by output skills contains at minimum:

```json
{
  "skill": "generate-flow",
  "pushedAt": "2026-03-27T14:32:00.000Z",
  "figmaFileKey": "abc123",
  "figmaPageName": "Flows",
  "pushedNodes": [
    {
      "screenName": "Screen 1 — List view",
      "nodeId": "123:456",
      "htmlSource": "components/flows/my-flow.html"
    }
  ],
  "refinements": 0
}
```

### If not found

If no `.last-push.json` exists in any expected location, ask:

> "I couldn't find a previous push manifest. Please share the Figma URL of the frame you'd like to refine, and describe what needs to change."

Accept a Figma URL as fallback context. Extract `fileKey` and `nodeId` from the URL. Continue without `pushedNodes` — use the provided node as the target.

### Present context summary

Once the manifest is loaded (or the URL is provided), present a one-line summary before proceeding:

```
Context: [skill] pushed [N] nodes to [figmaPageName] on [pushedAt date]. Refinement #[count+1].
```

---

## Step 2 — Collect findings

Behavior depends on the detected mode.

### Mode 1 — Conversational feedback

Parse the user's free text into a list of discrete, actionable findings:

```
Findings from your feedback:
1. [target: node name or screen] — [issue description]
2. [target] — [issue description]
...
```

For each finding:
- **Target** — match to a node name in `pushedNodes` using fuzzy matching (e.g., "the header" → screen containing an FM Page Header). If a finding cannot be matched to a specific node, note it as "unresolved — will search in Figma".
- **Issue** — the specific problem stated or clearly implied by the user.

Do not ask for confirmation before proceeding. Parse and move to Step 3.

### Mode 2 — Figma comment reading

1. Call `get_metadata` on the Figma file (using `figmaFileKey` from the manifest) to confirm the file is accessible.
2. Read comments from the file. Present them as a numbered list:

```
Comments on [figmaPageName] (as of [timestamp]):

1. [author] on [node name]: "[comment text]"
2. [author] on [node name]: "[comment text]"
...
```

If there are no comments, say: "No open comments found on this file. Share feedback text directly and I'll fix it."

3. Ask:
   > "Fix all, pick specific ones (e.g., `fix 1,3`), or skip? Reply with your selection."

4. Wait for the user's response. Map selected comments to findings in the same `{target, issue}` format as Mode 1.

### Mode 3 — Parity re-check

Re-run the parity check procedure from `../../references/parity-check.md` against the content described in `pushedNodes`.

For each pushed node:
1. Call `get_screenshot` on the node ID to get the current visual state.
2. Call `get_design_context` on the node ID to read the current layer structure.
3. Compare against the HTML source file at `htmlSource` (if available) or the manifest's original intent.
4. Report any deviations as findings using the same `{target, issue}` format.

Present the parity report:
```
Parity check — [N] nodes reviewed:

[node name]: PASS / FAIL
  [if FAIL] — [deviation description]
```

Only proceed to Step 3 for nodes that FAIL. Nodes that PASS require no action.

---

## Step 3 — Fix loop

For each finding, in sequence:

### 3a. Screenshot before

Call `get_screenshot` on the target node. Present the screenshot to the user:

```
Before: [node name]
[screenshot]
```

If the target node ID is unknown (unresolved finding), call `get_metadata` on the file to locate the node by name, then screenshot it.

### 3b. Determine fix approach

Choose the fix strategy based on the type of issue:

| Issue type | Fix approach |
|------------|--------------|
| **Layout** — spacing, sizing, alignment, auto-layout | Use `use_figma` to adjust layout properties directly on the node |
| **Content** — wrong text, wrong label, wrong data | Fix the HTML source file, then re-push the affected node via `use_figma` |
| **Style** — wrong color, wrong token, wrong variant | Use `use_figma` to rebind variables, swap instances, or update component properties |
| **Structure** — missing state, wrong component, detached instance | Use `use_figma` to swap or recreate the affected sub-tree |

### 3c. Apply the fix

Apply using `use_figma`. Follow the shared rules in `../../references/figma-output.md`:
- Bind variables, never hardcode hex values for DS2026 content
- Use `importComponentByKeyAsync` when swapping instances
- Use `setProperties` when adjusting variants
- Apply auto-layout and HUG sizing after any structural change

For content fixes that require HTML re-generation:
1. Read the current HTML source at `pushedNodes[i].htmlSource`
2. Make the targeted change to the HTML
3. Save the updated HTML
4. Re-push only the affected node using `use_figma`

### 3d. Screenshot after

Call `get_screenshot` on the same node. Present before/after side by side:

```
Fix applied: [issue description]
Before: [screenshot A]
After:  [screenshot B]
```

### 3e. Next finding

Move to the next finding without pausing. After all findings are processed, present a summary:

```
Fixed [N] issues. More changes or done?
```

Wait for the user's response. If they provide more feedback, re-enter Step 2 in Conversational mode with the new text. If they say "done" (or any equivalent), proceed to Step 4.

---

## Step 4 — Update manifest

Merge refinement metadata back into `.last-push.json`:

```json
{
  "lastRefinedAt": "[ISO 8601 timestamp]",
  "refinements": [previous count + number of fixes applied]
}
```

Preserve all existing fields. Only `lastRefinedAt` and `refinements` are updated or added.

Report completion:

```
Done. Manifest updated — [N] total refinements on this output.
```

---

## Rules

1. **One fix at a time.** Never batch multiple `use_figma` calls for different findings into a single call. Apply each fix independently so failures are isolated and reversible.
2. **Screenshot before AND after every fix.** This is not optional — it provides visual confirmation for the user and catches unexpected side effects.
3. **Preserve static HTML.** When fixing content via HTML re-generation, only change the specific element targeted by the finding. Do not restructure, reformat, or improve surrounding content.
4. **Follow `figma-output.md`.** All `use_figma` calls must conform to the shared Figma output rules: no hardcoded hex, auto-layout on every frame, descriptive layer names, sequential execution.
5. **Sequential execution.** Never run `use_figma` calls in parallel. Complete each fix (including the after-screenshot) before starting the next.
