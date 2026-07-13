#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var { coverage } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-coverage-report.js",
  ),
);

describe("ds-coverage-report", function () {
  it("classifies override / anatomy / chip", function () {
    var rows = coverage(["button", "stepper", "weird"], {
      builtSlugs: ["button"],
      anatomyLoader: function (s) {
        return s === "stepper"
          ? { quality: { ratio: 0.9 }, root: { kind: "container" } }
          : null;
      },
    });
    var by = {};
    rows.forEach(function (r) {
      by[r.slug] = r.tier;
    });
    assert.strictEqual(by["button"], "override");
    assert.strictEqual(by["stepper"], "anatomy");
    assert.strictEqual(by["weird"], "chip");
  });

  it("degraded with null ratio when spec has root but no quality", function () {
    var rows = coverage(["alert"], {
      builtSlugs: [],
      anatomyLoader: function (s) {
        if (s === "alert") return { root: { kind: "container" } };
        return null;
      },
    });
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].tier, "degraded");
    assert.strictEqual(rows[0].ratio, null);
  });

  it("classifies degraded (spec exists but ratio < minRatio)", function () {
    var rows = coverage(["badge"], {
      builtSlugs: [],
      anatomyLoader: function (s) {
        if (s === "badge")
          return { quality: { ratio: 0.4 }, root: { kind: "container" } };
        return null;
      },
    });
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].tier, "degraded");
    assert.strictEqual(rows[0].ratio, 0.4);
  });
});

describe("coverage(): renderability columns", function () {
  var path = require("path");
  var { coverage } = require(
    path.resolve(
      __dirname,
      "..",
      "..",
      "scripts",
      "renderers",
      "ds-coverage-report.js",
    ),
  );

  it("marks an override row renderable:null (an override ignores the doc)", function () {
    var rows = coverage(["button"], { builtSlugs: ["button"] });
    assert.strictEqual(rows[0].tier, "override");
    assert.strictEqual(rows[0].renderable, null);
  });

  it("reports renderable:false with a reason where the floor is faking it", function () {
    var rows = coverage(["spinner"], { builtSlugs: [] });
    assert.strictEqual(rows[0].renderable, false);
    assert.match(rows[0].why, /root has no layout/);
  });

  it("keeps the ratio column so the two signals can be compared", function () {
    var rows = coverage(["spinner"], { builtSlugs: [] });
    assert.ok(rows[0].ratio >= 0.6, "spinner still passes the old ratio gate");
    assert.strictEqual(rows[0].renderable, false, "but is not renderable");
  });

  it("reports renderable:true for a doc with real layout and resolvable children", function () {
    var rows = coverage(["collapse-accordion"], { builtSlugs: [] });
    assert.strictEqual(rows[0].renderable, true);
  });
});
