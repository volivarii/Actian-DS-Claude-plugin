"use strict";

// unpublished.js — quarantine for a DS slug Figma has unpublished but is
// expected to publish again.
//
// Absence from the registry does not say WHY a slug is absent, and the two
// causes need opposite responses:
//
//   RETIRED    permanent. Delete the leaf tests, the goldens and the worked
//              example, the way card-for-items was handled in #315.
//   UNPUBLISHED temporary. The component is archived in the Figma file while
//              an old version is rebuilt. Deleting its tests throws away work
//              that has to be written again when it returns.
//
// Upstream already draws this line: it keeps the guidance for an unpublished
// component and names it in guideline-reachability's UNREACHABLE list, so
// republishing costs no work there. This is the same move for the tests, so
// republishing costs no work here either.
//
// Consult it with skipReason(slug), which returns a string for a quarantined
// slug and false for every other one, matching what node:test's `skip` option
// accepts:
//
//   describe("...", { skip: skipReason("chat-with-ai-steward") }, ...)
//
// tests/integration/unpublished-quarantine.test.js keeps this list honest: a
// quarantined slug must be absent from the registry AND still carry its
// vendored guidance. Publish it again and the entry is reported stale; drop
// its guidance and the entry is reported as a retirement to be deleted rather
// than skipped. A skip that can outlive its cause is a test nobody runs.

var EXPECTED_BACK = {
  "chat-with-ai-steward":
    "unpublished in Figma, carried through by knowledge c8340c77 (2026-08-26): " +
    "an old version being rebuilt, archived in the file rather than deleted, " +
    "expected back. Upstream kept its guidance for that reason, so this skip " +
    "clears itself the moment the component republishes.",
};

function skipReason(slug) {
  return Object.prototype.hasOwnProperty.call(EXPECTED_BACK, slug)
    ? slug + " is unpublished upstream: " + EXPECTED_BACK[slug]
    : false;
}

module.exports = { EXPECTED_BACK: EXPECTED_BACK, skipReason: skipReason };
