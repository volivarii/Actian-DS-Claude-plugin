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

function card() {
  return { type: "INSTANCE", library: "ds", dsSlug: "search-result-card", props: { Title: "x" } };
}

describe("findUnfilledSlots", function () {
  it("flags a declared slot no node carries, and a results slot under the floor", function () {
    var data = {
      meta: {},
      screens: [
        {
          id: "s1",
          name: "Catalog",
          pageRecipe: "faceted-browse",
          content: [
            {
              type: "FRAME",
              name: "Filter rail",
              slot: "rail",
              children: [{ type: "TEXT", content: "Filters" }],
            },
            {
              type: "FRAME",
              name: "Results",
              slot: "results",
              children: [card(), card(), card()],
            },
          ],
        },
      ],
    };
    var f = V.findUnfilledSlots(data);
    var checks = f
      .map(function (x) {
        return x.check + ":" + x.path;
      })
      .sort();
    assert.deepEqual(checks, [
      "density-floor:slot:results",
      "unfilled-slot:slot:bulk-bar",
      "unfilled-slot:slot:results-header",
    ]);
  });

  it("is silent on a screen with no pageRecipe", function () {
    assert.deepEqual(
      V.findUnfilledSlots({ screens: [{ id: "s", name: "Free", content: [] }] }),
      [],
    );
  });

  it("treats an array-valued slot as filling every key it lists, and subtracts undrawnSlots from the declared keys", function () {
    var recipes = [
      {
        slug: "x",
        slots: { a: "..", b: "..", c: ".." },
        undrawnSlots: ["c"],
      },
    ];
    var data = {
      meta: {},
      screens: [
        {
          id: "s1",
          name: "Screen",
          pageRecipe: "x",
          content: [
            {
              type: "FRAME",
              name: "Combined",
              slot: ["a", "b"],
              children: [{ type: "TEXT", content: "x" }],
            },
          ],
        },
      ],
    };
    assert.deepEqual(V.findUnfilledSlots(data, recipes), []);
  });

  it("reports the unfilled key from an array-valued slot but never a slot subtracted by undrawnSlots", function () {
    var recipes = [
      {
        slug: "x",
        slots: { a: "..", b: "..", c: ".." },
        undrawnSlots: ["c"],
      },
    ];
    var data = {
      meta: {},
      screens: [
        {
          id: "s1",
          name: "Screen",
          pageRecipe: "x",
          content: [
            {
              type: "FRAME",
              name: "Just a",
              slot: ["a"],
              children: [{ type: "TEXT", content: "x" }],
            },
          ],
        },
      ],
    };
    var f = V.findUnfilledSlots(data, recipes);
    var checks = f.map(function (x) {
      return x.check + ":" + x.path;
    });
    assert.deepEqual(checks, ["unfilled-slot:slot:b"]);
  });
});
