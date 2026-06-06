# generate-flow — push opt-in model

Figma push is **opt-in** in the HTML-first pipeline. The default greenfield
run produces a self-contained `flows/[feature].html` deliverable and does NOT
push to Figma unless one of the triggers below fires.

## Push triggers

Three conditions independently trigger a push:

### 1. `--push` flag

Passing `--push` opts in unconditionally.  
`--no-push` wins ties: when both `--push` and `--no-push` are present, no push occurs.  
Default (neither flag): no push.

Parsing is handled by `scripts/lib/parse-push.js` → `parsePush(argv)` →
`{ push: boolean, explicit: boolean }`.

### 2. Prose intent

When the prompt contains explicit Figma intent, the skill infers `--push` and
sets `push: true` without requiring the flag.  Phrases that trigger:

- "push to figma" / "push it to figma"
- "in figma" (e.g. "create this in figma")
- "as a figma file"

These are normalised lower-case matches; trailing punctuation is ignored.

### 3. `--hifi` or `--audit` implies push

`--hifi` produces a DS-Kit hi-fi output; `--audit` runs a post-push design
audit.  Both produce Figma artifacts, so Figma push is implicitly required.
When either flag is set, push is treated as if `--push` were passed.

## `--no-push` override

`--no-push` is an absolute veto.  It overrides every trigger above:
- Explicit `--push` → vetoed.
- Prose intent detected → vetoed.
- `--hifi` / `--audit` set → vetoed (skill warns that the audit cannot run
  without a push and invites the designer to remove `--no-push` or omit the
  implication flags).

## Explicit-Figma-path exemption (refine / iterate / branch)

When the designer is already working in Figma — i.e., a Figma URL is present
and the run is classified as **refine**, **iterate**, or **branch** — push
ALWAYS happens.  This overrides the opt-in default because the designer's
intent is unambiguous: they are editing an existing Figma artifact.

`--no-push` still vetoes even on this path (power-user override).

## Combined post-build gate (greenfield only)

After the `flows/[feature].html` deliverable is rendered (Step 6.5), the skill
presents a **single combined gate** offering both push-to-Figma and audit —
unless `--no-prompt` is set or the run is a refine / iterate / branch.

Present this prompt **verbatim**:

```
Your flow is ready → {project_working_directory}/flows/[feature].html

Want to do more?

  done (default) — keep the HTML, nothing else
  push           — push the flow to Figma
  push + audit   — push to Figma, then run /design-audit on the result

Reply: enter for done, or type one of the options above.
```

Parser:
- Empty / "done" / "no" → exit cleanly; HTML deliverable stands.
- "push" → proceed with Step 7 Figma push (push sequence per
  `references/generate-flow/push-sequence.md`).
- "audit" / "push + audit" / "push+audit" / "push and audit" → push first,
  then audit the pushed Figma result. (`/design-audit` takes a Figma URL, so
  audit always requires a prior push — "audit" is treated as "push + audit".)
- Invalid → re-prompt.
- 3 retries → abort with:
  `"Aborting. Pass --push, --audit, or --no-prompt to skip this gate."`

This gate is **not** shown when:
- `--no-prompt` is set (defaults apply: no push, no audit).
- `--push` was already resolved at parse time (skip the push offer; still
  offer audit unless `--audit` is also already set).
- The run is refine / iterate / branch (push already happened; offer audit
  only if `--audit` was not passed).

## Relationship to `--no-prompt`

When `--no-prompt` is set, the combined post-build gate is suppressed.
Push happens only if a trigger (flag, prose, `--hifi`/`--audit`) fired at
parse time.  See `references/ds-rules/interactive-gates.md` for the full
`--no-prompt` convention.
