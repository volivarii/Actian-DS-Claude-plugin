"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var validateNode = require("../../scripts/renderers/html-renderers/validate-node.js");

describe("validate-node — flow-field coverage", function () {
  it("accepts a flow content node carrying `intent`", function () {
    var errors = validateNode.validateTree({
      type: "INSTANCE",
      ref: "fmButton",
      intent: "destructive-action",
    });
    assert.deepEqual(errors, []);
  });

  it("still rejects an unknown/fidelity key", function () {
    var errors = validateNode.validateTree({ type: "FRAME", className: "fm-x" });
    assert.ok(errors.some(function (e) { return e.path === "className"; }));
  });
});
