#!/usr/bin/env bash
# run-component-brief.sh — orchestrate the component-brief eval lane.
#
# This script does NOT directly invoke Claude or push to Figma — those
# happen inside the calling Claude Code session via the Agent tool when
# the maintainer says "run the brief eval." This script's job is to:
#
#   1. Print the run plan (which evals, where workspace lives)
#   2. Print copy-paste subagent prompts the maintainer dispatches
#   3. After subagent runs complete, aggregate benchmark + open viewer
#
# This split is intentional: the Anthropic skill-creator framework
# assumes the orchestrator is Claude Code itself. We can't shell-out
# to "claude --dangerous-no-permissions"; the maintainer drives it.

set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVALS_DIR="$PLUGIN_ROOT/evals/component-brief"
WORKSPACE_DIR="$EVALS_DIR/workspace"
SKILL_CREATOR="$HOME/.claude/plugins/cache/claude-plugins-official/skill-creator/unknown/skills/skill-creator"

usage() {
  cat <<'USAGE'
Usage:
  run-component-brief.sh plan            # print the run plan + subagent prompts
  run-component-brief.sh aggregate <iter># aggregate iteration-N into benchmark
  run-component-brief.sh view <iter>     # open the eval-viewer for iteration-N
USAGE
}

cmd="${1:-}"; shift || true

case "$cmd" in
  plan)
    iter="iteration-$(date +%Y%m%d-%H%M%S)"
    iter_dir="$WORKSPACE_DIR/$iter"
    mkdir -p "$iter_dir"

    echo "Workspace: $iter_dir"
    echo
    echo "Dispatch one Agent per eval. Use these exact prompts:"
    echo
    echo "===== checkbox-table-heavy ====="
    cat <<PROMPT
Description: Run component-brief eval — Checkbox
Prompt:
You are the with-skill subagent for the component-brief eval. Read
$EVALS_DIR/evals.json eval id=0 ("checkbox-table-heavy") and execute
the prompt exactly. Save outputs to $iter_dir/eval-checkbox/with_skill/
outputs/. Capture timing.json with total_tokens and duration_ms.
PROMPT
    echo
    echo "===== button-variant-heavy ====="
    cat <<PROMPT
Description: Run component-brief eval — Button
Prompt:
You are the with-skill subagent for the component-brief eval. Read
$EVALS_DIR/evals.json eval id=1 ("button-variant-heavy") and execute
the prompt exactly. Save outputs to $iter_dir/eval-button/with_skill/
outputs/. Capture timing.json with total_tokens and duration_ms.
PROMPT
    echo
    echo "After both subagents complete and report FRAME_NODE_ID values,"
    echo "dispatch the grader subagent for each:"
    echo
    cat <<PROMPT
Description: Grade Checkbox eval result
Prompt:
You are the grader subagent. Read $EVALS_DIR/grader.md. Inputs:
frame_node_id=<paste from previous run>, fixture_path=$EVALS_DIR/
fixtures/checkbox-brief-data.json, eval_name=checkbox. Write
grading.json to $iter_dir/eval-checkbox/with_skill/.
PROMPT
    echo
    cat <<PROMPT
Description: Grade Button eval result
Prompt:
You are the grader subagent. Read $EVALS_DIR/grader.md. Inputs:
frame_node_id=<paste from previous run>, fixture_path=$EVALS_DIR/
fixtures/button-brief-data.json, eval_name=button. Write
grading.json to $iter_dir/eval-button/with_skill/.
PROMPT
    echo
    echo "Then run: $0 aggregate $iter"
    ;;

  aggregate)
    iter="${1:?iteration required}"
    iter_dir="$WORKSPACE_DIR/$iter"
    [ -d "$iter_dir" ] || { echo "no such iteration: $iter_dir" >&2; exit 1; }
    cd "$SKILL_CREATOR"
    python3 -m scripts.aggregate_benchmark "$iter_dir" --skill-name component-brief
    echo
    echo "benchmark.md:"
    cat "$iter_dir/benchmark.md"
    ;;

  view)
    iter="${1:?iteration required}"
    iter_dir="$WORKSPACE_DIR/$iter"
    [ -f "$iter_dir/benchmark.json" ] || { echo "run aggregate first" >&2; exit 1; }
    nohup python3 "$SKILL_CREATOR/eval-viewer/generate_review.py" \
      "$iter_dir" \
      --skill-name component-brief \
      --benchmark "$iter_dir/benchmark.json" \
      > "$iter_dir/viewer.log" 2>&1 &
    echo "Viewer PID $!. Logs at $iter_dir/viewer.log."
    ;;

  *)
    usage
    exit 1
    ;;
esac
