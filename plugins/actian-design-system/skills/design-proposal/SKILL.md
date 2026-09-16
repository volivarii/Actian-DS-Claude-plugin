---
name: design-proposal
description: Propose a design for a component-scale ticket as a short document for PMs and designers. What we will build in one sentence, then each part drawn inside the product with why and what it costs, what to settle before building, and last, folded until opened, the other options, their comparison and the research. `--evaluate` stops after naming the decisions the ticket forces, with no document. Use for "approaches", "concepts", "options", "how should we", "which is best", a pasted ticket. No Figma push.
argument-hint: "[ticket text, id, request or attached PDF] [--concepts N] [--research all|none|<lanes>] [--no-prompt] [--evaluate] [--publish] [--from proposals/proposal-data.json]"
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

One offline HTML document at `{project_working_directory}/proposals/<slug>.html`, for a PM or designer
approving a direction, so it leads with what ships: the answer in one sentence; What ships, one row per
part, when there are two or more; one block per part, headed by what it builds, with the chosen drawing,
why, where it breaks and what it costs; how the parts connect; what to settle before building; what
changes for a user and an admin; the background; then, folded until opened, the other options with their
comparison and the research; the sources and one closing line. No question is printed as a heading.
`<slug>` is the ticket id lower-cased when there is one, else a kebab-case of the title, for example
`dip-i-496.html`; a re-render with `--from` lands on the same file. Its source is
`proposals/proposal-data.json`, which you author. Use this skill for component-scale questions (a menu, a
field, a card, a badge, a dialog). A multi-screen product flow is `/generate-flow`; a Figma push is
`/generate-flow --push`. A proposal never pushes: when the request says "push to Figma" or "in Figma", say
so in one line and offer `/generate-flow`. Under `--evaluate` there is no document, only the data file.

## Input shapes

| Shape | Pattern | Example |
|---|---|---|
| Request | prose, with or without a ticket already in context | `/design-proposal show a user their roles in the account menu` |
| Ticket | a ticket id, pasted text, or an attached PDF or screenshots | `/design-proposal DIP-I-496` |

## Flags

| Flag | Default | Behavior |
|---|---|---|
| `--concepts N` | 3 | Number of options inside a decision, 2 to 4 |
| `--research <lanes>` | gate | Answer the Step 3 gate without being asked: `all`, `none`, or lanes from `competitors,designSystems,ours,yours`, plus any refs you are pasting. `--no-research` is `none`; "skip research" in the request does the same |
| `--no-prompt` | off | Draw straight through: skip the Step 4 stop that asks before anything is drawn |
| `--evaluate` | off | Stop after the decisions. Writes `proposals/proposal-data.json` at `stage: evaluation`: the framing, the product read, the scope and the questions, with no options, no comparison and no picks. No research and no document. Refused together with `--from` |
| `--publish` | off | Publish the document as a shareable page at Step 6 without asking first; "Publishing" in `references/design-proposal/document-authoring.md` is the how. Refused together with `--evaluate`, which writes no document |
| `--from <path>` | none | Resume a data file. One at `stage: evaluation` resumes into a proposal, without re-reading the ticket or the product (see "The evaluation stage" below); a finished proposal is validated and re-assembled, with no reading and no decisions in chat. A file authored before `2026.9.30` carries `approaches` and is refused with one P0 naming `scripts/migrations/proposal-approaches-to-decisions.js`; convert it, then write the three fields the converter leaves empty. A file authored before `2026.9.28` also has no `scope` |

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

**Step 3, research.** A gate. Read "The research gate" in
`references/design-proposal/document-authoring.md`, which is the whole of it: ask which of `competitors`,
`designSystems`, `ours` (no web search) and `yours` (refs the reader pastes) to run, wait, dispatch
`ds-researcher`, present it in five lines. `--research <lanes>` answers the gate; `--no-prompt` runs `ours`
alone. Not under `--evaluate`; on a resume it runs here.

**Step 4, what you would build, in chat.** Work out the decisions: one per question the feature forces
that a reader could answer differently, at most four, one the common case; a question that would change a
pick is a decision or its blocker, never an open question. Each decision is a part of what ships. Say it
as a plan, not as questions, in plain words and under twenty lines: `What I'd build: <answer>`, then per
part `<n>. <Part>: <pick, one line>. Cost: <one line>. Also looked at: <option> (<why not>)`, then
`Not doing: <non-goals>` and `Change anything before I draw these?` No file yet.
**Then stop, and wait for a reply.** The parts and the picks are what a reader pushes back on, and here it costs a sentence;
after Step 5 it costs every drawing. A reader who knows the surface catches the pick that is right in the
abstract and wrong on their screen. `--no-prompt` skips it.

**The evaluation stage.** Only `--evaluate`, and `--from` a file at `stage: evaluation`, come here. `--evaluate` stops
here: write the decisions to `proposals/proposal-data.json` at `stage: evaluation`, validate it and say
what the ticket forces, as "The evaluation stage" in `references/design-proposal/document-authoring.md`
says; do not research, draw, compare, pick or write a document. `--from` a file already at that stage
is the resume, and enters here rather than at Step 1: read that section first, because the ticket and
the product are recorded in `source` and `context` and must not be read a second time.

**Step 5, document.** Read `references/design-proposal/document-authoring.md`, the palette in
`references/ds-rules/fm-css-reference.md` and the Actian writing rules in `vendor/content/dist/writing.md`
(nothing else). The writing rules govern every word: the labels inside a drawing and the document's own
prose. **Draw from the design system, never from
imagination:** list the components first, then compose the drawings out of them.

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" -e 'console.log(require(process.env.CLAUDE_PLUGIN_ROOT+"/scripts/lib/ds-components.js").componentList().join(", "))'
```

Every option declares `uses` (the slugs it composes) or `adds` (`component` and `why`) when the system
truly has no mechanism: a proposal may argue for a new component, it just has to say so. An unknown slug
is a P0.

Author `proposals/proposal-data.json` against `schemas/proposal-data.schema.json` (an example on every
field) and the reference's "The keys and what each one is for". `meta.date` is today. Five things the
schema cannot say: the `decisions` are the ones you named in Step 4 and no others, each naming its
`part`; every option is drawn **inside its anchor, in flow**, at a `width` sized to the idea; every `pick`
reason names a `criterionId` in that decision's own comparison; a question that would change a pick is
that decision's `blocker`, never an `openQuestions` entry; and every field fits its word limit, in plain
words (the reference's "Plain words" and "Word limits"). Then:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-proposal.js" {project_working_directory}/proposals/proposal-data.json
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" {project_working_directory}/proposals/proposal-data.json --type proposal -o {project_working_directory}/proposals/<slug>.html
```

Fix every P0 and P1 the validator prints (a P1 terminology or avoid-word line names the word and the
replacement; a `length` or `part` P1 is fixed, never explained). Re-run until no P0 remains and every remaining P1 is one you have explained in chat (a
ticket's own word kept over a terminology hit); P2 is voice, fix it when cheap. Never hand-edit the HTML
output; edit the data file and re-assemble.

**Step 6, share.** Say: `Proposal ready: {project_working_directory}/proposals/<slug>.html (opens offline;
in Cowork it appears in the panel)`. The document does not carry these, so offer them in one line each:
"adjust" (edit the data file, re-run with `--from`), "publish as a page" (`--publish` skips the ask) and
"make this a flow" (`/generate-flow --from proposals/proposal-data.json` composes every pick into one
screen list and a brief; `--decision <id>` takes one alone, `--option <id>` draws a rejected one).

## Rules

- Time budget: Steps 1 to 4 in under three minutes of reading, research included. One section of
  `document-authoring.md` at Step 3 and the three references at Step 5 are the whole read. Never open the
  renderer or the vendored component map.
- The header strip, the app label and the nav are not yours to draw; the assembler adds the strip.
- No hex colours, scripts, external loads, em dashes, invented product names or invented components: the
  validator checks each. A second pass is fine; report the pass count.
- Terminology follows the vendored app-context; when a validator line contradicts the ticket's own words,
  keep the ticket's words and say so in chat, never silence the gate. On rationale prose these gates point
  rather than rule: keep the ordinary English word, and say which ones you kept.
- The data file is the source: every follow-up edits it and re-renders, never the HTML.

## References

- `references/design-proposal/document-authoring.md`, the research gate, the sections, the fragment
  contract, publishing and the conventions
- `references/ds-rules/fm-css-reference.md`, the Fat Marker palette and component styles
- `schemas/proposal-data.schema.json`, `schemas/proposal-evaluation.schema.json`, `references/context/ux-patterns.md`
