#!/usr/bin/env bash
# Runs the test suite and fails when it should.
#
# `node --test` exits 0 when a describe body throws. The file never builds, none of its
# tests run, and the summary still reads "# fail 0": a suite that crashed on load is
# indistinguishable from a green one, both to a human reading the tail and to CI reading
# the exit code. That happened on this repo, hiding a whole renderer suite that could not
# even require its subject.
#
# So the exit code is not the only signal here. Three things fail the run: a non-zero exit,
# any unindented "not ok" line (a failing test, or a suite that never built), and a run that
# executed no tests at all. The last one matters because every other check in this file is
# vacuous when the runner had nothing to run, and the ways that happens are quiet: a renamed
# tests directory, a bad cwd, a glob that matches nothing.
set -uo pipefail

# The test tree lives at the repository root, next to plugins/, so an installed plugin
# does not carry it. This runner is inside the plugin, so it climbs out to find it and
# runs from there: no test depends on the working directory, but the one that shells
# out to git names its pathspecs from the repository root.
REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)" || exit 1
cd "$REPO_ROOT" || exit 1
if [ ! -d tests ]; then
  echo "SUITE FAILED: no tests directory at $REPO_ROOT. The suite lives at <repo>/tests." >&2
  exit 1
fi

log="$(mktemp)" || { echo "SUITE FAILED: mktemp could not create a log file." >&2; exit 1; }
trap 'rm -f "$log"' EXIT

files="$(find tests -name '*.test.js' -type f | wc -l | tr -d ' ')"
if [ "$files" -eq 0 ]; then
  echo "SUITE FAILED: no *.test.js under tests/." >&2
  exit 1
fi

# Bare `node` resolves under `npm test`, which puts it on PATH, and in CI. It does not
# resolve on Desktop, where this repo's own rule is never to call it bare. This runner is
# the one gate that catches a suite crashing on load, so a runner that cannot start is the
# worst way to fail. resolve-node.sh finds the interpreter the same way every script here does.
# shellcheck source=../lib/resolve-node.sh
. "$(dirname "$0")/../lib/resolve-node.sh"
if [ -z "${NODE_BIN:-}" ]; then
  echo "SUITE FAILED: resolve-node.sh found no node interpreter." >&2
  exit 1
fi

# The reporter is pinned, and that is not cosmetic. Every check below reads TAP: it greps
# "^# tests" for whether anything ran and "^not ok" for a suite that crashed on load. Node
# 24 made spec the default reporter, which writes neither (it prints an info line and a
# check mark), so on a machine resolving to node 24 both greps match nothing and the one
# gate built to catch a silent pass goes silent itself. Pinning makes the output the same
# shape on every interpreter and on both sides of a pipe.
find tests -name '*.test.js' -type f -print0 | xargs -0 "$NODE_BIN" --test --test-reporter=tap | tee "$log"
status=${PIPESTATUS[1]}

crashed="$(grep -cE '^not ok ' "$log" || true)"
[ -n "$crashed" ] || crashed=0

ran="$(grep -oE '^# tests [0-9]+' "$log" | tail -1 | grep -oE '[0-9]+' || true)"
[ -n "$ran" ] || ran=0

if [ "$ran" -eq 0 ]; then
  echo ""
  echo "SUITE FAILED: ${files} test file(s) found, but the run reported no tests."
  echo "A gate that ran nothing cannot be green." >&2
  exit 1
fi

if [ "$crashed" -gt 0 ] && [ "$status" -eq 0 ]; then
  echo ""
  echo "SUITE FAILED: ${crashed} top-level 'not ok' line(s), but the runner exited 0."
  echo "That is the shape a suite takes when a describe body throws: it never built, so"
  echo "its tests never ran and the summary counted no failures. The lines are:"
  grep -E '^not ok ' "$log"
  exit 1
fi

exit "$status"
