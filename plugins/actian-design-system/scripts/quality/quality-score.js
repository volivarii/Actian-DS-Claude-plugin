"use strict";

// DS Quality Score: composite headline (0-100) + per-gate pass-rates.
// Each gate yields a pass-rate in [0,1]; the headline is the mean of the
// gates that have data, ×100. Pure + dependency-free.

function rate(total, fails) {
  if (total === 0) return 1; // no checks ⇒ nothing failing
  return (total - fails) / total;
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

// Fidelity gate: pass-rate = ledger meanScore over SCORED components.
// Null score (excluded from the headline) until Program-C rows exist.
function fidelityGate(agg) {
  agg = agg || {};
  return {
    score: typeof agg.meanScore === "number" ? agg.meanScore : null,
    scored: agg.scored || 0,
    total: agg.count || 0,
  };
}

module.exports = {
  rate: rate,
  tokenGate: tokenGate,
  fidelityGate: fidelityGate,
};
