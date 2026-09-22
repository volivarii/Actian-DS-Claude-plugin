"use strict";
// The test tree lives at the repository root (tests/), next to plugins/, so an
// installed plugin does not carry it. The few scripts that read or write test
// data at run time (the blank-box baseline, the fidelity ledger and pixel
// diffs) resolve it here instead of each climbing out of the plugin on its own.
// In an installed plugin there is no repository around it and this path does
// not exist: those scripts are development tooling, never a skill's runtime.
var path = require("path");
module.exports = path.resolve(__dirname, "..", "..", "..", "..", "tests");
