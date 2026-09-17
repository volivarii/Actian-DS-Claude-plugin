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

describe("findMissingFocus", function () {
  it("warns on a lo-fi screen with no focus node", function () {
    var f = V.findMissingFocus({
      meta: { skin: "lofi" },
      screens: [
        {
          id: "a",
          name: "A",
          content: [{ type: "FRAME", name: "x", children: [] }],
        },
      ],
    });
    assert.deepEqual(
      f.map(function (x) {
        return x.check;
      }),
      ["missing-focus"],
    );
  });
  it("is silent when a node carries focus, when the screen is freehand, or when the skin is not lofi", function () {
    assert.deepEqual(
      V.findMissingFocus({
        meta: { skin: "lofi" },
        screens: [
          {
            id: "a",
            name: "A",
            content: [{ type: "FRAME", name: "x", focus: true, children: [] }],
          },
        ],
      }),
      [],
    );
    assert.deepEqual(
      V.findMissingFocus({
        meta: { skin: "lofi" },
        screens: [{ id: "a", name: "A", layout: "freehand", content: [] }],
      }),
      [],
    );
    assert.deepEqual(
      V.findMissingFocus({
        meta: {},
        screens: [{ id: "a", name: "A", content: [] }],
      }),
      [],
    );
  });
  it("missing-focus is registered as CLI-visible", function () {
    var cliText = require("fs").readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "scripts",
        "validation",
        "validate-flow-data.js",
      ),
      "utf8",
    );
    var m = /CLI_VISIBLE_KINDS = \{([\s\S]*?)\};/.exec(cliText);
    assert.ok(m, "CLI_VISIBLE_KINDS block found");
    assert.match(m[1], /"missing-focus":\s*true/);
  });
});
