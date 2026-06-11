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

// Rasterize an HTML file with Chrome and decode the PNG → { width, height, data }.
function shoot(chrome, htmlPath, outPng, w, h) {
  H.screenshot({
    chrome: chrome,
    htmlPath: htmlPath,
    outPng: outPng,
    width: w,
    height: h,
  });
  return P.decodePng(fs.readFileSync(outPng));
}

function runPixel(slug, chrome, tmp, opts) {
  opts = opts || {};
  var oracle = ORACLE(slug);
  if (!fs.existsSync(oracle)) return { pass: null, skipped: "no preview.webp" };

  // 1. render the leaf → PNG → decode
  var lhp = path.join(tmp, slug + "-leaf.html");
  fs.writeFileSync(lhp, H.buildLeafHtml(slug, H.renderLeafFragment(slug)));
  var render = shoot(
    chrome,
    lhp,
    path.join(tmp, slug + "-render.png"),
    1280,
    800,
  );

  // 2. rasterize the .webp oracle via Chrome (pngjs can't decode webp) → PNG → decode
  var ohp = path.join(tmp, slug + "-oracle.html");
  fs.writeFileSync(ohp, H.buildImageHtml(oracle));
  var oracleImg = shoot(
    chrome,
    ohp,
    path.join(tmp, slug + "-oracle.png"),
    1600,
    1200,
  );

  // 3. trim both to content, bail on aspect divergence, resize to common, diff.
  var norm = P.normalizePair(render, oracleImg, {
    aspectTol: opts.aspectTol == null ? 0.15 : opts.aspectTol,
  });
  if (norm.mismatch) {
    return { pass: false, mismatch: true, boxA: norm.boxA, boxB: norm.boxB };
  }
  var d = P.diffRatio(norm.a, norm.b, norm.w, norm.h, {
    pmThreshold: opts.pmThreshold,
  });
  // threshold default 0.06 (≤6% of pixels may differ) is provisional — calibrate in Task 7.
  var v = P.gridVerdict(
    [d.ratio],
    opts.threshold == null ? 0.06 : opts.threshold,
  );
  v.ratio = d.ratio;
  v.dims = { w: norm.w, h: norm.h };
  return v;
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
      // Gate 1 always runs (pure-JS diff, Chrome present); pass:null only when the
      // component has no preview.webp oracle to compare against.
      var gate1 = runPixel(slug, resolved.chrome, tmp, opts);
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

var PILOT = ["button", "checkbox-with-label", "alert-banner"];

if (require.main === module) {
  var args = process.argv.slice(2);
  var slugs =
    args[0] === "--all"
      ? require("../renderers/html-renderers/ds-html-map.js").BUILT_SLUGS
      : args[0] === "--pilot"
        ? PILOT
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
