"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var v = require("../../scripts/renderers/html-renderers/validate-node.js");

test("valid INSTANCE node passes", function () {
  var errs = v.validateNode({
    type: "INSTANCE",
    ref: "fmButton",
    variant: "Type=Primary",
    props: { Label: "Go" },
  });
  assert.deepEqual(errs, []);
});

test("valid structural nodes pass", function () {
  ["FRAME", "TEXT", "RECT", "ELLIPSE", "DIVIDER"].forEach(function (t) {
    assert.deepEqual(v.validateNode({ type: t }), [], t + " should pass");
  });
});

test("node carrying height validates (emitter reads node.height)", function () {
  assert.deepEqual(v.validateNode({ type: "RECT", width: 10, height: 10 }), []);
});

test("unknown node type is an error", function () {
  var errs = v.validateNode({ type: "WIDGET" });
  assert.equal(errs.length, 1);
  assert.match(errs[0].message, /unknown node type/i);
});

test("INSTANCE without ref is an error", function () {
  var errs = v.validateNode({ type: "INSTANCE" });
  assert.ok(
    errs.some(function (e) {
      return /ref/.test(e.message);
    }),
  );
});

test("fidelity vocabulary in the spec is rejected (discipline rule)", function () {
  var errs = v.validateNode({
    type: "INSTANCE",
    ref: "fmButton",
    class: "fm-button",
  });
  assert.ok(
    errs.some(function (e) {
      return /unexpected key 'class'/.test(e.message);
    }),
  );
});

test("validateTree recurses into children and reports paths", function () {
  var errs = v.validateTree({ type: "FRAME", children: [{ type: "BOGUS" }] });
  assert.equal(errs.length, 1);
  assert.match(errs[0].path, /children\[0\]/);
});

test("validateTree dot-separates paths at depth >= 2", function () {
  var errs = v.validateTree({
    type: "FRAME",
    children: [{ type: "FRAME", children: [{ type: "BOGUS" }] }],
  });
  assert.equal(errs.length, 1);
  assert.equal(errs[0].path, "children[0].children[0].type");
});

test("validateNode never throws on garbage", function () {
  assert.doesNotThrow(function () {
    v.validateNode(null);
  });
  assert.doesNotThrow(function () {
    v.validateNode(undefined);
  });
  assert.doesNotThrow(function () {
    v.validateNode(42);
  });
});
