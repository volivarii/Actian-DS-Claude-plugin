---
name: design-proposal
description: Propose a design for a component-scale ticket as a reasoned document. One answer sentence, the terrain the feature sits on, then one block per decision the ticket forces: two to four options drawn inside the surface the question lives on, a comparison, a pick with reasons that name the row they argue from, and what the pick costs. Use for "approaches", "concepts", "options", "how should we", "which is best", a pasted ticket. No Figma push.
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

One offline HTML document at `{project_working_directory}/proposals/<slug>.html`, in eight elements: the
answer in one sentence above the picks; the terrain, a drawing of the places this touches, omitted when
there is only one; the decision table of question, pick and cost, omitted when there is one decision; the
briefing of goals and non-goals, the product facts and the research; then one block per decision, each
with its options drawn side by side at one width, a comparison, and a pick whose reasons name the rows
they argue from and whose cost says what ships with it; what is still open, when anything is; what this
changes for an admin and a user; and one line of latitude.
`<slug>` is the ticket id lower-cased when there is one, else a kebab-case of the title, for example
`dip-i-496.html`; a re-render with `--from` lands on the same file. Its source is
`proposals/proposal-data.json`, which you author. Use this skill for component-scale questions (a menu, a
field, a card, a badge, a dialog). A multi-screen product flow is `/generate-flow`; a Figma push is
`/generate-flow --push`. A proposal never pushes: when the request says "push to Figma" or "in Figma", say
so in one line and offer `/generate-flow`.

## Input shapes

| Shape | Pattern | Example |
|---|---|---|
| Request | prose, with or without a ticket already in context | `/design-proposal show a user their roles in the account menu` |
| Ticket | a ticket id, pasted text, or an attached PDF or screenshots | `/design-proposal DIP-I-496` |
| Re-render | `--from proposals/proposal-data.json` after edits | `/design-proposal --from proposals/proposal-data.json` |

## Flags

| Flag | Default | Behavior |
|---|---|---|
| `--concepts N` | 3 | Number of options inside a decision, 2 to 4 |
| `--no-research` | off | Skip the web research; the document says so. "skip research" in the request does the same |
| `--no-prompt` | off | Kept for compatibility; same as `--no-research` (this skill asks no question) |
| `--from <path>` | none | Validate and assemble an existing data file; no reading, no decisions in chat. A file authored before `2026.9.30` carries `approaches` and is refused with one P0 naming `scripts/migrations/proposal-approaches-to-decisions.js`; convert it, then write the three fields the converter leaves empty. A file authored before `2026.9.28` also has no `scope` |

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

**Step 4, decisions in chat.** First the scope in two lines: what this is for (the goals, from the ticket)
and what it is not doing (the non-goals). Then name the decisions: one per question the feature forces
that a reader could answer differently, at most four, and one is the common case. A question that would
change a pick is a decision or that decision's blocker, never an open question. Then, under each
decision, N options, each a bold name and two lines: what it is, and the case where it breaks; and one
sentence on which one you would pick and what it costs. No file yet. The decomposition is what the reader
pushes back on here, and that is far cheaper than pushing back on three rendered blocks.

**Step 5, document.** Read `references/design-proposal/document-authoring.md` and the palette in
`references/ds-rules/fm-css-reference.md` (nothing else). Author `proposals/proposal-data.json` against
`schemas/proposal-data.schema.json`: `meta.title` is the document title, `meta.date` is today's date,
`meta.skill` is `design-proposal`, `meta.apps` lists the app slugs; `answer` (one sentence, what we are
doing), `context` (`product` is three to six facts, one line each, not a paragraph), `scope` (one to four
goals and one to four non-goals, both from the ticket, never invented: the non-goals are what stops
a reviewer scoping the work sideways), `research`, `breadboard` (two to six places and the lines between
them, required when the places span more than one app, omitted for a single place), `decisions` (the ones
you named in Step 4, each with its `options` drawn inside their anchor, in flow, `width` sized to the
idea, with their `screens[]` lists; its own `comparison` with criteria from the ticket's goal, the product
read, or cost; and a `pick` whose every reason names a `criterionId` in that same comparison, plus a
`cost` saying what ships with it; a `blocker` when a question would change the pick), `openQuestions` (at
most four non-blocking rabbit holes or open questions; omit the field when the proposal genuinely settles
everything, never invent one), `change` (admin side, user side) and `latitude` (one line). Then:

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
in Cowork it appears in the panel)`. The document does not carry these, so say them: offer, one line
each, "adjust" (add an option, compare on another criterion, show an option in another state, drop the
research: edit the data file, re-run with `--from`) and "make <option> a flow" (its `screens[]` is the
brief: `/generate-flow` with those screens and the option's note; the picked option of the first decision
when none is named).

## Rules

- Time budget: Steps 1 to 4 in under three minutes of reading, research included; the two references in
  Step 5 are the whole read. Do not open the renderer, the schema beyond its examples, or the vendored
  component map.
- The header strip, the app label and the nav are not yours to draw; the assembler adds the strip.
- No hex colours, no scripts, no external loads, no em dashes, no invented product names: the validator
  checks each, over every text field, and a document that needed a second validator pass is still fine.
  Report the pass count.
- Terminology follows the vendored app-context; when a validator line contradicts the ticket's own words,
  keep the ticket's words and say so in chat, do not silence the gate. On rationale prose these gates
  point rather than rule: keep the word when it is the ordinary English one, and say which ones you kept.
- A `proposal-data.json` written before `2026.9.30` carries `approaches`, `comparison` and
  `recommendation`, and is converted with `scripts/migrations/proposal-approaches-to-decisions.js`. It
  moves the structure only; the three fields it leaves empty (each reason's `criterionId`, `pick.cost`
  and `latitude`) are yours to write, because the old shape never carried them.
- The data file is the source. Every follow-up edits it and re-renders; the HTML is never hand-edited.

## References

- `references/design-proposal/document-authoring.md`, the sections, the fragment contract, the conventions
- `references/ds-rules/fm-css-reference.md`, the Fat Marker palette and component styles
- `schemas/proposal-data.schema.json`, the data contract, with an example on every field
- `references/context/ux-patterns.md`, when research runs
