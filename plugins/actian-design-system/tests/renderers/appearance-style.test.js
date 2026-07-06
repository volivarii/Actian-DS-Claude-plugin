"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");

describe("variantColorDecls", function () {
  var as = require("../../scripts/renderers/appearance-style.js");

  it("variantColorDecls emits only background + border-color", function () {
    var decls = as.variantColorDecls({
      background: "#fff9ff",
      backgroundToken: "--zen-color-tag-purple",
      border: { color: "#f2e6f8", width: "1px" },
      radius: "4px",
      text: { color: "#50505d" },
    });
    assert.deepStrictEqual(decls, [
      "background:var(--zen-color-tag-purple, #fff9ff)",
      "border-color:#f2e6f8",
    ]);
  });

  it("variantColorDecls is value-only when no token rides", function () {
    var decls = as.variantColorDecls({ background: "#fff4ec", border: { color: "#ffdacf" } });
    assert.deepStrictEqual(decls, ["background:#fff4ec", "border-color:#ffdacf"]);
  });

  it("variantColorDecls drops unsafe/absent slots", function () {
    assert.deepStrictEqual(as.variantColorDecls({ background: "red;}" }), []);
    assert.deepStrictEqual(as.variantColorDecls(null), []);
    assert.deepStrictEqual(as.variantColorDecls({ radius: "4px" }), []);
  });
});
