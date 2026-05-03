#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fp = require("../../scripts/sync/fingerprint-schema.js");

describe("RECIPE_IDS", function () {
  it("is a non-empty array", function () {
    assert.ok(Array.isArray(fp.RECIPE_IDS));
    assert.ok(fp.RECIPE_IDS.length > 0);
  });

  it("contains expected canonical archetypes", function () {
    // Sanity check against recipes/flow/_index.json archetype names — these
    // are stable IDs the registry has shipped since Sprint A.
    assert.ok(fp.RECIPE_IDS.indexOf("table-list") !== -1);
    assert.ok(fp.RECIPE_IDS.indexOf("form-create") !== -1);
    assert.ok(fp.RECIPE_IDS.indexOf("dashboard") !== -1);
  });

  it("contains only string entries", function () {
    for (var i = 0; i < fp.RECIPE_IDS.length; i++) {
      assert.strictEqual(typeof fp.RECIPE_IDS[i], "string");
    }
  });
});

describe("validateFingerprint", function () {
  it("accepts a fully-valid fingerprint", function () {
    var v = fp.validateFingerprint({
      density: "high",
      hierarchy_depth: 4,
      primary_components: ["toolbar", "table"],
      layout_archetype: fp.RECIPE_IDS[0],
      extracted_at: "2026-04-29T12:00:00Z",
    });
    assert.strictEqual(v.valid, true);
    assert.deepStrictEqual(v.errors, []);
  });

  it("accepts an empty fingerprint object (vacuous, partial extraction allowed)", function () {
    var v = fp.validateFingerprint({});
    assert.strictEqual(v.valid, true);
    assert.deepStrictEqual(v.errors, []);
  });

  it("accepts a partial fingerprint with only some fields populated", function () {
    var v = fp.validateFingerprint({ density: "medium" });
    assert.strictEqual(v.valid, true);
  });

  it("rejects non-object inputs", function () {
    assert.strictEqual(fp.validateFingerprint(null).valid, false);
    assert.strictEqual(fp.validateFingerprint(undefined).valid, false);
    assert.strictEqual(fp.validateFingerprint("a string").valid, false);
    assert.strictEqual(fp.validateFingerprint(42).valid, false);
  });

  it("rejects invalid density enum", function () {
    var v = fp.validateFingerprint({ density: "ultra" });
    assert.strictEqual(v.valid, false);
    assert.ok(
      v.errors.some(function (e) {
        return e.indexOf("density") !== -1;
      }),
    );
  });

  it("rejects out-of-range hierarchy_depth", function () {
    assert.strictEqual(
      fp.validateFingerprint({ hierarchy_depth: 0 }).valid,
      false,
    );
    assert.strictEqual(
      fp.validateFingerprint({ hierarchy_depth: 9 }).valid,
      false,
    );
    assert.strictEqual(
      fp.validateFingerprint({ hierarchy_depth: 1.5 }).valid,
      false,
    );
    assert.strictEqual(
      fp.validateFingerprint({ hierarchy_depth: "deep" }).valid,
      false,
    );
  });

  it("rejects non-array primary_components", function () {
    var v = fp.validateFingerprint({ primary_components: "table" });
    assert.strictEqual(v.valid, false);
  });

  it("rejects non-string entries inside primary_components", function () {
    var v = fp.validateFingerprint({ primary_components: ["table", 42] });
    assert.strictEqual(v.valid, false);
  });

  it("accepts empty primary_components array", function () {
    var v = fp.validateFingerprint({ primary_components: [] });
    assert.strictEqual(v.valid, true);
  });

  it("rejects layout_archetype not in RECIPE_IDS", function () {
    var v = fp.validateFingerprint({ layout_archetype: "command-palette" });
    assert.strictEqual(v.valid, false);
    assert.ok(
      v.errors.some(function (e) {
        return e.indexOf("layout_archetype") !== -1;
      }),
    );
  });

  it("accepts every member of RECIPE_IDS as a valid layout_archetype", function () {
    for (var i = 0; i < fp.RECIPE_IDS.length; i++) {
      var v = fp.validateFingerprint({ layout_archetype: fp.RECIPE_IDS[i] });
      assert.strictEqual(
        v.valid,
        true,
        "RECIPE_IDS[" + i + "] = " + fp.RECIPE_IDS[i] + " should validate",
      );
    }
  });
});
