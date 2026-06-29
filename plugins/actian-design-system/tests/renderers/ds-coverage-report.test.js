#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var { coverage } = require(path.resolve(__dirname, "..", "..", "scripts", "renderers", "ds-coverage-report.js"));

describe("ds-coverage-report", function () {
  it("classifies override / anatomy / chip", function () {
    var rows = coverage(["button", "stepper", "weird"], {
      builtSlugs: ["button"],
      anatomyLoader: function (s) { return s === "stepper" ? { quality: { ratio: 0.9 }, root: { kind: "container" } } : null; }
    });
    var by = {}; rows.forEach(function (r) { by[r.slug] = r.tier; });
    assert.strictEqual(by["button"], "override");
    assert.strictEqual(by["stepper"], "anatomy");
    assert.strictEqual(by["weird"], "chip");
  });

  it("classifies degraded (spec exists but ratio < minRatio)", function () {
    var rows = coverage(["badge"], {
      builtSlugs: [],
      anatomyLoader: function (s) {
        if (s === "badge") return { quality: { ratio: 0.4 }, root: { kind: "container" } };
        return null;
      }
    });
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].tier, "degraded");
    assert.strictEqual(rows[0].ratio, 0.4);
  });
});
