# Refine shape — detection + behavior

Detailed detection rules and the step-by-step refine behavior for `generate-flow`'s
Refine mode (Figma URL + prose instruction). Loaded on demand from
`skills/generate-flow/SKILL.md`.

Refine is a shape the skill detects, not a flag. When detected (v1.56.0+), it runs a targeted edit through the engine in `scripts/lib/resolve-unit.js`, `scripts/lib/snapshot-store.js`, and `scripts/lib/derive-scope.js`, with the validator running scope-filtered (B-refine.1). It skips the standard 3-gate pipeline AND the Step 0.5 pre-gen gate, and pushes only the affected screen frames.

## Contents
- Detection (all must match)
- Behavior

### Detection (all must match)

1. A Figma URL is present in the input
2. Prose instruction is present alongside (not just whitespace, not only flags)
3. The URL resolves to a `pushedNodes[]` entry (single-screen refine) or the wrapper `pageNodeId` (whole-flow refine) in `.last-push.json`

If any condition fails, fall back per the table below.

| Failure | Resolver `reason` | Behavior |
|---------|-------------------|----------|
| URL provided, no prose instruction | n/a | Iterate mode (`--from <url>` semantics) |
| Prose provided, no URL | n/a | Standard generate from prompt |
| URL parses but `fileKey` doesn't match the local manifest | `file mismatch` | Treat as new generation; warn: "no prior push found, treating as new flow." |
| URL parses and file matches, but `nodeId` is not in `pushedNodes` and not the wrapper `pageNodeId` (designer copied a child or random node) | `node not in pushedNodes` | **Loud error:** "URL points to a nested element or wrapper. Copy the screen frame URL and retry." Do not silently fall through. |
| URL matches a `pushedNodes` entry but the manifest pre-dates v1.56.0 (no `screenId` field) | `manifest pre-dates screenId` | Treat as new generation; warn: "manifest is from an older plugin version; treating as new flow. Re-push once to enable surgical refines." |
| URL parses but the resolver string is malformed | `unparseable URL` | Treat as new generation; warn the designer the URL was unrecognized. |
| Manifest file unreadable / missing | `manifest unreadable` | Treat as new generation; warn: "no prior push manifest found at this location, treating as new flow." |
| Snapshot sidecar (`flow-data.snapshot.json`) missing or corrupt | n/a | Treat as new generation; warn: "no usable snapshot found, treating as new flow." |
| `derive-scope.js` returns `null` (AI's edit produced no actual data difference) | n/a | Abort: "no changes detected; nothing to push." Don't push or rewrite manifest. |
| Refine instruction the data model can't represent (e.g., "add a 3D shader") | n/a | Return error; suggest alternative or `/create-component`. |
| Refine instruction conflicts with glossary | n/a | Validator flags; companion presents conflict and asks. |
| Refine on a hifi unit | n/a | Re-route through `/generate-flow` refine on the underlying lo-fi data model (hifi is downstream); explain to designer. |

### Behavior (v1.56.0+)

> **Designer note:** Refine recreates affected screen frames (delete + re-push at the
> original wrapper position). Manual edits inside those frames are lost. Out-of-scope
> screen frames are preserved untouched — byte-identical layer trees before and after.
> If you need to keep manual edits inside a frame, don't refine it; copy the frame to a
> new wrapper first.

1. **Resolve URL.** Run `scripts/lib/resolve-unit.js` `resolveByUrl(url, manifestPath)`.
   The manifest path is inferred from the URL's enclosing project flow directory
   (typically `{project_working_directory}/flows/<feature>/.last-push.json`).
   - `kind === "miss"` → fall through per the failure table; emit the message tied to `reason`.
   - `kind === "single-unit"` → proceed with single-screen refine; `screenId` + `figmaNodeId` are returned.
   - `kind === "full"` → proceed; designer pasted the wrapper URL → whole-flow refine.

2. **Load snapshot.** Read `flow-data.snapshot.json` from the same manifest dir via
   `scripts/lib/snapshot-store.js` `read()`. If `null` → fall through to greenfield with the
   documented warning ("no usable snapshot found, treating as new flow").

3. **Apply edit inline.** AI reads prose + snapshot in context. Mutate the targeted screen
   object(s) in memory, then write the result as the new `flow-data.json`.
   No screen-generator agents — refine is a targeted edit, not parallel generation.

   **C-vision (v1.57.0+) note:** the snapshot's `meta.references[]` carries cached
   fingerprints from the prior push. Step 4.5 logic applies in refine: reuse fingerprints
   whose URL is unchanged in the new flow-data; re-analyze (via `get_screenshot` →
   vision-extract) only when a ref URL changed. The targeted edit may also add or remove
   refs entirely, in which case re-analysis follows the standard step 4.5 flow.

4. **Derive scope.** Run `scripts/lib/derive-scope.js` `deriveScope(snapshot, newData)`.
   - Returns a scope tag (`single-unit:<id>` | `multi-unit:[…]` | `full`) → continue.
   - Returns `null` → abort with `"no changes detected; nothing to push."` Don't push or rewrite manifest.

5. **Validate.** Run validator with the derived scope:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/<feature>/flow-data.json \
     --scope <scope-tag>
   ```
   Findings filtered to changed screens. P0s → patch in place per existing 3-strike protocol;
   warnings → proceed.

6. **Push surgically.** For each changed screen id (in original wrapper order):
   a. Look up Figma node id: `pushedNodes` entry where `screenId === <id>` → `id`.
   b. Note the frame's position index within the wrapper. Recreation must restore the same
      index, or refine reshuffles unrelated screens.
   c. `use_figma`: delete that frame.
   d. `use_figma`: recreate frame from the new screen data (same per-screen push pattern as
      the greenfield Step 6 of the standard push sequence) and insert at the recorded position.

   Skip wrapper / Cover Card / Research card / Tier Summary recreation — those persist.
   Update GenLog metadata fields (Date, Duration, Plugin Version) via `setProperties` on the
   existing GenLog instance. Emit the Scope text node sibling per existing Step 3b — the
   runtime scope variable from §4 flows directly here.

7. **Rewrite manifest + snapshot.** Update `.last-push.json`: refresh entries for changed
   screens (new Figma node ids, new tier/justification if changed), preserve untouched
   entries verbatim, refresh `sourceHash` / `pushedAt` / `componentKeys` / hash fields.
   Then call `scripts/lib/snapshot-store.js` `write(manifestDir, newFlowData)` as the last step.
