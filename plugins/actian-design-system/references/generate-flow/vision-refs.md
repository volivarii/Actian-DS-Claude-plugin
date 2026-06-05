# Vision reference extraction (`--ref` / C-vision)

The image→structure fingerprint-extraction pipeline used only when `generate-flow`
is given a reference (`--ref <url>` populating `meta.references[]`). Loaded on demand
from `skills/generate-flow/SKILL.md` (Pipeline step 4.5). Opt-in: skipped entirely
when `meta.references` is empty.

## Contents
- When it runs + per-ref loop
- Vision-extraction prompt template
- Failure-mode dispatch
- Pass-through to screen-generators

4.5. **Vision analysis on `meta.references[]`** (C-vision, v1.57.0+) — when `--ref <url>` was provided and `meta.references[]` is non-empty, run the vision pipeline before building flow-data. Skip entirely when `meta.references` is missing or empty (C-vision is opt-in).

   ```bash
   # Load the canonical RECIPE_IDS for vision-prompt parameterization:
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" -e 'console.log(require("'${CLAUDE_PLUGIN_ROOT}'/scripts/recipes/fingerprint-schema.js").RECIPE_IDS.join(", "))'
   ```

   For each entry in `meta.references[]`:

   1. **Cache check** (refine path): if `meta.references[i].fingerprint` already exists AND the snapshot's prior URL for this index matches the current URL → reuse the cached fingerprint. Skip to the next ref. (B-refine.2's `flow-data.snapshot.json` preserves the prior `meta.references[]` shape.)
   2. Otherwise, call `mcp__claude_ai_Figma__get_screenshot` with the ref URL → image bytes.
   3. Run the vision-extraction prompt below on the screenshot, parameterized with the RECIPE_IDS list from the bash command above.
   4. Validate the output via `scripts/recipes/fingerprint-schema.js` `validateFingerprint`. If invalid: retry once with a "your previous output was invalid; emit STRICT JSON" reminder. If still invalid: drop the invalid fields, persist the rest. (Empty fingerprint objects are valid.)
   5. Persist on `meta.references[i].fingerprint`, including `extracted_at` as the current ISO timestamp.

   **Vision-extraction prompt template:**

   ```
   Analyze the attached screenshot and extract a structural fingerprint as STRICT JSON.

   Output ONLY this JSON object — no prose, no markdown fences:

   {
     "density": "high" | "medium" | "low",
     "hierarchy_depth": <integer 1-8>,
     "primary_components": [<lowercase strings, e.g., "toolbar", "table", "filter-chips">],
     "layout_archetype": <one of: <COPY THE RECIPE_IDS LIST FROM THE BASH OUTPUT HERE>>
   }

   Definitions:
   - density: information density of the layout. high = packed (many rows/columns/data points per screen). medium = balanced. low = generous whitespace, hero-style.
   - hierarchy_depth: levels of visual nesting from top-level container to leaf content. A page with sidebar + main + table-with-rows = depth 4.
   - primary_components: 3-7 dominant UI elements. Use generic noun phrases (e.g., "command palette", "filter chips"), not implementation names.
   - layout_archetype: closest match from the provided recipe ID list. If the screenshot does not clearly match any, OMIT the field entirely. Do not guess.
   ```

   **Failure-mode dispatch:**

   | Mode | Behavior |
   |------|----------|
   | `get_screenshot` MCP fails (auth, missing node, file deleted) | Per-ref warning to designer; mark this fingerprint as missing; continue with remaining refs. |
   | Vision returns malformed JSON | Retry once with strict-JSON reminder. If still invalid, soft-fail this ref. |
   | Vision returns `layout_archetype` not in `RECIPE_IDS` | Drop that field, keep density/depth/components. |
   | All refs fail | Loud abort: "Could not extract fingerprints from any reference. Drop `--ref` or fix the URLs and retry." |
   | Some refs fail | Proceed with successful subset. Surface a list of which URLs failed and why. |
   | `kind === "image"` URL provided | Loud error per Sprint A v1: "Image URLs not yet supported. Screenshot into a Figma frame first." Abort. |

   **Pass through to screen-generators:** the persisted `meta.references[]` (with fingerprints attached) flows into screen-generator agents' input as the "Reference fingerprints" block (see `agents/screen-generator.md`). Sequential mode reads them inline; parallel mode includes them in each batch's dispatch payload.
