# generate-flow: Figma push, refine shape and push sequence

This file holds the push opt-in resolution, the refine shape detection and
behavior, and the full push-to-Figma sequence (lo-fi push, DS-native hifi
authoring, and the audit pass) for `generate-flow`. `skills/generate-flow/SKILL.md`
points here from its Push opt-in, Refine shape, and Push to Figma sections;
read this file only when push has resolved to true.

## Push opt-in (resolve before Step 7)

The default greenfield run is **HTML only — no push**. A Figma push happens **only if** one of these resolves push to true:

- `--push` flag set.
- Prose intent in the prompt: "push to figma", "in figma", "as a figma file".
- `--audit` set (runs a post-push design audit → implies push). `--hifi` does NOT imply push — it selects DS-native authoring mode; the deliverable is hi-fi HTML.
- The designer accepts push at the Step 7.5 combined gate.

**`--no-push` overrides all of the above** (wins ties with `--push`).

**Explicit-Figma exemption:** refine / iterate / branch on an existing Figma URL **always push** — the designer is already editing a Figma artifact, so push is unconditional regardless of the opt-in default. (`--no-push` still vetoes as a power-user override.)

**REQUIRED:** read `references/generate-flow/push-opt-in.md` for the full trigger table, the `--no-push` veto rules, and the verbatim Step 7.5 combined gate prompt.

## Refine shape

Refine activates when ALL of: a Figma URL is provided, a prose instruction is
provided alongside, AND the URL resolves to a `pushedNodes[]` entry (or the
wrapper `pageNodeId`) in `.last-push.json`. Refine edits the existing
`flow-data.json` in place and re-pushes — it does not regenerate. Refine is on
the explicit-Figma path, so it **always pushes** (unless `--no-push`).

**REQUIRED:** before running a Refine, read
`references/generate-flow/refine.md` for the full detection rules and the
step-by-step behavior.

## Push to Figma

Push is **opt-in** — only run this section when push resolved to true (see **Push opt-in** above). Read `references/figma/figma-push-patterns.md` for component keys and patterns. Push from `flow-data.json` using small `use_figma` calls. Always pass `skillNames: "figma-use"`.

**REQUIRED:** read `references/generate-flow/push-sequence.md` for the full push
sequence (wrapper + GenLog → tier/scope annotations → research/cover cards →
per-screen frame + chrome `setProperties` + the deterministic content emitter →
designer report) and the push rules.

### DS-native authoring (if --hifi flag)

When `--hifi` is set, every content INSTANCE node must carry `library:"ds"` and `dsSlug` from the vocabulary doc `references/generate-flow/ds-components-authoring.md`. Set `meta.library:"ds"` on the flow-data when writing it — the renderer picks up the DS chrome branch and applies themed hi-fi HTML automatically.

**Vocabulary and built leaves:** read `references/generate-flow/ds-components-authoring.md` FIRST. Favor BUILT leaves (they produce full CSS-styled HTML); unbuilt slugs with a vendored appearance doc render their real captured colors (and real icon glyphs where anatomy resolves one), with the labeled chip only as the last-resort fallback when no appearance doc exists. Validation adds `unknown-ds-slug` (hard error: the slug is not in the DS registry) and `ds-slug-unbuilt` (warning: slug is valid but not yet a built leaf; renders from its captured appearance doc when one exists, chip only as last resort; prefer a built leaf when one exists that covers the use case).

**The HTML deliverable IS the hi-fi artifact.** The `flows/[feature].html` file is themed and fully styled — it is what you share. No separate conversion step is needed.

**Figma push for DS-native flows uses the whole-tree emitter.** `--hifi --push` is supported: for each screen with `library:"ds"`, the push step builds the full node tree via `screenTree(screen)` and emits it in ONE `use_figma` call appended to the wrapper — chrome (app header, sidebar, page header) and content together, all DS Kit instances. Read `references/generate-flow/push-sequence.md` step 6 DS-screen path for the exact shell command. `--hifi` alone does NOT imply a push — Figma output requires explicit `--push`.

### Audit pass (if --audit flag)

After lo-fi push (or hifi push when `--hifi` is also set), invoke `/design-audit <pushed-url>`. Audit reports findings without modifying the design. To auto-fix, the designer follows up with `/design-audit <url> --fix all` or `--fix N`. (`--audit` implies a push.)

---

