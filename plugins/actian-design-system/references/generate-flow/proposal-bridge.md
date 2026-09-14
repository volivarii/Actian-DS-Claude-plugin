# The proposal bridge

`--from` a local `proposals/proposal-data.json` seeds the flow from a proposal this plugin already
wrote. Every option in a proposal carries a `screens[]` list in this skill's own screen-list shape,
and until the bridge existed nothing read it: a person read the rendered document and retyped the
screens, so the most expensive judgement in the pipeline was made twice.

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

The order follows the proposal's breadboard when it drew one, walking its connections, and
declaration order when it did not. The link is `anchor.place`, declared rather than guessed.

The brief comes from the proposal's `answer`, then each decision's question with its pick's reasons
and cost. No prose is invented, so a thin proposal makes a thin brief, and that is honest.

## Reading the findings

Findings print on stderr, one per line, and a P0 exits 1. Read it and stop: a P0 means the seed is
wrong, not thin. An evaluation-stage file is refused outright, because an evaluation has no options
and so no screens; resume it with `/design-proposal --from <file>` first.

## Then

Take `screens` as the screen list and `brief` as the brief, and run the pipeline from Gate 3. There
is nothing to research and no app to infer, since both are already in the seed.
