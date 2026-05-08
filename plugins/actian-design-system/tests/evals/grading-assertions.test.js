"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");

var assertions = require("../../scripts/evals/grading-assertions.js");

var FIXTURES = path.join(__dirname, "fixtures");

function loadFixture(name) {
  var raw = fs.readFileSync(path.join(FIXTURES, name + ".json"), "utf8");
  var parsed = JSON.parse(raw);
  // Helper: return the single document node for the only key in `nodes`.
  var ids = Object.keys(parsed.nodes);
  assert.strictEqual(ids.length, 1, "fixture must have exactly one node entry");
  return parsed.nodes[ids[0]].document;
}

describe("A1: generic-Frame ratio", function () {
  it("passes when ≤5% of frames are named literally 'Frame'", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a1GenericFrameRatio(doc);
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when >5% of frames are named literally 'Frame'", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a1GenericFrameRatio(doc);
    assert.strictEqual(result.passed, false, result.evidence);
  });
});

describe("A2: token-table row heights ≥ 32", function () {
  it("passes when all rows in tables named Color/Sizing/Typography/Anatomy parts ≥ 32px", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a2TokenTableRowHeights(doc);
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when any row in those tables is < 32px", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a2TokenTableRowHeights(doc);
    assert.strictEqual(result.passed, false, result.evidence);
  });
});

describe("A3: variation matrix row heights ≥ 40", function () {
  it("passes when all variation rows ≥ 40px", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a3VariationRowHeights(doc);
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when any variation row < 40px", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a3VariationRowHeights(doc);
    assert.strictEqual(result.passed, false, result.evidence);
  });

  it("passes vacuously when no Variation frame exists", function () {
    var doc = { id: "0:1", name: "Empty", type: "FRAME", children: [] };
    var result = assertions.a3VariationRowHeights(doc);
    assert.strictEqual(result.passed, true);
  });
});

describe("A4: token typo regression", function () {
  it("passes when no banned token typos appear in any TEXT node", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a4TokenTypos(doc);
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when a TEXT node contains --zen-font-body-stardard", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a4TokenTypos(doc);
    assert.strictEqual(result.passed, false, result.evidence);
  });
});

describe("A5: Specs sub-frame exists", function () {
  it("passes when a frame whose name contains 'Specs' exists", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a5SpecsSubFrame(doc);
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when no frame name contains 'Specs'", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a5SpecsSubFrame(doc);
    assert.strictEqual(result.passed, false, result.evidence);
  });
});

describe("A6: Anatomy badges A and B", function () {
  it("passes when both A and B TEXT nodes exist inside Anatomy diagram", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a6AnatomyBadges(doc);
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when badge B is missing", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a6AnatomyBadges(doc);
    assert.strictEqual(result.passed, false, result.evidence);
  });
});

describe("A7: variation row count matches fixture", function () {
  it("passes when Figma variation row count equals fixture variant count (±1)", function () {
    var doc = loadFixture("button-passing");
    var result = assertions.a7VariationRowCount(doc, { variantCount: 6 });
    assert.strictEqual(result.passed, true, result.evidence);
  });

  it("fails when counts differ by more than 1", function () {
    var doc = loadFixture("button-passing");
    var result = assertions.a7VariationRowCount(doc, { variantCount: 12 });
    assert.strictEqual(result.passed, false, result.evidence);
  });

  it("passes when counts differ by exactly 1 (header-row tolerance)", function () {
    var doc = loadFixture("button-passing");
    // 6 rows in fixture; 5 variants = diff of 1 — should pass
    var result = assertions.a7VariationRowCount(doc, { variantCount: 5 });
    assert.strictEqual(result.passed, true, result.evidence);
  });
});

describe("A8: renderTable invocation rate ≥ 80%", function () {
  it("passes when adoption_rate ≥ 0.80 with strict equality on 'Table (renderTable)'", function () {
    var doc = loadFixture("checkbox-passing");
    var result = assertions.a8RenderTableAdoption(doc, {
      expectedRenderTablesCount: 4,
    });
    assert.strictEqual(result.passed, true, result.evidence);
    var ev = JSON.parse(result.evidence);
    assert.strictEqual(ev.tables_via_interpreter, 4);
    assert.strictEqual(ev.adoption_rate, 1);
  });

  it("fails when fewer than expected tables match exactly", function () {
    var doc = loadFixture("checkbox-failing");
    var result = assertions.a8RenderTableAdoption(doc, {
      expectedRenderTablesCount: 4,
    });
    assert.strictEqual(result.passed, false, result.evidence);
  });

  it("counts only exact 'Table (renderTable)' matches, not suffixed names", function () {
    var doc = {
      id: "0:1",
      name: "Root",
      type: "FRAME",
      children: [
        { id: "0:2", name: "Table (renderTable)", type: "FRAME", children: [] },
        {
          id: "0:3",
          name: "Table (renderTable) — Sizing",
          type: "FRAME",
          children: [],
        },
        {
          id: "0:4",
          name: "Anatomy parts table (renderTable)",
          type: "FRAME",
          children: [],
        },
        { id: "0:5", name: "Table (renderTable)", type: "FRAME", children: [] },
      ],
    };
    var result = assertions.a8RenderTableAdoption(doc, {
      expectedRenderTablesCount: 4,
    });
    var ev = JSON.parse(result.evidence);
    // Only 2 strict matches; 4 expected → adoption_rate = 0.50
    assert.strictEqual(ev.tables_via_interpreter, 2);
    assert.strictEqual(result.passed, false);
  });
});
