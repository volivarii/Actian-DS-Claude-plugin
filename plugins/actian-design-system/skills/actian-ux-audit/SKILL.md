---
name: actian-ux-audit
description: Audits a Figma frame against the Actian design system (components, tokens, accessibility, copy, layout and states) with evidence and a fix per finding, applies fixes on request, and writes the UX handover (ux-handover.md, formerly specs.md) from the final frame. Use for "audit", "review this frame", "generate the specs", "UX handover".
---

# Audit, fixes and the UX handover

<!-- plugin-root:begin -->
## Where the plugin lives

`scripts/`, `schemas/` and `vendor/` below sit in the plugin root, the directory holding `.claude-plugin/plugin.json`, never in the project directory, and every command expects `CLAUDE_PLUGIN_ROOT` to name it. In Cowork the plugin is mounted inside a VM, so run this line once per shell first (again if a later shell finds the variable empty):

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```

Run a script as `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/<path>" ...`, never with a bare `node`. Write every output file in the project directory.
<!-- plugin-root:end -->

**Goal.** Every place the frame departs from the design system, with evidence and a fix; on request the fixes applied; for a final design, the UX handover.

**Rules.** The knowledge wins over memory: never invent a component, a token or a product fact, and mark what the product lacks as new. Run the checks named here, and say which one did not run. With nobody to ask (an unattended run), write the open questions into the file as flagged concerns instead of waiting.

**In the SDLC** (ai-tooling's `/grill`): if `docs/intents/<slug>/INTENT.md` exists, it and `pm.md` are the brief; outputs go in `docs/intents/<slug>/inputs/ux/`. Only the grill writes `INTENT.md`, `pm.md`, `ux.md`, `SPEC.md`.

**Start here.** The frame through Figma: a screenshot, then its node properties. Then the knowledge for what you found.

**Check** components (library instances, right variant, `vendor/components/dist/guidelines/<slug>.json`), tokens (colour, spacing, radius, type bound, spacing on the scale), accessibility (WCAG 2.2 AA; `scripts/lib/a11y/resolve-a11y.js --slugs <slugs>`), copy (`vendor/content/dist/global.md`, the terminology), layout and states. Each finding: node, the rule quoted, what the file has, the fix, a confidence; below 0.5 goes to needs review. Figma traps: `figma-api-traps.md` here; fixing: `evidence-and-fixes.md` here.

**Fix** only when asked: one finding at a time, P0 first, looking at the result after each.

**`ux-handover.md`** (the UX lane's last step, not a periodic audit). Fix the findings first; the designer's own work is not handed over. From the knowledge's specs template, three sources: the final frame (components by DS name and slug, copy, accessibility, screens), the prototype (flow order, states, interactions), the intent (`INTENT.md` and the UX lane's decisions, else the ticket: edge cases, scope, open questions). Each section's first line names its source. Interactions and edge cases are observable statements ("When a user has no group, the row is hidden") that become acceptance criteria. Flagged concerns: only what is open, each with its owner (PM, UX, architect, developer) and a recommended answer. Then `scripts/validation/check-handover.js specs ux-handover.md --prototype <prototype.html>`: no P0. If it says `template not vendored yet`, hand over without the file and say so.

**Hand over.** The findings table, the fixes applied, `ux-handover.md` and its check result, what you could not check.
