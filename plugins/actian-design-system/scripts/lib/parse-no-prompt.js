"use strict";

// Parses the --no-prompt flag from CLI args.
//
// Used by /generate-flow, /design-audit, /convert-to-hifi to decide whether
// to run interactive gates or skip with documented defaults. The flag is the
// single skill-wide suppressor for the gate convention defined in
// references/ds-rules/interactive-gates.md.
//
// Returns { noPrompt: boolean, remainingArgs: string[] } — does NOT mutate
// the input array. Strict equality match (no prefixed variants, no aliases).

var FLAG = "--no-prompt";

function parseNoPrompt(args) {
  if (!Array.isArray(args)) {
    return { noPrompt: false, remainingArgs: [] };
  }
  var noPrompt = false;
  var remaining = [];
  for (var i = 0; i < args.length; i++) {
    if (args[i] === FLAG) {
      noPrompt = true;
    } else {
      remaining.push(args[i]);
    }
  }
  return { noPrompt: noPrompt, remainingArgs: remaining };
}

module.exports = parseNoPrompt;
