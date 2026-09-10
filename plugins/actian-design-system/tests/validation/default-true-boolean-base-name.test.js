#!/usr/bin/env node
"use strict";

// default-true-boolean-base-name.test.js — the default-true-boolean-unset
// check must tolerate the same base-name spelling hasOverride() already
// accepts for required-override props (controller ruling on task 8: the
// check was the inconsistency, not the rule — prepare-flow.js's
// propertyRules.defaultTrueBooleans is authored plain, and the DS leaf
// renderer itself (vendor/components/render/renderer/html-renderers/
// ds-html-map.js) reads these booleans by their plain name, e.g.
// props["Leading icon show"] on read-only-tag).

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);
var rules = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "component-property-rules.js"),
);

var QUIET = { skipTokens: true, skipTerminology: true, skipAvoidWords: true };

// "button" is a real registry slug with at least one suffixed default-true
// boolean (e.g. "Show leading icon#809:73") — read live rather than
// hardcoding the Figma node id, which would go stale on a re-vendor.
var boolName = rules.inspectSlugs(["button"]).button.defaultTrueBooleans[0];
var baseName = boolName.replace(/#[\d:]+$/, "");

function flowWithButtonProps(props) {
  return {
    meta: {},
    screens: [
      {
        id: "s1",
        name: "Screen 1",
        template: "studio",
        content: [{ type: "INSTANCE", ref: "button", props: props }],
      },
    ],
  };
}

function unsetFindings(result) {
  return result.findings.filter(function (f) {
    return (
      f.kind === "default-true-boolean-unset" &&
      f.message.indexOf(boolName) !== -1
    );
  });
}

describe("default-true-boolean-unset: base-name tolerance", function () {
  it("setting the plain-named boolean (e.g. \"" + baseName + "\": false) for a suffixed registry name raises no warning", function () {
    var props = {};
    props[baseName] = false;
    var result = validate.validate(flowWithButtonProps(props), QUIET);
    assert.strictEqual(unsetFindings(result).length, 0);
  });

  it("leaving it unset still raises the warning (proves the check can fail)", function () {
    var result = validate.validate(flowWithButtonProps({}), QUIET);
    var findings = unsetFindings(result);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].severity, "warning");
  });

  it("setting the exact suffixed registry name still works too (regression)", function () {
    var props = {};
    props[boolName] = false;
    var result = validate.validate(flowWithButtonProps(props), QUIET);
    assert.strictEqual(unsetFindings(result).length, 0);
  });
});
