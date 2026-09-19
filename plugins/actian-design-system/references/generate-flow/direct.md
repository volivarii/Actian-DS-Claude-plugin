# The direct route (`--direct`)

Loaded when `/generate-flow` is called with `--direct`. One author draws the whole flow as one clickable HTML prototype, from the design system's own markup; scripts draw the app's frame, check the author's files and take a screenshot of every step; the author looks before it hands over. Without the flag nothing here applies.

## What it gives

One self-contained file at `{project_working_directory}/flows/[feature].html`:

- the app's real header and side navigation, drawn by a script, with the right item active on every step;
- the design system's own component markup and stylesheet;
- live state between steps (a selection selects, a save changes the list behind the panel), because one author holds the whole flow and its steps cannot disagree;
- a strip above the product UI to jump to a step, and "Show what is new", which marks everything the product does not have today;
- a look: the author reads screenshots of every step at two widths and fixes what it sees.

## What it does not give

No `flow-data.json`. So there is nothing to push to Figma, nothing for `/design-audit` or `/compare-flows`, and no lo-fi or FatMarker rendering. Two direct runs of one prompt differ in structure.

Before Gate 1, refuse a run that combines `--direct` with `--push`, `--fm`, `--lofi`, `--audit`, `--variants`, `--breakpoints`, `--states`, `--from` or `--branch`, in one line:

`--direct draws an HTML prototype only: drop <flag>, or drop --direct for the data-file route.`

Prose that asks for a Figma push gets the same line. `--no-prompt`, `--ref` and `--layout freehand` combine with `--direct`.

## Steps

Pipeline items 1 to 4.5 of the skill run as written: the app, the three gates, vision references. Then, in place of items 5.0 to 9:

**D1. The screen list.** Write `{project_working_directory}/flows/screen-list.json` exactly as item 5.0 says: `pattern` where an app pattern covers the screen, `layer` where it is a surface over another screen, `exit` on every screen but the last, `meta.nav`. Skip 5.0's merge and render: a direct run has no `flow-data.json`.

**D2. The brief.** One call, with the `--app`, `--entity` and `--use-case` rules of the skill's Step 3.5:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/app-context/prepare-flow.js" --app <app> --entity <slug> --use-case <audience> --screen-list {project_working_directory}/flows/screen-list.json --direct -o {project_working_directory}/flows/.brief.json
```

It writes one brief and no slices. Its `direct` block names every file the author needs: for each step the captured page's screenshot, regions and render notes; for each component its rendered markup and usage notes; the stylesheets, the icons, the content rules. Read `brief.join` as Step 3.5 says before trusting an empty join.

**D3. Provenance.** Write `{project_working_directory}/flows/.direct/run.json`: `{ "skill": "generate-flow --direct", "feature": "...", "prompt": "<first 200 characters>", "date": "<ISO date>", "duration": "", "model": "...", "pluginVersion": "..." }`. Note the start time.

**D4. The author.** Dispatch ONE `prototype-author` agent with:

- `pluginRoot` = `${CLAUDE_PLUGIN_ROOT}`
- `briefPath` = `{project_working_directory}/flows/.brief.json`
- `authorDir` = `{project_working_directory}/flows/.direct`
- `outPath` = `{project_working_directory}/flows/[feature].html`
- `lookDir` = `{project_working_directory}/flows/look`
- `runPath` = `{project_working_directory}/flows/.direct/run.json`
- `references` = `meta.references[]` when Step 4.5 produced fingerprints

Paste no brief content. Print `Drawing <feature> (<M> steps, one author)`. The agent writes `body.html`, `app.js`, `extra.css` and `meta.json` under `authorDir`, assembles the page, checks it, and looks at it.

**D5. Check it yourself.** When the agent returns, run the check and print what it prints:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/check-direct.js" {project_working_directory}/flows/.brief.json --author {project_working_directory}/flows/.direct
```

`check-direct.js` reads the steps by running `app.js` in a throwaway `node:vm` context. That is not a security boundary: run it only on files the author wrote in this session, never on a prototype that came from somewhere else. A `P0` left: send the lines back to the same agent once. Still there after that: hand over with the `P0` lines shown.

**D6. When the agent could not run scripts.** A report that says `scripts: not run` means Bash was not available where the agent ran. Run the three commands yourself, then send the findings and the screenshot paths back to the agent, at most twice:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-direct.js" {project_working_directory}/flows/.brief.json --author {project_working_directory}/flows/.direct --run {project_working_directory}/flows/.direct/run.json -o {project_working_directory}/flows/[feature].html
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/check-direct.js" {project_working_directory}/flows/.brief.json --author {project_working_directory}/flows/.direct
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/look-direct.js" {project_working_directory}/flows/[feature].html --steps <M> -o {project_working_directory}/flows/look
```

`look-direct.js` exits 2 when there is no browser here or it does not answer within 60 seconds. The run continues; the prototype is "not looked at".

**D7. Finish.** Set `duration` in `run.json`, run the `assemble-direct.js` command of D6 once more so the page's provenance is complete, and hand over.

## Handover

```
Your prototype is ready → {project_working_directory}/flows/[feature].html
<the P1 lines left, or "0 findings">
Looked at: yes, <n> screenshots in flows/look/        (or)  Not looked at: <reason>
New in this prototype: <the names in meta.json adds>
Two direct runs differ in structure. For a Figma artifact, run without --direct.
```

No Step 7.5 gate: there is nothing to push.

## The findings

`check-direct.js` prints one line per finding on stdout, `P0 [kind] file → message` or `P1 [kind] file → message`, prints `check-direct: clean` when there is none, and exits 1 when any `P0` is left.

| Kind | Level | What the author does |
| --- | --- | --- |
| `external-url` | P0 | Remove it: the page opens offline |
| `unfilled-token` | P0 | Replace the `{{placeholder}}` with content |
| `unknown-icon` | P0 | Use a slug from the icons file the brief names |
| `unknown-token` | P0 | Use a `var(--token)` the stylesheet defines |
| `unknown-ds-class` | P0 | Use the class the component's fragment carries |
| `raw-colour` | P1 | Replace the hand-typed colour in `extra.css` with a token |
| `frame-missing` | P0 | Wrap the content area in `<div data-app-frame>` |
| `frame-redrawn` | P0 | Remove the header or side navigation: the assembler draws them |
| `layer-misplaced` | P0 | A layer is an `<aside data-layer>` of a known kind, written after the frame closes |
| `step-mismatch` | P0 | `proto.steps` ids equal the brief's step ids, in order |
| `steps-unread` | P1 | `app.js` threw when evaluated: fix the error it names |
| `new-undeclared` | P1 | Add the `data-new` name to `meta.json` adds |
| `add-unplaced` | P1 | Mark the new thing on the page with `data-new`, or drop the entry |
| `unsafe-embed` | P0 | Remove the literal `</style` from `extra.css`, or `<!--` from `app.js` |

Terminology is not checked.
