// tests/integration/authoring-table-sync.test.js
// Gate: the vocabulary table in ds-components-authoring.md is generated from
// the vendored dskit registry + ds-html-map.BUILT_SLUGS (see
// scripts/renderers/render-authoring-table.js). This test fails whenever the
// committed table drifts from those sources — the exact failure mode the
// 2026-07-05 audit found (16 BUILT slugs marked chip, a retired `input` row,
// text-input missing), which mis-steers screen-generator/generate-flow.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var gen = require("../../scripts/renderers/render-authoring-table.js");
var BUILT_SLUGS =
  require("../../scripts/lib/renderer.js").dsHtmlMap.BUILT_SLUGS;

test("ds-components-authoring.md vocabulary table is in sync with registry + BUILT_SLUGS", function () {
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  var regenerated = gen.replaceTable(md, gen.renderTableRows());
  assert.equal(
    regenerated,
    md,
    "Stale vocabulary table — regenerate and commit:\n" +
      "  node scripts/renderers/render-authoring-table.js",
  );
});

test("generated rows mark exactly the built-and-authorable slugs as BUILT", function () {
  // Invariant derived from data (never a frozen slug list): a row says BUILT
  // iff its slug is in BUILT_SLUGS. Registry-only slugs must not claim a
  // bespoke leaf, and no built slug that is authorable may hide as chip.
  var authorable = {};
  gen.authorableEntries().forEach(function (e) {
    authorable[e.slug] = true;
  });
  var built = {};
  BUILT_SLUGS.forEach(function (s) {
    if (authorable[s]) built[s] = true;
  });
  gen.renderTableRows().forEach(function (row) {
    var m = row.match(/^\| `([^`]+)` \|.*\| (\*\*BUILT\*\*|appearance|chip) \|/);
    assert.ok(m, "unparseable generated row: " + row);
    assert.equal(
      m[2] === "**BUILT**",
      !!built[m[1]],
      m[1] + " status disagrees with BUILT_SLUGS membership",
    );
  });
});
