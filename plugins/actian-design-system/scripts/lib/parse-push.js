"use strict";

// Parses the --push / --no-push flags from CLI args.
//
// Used by /generate-flow to decide whether to push the generated flow to
// Figma. The default is no push (HTML deliverable only); --push opts in.
// --no-push wins on ties (both flags present).
//
// Returns { push: boolean, explicit: boolean } — does NOT mutate the input
// array. Strict equality match (no prefixed variants, no aliases).

var FLAG_PUSH = "--push";
var FLAG_NO_PUSH = "--no-push";

function parsePush(args) {
  if (!Array.isArray(args)) {
    return { push: false, explicit: false };
  }
  var hasPush = false;
  var hasNoPush = false;
  for (var i = 0; i < args.length; i++) {
    if (args[i] === FLAG_NO_PUSH) {
      hasNoPush = true;
    } else if (args[i] === FLAG_PUSH) {
      hasPush = true;
    }
  }
  if (hasNoPush) {
    return { push: false, explicit: true };
  }
  if (hasPush) {
    return { push: true, explicit: true };
  }
  return { push: false, explicit: false };
}

module.exports = parsePush;
