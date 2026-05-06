#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/anatomy-scale.js");

describe("anatomy-scale — wiring", function () {
  it("exports pickScale", function () {
    assert.strictEqual(typeof mod.pickScale, "function");
  });
});

describe("pickScale — heuristic", function () {
  it("16x16 (Checkbox) → 4 (smaller axis 16, 16*4=64 still < 80, but cap at 4)", function () {
    assert.strictEqual(mod.pickScale(16, 16, null), 4);
  });

  it("30x30 → 3 (30*3=90 > 80)", function () {
    assert.strictEqual(mod.pickScale(30, 30, null), 3);
  });

  it("60x60 → 2 (60*2=120 > 80)", function () {
    assert.strictEqual(mod.pickScale(60, 60, null), 2);
  });

  it("200x40 → 2 (smaller axis 40, 40*2=80 NOT > 80, so 3? actually 40*3=120 > 80, pick 3)", function () {
    assert.strictEqual(mod.pickScale(200, 40, null), 3);
  });

  it("100x100 → 1 (100 > 80 already)", function () {
    assert.strictEqual(mod.pickScale(100, 100, null), 1);
  });

  it("500x500 (Dialog) → 1", function () {
    assert.strictEqual(mod.pickScale(500, 500, null), 1);
  });
});

describe("pickScale — override", function () {
  it("valid override 4 wins regardless of dimensions", function () {
    assert.strictEqual(mod.pickScale(500, 500, 4), 4);
  });

  it("valid override 1 wins regardless of dimensions", function () {
    assert.strictEqual(mod.pickScale(16, 16, 1), 1);
  });

  it("undefined override falls through to heuristic", function () {
    assert.strictEqual(mod.pickScale(60, 60, undefined), 2);
  });

  it("null override falls through to heuristic", function () {
    assert.strictEqual(mod.pickScale(60, 60, null), 2);
  });

  it("throws on non-integer override", function () {
    assert.throws(function () {
      mod.pickScale(60, 60, 2.5);
    }, /Invalid anatomyScale override/);
  });

  it("throws on zero or negative override", function () {
    assert.throws(function () {
      mod.pickScale(60, 60, 0);
    }, /Invalid anatomyScale override/);
    assert.throws(function () {
      mod.pickScale(60, 60, -1);
    }, /Invalid anatomyScale override/);
  });

  it("throws on override greater than 4", function () {
    assert.throws(function () {
      mod.pickScale(60, 60, 5);
    }, /Invalid anatomyScale override/);
  });
});
