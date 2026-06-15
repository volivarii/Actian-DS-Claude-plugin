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

// Fidelity gate: SCORE = structural pass-rate over Program-C rows (deterministic).
// The pixel result is reported as a review-only annotation and never scored,
// because oracles are Figma exports, not browser renders. Null (excluded from
// the headline) until Program-C rows exist.
function fidelityGate(agg) {
  agg = agg || {};
  var total = agg.count || 0;
  return {
    score: total ? (agg.structuralPass || 0) / total : null,
    structuralPass: agg.structuralPass || 0,
    pixelPass: agg.pixelPass || 0,
    total: total,
  };
}

// Compose the trended ledger row. Headline = mean of gate scores that are
// non-null, ×100, rounded. Axes (scope/app/theme/context) default to an
// ecosystem-wide run; 1b/1d may emit component- or theme-scoped rows.
function composeScore(input) {
  var tokens = input.tokens || {};
  var fidelity = input.fidelity || {};
  var gateScores = [tokens.score, fidelity.score].filter(function (s) {
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
    gates: { tokens: tokens, fidelity: fidelity },
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
  var f = row.gates.fidelity || {};
  var tokenLine =
    t.score == null
      ? "  tokens   : n/a"
      : "  tokens   : " +
        Math.round(t.score * 100) +
        "/100  (broken-ref " +
        Math.round(t.brokenRefRate * 100) +
        "%, contrast " +
        Math.round(t.contrastRate * 100) +
        "%, " +
        t.errors +
        " error(s))";
  var lines = [
    "DS Quality Score: " +
      (row.score == null ? "n/a" : row.score) +
      " / 100  [" +
      row.scope +
      "]",
    tokenLine,
    "  fidelity : " +
      (f.score == null ? "n/a" : Math.round(f.score * 100) + "/100") +
      "  (structural " +
      (f.structuralPass || 0) +
      "/" +
      (f.total || 0) +
      "; pixel " +
      (f.pixelPass || 0) +
      "/" +
      (f.total || 0) +
      " — review-only)",
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
  fidelityGate: fidelityGate,
  composeScore: composeScore,
  readLedger: readLedger,
  appendRow: appendRow,
  formatReport: formatReport,
  noChecksRan: noChecksRan,
};
