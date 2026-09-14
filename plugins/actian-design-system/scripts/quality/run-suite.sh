#!/usr/bin/env bash
# Runs the test suite and fails when it should.
#
# `node --test` exits 0 when a describe body throws. The file never builds, none of its
# tests run, and the summary still reads "# fail 0": a suite that crashed on load is
# indistinguishable from a green one, both to a human reading the tail and to CI reading
# the exit code. That happened on this repo, hiding a whole renderer suite that could not
# even require its subject.
#
# So the exit code is not the only signal here. Any unindented "not ok" line fails the
# run, which covers both a failing test and a suite that never built.
set -uo pipefail

log="$(mktemp -t adsp-suite.XXXXXX)"
trap 'rm -f "$log"' EXIT

find tests -name '*.test.js' -type f -print0 | xargs -0 node --test | tee "$log"
status=${PIPESTATUS[1]}

crashed="$(grep -cE '^not ok ' "$log" || true)"

if [ "$crashed" -gt 0 ] && [ "$status" -eq 0 ]; then
  echo ""
  echo "SUITE FAILED: ${crashed} top-level 'not ok' line(s), but the runner exited 0."
  echo "That is the shape a suite takes when a describe body throws: it never built, so"
  echo "its tests never ran and the summary counted no failures. The lines are:"
  grep -E '^not ok ' "$log"
  exit 1
fi

exit "$status"
