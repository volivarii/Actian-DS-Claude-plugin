"use strict";
var fs = require("node:fs");
var path = require("node:path");

var LEDGER = path.join(
  __dirname,
  "..",
  "..",
  "tests",
  "renderers",
  "__fidelity__",
  "ledger.jsonl"
);

function readLedger(file) {
  var p = file || LEDGER;
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(function (l) {
      try {
        return JSON.parse(l);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

function latestPerSlug(rows) {
  var by = {};
  rows.forEach(function (r) {
    var cur = by[r.slug];
    if (!cur || String(r.date || "") >= String(cur.date || "")) {
      by[r.slug] = r;
    }
  });
  return Object.keys(by).map(function (k) {
    return by[k];
  });
}

function aggregate(rows) {
  var count = rows.length;
  var scored = 0;
  var sum = 0;
  var skipped = 0;
  var pixelPass = 0;
  var structuralPass = 0;
  rows.forEach(function (r) {
    var s = r.fidelity ? r.fidelity.score : undefined;
    if (typeof s === "number") {
      sum += s;
      scored++;
    } else {
      skipped++; // null/undefined score = pixel-skipped (structural-only)
    }
    var g = r.gates || {};
    if (g.pixel_diff === "pass") pixelPass++;
    if (g.responsive_structural === "pass") structuralPass++;
  });
  return {
    count: count,
    scored: scored,
    skipped: skipped,
    meanScore: scored ? Math.round((sum / scored) * 1000) / 1000 : null,
    pixelPass: pixelPass,
    structuralPass: structuralPass,
  };
}

function format(agg) {
  return [
    "Fidelity report (Program C two-gate)",
    "  components       : " +
      agg.count +
      " (" +
      agg.scored +
      " scored, " +
      agg.skipped +
      " pixel-skipped)",
    "  mean score       : " +
      (agg.meanScore === null
        ? "n/a (no pixel-scored rows)"
        : agg.meanScore),
    "  pixel pass       : " + agg.pixelPass + "/" + agg.count,
    "  structural pass  : " + agg.structuralPass + "/" + agg.count,
  ].join("\n");
}

if (require.main === module) {
  var rows = latestPerSlug(readLedger());
  // only Program-C rows carry the two-gate method
  var c = rows.filter(function (r) {
    return r.fidelity && /two-gate/.test(r.fidelity.method || "");
  });
  console.log(format(aggregate(c)));
}

module.exports = { readLedger, latestPerSlug, aggregate, format };
