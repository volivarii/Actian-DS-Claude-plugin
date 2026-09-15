# Authoring a proposal document

`proposals/proposal-data.json` is the source; `assemble-preview.js --type proposal` lays it out and
`validate-proposal.js` checks it. The schema (`schemas/proposal-data.schema.json`) carries an example on
every field; read its examples, not the renderer.

## The evaluation stage

`meta.stage` says where the file is. Absent or `"proposal"` is a finished document, which every file
written before this stage already is. `"evaluation"` is what `--evaluate` writes: the framing, the
product read, the scope and the questions, with no options, no comparison and no picks. It validates
against `schemas/proposal-evaluation.schema.json`, with the validator in Run below and only the
validator: the assembler reads a finished document and refuses an evaluation by the fields it lacks.

**What an evaluation carries.** `meta` as below plus `stage` `"evaluation"`; `source` as the ticket
arrived, where `system`, `id` and `body` are all required, because an evaluation claims what a ticket
forces and cannot make that claim without naming it; `context` and `scope` exactly as a document writes
them; `research` with `ran` false, `findings` empty and `skippedBecause` set to
`"the evaluation names the decisions first; research runs against them on resume"`; `decisions[]` with
`id` and `question` alone, one to four, each question one sentence ending in a question mark and no two
alike; and `openQuestions` for what the product read could not settle, which a `context.gap` makes a P1
to leave empty. Nothing else: `answer`, `breadboard`, `change`, `latitude`, and a decision's `options`,
`comparison`, `pick` or `blocker` are each a P0 naming the field, because a half-filled evaluation is a
file lying about where it is, and the resume would then skip work that was never done.

**What it says in chat.** Under fifteen lines, and no document: the apps and the anchor, the decisions
numbered, the scope in one line, anything the product read could not ground, and
`Continue with: /design-proposal --from proposals/proposal-data.json`. `--no-research` alongside
`--evaluate` is accepted and does nothing, research being off already. `--from` alongside it is refused
in one line: `--from` runs the other way, and re-evaluating a ticket is another `--evaluate`.

**Research has not run yet, and saying it has is a P0.** `research.ran` is false at this stage with
a `skippedBecause`; the resume runs the research, aimed at the decisions this file names. That order
is the reason the stage exists, so claiming research at this stage is refused like any other field
an evaluation does not carry.

**What it draws.** Expect terminology and avoid-word P1s at this stage too, and expect most of them
on the ticket's own words: they run over `context.question`, `context.product[]`, `scope.goals[]`,
`decisions[].question` and `openQuestions[].text`, which is most of what an evaluation is. Read the
paragraph below on what a terminology P1 means; the answer is usually to keep the word and say so.

**Resuming one.** `--from` a file at `stage: evaluation` skips the frame and the product read. They are
recorded in `source` and `context`, reading the ticket or the product a second time produces a second,
different read, and neither field is rewritten. Run the research now instead, aimed at the decisions
the file names rather than at the ticket in general, and set `research.ran` true with its findings.
Then restate the decisions in one line each, author the options, the comparisons and the picks
against them, and set `meta.stage` to `proposal`. That last one is the step to miss: a complete,
correct proposal still marked `evaluation` draws a wall of P0s, one per field an evaluation may not
carry, and the way out is in each finding's advice rather than in any of their headlines. Adding, dropping or rewording a decision here is expected: the evaluation fixed the
framing, which is expensive, not the decomposition, which is judgement and may improve once the options
exist.

**A question that would change a pick** is a decision or that decision's `blocker` in a proposal.
An evaluation has no `blocker`, and carrying one is a P0, because a stage that has not weighed any
options cannot know which question would change a pick. So at this stage it is either its own
decision, when it is really a separate question, or an `openQuestions` entry, when it is a doubt
about a decision already named. The resume is where it becomes a `blocker`, once there are options
for it to block.

**A strict prefix.** Every key an evaluation carries has the same name, the same shape and the same
meaning it has in a finished document. Completing one adds keys and sets `meta.stage` to `"proposal"`;
it never renames or reshapes one. That is what makes the resume trivial and what stops the two stages
drifting into two data models.

## The keys and what each one is for

The document leads with the answer, draws the terrain, then argues one decision at a time.

- **meta**: `title`, `date`, `apps`, `skill`, plus `ticket`, `prompt` and `model` when you have them.
- **answer**: one sentence, what we are doing. It sits above the picks. If it needs two sentences the
  second one belongs inside a decision.
- **source** (optional in a proposal, required in an evaluation): the ticket as it arrived,
  `{ system, id, url, title, body }`. Nothing in the document reads it; it is the input record.
- **context**: `question` (the one sentence from Step 1), `product` (three to six facts, **one line
  each, as separate strings, never a paragraph**: the anchor surface, the data model behind it, what an
  admin and a user see today), `sources` (one line each, `app-context: ...` or `attachment: ...`),
  `gap` (one sentence, only when the anchor surface has no capture in app-context).
- **scope**: one to four goals and one to four non-goals. A goal comes from the ticket. A non-goal is
  a thing a reviewer would plausibly ask for that this change deliberately does not do; naming it is
  what stops the ask. Do not invent either to fill the slots; two of each is a full answer.
- **research**: `ran` and up to five `findings` of `{ claim, source }`, the source as text (the document
  loads nothing). When research did not run: `ran: false`, `findings: []`, `skippedBecause`.
- **breadboard** (see below): `places[]` and `connections[]`, the terrain the decisions sit on.
- **decisions**: one to four. Each is self-contained: `id` (a slug), `question`, `options`, `comparison`,
  `pick`, and an optional `blocker`.
- **openQuestions**: at most four `{ kind, text }`, `kind` one of `rabbit hole` or `open question`.
  Non-blocking only. Omit the whole field when there are none; an invented question reads as padding
  and costs the document its credibility.
- **change**: `adminSide` and `userSide`, what this does to each.
- **latitude**: one line saying how much of this is fixed. The drawings are one way to answer the
  questions, not the only way.

`context.sources` is not printed in the briefing. It renders as **Where this came from**, the
document's last section before the latitude line, one row per source: the prefix becomes the
row's kind and the rest becomes its text, so `app-context: explorer chrome` reads as a kind
column beside a text column rather than as five lines each starting "app-context:". Write each
source as `app-context: <what you read>` or `attachment: <what it was>`. A source with no
recognised prefix still renders, unkinded. `context.gap` stays in the briefing, beside the facts
it qualifies: it says what the read could not reach, which is a caveat rather than a citation.

### Inside a decision

- **options**: two to four. Each has an `id` (a slug), a `name`, an `anchor` (`app` slug and the
  `surface` in the product's words), `whatItIs` and `breaksWhen` (one line each), a `verdict` (a few
  words, printed as a tag), a `screen` (`width`, `html`, and at most three `notes`, a phrase each) and
  `screens` (one to four entries in generate-flow's screen-list shape: `name`, `template` from
  `recipes/flow/_index.json`, `app`, `entity` or null, `note`).
- **comparison**: `criteria` rows (`id`, `label`, `source` one of `ticket goal`, `product fact`, `cost`)
  and `cells[optionId][criterionId] = { text, tone }` with `tone` one of `good`, `mixed`, `bad`. Three
  to six rows. Every criterion comes from the ticket's stated goal, a fact the product read established,
  or cost; never taste. The criteria are this decision's own: a row in a sibling decision is invisible
  here.
- **pick**: `optionId`, two to four `reasons` of `{ criterionId, text }`, and `cost`.
- **blocker** (optional): one sentence.

## How many decisions

One decision per question the feature forces that a reader could answer differently. Not one per
screen, not one per option you can think of: a question whose answer a reasonable reader could argue
with. A ticket that forces one question gets one decision, and that is the common case; the shape
degrades to a short document rather than a truncated long one.

The failure mode to avoid is the old shape wearing the new schema: a single decision carrying four
variants of one surface, when the ticket plainly forced a second question that then gets demoted to an
open question three sections away. If a question would change a pick, it is a decision or a blocker,
never an open question.

## A reason names the criterion it argues from

Every entry in `pick.reasons[]` carries a `criterionId` naming a row in **its own** decision's
comparison, and the validator fails a P0 on one that does not. This is the density rule made
structural: the argument becomes traceable, it renders as one line instead of a paragraph, and a
reader can check it against the row it claims.

A reason that cannot name a criterion is one of two things. It is taste, in which case it does not
belong in the document. Or it is a price rather than a win, in which case it belongs in `cost`.

## Every pick states its cost

`pick.cost` is required and an empty one is a P0. What risk ships with this choice is the thing a
product manager is actually reading for, and it is the half of the argument the old shape had nowhere
to put. One line: what this choice buys trouble on, not a hedge.

## A blocker is not an open question

A question that would change a pick if answered differently is that decision's `blocker` and lives in
its block, beside the pick it would change. Everything that does not change a pick is an
`openQuestions[]` entry at the end of the document. This is the RFC convention: unresolved questions
are ones that do not block approval, so a question that blocks approval must not be filed as one.

## The breadboard

`breadboard` is `{ places[], connections[] }`. A place is `{ id, name, app, affordances[], row, col,
isNew }`; a connection is `{ from, to, label, isNew }`. `to` names a place. `from` names a place, or an
affordance as `<placeId>/<n>` with `n` the 1-based index of the affordance the line leaves from. `row`
and `col` put the box on a grid, and the assembler computes the coordinates and routes each line
orthogonally through the gutters; omitting them means one row in declaration order.

**Places are surfaces, not screens.** A place is somewhere in the product a person is: a menu, a
settings page, a share dialog. Two states of one surface are one place. Two to six of them.

Required when the places span more than one app, which is exactly the case prose fails on, and the
validator raises a P1 when it is absent there. Omitted entirely for a single place. Optional in
between, where several places sit in one app.

## One anchor, N options

Inside a decision, every option is drawn inside the surface the question lives on, in the product's
words (`anchor.surface`), so the reader compares variants of one thing. When the options truly live on
different surfaces, each names its own anchor. The assembler renders the anchor app's header strip
above the drawing; do not draw an app name, a nav bar or an avatar strip.

## The fragment contract

- Classes come from the Fat Marker sheet; `references/ds-rules/fm-css-reference.md` shows the palette and
  the main components. `fm-base.css` also defines `fm-field-group`, `fm-input` with `fm-input__text`,
  `fm-toggle` (add `fm-toggle--on`), `fm-badge`, `fm-tag`, `fm-menu` with `fm-menu-item`, `fm-user` with
  `fm-user__avatar` and `fm-user__name`, and `fm-placeholder`; use them as named.
- `.fm-input-label` is a column flex container: it stacks its children. A badge beside a label needs its
  own row (`<span style="display:flex;gap:6px;align-items:center">` around the text and the badge).
- Colours are `--fm-*` variables only: `--fm-text-primary`, `--fm-text-secondary`, `--fm-text-tertiary`,
  `--fm-text-success`, `--fm-text-error`, `--fm-base-100` to `--fm-base-900`, `--fm-base-white`,
  `--fm-bg-grey`, `--fm-border`, `--fm-brand`, `--fm-brand-dark`, `--fm-brand-light`, `--fm-radius`,
  `--fm-shadow-default`. A hex or rgb value anywhere, prose included, is a P1 finding.
- **Draw in flow.** A menu, a popover or a panel is drawn as a block inside its anchor, at the top of the
  fragment, with `width:100%` or a fixed width; never `position:absolute` (P1). The frame grows with the
  drawing and nothing is clipped.
- No `<script>`, no `onclick`, no `javascript:` URL (P0). Clicks are declared: `data-toggle="<id>"` on the
  control and `id="<id>"` on the element it shows or hides, in the same drawing. Start a panel hidden by
  adding the `hidden` attribute. Ids are document-wide (P1 if reused).
- No `src` or `href` that starts with `http`, `https` or `//` (P0). The document opens offline.
- Every opened `div`, `span`, `p`, `section`, `button`, `a`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `th`,
  `label` and heading is closed (P0).
- Product words follow the vendored terminology and avoid-word rules; the validator runs both over every
  text field. No em dashes anywhere (P2): colon, comma or period.

## Conventions that make the document read as a proposal

- **Width to the idea, then the row decides.** 320 for a menu or popover, 360 to 400 for a form region,
  720 for a page region. The options of one decision sit in one row of a 1200px document with a 24px
  gap, so the count caps the width: two options fit at 588 each, three at 384, four at 282. A page-region
  width is therefore only ever a two-option choice.
- **The renderer equalises, it does not trust.** Within a decision the assembler takes the widest
  declared width, caps it at that row budget, and applies the result to every option in the decision, so
  the widest option raises its siblings and nobody can draw their favourite at 720 against a rival at
  320. Presentation quality moves a stakeholder's judgement in both directions, which is why this is
  enforced rather than asked for. A sibling declared at a different width is an informational P1, not an
  error: the drawing you get is the equalised one.
- **Emphasise the thing the ticket adds.** Wrap it in
  `style="border:2px dashed var(--fm-brand);background:var(--fm-brand-light);border-radius:var(--fm-radius);padding:8px 10px"`
  and add `<span class="fm-badge">New</span>` beside it. One emphasis per drawing.
- **Two lines, one verdict.** `whatItIs` says what it is; `breaksWhen` names the case it does not survive;
  `verdict` is the reader's shorthand ("Simple, caps at one group").
- **Notes are phrases.** At most three per drawing, each one the rationale of a part of it.
- **The screen list is the bridge.** `screens[]` describes the pages a flow of this option would show,
  not the drawing; `note` says what the option changes on that page.

## Draw the design system, or say what you are adding

Every option declares what its drawing is made of, and the validator resolves the claim against
the vendored component snapshot:

- **`uses`**: the component slugs the drawing composes. A slug the snapshot does not know is a
  **P0**, because an invented name wearing the shape of a real one is the exact failure this
  gate exists to catch, and the one a reader is least able to see.
- **`adds`**: `{ component, why }` for a mechanism the system does not have. This is not a
  failure. A proposal may argue for a new or changed component; it has to say so, because that
  is uncosted work and a reader should meet it beside the drawing rather than in a build ticket
  weeks later. A name the snapshot already knows draws a P1: then it is not an addition.
- Neither is a **P1**. A drawing that names nothing has not been checked against anything.

List the inventory before you draw, not after:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" -e 'console.log(require(process.env.CLAUDE_PLUGIN_ROOT+"/scripts/lib/ds-components.js").componentList().join(", "))'
```

**Why this is a gate and not advice.** The failure it catches is silent. A drawing that invents a
label, a summary line and a small table renders beautifully, validates clean against every other
check, and reads as a design; the first mechanism that notices the system was never consulted is
a design lead looking at the finished document. Advice in a reference is read once, by an author
who is already confident. A P0 fires every time.

The document prints `Built from <slugs>` quietly under each drawing, and prints an `adds` entry
loudly, in the brand colour, because those are two different messages.

## The document proposes; the reader decides

Nothing a reader sees says the decision has been made. The summary is **What we propose**, a
block is **Question N of M**, the winning column is **Proposed**, and the lead is **We propose**.
The data model still calls them `decisions[]` and `pick`, because that is what the author is
choosing between and what `--decision` and `--option` address by id, but those names never reach
the page. If you write "we decided" or "the decision" into a text field, you have handed the
reader a verdict instead of an argument.

## A decision block leads with the proposal

The block renders in three parts, in this order, and the renderer does it for you:

1. **The proposal.** The case for the pick on the document's left edge, the reasons, the cost
   and the blocker when there is one, with the picked option's drawing beside it on the right.
2. **Also considered.** Every other option, smaller, equal to each other, one line of annotation.
3. **How they compare.** The full table, with the proposed column marked.

What this asks of your authoring: the picked option's `whatItIs` and `breaksWhen` are read
directly under the drawing a reader is looking at, so `breaksWhen` on the pick is the most
load-bearing line in the block. It says where the thing we are proposing fails. Do not soften it.

A document with more than one decision also pins a bar naming each of them, which is how a
reader moves around nine thousand pixels of argument. The bar carries the `question`, so a
question that only makes sense after reading its own block is a question that needs rewriting.

A rejected option is skimmed, not weighed, so its `verdict` is what a reader actually reads of
it. Make the verdict the sentence you would say out loud if someone asked why it lost.

## A comparison cell is scanned, not read

Each cell renders as a mark on its own line with the phrase quiet beneath it, so the row of marks
reads in one pass. That only works if the phrase is short: **two to four words**, a fragment, no
sentence. "Three names, no total" works. "This option would require the user to open each group
in turn" does not, and pushes every cell in its row down a line.

## Length is a design constraint, not a preference

The document's job is to be read by someone who did not write it, in one sitting, before a
meeting. Every field below has a length that the layout was built for, and a field that runs
past it does not get truncated: it pushes the next thing off the screen.

- **A reason is one line.** It names its criterion and says why that row decided it. If it
  needs two clauses joined by "and", it is two reasons or it is the cost.
- **A cost is one line.** What this choice buys trouble on. Not a hedge, not a paragraph, and
  never a second reason wearing a cost's label.
- **A product fact is one line, and there are three to six of them.** Six one-line facts read;
  three three-line facts do not.
- **`whatItIs` and `breaksWhen` are one line each**, and `verdict` is a few words. The drawing
  carries the idea; these three say what a reader cannot see in it.
- **The answer is one sentence.** Nothing else sits in that section: the decision table below
  it is the summary, and repeating the picks above the table is how the document got long.

The document prints each decision's question exactly twice, once in the table and once as its
own heading, and each pick's name where a reader needs it: the table, the option card and the
comparison header. Anything you write that restates one of those is the third copy.

## Voice

The document never describes how it was made. No renderer, palette, schema, data file, flag or script
name in anything a reader sees, including the notes, the cells and the latitude line. Provenance is one
footer line saying who and when; the follow-ups ("adjust this", "make a pick a flow") are offered in
chat, where the author already is, and never printed in the document.

## What a terminology or avoid-word P1 means

Those two gates run over every text field, the rationale prose included: `answer`, `latitude`,
`pick.cost`, `pick.reasons[].text` and `blocker` as well as everything a reader sees on a drawing. They
are P1 rather than P0 because on rationale prose the right answer is often to keep the word. "The
recommendation stands" is English, not the product's Suggestion; "it avoids a new API surface" is not an
Output port. No regex separates a product noun from its ordinary sense, and these do not try.

So they point, they do not rule. The acceptance document draws no hits at all, because its wording was
settled against them. A real ticket is noisier: the DIP-I-522 run drew twenty P1s, seventeen of which
were the single word "item", which that ticket uses four times in its own text. Expect repetition, and
expect to keep the ticket's word. The whole procedure is the skill's: read each P1, keep or change the
word, and say in chat which ones you kept and why. Do not silence the gate.

## Publishing

Step 6 offers the document as a page, and `--publish` takes the offer without asking. What the link buys
over the file is the way back: a reader can comment on any part of the document and send that thread to
Claude, where it arrives attached to the decision it argues with. Say that line when you give the link.

The page is a second render of the same data file. `--fragment` drops the `<!doctype>`, `<head>` and
`<body>`, because the host supplies those and a fragment that keeps them nests one document inside
another:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" {project_working_directory}/proposals/proposal-data.json --type proposal --fragment -o {project_working_directory}/proposals/<slug>.artifact.html
```

Then publish that file with the Artifact tool: `favicon` the straightedge emoji, `description` the answer
sentence, no `title` (the fragment carries one), and the path exactly as written above, because a
re-publish of the same path redeploys the same link and any other path is a second artifact. On a
re-publish pass no `favicon`: the emoji is how a reader recognises the page, and a new one reads as a new
document.

The fragment is a render, not an edit: never hand-write or patch it, the same rule the HTML document
lives under. A proposal at `stage: evaluation` has no document, so it has no page either.

## Run

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-proposal.js" proposals/proposal-data.json
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" proposals/proposal-data.json --type proposal -o proposals/<slug>.html
```

Re-run until no P0 remains and every remaining P1 is one you have explained in chat; P2 is voice, fix it
when cheap.

A `proposal-data.json` written before `2026.9.30` carries `approaches`, `comparison` and
`recommendation` at the top level. Convert it first, then author the three fields the converter leaves
empty:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/migrations/proposal-approaches-to-decisions.js" proposals/proposal-data.json
```
