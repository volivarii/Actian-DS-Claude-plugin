---
name: actian-ux-proposal
description: Writes a design proposal for a ticket (each decision the ticket forces, drawn with design system components, with options, a comparison, the pick and its cost) and the intent.md the PM owns, both from one proposal data file. Use for a ticket, "approaches", "options", "how should we", "write the intent".
---

# Proposal and intent.md

<!-- plugin-root:begin -->
## Where the plugin lives

`scripts/`, `schemas/` and `vendor/` below sit in the plugin root, the directory holding `.claude-plugin/plugin.json`, never in the project directory, and every command expects `CLAUDE_PLUGIN_ROOT` to name it. In Cowork the plugin is mounted inside a VM, so run this line once per shell first (again if a later shell finds the variable empty):

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```

Run a script as `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/<path>" ...`, never with a bare `node`. Write every output file in the project directory.
<!-- plugin-root:end -->

**Goal.** A proposal document a PM or designer reads once and then knows what we propose, why, what it costs and what they must settle; and the `intent.md` that goes to git.

**Start here.** The ticket. Then the knowledge on what it touches: the app file (`vendor/app-context/src/apps/`), the entities, personas, patterns and content rules.

**Make it.** Write `proposal-data.json` (shape: `schemas/proposal-data.schema.json`). Then:
- `scripts/renderers/assemble-preview.js proposal-data.json --type proposal -o proposal.html` (the document, with mockups);
- `scripts/renderers/assemble-intent.js proposal-data.json --proposal proposal.html -o intent.md`.

**Done when**
- every question the ticket forces that a reader could answer differently is a decision, heaviest first;
- each decision has options drawn inside the product as Fat Marker fragments (`fm-*` classes and `--fm-*` tokens only; the class list is `vendor/components/render/renderer/fm-base.css`), the design system components they use named in `uses[]`, a comparison, and a pick with reasons and cost;
- every drawn part is marked existing or new; every product fact names its knowledge file;
- `scripts/validation/validate-proposal.js proposal-data.json` shows no P0; `scripts/validation/check-handover.js intent intent.md` shows no P0 (`template not vendored yet`: hand over the document without `intent.md` and say so);
- business fields (value, stakeholders, metrics, constraints, deliverables) read "To fill by PM": never invented.

**Hand over.** Both paths, the decisions in one line each, the open questions, the P1s kept and why, what you could not check.
