# Post-Push Parity Check

## When to run

Immediately after all `use_figma` calls complete, before presenting results to the designer. The parity check is a mandatory gate — do not summarize or declare success until every check has passed or been explicitly skipped.

## Procedure

### 1. Screenshot each pushed element

Call `get_screenshot` on every node ID that was created or modified during the push. Capture each screenshot individually so it can be compared against the HTML source.

```
get_screenshot({ fileKey: "<figma-file-key>", nodeId: "<node-id>" })
```

Repeat for every entry in `pushedNodes`.

### 2. Present side-by-side

Show the designer both views together:

- HTML preview URL (local file path or hosted URL for the static HTML output)
- Figma screenshots captured in step 1, one per pushed node

Present them in document order — the same order the nodes were pushed.

### 3. Automated checklist

For each pushed node, evaluate all five checks and record the result in a table.

| Check | Priority | Pass condition |
|---|---|---|
| Element count | P0 | Number of child nodes in Figma matches number of logical elements in HTML source |
| Clipping height/width | P0 | No frame or group has a clipping dimension less than 10px |
| Empty text nodes | P0 | Every text layer contains at least one visible character |
| Missing children | P1 | No expected child component is absent from the Figma node tree |
| Sizing mismatch | P1 | No element's Figma size is more than 2x or less than 0.5x its intended size |

P0 failures must be fixed before presenting to the designer. P1 failures must be surfaced but may be skipped at the designer's discretion.

### 4. Report results

After evaluating all checks, output the results in this exact format:

```
Parity check results

Card 1 — Hero Section
  Element count      OK
  Clipping           OK
  Empty text nodes   OK
  Missing children   WARNING — "icon-arrow" absent from node tree
  Sizing mismatch    OK

Card 2 — Feature Grid
  Element count      WARNING — HTML has 6 items, Figma shows 5
  Clipping           OK
  Empty text nodes   OK
  Missing children   OK
  Sizing mismatch    OK

Fix Card 2? (yes / skip / done)
```

One block per pushed node. List only the nodes that have at least one WARNING first, then all-OK nodes. End every report with the fix prompt referencing the first unfixed WARNING node.

### 5. Fix loop

Interpret the designer's response to the fix prompt:

- **yes** — identify the root cause of the WARNING, apply the correction via `use_figma`, re-capture `get_screenshot` for that node, re-run all five checks for that node, and output the updated result block. Then advance to the next WARNING node and repeat the fix prompt.
- **skip** — log the WARNING as accepted and advance to the next WARNING node. If no more WARNING nodes remain, proceed to step 6.
- **done** — end the fix loop immediately. Log all remaining unresolved WARNINGs as accepted and proceed to step 6.

Never re-run the full checklist for nodes that already passed. Only re-check the node that was just fixed.

### 6. Write push manifest

After the fix loop ends, write a `.last-push.json` file to the appropriate directory.

**Schema:**

```json
{
  "skill": "<skill-name>",
  "fileKey": "<figma-file-key>",
  "pageNodeId": "<page-node-id>",
  "pushedNodes": [
    { "id": "<node-id>", "label": "<human-readable label>" }
  ],
  "htmlFile": "<relative-path-to-static-html>",
  "prototypeFile": "<relative-path-to-prototype-or-null>",
  "pushedAt": "<ISO-8601-timestamp>"
}
```

**Field notes:**

- `skill` — the slug of the skill that performed the push (e.g. `generate-flow`, `component-brief`, `generate-presentation`, `create-component`)
- `fileKey` — Figma file key used for all `use_figma` calls in this session
- `pageNodeId` — node ID of the Figma page (not a frame — the top-level page)
- `pushedNodes` — one entry per node pushed; `label` is the human-readable name shown in the Figma layers panel
- `htmlFile` — path relative to the project root of the static HTML output file
- `prototypeFile` — path relative to the project root of the prototype file, or `null` if none was generated
- `pushedAt` — ISO 8601 timestamp at the moment the manifest is written (e.g. `2026-03-27T14:32:00Z`)

**Manifest locations by skill:**

| Skill | Manifest path |
|---|---|
| `generate-flow` | `{project_dir}/components/flows/.last-push.json` |
| `component-brief` | `{project_dir}/components/{name}/.last-push.json` |
| `generate-presentation` | `{project_dir}/presentations/{slug}/.last-push.json` |
| `create-component` | `{project_dir}/components/{name}/.last-push.json` |

Write the manifest as the final step. Do not prompt the designer for confirmation before writing it.

## Integration pattern

Each output skill adds the following step text at the end of its procedure, after all `use_figma` calls:

```
## Step N: Parity check

Read reference: @references/parity-check.md

Run the full post-push parity check procedure:
1. Screenshot each pushed node with get_screenshot
2. Present HTML preview URL alongside Figma screenshots
3. Run the 5-item automated checklist for each node
4. Report results in the required format and enter the fix loop
5. Write .last-push.json to the correct manifest location
```

Replace `N` with the actual step number in context. Skills must not declare completion or present a final summary until the parity check procedure is finished and the manifest has been written.
