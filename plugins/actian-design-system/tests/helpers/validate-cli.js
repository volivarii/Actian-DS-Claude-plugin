"use strict";

// validate-cli.js: shared test helper. Runs scripts/validation/validate-flow-data.js
// as a subprocess against a fresh temp fixture, and returns its combined output.
//
// Multiple leaf tests need "write a flow-data.json, run the validator CLI on it,
// read the findings back" (token-source-fm.test.js is the first; more tasks in
// this hardening slice reuse it). Centralizing here means the fixture shape and
// the spawn plumbing are defined once instead of pasted into every leaf.
//
// validate(data) writes data to a fresh fs.mkdtempSync directory and runs the
// validator with process.execPath (the Node binary already running this test,
// so no NODE_BIN resolution is needed here). The temp directory is removed in
// a finally block (tests/validation/validate-enum-typing.test.js sets the
// precedent) so a leaf calling validate() repeatedly does not litter the OS
// temp directory with fixtures.

var fs = require("fs");
var os = require("os");
var path = require("path");
var spawnSync = require("child_process").spawnSync;

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var VALIDATE = path.join(
  PLUGIN_ROOT,
  "scripts",
  "validation",
  "validate-flow-data.js",
);

function validate(data) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "val-"));
  var input = path.join(dir, "flow-data.json");
  fs.writeFileSync(input, JSON.stringify(data));
  try {
    var r = spawnSync(process.execPath, [VALIDATE, input], {
      encoding: "utf8",
    });
    return { status: r.status, out: r.stdout + r.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function flowWithText(color) {
  return {
    meta: { feature: "T", app: "Studio" },
    screens: [
      {
        name: "S1",
        template: "studio",
        content: [{ type: "TEXT", content: "Hello", color: color }],
      },
    ],
  };
}

module.exports = { validate: validate, flowWithText: flowWithText };
