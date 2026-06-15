"use strict";

var fs = require("fs");

// DS Quality Score: composite headline (0-100) + per-gate pass-rates.
// Each gate yields a pass-rate in [0,1]; the headline is the mean of the
// gates that have data, ×100. Pure + dependency-free.

function rate(total, fails) {
  if (total === 0) return 1; // no checks ⇒ nothing failing
  return Math.max(0, Math.min(1, (total - fails) / total));
}

// Token gate: broken-ref + contrast pass-rates from lint findings + counts.
function tokenGate(input) {
  var findings = input.findings || [];
  var counts = input.counts || { refsChecked: 0, contrastChecks: 0 };
  var brokenRefFails = findings.filter(function (f) {
    return f.rule === "broken-ref";
  }).length;
  var contrastFails = findings.filter(function (f) {
    return f.rule === "contrast";
  }).length;
  var brokenRefRate = rate(counts.refsChecked, brokenRefFails);
  var contrastRate = rate(counts.contrastChecks, contrastFails);
  return {
    brokenRefRate: brokenRefRate,
    contrastRate: contrastRate,
    score: (brokenRefRate + contrastRate) / 2,
    errors: findings.filter(function (f) {
      return f.severity === "error";
    }).length,
  };
}

// Structural gate: SCORE = structural pass-rate over Program-C rows (deterministic:
// renders non-empty without overflow/clip/abs-pos breakage at 1440/768/360). The
// pixel/visual result is carried as a review-only ANNOTATION and never scored
// (oracles are Figma exports, not browser renders). Null until rows exist.
function structuralGate(agg) {
  agg = agg || {};
  var total = agg.count || 0;
  return {
    score: total ? (agg.structuralPass || 0) / total : null,
    structuralPass: agg.structuralPass || 0,
    total: total,
    pixelPass: agg.pixelPass || 0,
    pixelFail: agg.pixelFail || 0,
    pixelSkip: agg.pixelSkip || 0,
  };
}

// Compose the trended ledger row. Headline = mean of gate scores that are
// non-null, ×100, rounded. Axes (scope/app/theme/context) default to an
// ecosystem-wide run; 1b/1d may emit component- or theme-scoped rows.
function composeScore(input) {
  var tokens = input.tokens || {};
  var structural = input.structural || {};
  var gateScores = [tokens.score, structural.score].filter(function (s) {
    return typeof s === "number";
  });
  var headline = gateScores.length
    ? Math.round(
        (gateScores.reduce(function (a, b) {
          return a + b;
        }, 0) /
          gateScores.length) *
          100,
      )
    : null;
  return {
    date: input.date,
    scope: input.scope || "ecosystem",
    app: input.app || null,
    theme: input.theme || null,
    context: input.context || null,
    score: headline,
    gates: { tokens: tokens, structural: structural },
  };
}

function readLedger(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(function (l) {
      return l.trim();
    })
    .map(function (l) {
      try {
        return JSON.parse(l);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

function appendRow(file, row) {
  fs.appendFileSync(file, JSON.stringify(row) + "\n");
}

function formatReport(row) {
  var t = row.gates.tokens || {};
  var s = row.gates.structural || {};
  var tokenLine =
    t.score == null
      ? "  tokens     : n/a"
      : "  tokens     : " +
        Math.round(t.score * 100) +
        "/100  (refs " +
        Math.round(t.brokenRefRate * 100) +
        "%, contrast " +
        Math.round(t.contrastRate * 100) +
        "%, " +
        t.errors +
        " error(s))";
  var structuralLine =
    s.score == null
      ? "  structural : n/a"
      : "  structural : " +
        Math.round(s.score * 100) +
        "/100  (" +
        (s.structuralPass || 0) +
        "/" +
        (s.total || 0) +
        " clean — overflow/clip/empty at 1440/768/360)";
  var visualLine =
    (s.total || 0) === 0
      ? "  visual     : n/a  (pixel vs Figma — not yet measured)"
      : "  visual     : not scored  (pixel vs Figma: " +
        (s.pixelFail || 0) +
        " fail, " +
        (s.pixelSkip || 0) +
        " skipped, " +
        (s.pixelPass || 0) +
        " verified — review-only)";
  var lines = [
    "DS Quality Score: " +
      (row.score == null ? "n/a" : row.score) +
      " / 100  [" +
      row.scope +
      "]",
    tokenLine,
    structuralLine,
    visualLine,
  ];
  return lines.join("\n");
}

// True when the token gate ran zero checks (empty/structurally-missing token
// source). Used by the CLI to warn instead of silently scoring a perfect 100.
function noChecksRan(counts) {
  counts = counts || {};
  return (counts.refsChecked || 0) === 0 && (counts.contrastChecks || 0) === 0;
}

module.exports = {
  rate: rate,
  tokenGate: tokenGate,
  structuralGate: structuralGate,
  composeScore: composeScore,
  readLedger: readLedger,
  appendRow: appendRow,
  formatReport: formatReport,
  noChecksRan: noChecksRan,
};
