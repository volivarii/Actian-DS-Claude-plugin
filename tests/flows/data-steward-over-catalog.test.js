#!/usr/bin/env node
"use strict";

// Task 6.6 acceptance: the Data Steward panel layered over the Catalog page.
// Runs the real validator CLI (via the shared temp-fixture helper) against
// the committed fixture, and against a deliberately-broken copy, so the
// check is proven able to fail (gate doctrine) rather than trusted on faith.

var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var { validate } = require("../helpers/validate-cli.js");

var FIXTURE = path.join(
  __dirname,
  "..",
  "fixtures",
  "data-steward-over-catalog.flow.json",
);

// The nine catalog-quality Slice-1 "hard" check kinds (validate-flow-data.js
// HARD_KINDS-adjacent set): layer targeting, goto targeting, adds
// declaration, and the two soft-warning composition checks this fixture must
// also come up empty on (unfilled-slot/density-floor/missing-focus, per the
// task-6.6 addendum ruling 6).
var HARD_KINDS = [
  "unfilled-slot",
  "density-floor",
  "missing-focus",
  "layer-kind-unknown",
  "layer-target-missing",
  "layer-over-layer",
  "goto-target-missing",
  "adds-undeclared-name",
  "undeclared-invention",
];

function loadFixture() {
  return JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
}

// Finds the panel's Close button (screen "steward", props.Label === "Close")
// and mutates its `goto` to a screen id that does not exist in this flow.
function breakCloseGoto(data) {
  var found = false;
  (function walk(nodes) {
    (nodes || []).forEach(function (n) {
      if (!n) return;
      if (
        n.type === "INSTANCE" &&
        n.dsSlug === "button" &&
        n.props &&
        n.props.Label === "Close" &&
        typeof n.goto === "string"
      ) {
        n.goto = "catalog-does-not-exist";
        found = true;
      }
      if (n.children) walk(n.children);
    });
  })(
    (data.screens || []).reduce(function (acc, s) {
      return acc.concat(s.content || []);
    }, []),
  );
  if (!found) throw new Error("fixture shape changed: Close button not found");
  return data;
}

describe("data-steward-over-catalog.flow.json", function () {
  it("validates clean: no P0 line, none of the nine hard-check kinds (GREEN)", function () {
    var data = loadFixture();
    var r = validate(data);
    assert.doesNotMatch(r.out, /P0 \[/);
    HARD_KINDS.forEach(function (kind) {
      assert.doesNotMatch(
        r.out,
        new RegExp("\\[" + kind + "\\]"),
        "unexpected finding kind: " + kind,
      );
    });
    // error severity would exit 1; this fixture is clean or warning-only.
    assert.notEqual(r.status, 1);
  });

  it("flags a broken goto target as a P0 goto-target-missing (RED — proves the check can fail)", function () {
    var broken = breakCloseGoto(loadFixture());
    var r = validate(broken);
    assert.match(r.out, /P0 \[goto-target-missing\]/);
    assert.match(r.out, /"catalog-does-not-exist"/);
    assert.equal(r.status, 1);
  });

  it("the committed fixture file itself is untouched by the RED case (mutation runs on a clone)", function () {
    var before = fs.readFileSync(FIXTURE, "utf8");
    breakCloseGoto(loadFixture());
    var after = fs.readFileSync(FIXTURE, "utf8");
    assert.equal(before, after);
  });
});
