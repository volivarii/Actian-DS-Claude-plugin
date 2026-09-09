---
name: design-proposal
description: Propose a design for a component-scale ticket. Research if asked, then a few concepts with a recommendation, then a Fat Marker board (HTML, offline, captions per screen) grounded in the app context. Use for "approaches", "concepts", "options", "how should we", "which is best". No Figma push.
argument-hint: "[ticket text, id or request] [--concepts N] [--no-prompt] [--from proposals/proposal-data.json]"
---

# Design proposal

<!-- plugin-root:begin -->
## Where the plugin lives

Bare `references/`, `vendor/`, `agents/`, `recipes/`, `templates/` and `scripts/` paths in this file are relative to the plugin root: the directory holding `.claude-plugin/plugin.json`, the parent of the `skills/` directory named in the base directory above. They are never relative to the project working directory. Every command in this file expects `CLAUDE_PLUGIN_ROOT` to name that root. In Cowork, bash runs inside a VM where the plugin is mounted under `/sessions/<vm>/mnt/.remote-plugins/<plugin id>/`, so set the variable once per shell before anything else:
The line is idempotent: when a later bash call finds the variable empty, run the line again before the command.

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```
<!-- plugin-root:end -->

## What this produces

One offline HTML board at `{project_working_directory}/proposals/<slug>.html`: the screens of the
proposal side by side at their own width, each under its app header strip with a numbered label and a
one-sentence caption, and a recommendation block. Its source is `proposals/proposal-data.json`, which you
author. Use this skill for component-scale questions (a menu, a field, a card, a badge, a dialog). A
multi-screen product flow is `/generate-flow`; a Figma push is `/generate-flow --push`. A board never
pushes: when the request says "push to Figma" or "in Figma", say so in one line and offer `/generate-flow`.

## Input shapes

| Shape | Pattern | Example |
|---|---|---|
| Request | prose, with or without a ticket already in context | `/design-proposal show a user their roles in the account menu` |
| Ticket | a ticket id or pasted text | `/design-proposal DIP-I-496` |
| Re-render | `--from proposals/proposal-data.json` after edits | `/design-proposal --from proposals/proposal-data.json` |

## Flags

| Flag | Default | Behavior |
|---|---|---|
| `--concepts N` | 3 | Number of concepts to present, 2 to 4 |
| `--no-prompt` | off | Skip the one gate; research is skipped |
| `--from <path>` | none | Validate and assemble an existing data file; no concepts, no gate |

## Pipeline

**Step 1, frame.** Name the app or apps the ticket lives in, the entity if any, and the design question in
one sentence. Read the app's chrome facts and announce them:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/app-context/resolve-chrome.js" --app <administration|explorer|studio>
```

Say: `Proposal for <ticket or request>: <app label>, <entity or "no entity">. Question: <one sentence>.`

**Step 2, the one gate** (skipped by `--no-prompt`, default skip):

```
Research patterns before proposing?  skip (default) | yes
Reply: enter to skip, or "yes" to web-search how comparable products handle this.
```

On yes, run the companion's UX researcher role (web search, `references/context/ux-patterns.md`) and
present the findings in five lines or fewer before Step 3.

**Step 3, concepts in chat.** Present N concepts (default 3), each as a bold name and two lines: what it
is, and the case where it breaks. Then one paragraph: the recommendation and why. No file yet. If the
user picks a concept, the board shows its states; otherwise the board shows one screen per concept.

**Step 4, board.** Read `references/design-proposal/board-authoring.md` and the palette in
`references/ds-rules/fm-css-reference.md` (nothing else). Author `proposals/proposal-data.json` against
`schemas/proposal-data.schema.json`: `meta.date` is today's date, `meta.skill` is `design-proposal`,
`meta.apps` lists the app slugs, one screen per concept or state (at most 8), `width` sized to the idea,
`caption` naming the decision, `html` following the fragment contract. Then validate and assemble:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-proposal.js" {project_working_directory}/proposals/proposal-data.json
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" {project_working_directory}/proposals/proposal-data.json --type proposal -o {project_working_directory}/proposals/<slug>.html
```

Fix every P0 and P1 the validator prints (a P1 terminology or avoid-word line names the word and the
replacement), re-run until it prints `0 findings`, then assemble. Never hand-edit the HTML output; edit
the data file and re-assemble.

**Step 5, share.** Say: `Board ready: {project_working_directory}/proposals/<slug>.html (opens offline; in
Cowork it appears in the panel)`. Then offer, in one line each: "make it a flow" (`/generate-flow` with
the recommended concept as the brief) and "adjust <screen>" (edit the data file, re-run with `--from`).

## Rules

- Time budget: Steps 1 to 3 in under two minutes of reading; the two references in Step 4 are the whole
  read. Do not open the renderer, the schema beyond its examples, or the vendored component map.
- The header strip, the app label and the nav are not yours to draw; the assembler adds the strip.
- No hex colours, no scripts, no external loads, no em dashes, no invented product names: the validator
  checks each, and a board that needed a second validator pass is still fine. Report the pass count.
- Terminology follows the vendored app-context; when a validator line contradicts the ticket's own words,
  keep the ticket's words in the caption and say so in chat, do not silence the gate.

## References

- `references/design-proposal/board-authoring.md`, the fragment contract and the conventions
- `references/ds-rules/fm-css-reference.md`, the Fat Marker palette and component styles
- `schemas/proposal-data.schema.json`, the data contract
- `references/context/ux-patterns.md`, only when research is on
