"use strict";

// Pure assertion functions for the component-brief eval lane.
// Each function takes a `document` node (the top-level FRAME from a
// Figma /v1/files/.../nodes?ids=<id> response) and returns
// { passed: boolean, evidence: string }. No I/O, no side effects.
//
// The CLI in grade-locally.js wraps these into the grading.json schema
// expected by skill-creator's viewer ({expectations: [{text, passed,
// evidence}]}). Tests live in tests/evals/grading-assertions.test.js
// and exercise pure-function behavior with synthetic metadata fixtures.

function walkFrames(node, visit) {
  if (!node) return;
  if (node.type === "FRAME") visit(node);
  if (Array.isArray(node.children)) {
    node.children.forEach(function (c) {
      walkFrames(c, visit);
    });
  }
}

function a1GenericFrameRatio(document) {
  var total = 0;
  var generic = 0;
  walkFrames(document, function (frame) {
    total++;
    if (frame.name === "Frame") generic++;
  });
  if (total === 0) {
    return {
      passed: true,
      evidence: "no FRAME nodes in tree (vacuously passes)",
    };
  }
  var ratio = generic / total;
  var pct = (ratio * 100).toFixed(1);
  var passed = ratio <= 0.05;
  return {
    passed: passed,
    evidence:
      generic + " of " + total + " frames named literally 'Frame' (" + pct + "%)",
  };
}

var TOKEN_TABLE_NAME_TOKENS = ["Color", "Sizing", "Typography", "Anatomy parts"];

function isTokenTable(name) {
  if (typeof name !== "string") return false;
  for (var i = 0; i < TOKEN_TABLE_NAME_TOKENS.length; i++) {
    if (name.indexOf(TOKEN_TABLE_NAME_TOKENS[i]) >= 0) return true;
  }
  return false;
}

function a2TokenTableRowHeights(document) {
  var violations = [];
  walkFrames(document, function (frame) {
    if (!isTokenTable(frame.name)) return;
    var rows = Array.isArray(frame.children) ? frame.children : [];
    rows.forEach(function (row, idx) {
      var h = row.absoluteBoundingBox ? row.absoluteBoundingBox.height : null;
      if (h !== null && h < 32) {
        violations.push({
          table: frame.name,
          rowIndex: idx,
          rowName: row.name,
          height: h,
        });
      }
    });
  });
  if (violations.length === 0) {
    return {
      passed: true,
      evidence: "every row in every Phase 1 token table ≥ 32px",
    };
  }
  return {
    passed: false,
    evidence:
      "rows < 32px: " +
      violations
        .map(function (v) {
          return v.table + "[" + v.rowIndex + "] (" + v.rowName + ", h=" + v.height + ")";
        })
        .join("; "),
  };
}

function a3VariationRowHeights(document) {
  var violations = [];
  var found = false;
  walkFrames(document, function (frame) {
    if (typeof frame.name !== "string" || frame.name.indexOf("Variation") < 0) return;
    found = true;
    var rows = Array.isArray(frame.children) ? frame.children : [];
    rows.forEach(function (row, idx) {
      var h = row.absoluteBoundingBox ? row.absoluteBoundingBox.height : null;
      if (h !== null && h < 40) {
        violations.push({
          frame: frame.name,
          rowIndex: idx,
          rowName: row.name,
          height: h,
        });
      }
    });
  });
  if (!found) {
    return {
      passed: true,
      evidence: "no Variation frame in tree (allowed for fixtures without one)",
    };
  }
  if (violations.length === 0) {
    return { passed: true, evidence: "every variation row ≥ 40px" };
  }
  return {
    passed: false,
    evidence:
      "variation rows < 40px: " +
      violations
        .map(function (v) {
          return v.frame + "[" + v.rowIndex + "] (" + v.rowName + ", h=" + v.height + ")";
        })
        .join("; "),
  };
}

var BANNED_TOKEN_SUBSTRINGS = ["--zen-font-body-stardard", "--zen-color-them"];

function walkText(node, visit) {
  if (!node) return;
  if (node.type === "TEXT" && typeof node.characters === "string") {
    visit(node);
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(function (c) {
      walkText(c, visit);
    });
  }
}

function a4TokenTypos(document) {
  var matches = [];
  walkText(document, function (text) {
    BANNED_TOKEN_SUBSTRINGS.forEach(function (banned) {
      if (text.characters.indexOf(banned) >= 0) {
        matches.push({ id: text.id, banned: banned });
      }
    });
  });
  if (matches.length === 0) {
    return { passed: true, evidence: "no banned token typos in any TEXT node" };
  }
  return {
    passed: false,
    evidence:
      "banned token strings found: " +
      matches.map(function (m) {
        return m.banned + " in " + m.id;
      }).join("; "),
  };
}

function a5SpecsSubFrame(document) {
  var hits = [];
  walkFrames(document, function (frame) {
    if (typeof frame.name === "string" && frame.name.indexOf("Specs") >= 0) {
      hits.push(frame.name);
    }
  });
  if (hits.length === 0) {
    return { passed: false, evidence: "no frame name contains 'Specs'" };
  }
  return {
    passed: true,
    evidence: "Specs frame(s) found: " + hits.join(", "),
  };
}

function a6AnatomyBadges(document) {
  var anatomyDiagram = null;
  walkFrames(document, function (frame) {
    if (anatomyDiagram) return;
    if (typeof frame.name !== "string") return;
    // Per grader.md: name contains "Anatomy" but is NOT the "Anatomy parts"
    // token table.
    if (frame.name.indexOf("Anatomy") < 0) return;
    if (frame.name.indexOf("Anatomy parts") >= 0) return;
    anatomyDiagram = frame;
  });
  if (!anatomyDiagram) {
    return { passed: false, evidence: "no Anatomy diagram frame found" };
  }
  var foundA = false;
  var foundB = false;
  walkText(anatomyDiagram, function (text) {
    if (text.characters === "A") foundA = true;
    if (text.characters === "B") foundB = true;
  });
  if (foundA && foundB) {
    return { passed: true, evidence: "both A and B badge TEXT nodes found" };
  }
  return {
    passed: false,
    evidence:
      "badges found: A=" + (foundA ? "yes" : "no") + ", B=" + (foundB ? "yes" : "no"),
  };
}

function a7VariationRowCount(document, ctx) {
  var variantCount = ctx && ctx.variantCount;
  if (typeof variantCount !== "number") {
    return {
      passed: false,
      evidence: "ctx.variantCount missing — pass the fixture's card_variation.variants.length",
    };
  }
  var variationFrame = null;
  walkFrames(document, function (frame) {
    if (variationFrame) return;
    if (typeof frame.name === "string" && frame.name.indexOf("Variation") >= 0) {
      variationFrame = frame;
    }
  });
  if (!variationFrame) {
    return { passed: false, evidence: "no Variation frame found" };
  }
  var rowChildren = Array.isArray(variationFrame.children)
    ? variationFrame.children
    : [];
  var figmaCount = rowChildren.length;
  // grader.md tolerates ±1 (header rows may be excluded)
  var diff = Math.abs(figmaCount - variantCount);
  if (diff <= 1) {
    return {
      passed: true,
      evidence:
        "fixture variants: " + variantCount + ", Figma rows: " + figmaCount + " (within ±1)",
    };
  }
  return {
    passed: false,
    evidence:
      "fixture variants: " + variantCount + ", Figma rows: " + figmaCount + " (diff " + diff + ")",
  };
}

function a8RenderTableAdoption(document, ctx) {
  var expected = ctx && ctx.expectedRenderTablesCount;
  if (typeof expected !== "number") {
    return {
      passed: false,
      evidence:
        "ctx.expectedRenderTablesCount missing — pass evals.json's expected_render_tables_count",
    };
  }
  var tablesViaInterpreter = 0;
  var tokenPillFrames = 0;
  var namedTableFrames = [];
  walkFrames(document, function (frame) {
    if (frame.name === "Table (renderTable)") {
      tablesViaInterpreter++;
      namedTableFrames.push(frame.name);
    }
    if (typeof frame.name === "string" && frame.name.indexOf("Token: --zen-") === 0) {
      tokenPillFrames++;
    }
  });
  var adoptionRate = expected === 0 ? 0 : tablesViaInterpreter / expected;
  var passed = adoptionRate >= 0.8;
  var evidence = JSON.stringify({
    tables_via_interpreter: tablesViaInterpreter,
    expected_render_tables_count: expected,
    adoption_rate: Number(adoptionRate.toFixed(2)),
    token_pill_frames: tokenPillFrames,
    named_table_frames: namedTableFrames,
  });
  return { passed: passed, evidence: evidence };
}

module.exports = {
  walkFrames: walkFrames,
  walkText: walkText,
  isTokenTable: isTokenTable,
  a1GenericFrameRatio: a1GenericFrameRatio,
  a2TokenTableRowHeights: a2TokenTableRowHeights,
  a3VariationRowHeights: a3VariationRowHeights,
  a4TokenTypos: a4TokenTypos,
  a5SpecsSubFrame: a5SpecsSubFrame,
  a6AnatomyBadges: a6AnatomyBadges,
  a7VariationRowCount: a7VariationRowCount,
  a8RenderTableAdoption: a8RenderTableAdoption,
};
