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

### 5.5. Run changelog (if previous manifest exists)

If a `.last-push.json` already exists at the manifest location, run the changelog script before overwriting:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/changelog/changelog.js" \
  --previous <manifest-path>/.last-push.json \
  --source <source-data-file> \
  --tokens "${CLAUDE_PLUGIN_ROOT}/vendor/tokens/tokens.json"
```

Report the changelog output to the user. If the previous manifest doesn't exist (first push), the script outputs "First push — no changelog" and exits cleanly.

### 6. Write push manifest

After the fix loop ends, write a `.last-push.json` file to the appropriate directory.

**`pushedNodes[].screenId` (v1.56.0+):** when writing each `pushedNodes` entry, set
`screenId` to the matching `screens[i].id` from `flow-data.json`. Index parity:
`pushedNodes[i]` corresponds to `screens[i]` in push order. This field is required for
B-refine.2 refine resolution (`scripts/lib/resolve-unit.js`); refines against manifests that
omit it fall through to greenfield with a documented warning.

**Schema:**

```json
{
  "skill": "<skill-name>",
  "fileKey": "<figma-file-key>",
  "pageNodeId": "<page-node-id>",
  "pushedNodes": [
    {
      "id": "<node-id>",
      "label": "<human-readable label>",
      "screenId": "<kebab-case-screen-id>",
      "tier": "recognized|adapted|improvised",
      "confidence": 0.85,
      "matchedRecipe": "<recipe-id>" | null,
      "composition": ["<id>", "<id>"] | null,
      "justification": "<string>" | null
    }
  ],
  "htmlFile": "<relative-path-to-static-html>",
  "prototypeFile": "<relative-path-to-prototype-or-null>",
  "pushedAt": "<ISO-8601-timestamp>",
  "sourceHash": "<sha256-hex-of-source-data-file>",
  "componentKeys": ["<unique-component-keys-used>"],
  "tokenHash": "<sha256-hex-of-tokens-file>",
  "propertyDefaultsHash": {
    "fm": "<sha256-hex-of-fmkit-property-defaults>",
    "ds": "<sha256-hex-of-dskit-property-defaults>",
    "meta": "<sha256-hex-of-metakit-property-defaults>"
  }
}
```

**Field notes:**

- `skill` — the slug of the skill that performed the push (e.g. `generate-flow`, `component-brief`, `generate-presentation`, `create-component`)
- `fileKey` — Figma file key used for all `use_figma` calls in this session
- `pageNodeId` — node ID of the Figma page (not a frame — the top-level page)
- `pushedNodes` — one entry per node pushed. Each entry contains:
  - `id` (string, required) — Figma node ID of the pushed unit root
  - `label` (string, required) — human-readable name shown in the Figma layers panel
  - `screenId` (string|null, optional, since v1.56.0) — kebab-case data-model id from `flow-data.json.screens[].id`. Required for B-refine.2 refine resolution (`scripts/lib/resolve-unit.js`). Manifests written before v1.56.0 omit this; refines against those manifests fall through to greenfield generation with a documented warning.
  - `tier` (string, optional) — classifier output: `"recognized"` | `"adapted"` | `"improvised"`
  - `confidence` (number, optional) — 0.0 to 1.0; classifier confidence
  - `matchedRecipe` (string|null, optional) — recipe ID at tier 1; at tier 2 (deviation sub-case) the deviated-from recipe ID; null when tier 2 is a composition or when tier 3
  - `composition` (array|null, optional) — recipe IDs at tier 2, null otherwise
  - `justification` (string|null, optional) — required (non-null, ≥30 chars) when `tier` is `"adapted"` or `"improvised"`; null otherwise. The same field on the source `flow-data.json` screen object carries the same value (see `schemas/flow-data.schema.json`).

  **Per-tier field rules** (within each `pushedNodes` entry):
  - **Tier 1 (recognized):** `matchedRecipe` set, `composition` null, `justification` null
  - **Tier 2 (adapted — composition):** `matchedRecipe` null, `composition` set, `justification` set (non-empty, ≥30 chars)
  - **Tier 2 (adapted — deviation from base):** `matchedRecipe` set (the deviated-from recipe ID), `composition` null, `justification` set (non-empty, ≥30 chars explaining the deviation)
  - **Tier 3 (improvised):** `matchedRecipe` null, `composition` null, `justification` set (≥30 chars; lists rejected archetypes)

  Pre-tier manifests **omit** the `tier` field on entries. Tooling that reads these manifests should treat a missing `tier` as the synthetic in-memory value `"unknown"` — this value is **not** part of the on-disk enum. No data migration required; tier metadata is added on the next push that runs the classifier.
- `htmlFile` — path relative to the project root of the static HTML output file
- `prototypeFile` — path relative to the project root of the prototype file, or `null` if none was generated
- `pushedAt` — ISO 8601 timestamp at the moment the manifest is written (e.g. `2026-03-27T14:32:00Z`)
- `sourceHash` — SHA-256 hex digest of the source data file (e.g., `flow-data.json`, `brief-data.json`) at push time. Enables detecting if source data changed since last push.
- `componentKeys` — deduplicated array of Figma component keys imported during this push. Enables usage analytics and changelog diffs between pushes.
- `tokenHash` — SHA-256 hex digest of `vendor/tokens/tokens.json` at push time. Enables detecting token drift — if tokens changed since last push, outputs may need regeneration.
- `propertyDefaultsHash` — per-kit SHA-256 hex digests of component property defaults (text/boolean default values) at push time. Computed via `computePropertyDefaultsHashes({ fm, ds, meta })` from `scripts/changelog/changelog.js`. Enables detecting when a designer edits component default values upstream between syncs.

**Manifest locations by skill:**

| Skill | Manifest path |
|---|---|
| `generate-flow` | `{project_dir}/flows/.last-push.json` |
| `component-brief` | `{project_dir}/components/{name}/.last-push.json` |
| `generate-presentation` | `{project_dir}/presentations/{slug}/.last-push.json` |
| `create-component` | `{project_dir}/components/{name}/.last-push.json` |

Write the manifest as the final step. Do not prompt the designer for confirmation before writing it.

### Snapshot sidecar (v1.56.0+)

Alongside `.last-push.json`, a sibling file `flow-data.snapshot.json` carries the full
`flow-data.json` snapshot at push time. The `/generate-flow` skill writes it via
`scripts/lib/snapshot-store.js` as the very last step of the push sequence (after
`.last-push.json`). The refine path (`SKILL.md` Refine shape Behavior) reads it via
`snapshot-store.read()` to load the prior data model for AI editing.

Schema: identical to `flow-data.json` (no envelope, no metadata wrapper). Pure passthrough.

Lifetime: rewritten on every successful push. Missing or corrupt → refine treats as miss
and falls through to greenfield. Out-of-band cleanup not needed.

### Computing hashes and collecting keys

Before writing the manifest, compute the enrichment fields:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
SOURCE_HASH=$("$NODE_BIN" -e "process.stdout.write(require('crypto').createHash('sha256').update(require('fs').readFileSync('$SOURCE_FILE')).digest('hex'))")
TOKEN_HASH=$("$NODE_BIN" -e "process.stdout.write(require('crypto').createHash('sha256').update(require('fs').readFileSync('${CLAUDE_PLUGIN_ROOT}/vendor/tokens/tokens.json')).digest('hex'))")
PROPERTY_DEFAULTS_HASH=$("$NODE_BIN" -e "
var changelog = require('${CLAUDE_PLUGIN_ROOT}/scripts/changelog/changelog.js');
var path = require('path');
var fs = require('fs');
var root = '${CLAUDE_PLUGIN_ROOT}';
var registries = {
  fm:   JSON.parse(fs.readFileSync(path.join(root, 'vendor', 'components', 'registries', 'fmkit.json'), 'utf8')),
  ds:   JSON.parse(fs.readFileSync(path.join(root, 'vendor', 'components', 'registries', 'dskit.json'), 'utf8')),
  meta: JSON.parse(fs.readFileSync(path.join(root, 'vendor', 'components', 'registries', 'metakit.json'), 'utf8'))
};
process.stdout.write(JSON.stringify(changelog.computePropertyDefaultsHashes(registries)));
")
```

For `componentKeys`: during the push step, collect the component key from every `use_figma` call that imports a component instance. Deduplicate the list before writing.

For `propertyDefaultsHash`: include the JSON object produced by `PROPERTY_DEFAULTS_HASH` above as the `propertyDefaultsHash` field. It is a `{ fm, ds, meta }` object of SHA-256 hex strings.

`$SOURCE_FILE` is the path to the source data file:
- `generate-flow`: the `flow-data.json` file
- `component-brief`: the `brief-data.json` file
- `generate-presentation`: the `presentation-data.json` file
- `create-component`: the primary data file produced during build

### Tier summary line

After all parity checks complete, output a tier summary on a single line:

```text
Tiers: <N1> recognized, <N2> adapted, <N3> improvised
```

Where N1, N2, N3 are counts of `pushedNodes` entries at each tier. If no entries have a `tier` field (pre-tier output), omit the summary line entirely.

If any tier is improvised (N3 > 0), append on a second line:

```text
Review tier-3 justification before approving push.
```

This is informational. Designer may proceed without acting on it. Justifications are visible in the GenLog card on the pushed Figma frame and in the per-node `pushedNodes[i].justification` field of the manifest.

## Integration pattern

Each output skill adds the following step text at the end of its procedure, after all `use_figma` calls:

```
## Step N: Parity check

Read reference: @references/figma/parity-check.md

Run the full post-push parity check procedure:
1. Screenshot each pushed node with get_screenshot
2. Present HTML preview URL alongside Figma screenshots
3. Run the 5-item automated checklist for each node
4. Report results in the required format and enter the fix loop
5. Write .last-push.json to the correct manifest location
```

## Scope-aware behavior (v1.55.0+ / B-refine.1)

Parity is opt-in (per CLAUDE.md "Parity check is opt-in — only run when the user asks"). When the designer requests parity AND the run scope is non-full (`single-unit:<id>` or `multi-unit:[...]`), the procedure scopes the screenshot loop to the changed units only:

- Single-unit refine → screenshot only that unit's frame, run all 5 checks against it.
- Multi-unit refine → screenshot only the listed units' frames.
- Full regenerate → existing whole-flow procedure.

Designer never sees parity findings for screens they didn't touch — eliminates noise that would otherwise drown out the actual refine result. The `gateConfig.skipWhenScope` pattern is the JS-level enforcement when parity is implemented as a callable module; until then this rule is doc-driven and the skill enforces it at Step N.

If a designer wants whole-flow parity even on a refine (e.g., to check whether a refine introduced a regression elsewhere), they can pass `--check-parity full` explicitly.

Replace `N` with the actual step number in context. Skills must not declare completion or present a final summary until the parity check procedure is finished and the manifest has been written.
