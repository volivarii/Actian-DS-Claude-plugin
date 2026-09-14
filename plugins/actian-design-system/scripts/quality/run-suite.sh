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

if [ ! -d tests ]; then
  echo "SUITE FAILED: no tests directory here ($(pwd)). Run this from the plugin root." >&2
  exit 1
fi

log="$(mktemp)" || { echo "SUITE FAILED: mktemp could not create a log file." >&2; exit 1; }
trap 'rm -f "$log"' EXIT

files="$(find tests -name '*.test.js' -type f | wc -l | tr -d ' ')"
if [ "$files" -eq 0 ]; then
  echo "SUITE FAILED: no *.test.js under tests/." >&2
  exit 1
fi

find tests -name '*.test.js' -type f -print0 | xargs -0 node --test | tee "$log"
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
