---
name: actian-ux-audit
description: Audits a Figma frame against the Actian design system (components, tokens, accessibility, copy, layout and states) with evidence and a fix per finding, applies fixes on request, and writes specs.md from the final frame. Use for "audit", "review this frame", "generate the specs", "specs.md".
---

# Audit, fixes and specs.md

<!-- plugin-root:begin -->
## Where the plugin lives

`scripts/`, `schemas/` and `vendor/` below sit in the plugin root, the directory holding `.claude-plugin/plugin.json`, never in the project directory, and every command expects `CLAUDE_PLUGIN_ROOT` to name it. In Cowork the plugin is mounted inside a VM, so run this line once per shell first (again if a later shell finds the variable empty):

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```

Run a script as `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/<path>" ...`, never with a bare `node`. Write every output file in the project directory.
<!-- plugin-root:end -->

**Goal.** Every place the frame departs from the design system, with evidence and a fix; on request the fixes applied; for a final design, the `specs.md` engineering builds from.

**Start here.** The frame through Figma: a screenshot, then its node properties. Then the knowledge for what you found.

**Check** components (library instances, right variant, `vendor/components/dist/guidelines/<slug>.json`), tokens (colour, spacing, radius, type bound, spacing on the scale), accessibility (WCAG 2.2 AA; `scripts/lib/a11y/resolve-a11y.js --slugs <slugs>`), copy (`vendor/content/dist/global.md`, the terminology), layout and states. Each finding: node, the rule quoted, what the file has, the fix, a confidence; below 0.5 goes to needs review. Figma traps: `figma-api-traps.md` here; fixing: `evidence-and-fixes.md` here.

**Fix** only when asked: one finding at a time, P0 first, looking at the result after each.

**specs.md** (feature flow only, after the fixes, never on a periodic audit). From the knowledge's template, three sources: the final frame (components by DS name and slug, copy, accessibility, screens), the prototype (flow order, states, interactions), `intent.md` (edge cases, scope, open questions). Each section's first line names its source. Unfixed findings and open questions go to Flagged concerns. Then `scripts/validation/check-handover.js specs specs.md --prototype <prototype.html>`: no P0. If it says `template not vendored yet`, hand over without the file and say so. The designer reviews it before it is pushed.

**Hand over.** The findings table, the fixes applied, `specs.md` and its check result, what you could not check.
