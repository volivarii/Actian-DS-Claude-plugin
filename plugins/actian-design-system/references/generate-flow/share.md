# generate-flow — default encapsulated deliverable

`flows/[feature].html` is the **default output** of every generate-flow run: a
single self-contained HTML file that opens offline from `file://`, is safe to
email or drop on a static host, and serves two purposes simultaneously:

1. **Streaming preview** — re-emitted at each screen as it is built, so you see
   the flow grow live in your browser before the run finishes.
2. **Final deliverable** — the same file is the shareable/exportable artifact
   handed to stakeholders, reviewers, or anyone who doesn't use Figma.

No flag is required. The file is emitted automatically on every run.

## Behavior

- Rendered via `assemble-preview.js --type flow-share` — re-reads the
  already-validated `flow-data.json` (no extra model calls).
- Output path: `{project_working_directory}/flows/[feature].html`
- Command (for manual re-emit):
  ```bash
  source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" \
    {project_working_directory}/flows/flow-data.json --type flow-share \
    -o {project_working_directory}/flows/[feature].html
  ```
- Surfaced to the user as:
  `Flow ready → {project_working_directory}/flows/[feature].html  (open in a browser or send the file)`
- Fail-open: a render error is surfaced and skipped; it never blocks the run.

## Two in-page views

The file contains two switchable views:

- **Prototype** — a clickable, screen-by-screen walkthrough.
- **Overview** — all screens side-by-side for at-a-glance review.

Per-screen HTML is byte-identical between the streaming preview and the final
deliverable (both call the shared `renderScreen`).

## Guarantees

- **Offline / self-contained:** zero external `http(s)://` resource loads
  (Alpine inlined from `templates/vendor/`, flow CSS + tokens inlined,
  system-font stack — no Google Fonts).
- **Audience-safe:** the visible header shows feature · app · date · plugin
  version only. Full provenance (skill, prompt, model, duration) is preserved in
  a leading HTML comment so the generation-card rule is satisfied without
  exposing the prompt/model to viewers.

## Figma push (opt-in)

The HTML deliverable is the default. Figma push is opt-in via `--push`, or
triggered automatically when the run exits the final gate and the user confirms.
Refine / iterate / branch flows still push to Figma as their primary action
(they operate on an existing Figma frame).

## Framing

This is a **prototype that looks like the DS, not the DS itself** (FM lo-fi
fidelity). Hi-fi DS-Kit rendering is a separate sub-project.
