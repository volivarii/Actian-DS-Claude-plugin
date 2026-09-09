# Where the plugin lives (canonical skill preamble)

The block between the markers is copied verbatim into every `skills/<name>/SKILL.md`, directly after the
H1 and before the first `##` heading. `tests/integration/plugin-root.test.js` asserts each copy is
identical to this one and that the bash line resolves a simulated Cowork mount, so edit here first,
then paste into the skills. `scripts/lib/plugin-root.sh` is the same logic for scripts that run
without the variable (it adds a fallback to the script's own plugin and an error message).

Why it exists: Cowork runs Read and Glob against the Mac-side plugin path named in the skill header,
and bash inside a VM where the plugin is mounted under `/sessions/<vm>/mnt/.remote-plugins/<plugin id>/`.
On 2026-09-09 a session concluded the renderer scripts "aren't materialized" and hand-built the
deliverable. The line below removes the hunt.

<!-- plugin-root:begin -->
## Where the plugin lives

Bare `references/`, `vendor/`, `agents/`, `recipes/`, `templates/` and `scripts/` paths in this file are relative to the plugin root: the directory holding `.claude-plugin/plugin.json`, the parent of the `skills/` directory named in the base directory above. They are never relative to the project working directory. Every command in this file expects `CLAUDE_PLUGIN_ROOT` to name that root. In Cowork, bash runs inside a VM where the plugin is mounted under `/sessions/<vm>/mnt/.remote-plugins/<plugin id>/`, so set the variable once per shell before anything else:
The line is idempotent: when a later bash call finds the variable empty, run the line again before the command.

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```
<!-- plugin-root:end -->
