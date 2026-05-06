#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/anatomy-filter.js");

describe("anatomy-filter — wiring", function () {
  it("exports the two pure functions", function () {
    assert.strictEqual(typeof mod.filterPartsByLayerExistence, "function");
    assert.strictEqual(typeof mod.pickClosestEdge, "function");
  });
});

describe("filterPartsByLayerExistence", function () {
  it("all parts present → all visible", function () {
    var parts = [
      { letter: "A", figmaLayerName: "Box" },
      { letter: "B", figmaLayerName: "Label" },
    ];
    var present = new Set(["Box", "Label"]);
    var result = mod.filterPartsByLayerExistence(parts, present);
    assert.strictEqual(result.visible.length, 2);
    assert.strictEqual(result.absent.length, 0);
  });

  it("partial match — splits visible vs absent", function () {
    var parts = [
      { letter: "A", figmaLayerName: "Box" },
      { letter: "B", figmaLayerName: "Focus ring" },
      { letter: "C", figmaLayerName: "Label" },
    ];
    var present = new Set(["Box", "Label"]); // Focus ring missing
    var result = mod.filterPartsByLayerExistence(parts, present);
    assert.strictEqual(result.visible.length, 2);
    assert.strictEqual(result.absent.length, 1);
    assert.strictEqual(result.absent[0].letter, "B");
  });

  it("no parts present → all absent", function () {
    var parts = [
      { letter: "A", figmaLayerName: "Hover surface" },
      { letter: "B", figmaLayerName: "Focus ring" },
    ];
    var present = new Set([]);
    var result = mod.filterPartsByLayerExistence(parts, present);
    assert.strictEqual(result.visible.length, 0);
    assert.strictEqual(result.absent.length, 2);
  });

  it("empty parts input → empty visible + absent", function () {
    var result = mod.filterPartsByLayerExistence([], new Set(["Box"]));
    assert.deepStrictEqual(result, { visible: [], absent: [] });
  });

  it("preserves part objects intact (not just letters)", function () {
    var parts = [{ letter: "A", figmaLayerName: "Box", name: "Container" }];
    var present = new Set(["Box"]);
    var result = mod.filterPartsByLayerExistence(parts, present);
    assert.strictEqual(result.visible[0].name, "Container");
  });
});
