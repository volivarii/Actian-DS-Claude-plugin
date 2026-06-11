// scripts/fidelity/run-fidelity.js
"use strict";
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var R = require("./resolve-binaries");
var H = require("./render-leaf");
var P = require("./pixel-diff");
var S = require("./structural-check");

var PLUGIN_DIR = path.resolve(__dirname, "..", "..");
var ORACLE = function (slug) {
  return path.join(
    PLUGIN_DIR,
    "vendor",
    "components",
    "dist",
    "media",
    slug,
    "preview.webp",
  );
};
var LEDGER = path.join(
  PLUGIN_DIR,
  "tests",
  "renderers",
  "__fidelity__",
  "ledger.jsonl",
);

function runStructural(slug, chrome, tmp) {
  var frag = H.renderLeafFragment(slug);
  var measureJs = S.measureScript(); // pure + static — build once, not per width
  var per = {};
  S.WIDTHS.forEach(function (w) {
    var html = H.buildMeasureHtml(slug, frag, measureJs);
    var hp = path.join(tmp, slug + "-" + w + ".html");
    fs.writeFileSync(hp, html);
    per[w] = S.measureAtWidth({ chrome: chrome, htmlPath: hp, width: w }) || {
      overflow: true,
      clipped: 0,
      absPos: 0,
    };
  });
  return S.verdict(per);
}

function runPixel(slug, chrome, im, tmp, opts) {
  opts = opts || {};
  var oracle = ORACLE(slug);
  if (!fs.existsSync(oracle)) return { pass: null, skipped: "no preview.webp" };
  var frag = H.renderLeafFragment(slug);
  var html = H.buildLeafHtml(slug, frag);
  var hp = path.join(tmp, slug + ".html");
  fs.writeFileSync(hp, html);
  var render = H.screenshot({
    chrome: chrome,
    htmlPath: hp,
    outPng: path.join(tmp, slug + ".png"),
    width: 1440,
  });
  var rN = P.normalize(im, render, path.join(tmp, slug + "-r.png"));
  var oN = P.normalize(im, oracle, path.join(tmp, slug + "-o.png"));
  // v1: single-cell whole-image RMSE; region grid is a fast-follow once thresholds calibrate.
  var stderr = P.imExec(
    im,
    P.buildCompareArgs({ a: rN, b: oN, fuzz: opts.fuzz || 2 }),
  );
  var rmse = P.parseMetric(stderr);
  // unreadable metric → treat as total mismatch (RMSE 1) so it fails, never silently passes.
  // threshold default 0.06 (6% RMSE) is provisional — calibrated against known-good leaves in Task 7.
  return P.gridVerdict([rmse == null ? 1 : rmse], opts.threshold || 0.06);
}

function ledgerRow(slug, gate1, gate2) {
  var g1 =
    gate1.pass === null
      ? "skip(" + (gate1.skipped || "") + ")"
      : gate1.pass
        ? "pass"
        : "fail";
  var g2 = gate2.pass ? "pass" : "fail";
  return {
    slug: slug,
    date: new Date().toISOString().slice(0, 10),
    kind: "leaf",
    gates: { pixel_diff: g1, responsive_structural: g2 },
    fidelity: {
      dimensions: {},
      // Three-valued: null = pixel gate skipped (structural-only, NOT fidelity-green —
      // distinct from a real 0.0 failure); 1.0 = both gates pass; 0.0 = a gate failed.
      score: gate1.pass === null ? null : gate1.pass && gate2.pass ? 1.0 : 0.0,
      method: "Program C two-gate (pixel + structural)",
    },
    reference: {
      media: ["components/dist/media/" + slug + "/preview.webp"],
    },
    pixel: gate1,
    structural: gate2,
  };
}

function run(slugs, opts) {
  opts = opts || {};
  var resolved = R.resolveAll();
  if (!resolved.chrome) {
    R.requireAll(resolved); // throws clear setup msg
  }
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fid-"));
  try {
    var rows = slugs.map(function (slug) {
      var gate2 = runStructural(slug, resolved.chrome, tmp);
      var gate1 = resolved.imagemagick
        ? runPixel(slug, resolved.chrome, resolved.imagemagick, tmp, opts)
        : { pass: null, skipped: "imagemagick-missing" };
      var row = ledgerRow(slug, gate1, gate2);
      if (opts.write !== false)
        fs.appendFileSync(LEDGER, JSON.stringify(row) + "\n");
      return row;
    });
    return rows;
  } finally {
    // Clean the per-run scratch dir so repeated CI runs don't accumulate HTML/PNG.
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  var args = process.argv.slice(2);
  var slugs =
    args[0] === "--all"
      ? ["button", "checkbox-with-label", "alert-banner"]
      : args;
  var rows = run(slugs, {});
  rows.forEach(function (r) {
    console.log(
      r.slug,
      "pixel=" + JSON.stringify(r.gates.pixel_diff),
      "structural=" + r.gates.responsive_structural,
    );
  });
}

module.exports = { run, runStructural, runPixel, ledgerRow };
