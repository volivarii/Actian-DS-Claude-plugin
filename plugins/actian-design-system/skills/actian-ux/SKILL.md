---
name: actian-ux
description: Answers any Actian design system or product design question from the knowledge, citing the file, and is the UX policy entry every session loads, the grill's UX lane included. Use for questions about components, tokens, patterns, copy, accessibility, Studio/Explorer/Administration, which components a feature reuses or adds, and which skill fits (proposal, prototype, audit and the UX handover).
---

# Actian UX

<!-- plugin-root:begin -->
## Where the plugin lives

`scripts/`, `schemas/` and `vendor/` below sit in the plugin root, the directory holding `.claude-plugin/plugin.json`, never in the project directory, and every command expects `CLAUDE_PLUGIN_ROOT` to name it. In Cowork the plugin is mounted inside a VM, so run this line once per shell first (again if a later shell finds the variable empty):

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```

Run a script as `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/<path>" ...`, never with a bare `node`. Write every output file in the project directory.
<!-- plugin-root:end -->

**The knowledge is the source of truth.** It is vendored at `vendor/`. Its `vendor/llms.txt` is the index; for a screen start at "Building a screen".

**Answer** from the knowledge, citing each file you used. If the knowledge does not say, say so; never answer from memory as if it were the knowledge.

**Rules for every Actian design task:**
1. The knowledge wins over memory and habit: product words, components and tokens come from it. Never invent a component, a token or a product fact; mark what the product lacks as new.
2. Run the checks the skill names. If one cannot run, do the work and say which check did not run.
3. Hand over with nothing hidden: what is new, what was not checked, the open questions. With nobody to ask (an unattended run), write them into the file as flagged concerns instead of waiting.

**In the SDLC.** In the grill's UX lane, answer from the knowledge which components are reused or new, every state, the copy and accessibility. The PM owns `INTENT.md`, the developer `SPEC.md`; design files go in `docs/intents/<slug>/inputs/ux/`.

**Which skill:** a ticket, options, "how should we", a mock-up session → `/actian-ux-proposal`. Screens, a flow, a clickable prototype, a Figma push → `/actian-ux-prototype`. A Figma frame to review, fix, or turn into the UX handover → `/actian-ux-audit`.
