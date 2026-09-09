#!/bin/bash
# plugin-root.sh: make CLAUDE_PLUGIN_ROOT name the plugin root in every shell,
# including the Cowork VM, where bash runs beside a mount of the plugin at
# /sessions/<vm>/mnt/.remote-plugins/<plugin id>/ and never sees the Mac-side
# path the skill header names. bash only: an unmatched glob aborts zsh.
#
# Usage (sourced, never executed):  source "<plugin root>/scripts/lib/plugin-root.sh"
# Order: keep CLAUDE_PLUGIN_ROOT if it is set AND its .claude-plugin/plugin.json
# exists (Cowork can export the Mac-side value into a VM shell where that path
# does not exist, so an unmeasured value is never trusted); else the first
# directory under ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/
# whose .claude-plugin/plugin.json names actian-design-system; else the plugin
# that contains this script; else one error naming both places (and the
# rejected value, if one was set), return 1.
# The default glob and the manifest test are duplicated, on purpose and
# byte-identical, in references/context/plugin-root.md (the skill preamble),
# which cannot source this file before it knows the root.
if [ -z "${CLAUDE_PLUGIN_ROOT:-}" ] || [ ! -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; then
  _apr_prior="${CLAUDE_PLUGIN_ROOT:-}"
  _apr_root=""
  for _apr_d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do
    if grep -qs '"name": *"actian-design-system"' "${_apr_d}.claude-plugin/plugin.json"; then
      _apr_root="${_apr_d%/}"
      break
    fi
  done
  if [ -z "$_apr_root" ] && [ -n "${BASH_SOURCE[0]:-}" ]; then
    _apr_here="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)"
    if [ -n "$_apr_here" ] && grep -qs '"name": *"actian-design-system"' "$_apr_here/.claude-plugin/plugin.json"; then
      _apr_root="$_apr_here"
    fi
  fi
  if [ -z "$_apr_root" ]; then
    if [ -n "$_apr_prior" ]; then
      echo "Error: CLAUDE_PLUGIN_ROOT was \"$_apr_prior\" but that directory has no .claude-plugin/plugin.json naming actian-design-system. Looked for a replacement under ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/ and at $(dirname "${BASH_SOURCE[0]:-$0}")/../.. . Export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json> and retry." >&2
    else
      echo "Error: plugin root not found. Looked for a .claude-plugin/plugin.json naming actian-design-system under ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/ and at $(dirname "${BASH_SOURCE[0]:-$0}")/../.. . Export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json> and retry." >&2
    fi
    unset _apr_root _apr_d _apr_here _apr_prior
    if [ "${BASH_SOURCE[0]}" = "${0}" ]; then exit 1; else return 1; fi
  fi
  export CLAUDE_PLUGIN_ROOT="$_apr_root"
  unset _apr_root _apr_d _apr_here _apr_prior
fi
