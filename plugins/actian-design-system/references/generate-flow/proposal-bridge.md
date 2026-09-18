# The proposal bridge

> `skills/generate-flow/SKILL.md` is at its 30000-byte ceiling. Anything more about the bridge
> belongs here, not there.

`--from` a local `proposals/proposal-data.json` seeds the flow from a proposal this plugin already
wrote. Every option in a proposal carries a `screens[]` list naming a flow archetype, an app and an
entity, and until the bridge existed nothing read it: a person read the rendered document and
retyped the screens, so the most expensive judgement in the pipeline was made twice.

```bash
source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh"
"$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/bridges/proposal-to-flow.js" <path> [--decision <id>] [--option <id>]
```

It prints `{ screens, brief, findings }` on stdout, or writes it with `-o`.

| Flag | Behavior |
|---|---|
| none | Every decision's picked option. The default, because it is the question a reader actually has: what the product looks like if we do what this proposal says. It is also the only view that shows two decisions landing on one surface |
| `--decision <id>` | That decision's picked option alone, for carrying one choice forward without the rest |
| `--option <id>` | With `--decision`, that option rather than the pick, which is how a reader argues with a pick instead of merely reading it. Refused on its own, because an option id is unique only inside its decision |
| `-o <path>` | Write the seed to a file instead of stdout. Refused when the file already exists |

Every flag needs a value after it, and a flag given more than once keeps its first occurrence.

## What the seed carries

It composes rather than concatenates. Screens sharing a name are one screen carrying every note,
each prefixed with the question its decision answers when there is more than one; a single note is
left unprefixed. Two picks that disagree on a merged screen's `template`, `app` or `entity` are a P0
naming both decisions, because guessing a winner builds a flow nobody asked for.

The seed carries no `nav` or `exit`; the skill adds both when it writes the list (gates.md, Screen
list).

A proposal's `screens[].template` names a flow archetype (`recipes/flow/_index.json`: `overlay`,
`form-create`, `detail-view`), and that is a different vocabulary from `/generate-flow`'s own
screen-list `template`, which names chrome (`studio`, `explorer`, `administration`, ...; see the
Flags table in `skills/generate-flow/SKILL.md`). The seed emits both: `template` carries the
screen's `app` forward, so it renders chrome the way any other generate-flow screen does, and the
proposal's archetype rides along under `archetype`, a recipe hint for the screen-generator rather
than a rendering instruction.

An emitted screen is `{ name, template, archetype, app, entity, note? }`: `template` is the chrome
name, `archetype` is the proposal's own value, `app` repeats the chrome name (kept for anything
that reads it directly rather than through `template`), `entity` is the app-context entity slug or
`null`, and `note` is the attributed change text, present only when a source screen carried one.

The order follows the proposal's breadboard when it drew one, walking its connections, and
declaration order when it did not. The link is `anchor.place`, declared rather than guessed.

The brief comes from the proposal's `answer`, then each decision's question with its pick's reasons
and cost. No prose is invented, so a thin proposal makes a thin brief, and that is honest. The
`answer` line is left out when the run draws no pick at all (`--option` naming a rejected option),
the same reasoning that already keeps a rejected option's `reasons` out of its brief: printing
either under a rejected option would read as a case for it.

## A seed spanning two apps

Three picks composing to two screens across two apps, the acceptance document's default run, is not
a special case: each screen keeps its own chrome (its own `template`), because `template` is set
per screen, not once for the whole seed. What differs is `meta.app` in the `screen-list.json`
`/generate-flow` writes at Gate 3's skeleton step: with no single app to name for the whole flow, it
takes the first screen's app. A seed spanning two apps composes correctly either way; `meta.app` is
metadata for a title strip, not a constraint on what the screens themselves render.

## Reading the findings

Findings print on stderr, one per line, and a P0 exits 1. Read it and stop: a P0 means the seed is
wrong, not thin. An evaluation-stage file is refused outright, because an evaluation has no options
and so no screens; resume it with `/design-proposal --from <file>` first.

## Then

Take `screens` as the screen list and `brief` as the brief, and run the pipeline from Gate 3. There
is nothing to research and no app to infer, since both are already in the seed.
