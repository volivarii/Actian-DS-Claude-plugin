---
name: actian-ux-proposal
description: Writes a design proposal for a ticket or an intent: each decision it forces, drawn with design system components, with options, a comparison, the pick and its cost. Discovery material for a PM's mock-up sessions and an input to the grill's UX lane. Use for a ticket, "approaches", "options", "how should we".
---

# Proposal

<!-- plugin-root:begin -->
## Where the plugin lives

`scripts/`, `schemas/` and `vendor/` below sit in the plugin root, the directory holding `.claude-plugin/plugin.json`, never in the project directory, and every command expects `CLAUDE_PLUGIN_ROOT` to name it. In Cowork the plugin is mounted inside a VM, so run this line once per shell first (again if a later shell finds the variable empty):

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```

Run a script as `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/<path>" ...`, never with a bare `node`. Write every output file in the project directory.
<!-- plugin-root:end -->

**Goal.** A proposal document a PM or designer reads once and then knows what we propose, why, what it costs and what they must settle. Before an intent it serves the PM's mock-up sessions (evidence for `/intent`); in the grill's UX lane it is an input.

**Rules.** The knowledge wins over memory: never invent a component, a token or a product fact, and mark what the product lacks as new. Run the checks named here, and say which one did not run. With nobody to ask (an unattended run), write the open questions into the file as flagged concerns instead of waiting.

**In the SDLC** (ai-tooling's `/grill`): if `docs/intents/<slug>/INTENT.md` exists, it and `pm.md` are the brief; outputs go in `docs/intents/<slug>/inputs/ux/`. Only the grill writes `INTENT.md`, `pm.md`, `ux.md`, `SPEC.md`.

**Start here.** The brief (`INTENT.md`, or the ticket). Then the knowledge on what it touches: the app file (`vendor/app-context/src/apps/`), the entities, personas, patterns and content rules.

**Make it.** Write `proposal-data.json` (shape: `schemas/proposal-data.schema.json`). Then `scripts/renderers/assemble-preview.js proposal-data.json --type proposal -o proposal.html` (the document, with mockups). The data file is the source: a follow-up edits `proposal-data.json` and runs it again, never the HTML by hand.

**Done when**
- every question the brief forces that a reader could answer differently is a decision, heaviest first;
- each decision has options drawn inside the product as Fat Marker fragments (`fm-*` classes and `--fm-*` tokens only; the class list is `vendor/components/render/renderer/fm-base.css`), the design system components they use named in `uses[]`, a comparison, and a pick with reasons and cost;
- every drawn part is marked existing or new; every product fact names its knowledge file;
- `context.users` says who uses it and in what scenario, one line per persona, each naming its persona file;
- an open question another role answers names its `owner` (`pm`, `ux`, `archi`, `dev`) and, when honest, the `recommended` answer;
- business facts (value, metrics, deadlines) are never invented: they are the PM's, in `INTENT.md`;
- `scripts/validation/validate-proposal.js proposal-data.json` shows no P0.

**Hand over.** `proposal.html` and `proposal-data.json`, the decisions in one line each, the open questions with their owners, the P1s kept and why, what you could not check. No intent file: the PM writes `INTENT.md` with `/intent`.
