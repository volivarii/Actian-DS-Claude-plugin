#!/usr/bin/env node
// tests/renderers/ds-set-props.test.js
// TDD for ds-set-props.js — dsSetPropsBestEffort pure function.
//
// Phase RED (before ds-set-props.js exists):
//   - All 4 tests fail with MODULE_NOT_FOUND.
//
// Phase GREEN (after ds-set-props.js is created):
//   All tests pass.
//
// Run: source scripts/lib/resolve-node.sh && "$NODE_BIN" --test tests/renderers/ds-set-props.test.js

"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("node:path");

var dsSetProps = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "html-renderers",
    "ds-set-props.js",
  ),
);
var dsSetPropsBestEffort = dsSetProps.dsSetPropsBestEffort;

describe("ds-set-props — dsSetPropsBestEffort", function () {
  // -------------------------------------------------------------------------
  // T1: Phantom drop — keys absent from componentProperties go to dropped[]
  // -------------------------------------------------------------------------
  it("skips phantom props (no matching componentProperties key) and puts them in dropped", function () {
    var spyCalls = [];
    var inst = {
      componentProperties: { "App type": {}, Breakpoints: {} },
      setProperties: function (arg) {
        spyCalls.push(JSON.parse(JSON.stringify(arg)));
      },
    };
    var dropped = [];

    dsSetPropsBestEffort(
      inst,
      { "App type": "Studio", Breakpoints: "XL", Search: true, Account: "VO" },
      dropped,
    );

    assert.strictEqual(
      spyCalls.length,
      1,
      "setProperties called exactly once for the valid props",
    );
    assert.deepStrictEqual(
      spyCalls[0],
      { "App type": "Studio", Breakpoints: "XL" },
      "spy called with only the two matching props",
    );
    assert.ok(dropped.indexOf("Search") !== -1, "Search in dropped");
    assert.ok(dropped.indexOf("Account") !== -1, "Account in dropped");
    assert.ok(dropped.indexOf("App type") === -1, "App type NOT in dropped (it matched)");
    assert.ok(dropped.indexOf("Breakpoints") === -1, "Breakpoints NOT in dropped (it matched)");
  });

  // -------------------------------------------------------------------------
  // T2: Base-name match — key with #-suffix is resolved by splitting on '#'
  // -------------------------------------------------------------------------
  it("resolves base-name match for keys with #-suffix (Label#724:10 → Label)", function () {
    var spyCalls = [];
    var inst = {
      componentProperties: { "Label#724:10": {} },
      setProperties: function (arg) {
        spyCalls.push(JSON.parse(JSON.stringify(arg)));
      },
    };
    var dropped = [];

    dsSetPropsBestEffort(inst, { Label: "Go" }, dropped);

    assert.strictEqual(spyCalls.length, 1, "setProperties called exactly once");
    assert.deepStrictEqual(
      spyCalls[0],
      { "Label#724:10": "Go" },
      "spy called with the suffixed key form",
    );
    assert.strictEqual(dropped.length, 0, "nothing dropped");
  });

  // -------------------------------------------------------------------------
  // T3: Invalid-value fallback (vendor drift) — per-prop retry on throw
  // -------------------------------------------------------------------------
  it("retries per-prop when batched setProperties throws (vendor drift recovery)", function () {
    var spyCalls = [];
    var inst = {
      componentProperties: { Type: {}, Size: {} },
      setProperties: function (arg) {
        spyCalls.push(JSON.parse(JSON.stringify(arg)));
        // Simulate Figma rejecting an invalid variant value for "Type"
        if (Object.prototype.hasOwnProperty.call(arg, "Type")) {
          throw new Error("setProperties: invalid value for Type");
        }
      },
    };
    var dropped = [];

    // The function must NOT propagate the throw
    assert.doesNotThrow(function () {
      dsSetPropsBestEffort(
        inst,
        { Type: "Primary", Size: "Default" },
        dropped,
      );
    }, "dsSetPropsBestEffort must not throw on vendor-drift rejection");

    // Type should be in dropped (per-prop retry also threw)
    assert.ok(
      dropped.indexOf("Type") !== -1,
      "Type in dropped after retry failure",
    );
    // Size should NOT be in dropped (per-prop retry succeeded)
    assert.ok(
      dropped.indexOf("Size") === -1,
      "Size not in dropped (retry succeeded)",
    );

    // At least one retry call set only {Size} (without Type)
    var sizeOnlyCall = spyCalls.find(function (c) {
      return (
        Object.prototype.hasOwnProperty.call(c, "Size") &&
        !Object.prototype.hasOwnProperty.call(c, "Type")
      );
    });
    assert.ok(
      sizeOnlyCall,
      "setProperties was called with {Size} alone in per-prop retry",
    );
    assert.strictEqual(sizeOnlyCall.Size, "Default", "Size value is 'Default'");
  });

  // -------------------------------------------------------------------------
  // T4: Empty — no keys match → setProperties never called, all in dropped
  // -------------------------------------------------------------------------
  it("skips setProperties entirely when no keys match; all want names go to dropped", function () {
    var spyCalled = false;
    var inst = {
      componentProperties: { Foo: {} },
      setProperties: function () {
        spyCalled = true;
      },
    };
    var dropped = [];

    dsSetPropsBestEffort(inst, { Bar: "baz", Qux: 1 }, dropped);

    assert.strictEqual(spyCalled, false, "setProperties never called");
    assert.ok(dropped.indexOf("Bar") !== -1, "Bar in dropped");
    assert.ok(dropped.indexOf("Qux") !== -1, "Qux in dropped");
  });
});
