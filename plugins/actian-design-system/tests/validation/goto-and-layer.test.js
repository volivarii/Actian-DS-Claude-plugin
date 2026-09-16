"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var V = require(
  path.join(
    __dirname,
    "..",
    "..",
    "scripts",
    "validation",
    "validate-flow-data.js",
  ),
);
function kinds(f) {
  return f
    .map(function (x) {
      return x.check;
    })
    .sort();
}

describe("layer and goto", function () {
  it("fires every hard error on a known-bad flow", function () {
    var data = {
      screens: [
        {
          id: "a",
          name: "A",
          content: [
            { type: "FRAME", name: "f", goto: "nowhere", children: [] },
          ],
        },
        {
          id: "b",
          name: "B",
          layer: { kind: "popover", over: "zzz" },
          content: [],
        },
        {
          id: "c",
          name: "C",
          layer: { kind: "toast", over: "b" },
          content: [{ type: "FRAME", name: "g", adds: "Ghost", children: [] }],
        },
      ],
    };
    assert.deepEqual(kinds(V.findLayerIssues(data)), [
      "adds-undeclared-name",
      "goto-target-missing",
      "layer-kind-unknown",
      "layer-over-layer",
      "layer-target-missing",
    ]);
  });
  it("reports a dead end only when no node has goto", function () {
    assert.deepEqual(
      kinds(
        V.findLayerIssues({ screens: [{ id: "a", name: "A", content: [] }] }),
      ),
      ["prototype-dead-end"],
    );
  });
});

describe("undeclared invention", function () {
  var deep = {
    type: "FRAME",
    name: "Panel",
    children: [
      {
        type: "FRAME",
        name: "Row",
        children: [
          {
            type: "FRAME",
            name: "Cell",
            children: [{ type: "TEXT", content: "x" }],
          },
        ],
      },
    ],
  };
  it("flags a nested FRAME tree with no INSTANCE and no adds", function () {
    assert.deepEqual(
      kinds(
        V.findUndeclaredInvention({
          screens: [{ id: "a", name: "A", content: [deep] }],
        }),
      ),
      ["undeclared-invention"],
    );
  });
  it("is silent when the tree is declared, or the screen is freehand", function () {
    var declared = Object.assign({}, deep, { adds: "Panel" });
    assert.deepEqual(
      V.findUndeclaredInvention({
        screens: [
          {
            id: "a",
            name: "A",
            adds: [{ name: "Panel", composedFrom: [], why: "w" }],
            content: [declared],
          },
        ],
      }),
      [],
    );
    assert.deepEqual(
      V.findUndeclaredInvention({
        screens: [{ id: "a", name: "A", layout: "freehand", content: [deep] }],
      }),
      [],
    );
  });
});

describe("hardcoded color positive control", function () {
  it("a raw hex fill on a FRAME is already a P0", function () {
    var f = V.findHardcodedColors({
      screens: [
        {
          id: "a",
          name: "A",
          content: [
            { type: "FRAME", name: "f", fills: ["#1a6ee0"], children: [] },
          ],
        },
      ],
    });
    assert.ok(
      f.some(function (x) {
        return x.check === "hardcoded-color";
      }),
    );
  });
});
