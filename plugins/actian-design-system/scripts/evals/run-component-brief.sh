#!/usr/bin/env bash
# run-component-brief.sh — orchestrate the component-brief eval lane.
#
# This script does NOT directly invoke Claude or push to Figma — those
# happen inside the calling Claude Code session via the Agent tool when
# the maintainer says "run the brief eval." This script's job is to:
#
#   1. Print the run plan (which evals, where workspace lives)
#   2. Print copy-paste subagent prompts the maintainer dispatches
#   3. After grader runs complete, summarize per-assertion pass rates
#
# Multi-run support (--runs N): each fixture is run N times against the
# same prompt+skill. The summarizer reports pass/total per assertion so
# inter-run variance shows up as e.g. "A2: 1/3 pass — flaky" rather
# than a single deceptive pass/fail. Default is 1 run for cheap smoke;
# 3 runs is the standard for variance-aware gating.

set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVALS_DIR="$PLUGIN_ROOT/evals/component-brief"
WORKSPACE_DIR="$EVALS_DIR/workspace"

usage() {
  cat <<'USAGE'
Usage:
  run-component-brief.sh plan [--runs N]   # print run plan + subagent prompts
                                           # (N defaults to 1; use 3 for variance-aware)
  run-component-brief.sh summarize <iter>  # per-assertion pass-rate summary
USAGE
}

# emit_with_skill_prompt <fixture> <eval_id> <eval_name> <run_n> <runs_total> <out_dir>
emit_with_skill_prompt() {
  local fixture="$1" eval_id="$2" eval_name="$3" run_n="$4" runs_total="$5" out_dir="$6"
  local fixture_capitalized
  fixture_capitalized="$(echo "${fixture:0:1}" | tr '[:lower:]' '[:upper:]')${fixture:1}"
  echo "===== $eval_name (run $run_n / $runs_total) ====="
  cat <<PROMPT
Description: Run component-brief eval — $fixture_capitalized (run $run_n/$runs_total)
Prompt:
You are the with-skill subagent for the component-brief eval (run $run_n of $runs_total). Read
$EVALS_DIR/evals.json eval id=$eval_id ("$eval_name") and execute the
prompt exactly. Save outputs to $out_dir/outputs/. End your final
response with FRAME_NODE_ID=<file-key>:<node-id> as the LAST line.
PROMPT
  echo
}

# emit_grader_prompt <fixture> <run_n> <runs_total> <out_dir>
emit_grader_prompt() {
  local fixture="$1" run_n="$2" runs_total="$3" out_dir="$4"
  local fixture_capitalized
  fixture_capitalized="$(echo "${fixture:0:1}" | tr '[:lower:]' '[:upper:]')${fixture:1}"
  cat <<PROMPT
Description: Grade $fixture_capitalized eval result (run $run_n/$runs_total)
Prompt:
You are the grader subagent. Read $EVALS_DIR/grader.md. Inputs:
frame_node_id=<paste from run $run_n with-skill output>, fixture_path=$EVALS_DIR/fixtures/$fixture-brief-data.json,
eval_name=$fixture. Write grading.json to $out_dir/.
PROMPT
  echo
}

cmd="${1:-}"; shift || true

case "$cmd" in
  plan)
    runs=1
    while [ "${1:-}" != "" ]; do
      case "$1" in
        --runs)
          runs="${2:?--runs requires a value}"
          shift 2
          ;;
        --runs=*)
          runs="${1#--runs=}"
          shift
          ;;
        *)
          echo "unknown arg: $1" >&2
          usage
          exit 1
          ;;
      esac
    done
    if ! [[ "$runs" =~ ^[1-9][0-9]*$ ]]; then
      echo "--runs must be a positive integer (got: $runs)" >&2
      exit 1
    fi

    iter="iteration-$(date +%Y%m%d-%H%M%S)"
    iter_dir="$WORKSPACE_DIR/$iter"
    mkdir -p "$iter_dir"

    echo "Workspace: $iter_dir"
    echo "Runs per fixture: $runs"
    echo
    echo "Dispatch one Agent per with-skill row, then one per grader row."
    echo
    echo "--- with-skill subagents ($((runs * 2)) total) ---"
    echo
    for fixture in checkbox button; do
      if [ "$fixture" = "checkbox" ]; then
        eval_id=0; eval_name="checkbox-table-heavy"
      else
        eval_id=1; eval_name="button-variant-heavy"
      fi
      for n in $(seq 1 "$runs"); do
        out_dir="$iter_dir/eval-$fixture/run-$n/with_skill"
        emit_with_skill_prompt "$fixture" "$eval_id" "$eval_name" "$n" "$runs" "$out_dir"
      done
    done

    echo "After ALL with-skill subagents return FRAME_NODE_ID values, dispatch graders:"
    echo
    echo "--- grader subagents ($((runs * 2)) total) ---"
    echo
    for fixture in checkbox button; do
      for n in $(seq 1 "$runs"); do
        out_dir="$iter_dir/eval-$fixture/run-$n/with_skill"
        emit_grader_prompt "$fixture" "$n" "$runs" "$out_dir"
      done
    done

    echo "Then run: $0 summarize $iter"
    ;;

  summarize)
    iter="${1:?iteration required}"
    iter_dir="$WORKSPACE_DIR/$iter"
    [ -d "$iter_dir" ] || { echo "no such iteration: $iter_dir" >&2; exit 1; }
    # shellcheck disable=SC1091
    source "$PLUGIN_ROOT/scripts/lib/resolve-node.sh"
    "$NODE_BIN" "$PLUGIN_ROOT/scripts/evals/summarize.js" "$iter_dir"
    ;;

  *)
    usage
    exit 1
    ;;
esac
