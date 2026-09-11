---
name: design-proposal
description: Propose a design for a component-scale ticket as a reasoned document. Context from the app context and what you attach, bounded research, two to four approaches drawn inside the surface the ticket lives on, a comparison, a recommendation with reasons. Use for "approaches", "concepts", "options", "how should we", "which is best", a pasted ticket. No Figma push.
argument-hint: "[ticket text, id, request or attached PDF] [--concepts N] [--no-research] [--from proposals/proposal-data.json]"
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

One offline HTML document at `{project_working_directory}/proposals/<slug>.html`: where the ticket lives
today, what comparable products do, the approaches drawn inside one anchor surface with a verdict each,
a comparison table, and a recommendation with its reasons. `<slug>` is the ticket id lower-cased when
there is one, else a kebab-case of the title, for example `dip-i-496.html`; a re-render with `--from`
lands on the same file. Its source is `proposals/proposal-data.json`, which you author. Use this skill
for component-scale questions (a menu, a field, a card, a badge, a dialog). A multi-screen product flow
is `/generate-flow`; a Figma push is `/generate-flow --push`. A proposal never pushes: when the request
says "push to Figma" or "in Figma", say so in one line and offer `/generate-flow`.

## Input shapes

| Shape | Pattern | Example |
|---|---|---|
| Request | prose, with or without a ticket already in context | `/design-proposal show a user their roles in the account menu` |
| Ticket | a ticket id, pasted text, or an attached PDF or screenshots | `/design-proposal DIP-I-496` |
| Re-render | `--from proposals/proposal-data.json` after edits | `/design-proposal --from proposals/proposal-data.json` |

## Flags

| Flag | Default | Behavior |
|---|---|---|
| `--concepts N` | 3 | Number of approaches, 2 to 4 |
| `--no-research` | off | Skip the web research; the document says so. "skip research" in the request does the same |
| `--no-prompt` | off | Kept for compatibility; same as `--no-research` (this skill asks no question) |
| `--from <path>` | none | Validate and assemble an existing data file; no reading, no approaches in chat |

## Pipeline

**Step 1, frame.** Read the ticket and whatever the request attached (a PDF with the Read tool; screenshots
as images). Name the app or apps, the anchor surface (the product surface the ticket lives on, in the
product's words), the entity or "no entity", and the question in one sentence. Read the app's chrome:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/app-context/resolve-chrome.js" --app <administration|explorer|studio>
```

Say: `Proposal for <ticket or request>: <app label>, <anchor surface>, <entity or "no entity">. Question: <one sentence>.`

**Step 2, product read.** From app-context (the chrome you just read, the entity when there is one through
`resolve-patterns.js --entity <slug>`, and `vendor/app-context/dist/sections/<slug>.json` when the anchor is
a captured part) and from the attachment. Three to six sentences: the anchor surface, the data model
behind it, what an admin and a user see today. List the sources. When the anchor has no capture, say so
in one sentence; that sentence becomes `context.gap`. Ask for nothing.

**Step 3, research** (unless `--no-research` or the request says skip). At most two web searches, at most
five findings, each with a source named as text. Present them in chat in five lines or fewer. When it did
not run, the document says `Not researched: <why>`.

**Step 4, approaches in chat.** N approaches, each a bold name and two lines: what it is, and the case
where it breaks. Then one paragraph: the recommendation and why. No file yet. The reader pushes back here.

**Step 5, document.** Read `references/design-proposal/document-authoring.md` and the palette in
`references/ds-rules/fm-css-reference.md` (nothing else). Author `proposals/proposal-data.json` against
`schemas/proposal-data.schema.json`: `meta.title` is the document title, `meta.date` is today's date,
`meta.skill` is `design-proposal`, `meta.apps` lists the app slugs; `context`, `research`, `approaches`
(each drawn inside its anchor, in flow, `width` sized to the idea, with its `screens[]` list), `comparison`
(criteria from the ticket's goal, the product read, or cost) and `recommendation` (reasons that argue from
the table). Then:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-proposal.js" {project_working_directory}/proposals/proposal-data.json
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" {project_working_directory}/proposals/proposal-data.json --type proposal -o {project_working_directory}/proposals/<slug>.html
```

Fix every P0 and P1 the validator prints (a P1 terminology or avoid-word line names the word and the
replacement). Re-run until no P0 remains and every remaining P1 is one you have explained in chat (a
ticket's own word kept over a terminology hit); P2 is voice, fix it when cheap. Never hand-edit the HTML
output; edit the data file and re-assemble.

**Step 6, share.** Say: `Proposal ready: {project_working_directory}/proposals/<slug>.html (opens offline;
in Cowork it appears in the panel)`. Then offer, one line each: "adjust" (add an approach, compare on
another criterion, show an approach in another state, drop the research: edit the data file, re-run with
`--from`) and "make <approach> a flow" (its `screens[]` is the brief: `/generate-flow` with those screens
and the approach's note; the recommended approach when none is named).

## Rules

- Time budget: Steps 1 to 4 in under three minutes of reading, research included; the two references in
  Step 5 are the whole read. Do not open the renderer, the schema beyond its examples, or the vendored
  component map.
- The header strip, the app label and the nav are not yours to draw; the assembler adds the strip.
- No hex colours, no scripts, no external loads, no em dashes, no invented product names: the validator
  checks each, over every text field, and a document that needed a second validator pass is still fine.
  Report the pass count.
- Terminology follows the vendored app-context; when a validator line contradicts the ticket's own words,
  keep the ticket's words and say so in chat, do not silence the gate.
- The data file is the source. Every follow-up edits it and re-renders; the HTML is never hand-edited.

## References

- `references/design-proposal/document-authoring.md`, the sections, the fragment contract, the conventions
- `references/ds-rules/fm-css-reference.md`, the Fat Marker palette and component styles
- `schemas/proposal-data.schema.json`, the data contract, with an example on every field
- `references/context/ux-patterns.md`, when research runs
