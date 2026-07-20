"use strict";

// ds-built-slugs.test.js — BUILT_SLUGS validator gate.
// BUILT_SLUGS is the flow-data validator's warning-tier source of truth. This gate keeps
// it in lockstep with the actual switch cases in renderDSComponent.
// Repo style: node:test + node:assert.

var { test } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var MAP_PATH = require("../../scripts/lib/renderer.js").modulePath(
  "html-renderers/ds-html-map.js",
);
var map = require(MAP_PATH);

test("BUILT_SLUGS is exported and matches the switch cases", function () {
  assert.ok(Array.isArray(map.BUILT_SLUGS), "BUILT_SLUGS exported");
  var src = fs.readFileSync(MAP_PATH, "utf8");
  var cases = [];
  var caseRegex = /case "([a-z0-9-]+)":/g;
  var m;
  while ((m = caseRegex.exec(src))) {
    cases.push(m[1]);
  }
  var builtSet = new Set(map.BUILT_SLUGS);
  var caseSet = new Set(cases);
  assert.deepStrictEqual(
    Array.from(builtSet).sort(),
    Array.from(caseSet).sort(),
    "BUILT_SLUGS must match all switch cases (in any order)"
  );
});
