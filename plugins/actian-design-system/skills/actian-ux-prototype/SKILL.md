---
name: actian-ux-prototype
description: A clickable HTML prototype of an Actian product flow, drawn with the design system and checked, optionally pushed to Figma as real design system instances. Discovery material before an intent, and the flow the grill's UX lane settles. Use for a flow, screens, "show me how this would work", "push to Figma".
---

# Prototype

<!-- plugin-root:begin -->
## Where the plugin lives

`scripts/`, `schemas/` and `vendor/` below sit in the plugin root, the directory holding `.claude-plugin/plugin.json`, never in the project directory, and every command expects `CLAUDE_PLUGIN_ROOT` to name it. In Cowork the plugin is mounted inside a VM, so run this line once per shell first (again if a later shell finds the variable empty):

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```

Run a script as `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/<path>" ...`, never with a bare `node`. Write every output file in the project directory.
<!-- plugin-root:end -->

**Goal.** A clickable prototype of the flow, in the real app, built from the design system, that a designer clicks through step by step.

**Rules.** The knowledge wins over memory: never invent a component, a token or a product fact, and mark what the product lacks as new. Run the checks named here, and say which one did not run. With nobody to ask (an unattended run), write the open questions into the file as flagged concerns instead of waiting.

**In the SDLC** (ai-tooling's `/grill`): if `docs/intents/<slug>/INTENT.md` exists, it and `pm.md` are the brief; outputs go in `docs/intents/<slug>/inputs/ux/`. Only the grill writes `INTENT.md`, `pm.md`, `ux.md`, `SPEC.md`.

**Start here.** The brief (`INTENT.md`, or the request). The app file in `vendor/app-context/src/apps/`, the recipe and its screenshot for the page, the fragments and `render.css` (see `vendor/llms.txt`, "Building a screen"), the terminology and content rules.

**Make it.** The files and their rules: `prototype-files.md` here. Write the screen list, then `scripts/lib/app-context/prepare-flow.js --app <app> --screen-list <file> --direct -o brief.json`; write `body.html`, `app.js`, `extra.css`, `meta.json` in one folder; `scripts/renderers/assemble-direct.js brief.json --author <dir> -o prototype.html`.

**Done when**
- everything the request asks happens on the page, in order; every control works;
- it reads as the product: header, navigation, words, components;
- what the product lacks is marked new on the page itself;
- `scripts/validation/check-direct.js brief.json --author <dir>` is clean, in at most three runs: a P0 still there after the third goes into the hand over;
- you looked at every step (`scripts/renderers/look-direct.js prototype.html --steps <n> -o shots/`) and fixed what you saw. No browser (Cowork): say so, and name what the person must look at.

**Figma push (on request).** One JSON per screen (`figma-screen.md` here), then `scripts/renderers/figma-screen.js <screen.json> --parent-id <frame>`, its output as the code of one `use_figma` call. Colours as `var(--zen-...)` tokens, text in Roboto. Layers (drawers, toasts) as top-level content nodes with `positioning: "absolute"` and `x`, `y` in screen coordinates. One session, no helper agents. Screenshot each screen.

**Hand over.** The page, the steps, what is new and why, what you could not check, what you would ask.
