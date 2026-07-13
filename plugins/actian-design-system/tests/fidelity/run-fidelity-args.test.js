#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var R = require("../../scripts/fidelity/run-fidelity.js");

describe("parseArgs", function () {
  it("--pilot selects the pilot trio and writes by default", function () {
    var p = R.parseArgs(["--pilot"]);
    assert.deepStrictEqual(p.slugs, [
      "button",
      "checkbox",
      "alert-banner",
    ]);
    assert.strictEqual(p.write, true);
  });
  it("--no-write sets write:false and is not treated as a slug", function () {
    var p = R.parseArgs(["--pilot", "--no-write"]);
    assert.strictEqual(p.write, false);
    assert.deepStrictEqual(p.slugs, [
      "button",
      "checkbox",
      "alert-banner",
    ]);
  });
  it("bare args are slugs", function () {
    var p = R.parseArgs(["button", "modal"]);
    assert.deepStrictEqual(p.slugs, ["button", "modal"]);
    assert.strictEqual(p.write, true);
  });
  it("rejects an unknown flag instead of treating it as a slug", function () {
    assert.throws(function () {
      R.parseArgs(["--help"]);
    }, /unknown flag/i);
    assert.throws(function () {
      R.parseArgs(["--nowrite"]);
    }, /unknown flag/i);
  });
  it("--all resolves to the BUILT_SLUGS set", function () {
    var p = R.parseArgs(["--all"]);
    assert.ok(Array.isArray(p.slugs) && p.slugs.length > 0);
    assert.ok(p.slugs.indexOf("button") !== -1);
    assert.strictEqual(p.all, true);
  });
  it("--no-write standalone writes nothing and selects no slugs", function () {
    var p = R.parseArgs(["--no-write"]);
    assert.strictEqual(p.write, false);
    assert.deepStrictEqual(p.slugs, []);
  });
  it("drops empty/falsy bare tokens so they can't become a junk slug", function () {
    var p = R.parseArgs(["", "button", ""]);
    assert.deepStrictEqual(p.slugs, ["button"]);
  });
});
