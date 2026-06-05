# generate-flow — `--share` (shareable deliverable)

`--share` emits a **single self-contained HTML file** alongside the normal flow:
a clickable Prototype + an all-screens Overview in one file that opens offline
from `file://` and is safe to email or drop on a static host. It is independent
of and composable with the Figma push.

## Behavior

- Runs after the final clean preview render (Step 6.5), before the Figma push — it reads the already-validated flow-data.json and is independent of the push (it runs whether or not you push).
- Re-uses the validated `flow-data.json` — no regeneration, no extra model calls.
- Output: `{project_working_directory}/flows/[feature].html`
  (note: the live preview is `[feature]-flow.html`; the deliverable drops `-flow`).
- Command:
  ```bash
  source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" \
    {project_working_directory}/flows/flow-data.json --type flow-share \
    -o {project_working_directory}/flows/[feature].html
  ```
- Print, surfacing the real working-dir path (NOT a Cowork `outputs/` mirror):
  `Shareable prototype ready → {project_working_directory}/flows/[feature].html  (open in a browser or send the file)`
- Fail-open: a flow-share render error is surfaced and skipped; it never blocks
  the run (parity with the Step 6.5 preview).

## Guarantees

- **Offline / self-contained:** zero external `http(s)://` resource loads
  (Alpine inlined from `templates/vendor/`, flow CSS + tokens inlined,
  system-font stack — no Google Fonts).
- **Audience-safe:** the visible header shows feature · app · date · plugin
  version only. Full provenance (skill, prompt, model, duration) is preserved in
  a leading HTML comment so the generation-card rule is satisfied without
  exposing the prompt/model to viewers.

## Framing

This is a **prototype that looks like the DS, not the DS itself** (FM lo-fi
fidelity). Hi-fi DS-Kit rendering is a separate sub-project.
