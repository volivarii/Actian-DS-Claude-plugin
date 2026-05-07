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

### Component-brief / push-pattern PRs: automated eval lane

For PRs that touch `references/component-brief/`,
`scripts/renderers/figma-table/`, or the brief skill itself, the smoke
evidence is the output of the component-brief eval lane:

```bash
plugins/actian-design-system/scripts/evals/run-component-brief.sh plan
# dispatch the printed subagent prompts via the Agent tool, then:
plugins/actian-design-system/scripts/evals/run-component-brief.sh aggregate <iteration-id>
```

Paste the resulting `benchmark.md` into the Smoke evidence section. See
`evals/component-brief/README.md` for the full operator workflow.

**Marketplace-cache constraint:** `/component-brief` reads its skill code
from the installed plugin marketplace cache, NOT from the feature
branch. So the eval tests the LATEST released version of the brief
skill. For brief-skill-changing PRs, the smoke evidence has to come
from a run made AFTER marketplace propagation of that PR's commit.
Pre-merge eval runs against feature branches catch eval-infra
regressions, not skill-behavior regressions.

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
