# Migration discipline

This file documents the discipline for replacing or retiring established push
patterns, skill behaviors, and AI-facing rendering paths. Deviating from these
rules has produced shipping regressions in the past. The most recent example
(v1.71.0 → v1.71.1) is recorded below as a teaching case.

## Why this exists

Patches v1.70.0 → v1.70.4 each shipped with confident "this is the fix" framing
for the recurring 1-px token-tag squash. Each one passed local + CI tests. None
fully fixed the bug; the squash kept reappearing. v1.71.0 layered an
architectural rewrite (the `renderTable` strict tool) on top of the same
problem and **introduced a regression**: the new path's docs were inconsistent
with the project's own Node-invocation convention, so the AI silently fell
back to inlining — and the previously-working `appendTokenTagCell` helper had
already been deleted from the docs. Net effect: a worse build than v1.70.4 on
all four target table surfaces.

The pattern was: tests prove the **interpreter** works, but nothing proved the
**AI invokes the interpreter**, and the migration deleted the only-known
working escape valve before that adoption was demonstrated. When the new path
had any friction, the AI took the path of least resistance (inlining), which
is the broken path.

These rules exist so we stop repeating that pattern.

## Rule 1 — Parallel change, not big-bang replacement

When introducing a new path that replaces an existing AI-facing pattern:

1. **Add the new path** (new tool, new SKILL.md instructions, new helper).
2. **Keep the old path functional** in docs and code. Do not delete; do not
   "rewrite as a pointer to the new doc." The AI's strongest priors are on the
   old path; if you remove it, the AI improvises — and improvisation is what
   the migration was supposed to eliminate.
3. **Smoke-prove the AI adopts the new path** on at least one real component.
   The smoke must show frame names / metadata / structure that only the new
   path produces — not just "the output looked OK." If the smoke output is
   indistinguishable from the old-path output, you don't have proof.
4. **Mark the old path deprecated** in docs (callout banner, NOT deletion)
   once smoke proof is in. Keep the code working.
5. **Sustained adoption check** — at least one additional smoke on a different
   component, ideally days apart, ideally by someone other than the migration
   author. If the AI reverted to the old path, you don't have sustained
   adoption.
6. **Delete the old path** only after sustained adoption. This is usually one
   or more PATCH or MINOR releases later, not the same PR as the introduction.

This is the same discipline as Martin Fowler's "Parallel Change"
(expand-contract): widen the API, run both paths, verify the new path works
in production, then narrow.

### Active parallel change — flow content push (v1.98.0)

`render-node-figma.js` (the deterministic content-tree emitter, twin of the HTML
`render-node.js`) is the **canonical** path for pushing `screen.content[]` in
`/actian-ux-prototype`. The hand-walk in `actian-ux-prototype/SKILL.md` push step 6d is the
**documented fallback**, kept functional per step 2 above. Cutover (deleting the
fallback) happens only after the emitter shows sustained adoption across the
recipe set — a later MINOR/PATCH, not this PR.

## Rule 2 — Friction asymmetry

Before merging a migration, ask: **is using the new path simpler than not
using it?**

If using the new tool requires (a) building a JSON spec, (b) escaping it
through stdin, (c) sourcing a shell script, (d) capturing stdout, (e) pasting
the captured JS into a separate MCP call — the AI will silently inline the
construction directly because that's fewer steps. The path-of-least-resistance
beats the documented best path every time.

If the new path has higher friction than the old path, the migration will not
adopt regardless of how good the new path's design is. Either lower the
friction (one-call MCP tool, snippet template, helper API) or accept that the
migration will need a forcing function (validator that rejects the old path,
runtime hook that blocks improvisation, etc.).

The v1.71.0 `renderTable` migration documented `Bash → Node CLI → capture
stdout → paste into use_figma`. The old path was `inline construction in
use_figma`. The friction asymmetry was the wrong direction.

## Rule 3 — Smoke gates, not smoke wishes

Acceptance criteria written into design specs ("Phase 1 acceptance: Cowork
smoke shows v1.70.4 squash bug GONE") are **not gates**. They are wishes.
There is no mechanism preventing merge when an acceptance bar is unchecked.

The PR template (`.github/pull_request_template.md`) has a mandatory
**Smoke evidence** section for any PR that touches push patterns, skills,
or migrations. Reviewers should reject merge requests where the section is
empty or hand-waved. The reviewer is the gate; treat the section as load-
bearing, not ceremonial.

If the PR is a refactor / docs-only / test-only change with no AI-facing
behavioral effect, mark the section `N/A — <one-line reason>` and proceed.

### Component-brief / push-pattern PRs: automated eval lane (deleted 2026-09-22)

The component-brief eval lane (`scripts/evals/`, `evals/component-brief/`) left the repository
with the brief skill's code on 2026-09-22 (plugin 2026.9.60). Smoke evidence for push-pattern,
renderer and migration PRs is the suite plus a look at the deliverable, as the section above says.

## Rule 4 — Doc/runtime convention parity

Any Bash code block in committed docs that invokes Node MUST follow the
project's Node-resolution convention:

```bash
source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && \
  "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/some-script.js" ...
```

Bare `node` fails on Claude Desktop (Node isn't on `PATH`) and is blocked at
runtime by the PreToolUse hook `scripts/hooks/check-bare-node.sh`. The
write-time mirror is the test `tests/integration/doc-conventions.test.js`,
which is part of Tier 1 PR checks. Failing the test means the AI literally
cannot follow the docs you wrote — fix the docs, not the test.

Use `$CLAUDE_PLUGIN_ROOT` (set by the Claude harness) — never `$PLUGIN_ROOT`
(unset in skill invocations; will resolve to `/scripts/...`).

For intentional anti-pattern examples (e.g. CLAUDE.md showing "what NOT to
do"), prefix the block with `<!-- doc-lint:ignore-block -->` on its own line.

## Schema migrations

### The retired skills' code deleted (2026.9.60)

`retired/` and every file only the retired skills read left the repository on 2026-09-22, plugin
#413: `scripts/office/`, `assets/office/`, `references/office/`, `references/generate-presentation/`,
`recipes/presentation/`, `schemas/slide-data.schema.json`, the presentation renderer;
`recipes/brief/`, `schemas/brief-data.schema.json`, the brief renderer, `scripts/renderers/figma-table/`,
`templates/component-playground-wrapper.html`, `templates/fm-wrapper.html`,
`references/component-brief/`, `references/create-component/`, `references/convert-to-hifi/`
(its `fm-to-ds-map.json` moved to `references/actian-ux-prototype/`), `evals/`, `scripts/evals/`,
`scripts/lib/{anatomy-filter,anatomy-scale,dimension-line,gutter-layout,specs-extraction,token-tag}.js`,
`validateBriefData` in `validate-schema.js`, and the `brief` and `presentation` types of
`assemble-preview.js` and `merge-partials.js`. Nothing live read any of it (each removal was
preceded by a requirer check; `brief-sourcing.js` and `category-defaults-loader.js` stay because
the flow validator and the accessibility resolver read them). A data file of a retired skill
(`brief-data.json`, `slide-data.json`) no longer validates here. Restore point: git history,
`git log --diff-filter=D --stat -- plugins/actian-design-system`.

### The skills renamed to `actian-ux-*` (2026.9.59)

| Was | Is |
|---|---|
| `/companion` | `/actian-ux` |
| `/generate-flow` | `/actian-ux-prototype` |
| `/design-proposal` | `/actian-ux-proposal` |
| `/design-audit` | `/actian-ux-audit` |

Directories, references, tests and every loaded document carry the new names; there are
no alias skills, and each skill's description says what it was formerly called so a
request in the old words still routes. Output folders (`flows/`, `proposals/`) and data
file names are unchanged. `meta.skill` in `flow-data.json`, `proposal-data.json` and the
evaluation file is written with the new name; the schemas accept the old name too, so a
file authored before this version keeps validating and `--from` keeps working on it.

### `scope` required (2026.9.28)

`proposal-data.json`'s schema gained a required `scope` object (one to four
`goals`, one to four `nonGoals`) in `2026.9.28`. A `proposal-data.json`
authored before that version fails validation with a schema P0 at `scope`.
The fix is to add two goals and two non-goals to the file; it is not to
relax the schema.

This carries the same adoption gap Rule 1 exists for. The schema, the
validator, and the renderer are all tested: a fixture with `scope` validates,
a fixture without it fails at `scope`, and the document renders the two
columns. None of that proves an authoring agent writes `scope` (or the
optional `openQuestions`) when it drafts a real proposal from a real ticket,
as opposed to a test fixture built to already satisfy the schema. The skill
and the authoring reference were updated to instruct the agent to write
both, but instructing is not adopting; per Rule 1, that instruction is
unproven until a real run shows it taken.

**The check, run on 2026-09-13: passed.** `/design-proposal` was run against
DIP-I-522 (see what a share exposed, and pull back one item) and the authored
`proposals/proposal-data.json` carried `scope.goals` with three goals in the
ticket's own words, `scope.nonGoals` with two, and four `openQuestions`, two
rabbit holes and two open questions, all four of them real. Nothing was
boilerplate and nothing was invented to satisfy the schema, so the skill's
wording holds: instructing the agent to write `scope` did produce a written
`scope` on a real ticket. The data file is git-ignored, so this paragraph is
the record of it rather than a link.

### `decisions[]` replaces `approaches` (2026.9.30)

`proposal-data.json` lost three top-level keys, `approaches`, `comparison` and
`recommendation`, and gained `decisions[]`, `answer`, `change`, `latitude`,
`breadboard` and `source`. A file written before this version fails validation
with one P0 naming the converter,
`scripts/migrations/proposal-approaches-to-decisions.js`, rather than a wall of
schema errors.

This is the second break in three releases, after `scope`, and it is a
documented exception to Rule 1 for the same reason: the affected population is
files in user working directories, not a published contract, and the recovery
is mechanical for everything except three judgements the old shape never
carried (which criterion each reason argues from, what a pick costs, and the
latitude line). Those the converter writes empty, because a plausible
invention in a rationale would ship unread.

The converter's CLI wrote the string `undefined` over its output, in place
included, in every build between `b506c9ab` and `a7ced118`. Both are inside
this branch, so no released version shipped it.

The adoption gap Rule 1 exists for is the same one `scope` had, one size
larger. The schema, the validator, the renderer and the three-decision
acceptance fixture are all tested. None of that proves an authoring agent
*decomposes a real ticket into decisions* rather than writing one decision with
N variants, which is the old shape wearing the new schema.

**The check, not yet run:** after `2026.9.30` is installed, run
`/design-proposal` (now `/actian-ux-proposal`) against a ticket that plainly forces more than one question,
and read the authored `proposal-data.json`. It passes if `decisions[]` holds
one entry per question a reader could answer differently, each with its own
comparison, and if every `pick.reasons[].criterionId` names a row that reason
actually argues from rather than the first criterion in the list. It fails if
the agent writes a single decision with four options, or if the reasons are
assigned to criteria round-robin: either way the skill's wording is the defect,
not the schema.

### `meta.stage`, a release that did not break (2026.9.31)

`proposal-data.json` gains `meta.stage`, and it is **optional**. Absent means
`"proposal"`, which is what every file written before this release already is,
so no `proposal-data.json` in any working directory needs touching, no
converter ships with this change, and `--from` on a stored file behaves exactly
as it did. The `"evaluation"` value is the one `--evaluate` writes, and it is
read against `schemas/proposal-evaluation.schema.json` instead.

That is the point of the entry. This is the third schema change in four
releases and the first that did not break anything, after `scope` (2026.9.28)
and `decisions[]` (2026.9.30) both did. A discriminator whose default is the
existing meaning does not need to be required: making it required would have
broken every stored file to record a fact the absence already records. Rule 2's
friction asymmetry is the reason to prefer it, and it is the standard to hold a
future stage against, not an accident.

The adoption gap Rule 1 exists for applies to the new flag rather than to the
field. A schema, a validator branch and five gates are all tested; none of them
proves that an authoring agent, given a real ticket, names the decisions a
careful author names. That comparison was made by hand on 2026-09-14 against
two tickets, DIP-I-496 and DIP-I-522, and recorded with the branch's SDD ledger
rather than here, because it is a reading rather than a rule. Its short form:
on DIP-I-496 the evaluation named the same three decisions the hand-authored
acceptance document names, in the same order; on DIP-I-522 it named three where
the 2026-09-13 run, written before `decisions[]` existed, had a single question
slot and filled it once.

**That comparison does not discharge Rule 1, and the person who made it said so
first.** Three of its six decompositions were contaminated: the evaluation
schema's `examples` and the design spec both print those decisions verbatim, and
the author had read both before writing. So the comparison is evidence that the
machinery and the prose work, and it is not evidence that the stage names what a
careful author names. What is still owed is a run by a session that has read only
the skill. That is the same check this file already asks for against `2026.9.28`
and the `scope` field, so it is one run, not two: install the release, run
`/design-proposal` (now `/actian-ux-proposal`) on a real ticket, and read what the agent authored.

The one piece of independent support, which is worth more than either half alone:
a second agent, reviewing the skill's prose and working from the DIP-I-522 ticket
text alone, reached three questions matching the spec's worked example, and found
that two of its three name subjects the hand-authored file had demoted into a goal
and an open question.

## Teaching case — v1.71.0 → v1.71.1

What shipped in v1.71.0:

- `renderTable` strict tool: schema, Figma interpreter, HTML interpreter,
  validator, 27 unit tests. All correct.
- Pattern 3 + Pattern 4 in `push-patterns.md` collapsed to short pointers
  to `render-table-tool.md`. The `appendTokenTagCell` helper was deleted.
- SKILL.md push step rewritten to mandate the new tool.
- HTML preview migrated to use the same interpreter (this part actually works
  — proven in browser, no AI invocation required).

What broke in production smoke (Cowork desktop, Checkbox at
`FaBwMaNkvdrcQIo3fl8I4D#1067-2614`):

- The AI did not invoke `render-figma.js`. Frame names in the output
  metadata were generic `"Frame"` everywhere, not the interpreter's named
  output (`"Table (renderTable)"`, `"Token: --zen-..."`).
- All four Phase-1 target tables — Sizing, Color grid, Typography, Anatomy
  parts — squashed to 1px-per-row with content at negative `y`. Identical to
  the v1.70.4 anti-pattern.
- The validator never ran. A token typo (`--zen-font-body-stardard`) the
  validator would have caught against the live registry shipped in the brief.
- The Anatomy parts table had multiple token-pills stacked in single cells,
  a structure the renderTable schema disallows. If the AI had used the tool,
  the spec would have been rejected at the boundary.

Root causes:

- **Doc/convention drift (Rule 4):** `render-table-tool.md` documented `node
  "$PLUGIN_ROOT/..."` — bare `node`, wrong env var, no resolve-node sourcing.
  If the AI followed the docs literally, the runtime hook would have blocked
  the call. The AI's likely behavior (and what the metadata supports) was to
  read the docs, recognize the brittleness, and fall back to inlining the
  patterns it already knows.
- **Big-bang replacement (Rule 1):** `appendTokenTagCell` was deleted in the
  same PR that introduced the new tool. Pre-PR, the AI sometimes inlined the
  token-tag construction (broken) and sometimes called the helper (working).
  Post-PR, only the broken path remained.
- **Friction asymmetry (Rule 2):** Inlining table construction in use_figma
  was always the AI's path of least resistance. The renderTable workflow
  (`Bash → render-figma.js → capture stdout → use_figma`) was strictly more
  friction. No forcing function existed.
- **No smoke gate (Rule 3):** PR description listed Cowork smoke as a TODO
  with the merge proceeding regardless. Acceptance language was confident and
  unenforced.

What v1.71.1 did about it:

- Restored `appendTokenTagCell` and Pattern 3/4's full prose body in
  `push-patterns.md`. Added a status banner stating the canonical path is the
  restored helper until the renderTable tool is smoke-verified.
- Marked `render-table-tool.md` as experimental with the same banner. Fixed
  the invocation snippets to use the canonical pattern.
- SKILL.md pulled back from "use renderTable" mandate to "use Pattern 3 + 4;
  renderTable is available but unproven."
- Added the `tests/integration/doc-conventions.test.js` linter (Rule 4 in
  enforcement form). Caught two unrelated pre-existing violations as a bonus.
- Added the PR template with mandatory Smoke evidence section (Rule 3 in
  enforcement form).
- Wrote this file to make Rules 1–4 durable.
