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

describe("pickClosestEdge", function () {
  // Container at (0,0,400,300). Box at (10, 50) is closest to LEFT.
  it("box near left edge → left", function () {
    var box = { x: 10, y: 50, width: 50, height: 30 };
    var container = { x: 0, y: 0, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "left");
  });

  it("box near top edge → top", function () {
    var box = { x: 100, y: 5, width: 50, height: 30 };
    var container = { x: 0, y: 0, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "top");
  });

  it("box near right edge → right", function () {
    var box = { x: 380, y: 100, width: 15, height: 30 };
    var container = { x: 0, y: 0, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "right");
  });

  it("box near bottom edge → bottom", function () {
    var box = { x: 100, y: 280, width: 50, height: 15 };
    var container = { x: 0, y: 0, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "bottom");
  });

  it("equidistant from left and top — leftFirst=true picks left", function () {
    // box at (50, 50) with width 50, height 50 in 400x300 container
    // distLeft = 50, distTop = 50, distRight = 300, distBottom = 200
    // Tied between left and top; leftFirst=true → left
    var box = { x: 50, y: 50, width: 50, height: 50 };
    var container = { x: 0, y: 0, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "left");
  });

  it("equidistant from top and right — leftFirst=true picks top", function () {
    // distTop = 50, distRight = 50 — picks top (left already excluded by being further)
    var box = { x: 300, y: 50, width: 50, height: 50 };
    var container = { x: 0, y: 0, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "top");
  });

  it("non-zero container origin — distances computed relative to container", function () {
    // Container at (100, 100, 400, 300). Box at (110, 150) → distLeft = 10
    var box = { x: 110, y: 150, width: 50, height: 30 };
    var container = { x: 100, y: 100, width: 400, height: 300 };
    assert.strictEqual(mod.pickClosestEdge(box, container, true), "left");
  });
});
