# Interactive Gates Convention

How DS skills surface options to designers without losing the `--flag` API for power users + automation.

## The problem this solves

Today most plugin skills accept `--flag` arguments with silent defaults. Designers who don't know a flag exists never get its option; designers who do know must remember the exact name and value format. Beyond ergonomics, this hides capability — variants, refs, breakpoints, state coverage, post-gen audit go unused because nothing surfaces them at invocation time.

Interactive gates fix both: every meaningful choice is surfaced at the moment it matters, in plain prose, with a documented default. The flags stay; they suppress the gate when explicitly passed.

## Pattern: flag-first with gate fallback

In each skill that adopts this convention:

```
Step 0 — Parse args (including --no-prompt). Note which flags are explicitly passed.
Step 0.x — Per pipeline phase:
  - If --no-prompt is set: skip gates, use defaults for missing flags.
  - Else if all phase flags are passed: skip the gate.
  - Else: present a batched gate prompting for the missing flags.
Validate the resolved flag set (same validator as flag-only path).
Proceed with execution.
```

Result:
- Zero-flag designer invocations → all gates fire
- Full-flag invocations → zero gates (no behavior change for automation)
- Mixed invocations → gates fire only for missing flags
- `--no-prompt` invocations → zero gates, defaults applied

## The `--no-prompt` flag

Single skill-wide suppressor. When present:
- Skips every gate
- Uses the documented default for every flag not explicitly passed
- Available on every skill that adopts this convention

**Why `--no-prompt` over `--yes`:** `--yes` semantically suggests "auto-accept all gate suggestions," which would imply running audit, generating extra states, etc. `--no-prompt` is conservative: it means "no prompts, defaults only." Different semantics, different blast radius.

**Use cases:**
- Companion routes that have already extracted full intent from prose
- CI workflows (Sync from Figma, etc.)
- Scripted Cowork sessions
- Automated regression tests
- Power users who already know their flag set

## Gate batching (one prompt per pipeline phase)

Gates are batched per **pipeline phase**, not per flag. Reasons:
- Fewer interactive turns = faster designer flow
- Designers see the full configuration surface at once
- Easier to type one combined response than answer N sequential questions

The proven precedent: `/component-brief` Step 1.5 batches card selection + research scope into one prompt with one combined parser. This convention generalizes that.

**Per-skill batching:**
- `/generate-flow`: 2 phases — pre-generation gate (5 flags: `--hifi`, `--variants`, `--ref`, `--breakpoints`, `--states`), post-push gate (1 flag: `--audit`). Special-case flags `--from` and `--branch` are NOT gated; they're detected by companion or absent by default.
- `/design-audit`: 2 single-flag gates — scope at start, fix after findings reported.
- `/convert-to-hifi`: 1 single-flag gate — ref at start.

## Gate prompt shape

Each gate prompt should:
1. **State the question + default in plain prose** — no CLI jargon
2. **Show all options inline** — designers learn the option set by reading the prompt
3. **Provide examples** — at least 2 example responses
4. **Document the keystroke for "default"** — typically just enter
5. **Re-prompt on parse failure** — 3 retries, then abort with a message pointing at `--no-prompt` or the flag form

Example shape (adapted from `/component-brief` Step 1.5):

```
Configure generation for [feature]:

Output:        lo-fi (default) | hi-fi
Variants:      1 (default) | 2 | 3
References:    none (default) | <paste Figma URL(s) or image URL(s)>
Breakpoints:   desktop (default) | + tablet | + mobile | all

Reply: enter for all defaults, or specify any subset.
Examples:
  hifi 3
  ref:https://figma.com/design/abc/foo?node-id=1-2
  hifi tablet,mobile
```

## Companion's responsibility

The companion skill (`skills/companion/SKILL.md`) routes designer prose to specific skills. When companion routes:

- **Pass `--no-prompt`** when ALL flags relevant to the route's intent have been confidently extracted from prose. Example: companion row 3 ("ship-ready X") extracts `--hifi --audit`, so it routes `/generate-flow X --hifi --audit --no-prompt`.
- **Don't pass `--no-prompt`** when intent is partial or vague. Let the downstream skill gate. Example: companion row 1 ("design me a settings page") extracts no flags; routes `/generate-flow "settings page"` (no `--no-prompt`), letting the skill gate on output mode, variants, refs, and breakpoints.

The downstream skill gate is the canonical UX. Companion's job is intent classification and partial-flag pre-fill, not UX duplication.

**Per-row decision matrix** (precise):

| Companion row | Relevant flags | Pass `--no-prompt`? |
|---|---|---|
| 1 ("design me X") | none | No — let skill gate everything |
| 3 ("ship-ready X") | `--hifi`, `--audit` | Yes — append `--hifi --audit --no-prompt` |
| 4 ("variants of X") | `--variants` | Yes — append `--variants 3 --no-prompt` |
| 9 ("match this style" + refs) | `--ref` | Conditional — only if no other intent missing |
| 18 ("add empty + error states") | `--states` | Yes — append `--states empty,error --no-prompt` |
| 20 ("responsive") | `--breakpoints` | Yes — append `--breakpoints tablet,mobile --no-prompt` |

Other rows fall back to the gate.

## Defaults table (canonical)

This table is the source of truth for "what does the skill do when a flag is missing AND `--no-prompt` is set." Skills inherit these defaults; gates show them as the "press enter" choice.

| Flag | Skill | Default if missing AND `--no-prompt` |
|---|---|---|
| `--hifi` | `/generate-flow` | false (lo-fi output) |
| `--audit` | `/generate-flow` | false (skip post-gen audit) |
| `--variants <N>` | `/generate-flow` | 1 |
| `--ref <url>` | `/generate-flow`, `/convert-to-hifi` | none |
| `--breakpoints <list>` | `/generate-flow` | desktop only |
| `--from <url>` | `/generate-flow` | none |
| `--branch <name>` | `/generate-flow` | none |
| `--states <list>` | `/generate-flow` | none |
| `--scope <list>` | `/design-audit` | all |
| `--fix <N\|all>` | `/design-audit` | skip |

These match silent-default behavior pre-v1.63.0. No behavior change for automation that already passes flags.

## Validation parity

Same validator runs whether input came from a flag or a gate response. Skills MUST resolve gate input to the equivalent flag before validation, so a single code path catches invalid values regardless of source.

Example: `--variants 99` from a flag fails validation with "Variants must be 1-3." A gate input of "99" hits the same validator and produces the same error message, then re-prompts.

## Migration notes

When adopting this convention in a new skill:

1. Add `var parseNoPrompt = require("../../scripts/lib/parse-no-prompt.js");` at the top of any script that needs the flag.
2. Update the skill's `argument-hint` frontmatter field to include `[--no-prompt]`.
3. Add Step 0 (parse) and Step 0.x (gate) sections to `SKILL.md`, following the prompt shape above.
4. Document each gate's parser rules inline (valid tokens, retries, abort behavior).
5. Update `references/context/companion-context.md` and `skills/companion/SKILL.md` if companion has a row that should route to your skill.

## Out of scope for this convention

- `/component-brief` Step 1.5 already batches its gates; it does NOT need `--no-prompt` until a future iteration adds it for parity.
- `/sync-design-system`, `/compare-flows`, `/create-component` don't currently have gateable flags — adopt the convention if/when they grow them.
- Gates inside refine flows (URL + prose) — refine intent is already explicit; no gate needed.
