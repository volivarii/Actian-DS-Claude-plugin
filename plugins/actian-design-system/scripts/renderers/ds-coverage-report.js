#!/usr/bin/env node
"use strict";
var fs = require("fs");
var path = require("path");
var { loadAnatomy, passesRatioGate } = require(
  path.join(__dirname, "anatomy-render.js"),
);
var { isRenderable, countBlankBoxes } = require(
  path.join(__dirname, "renderability.js"),
);
var dsMap = require(path.join(__dirname, "html-renderers", "ds-html-map.js"));
var { buildDsAnatomyDocMap } = require(
  path.join(__dirname, "ds-anatomy-map.js"),
);

// Strict mode (no opts): a missing/non-numeric ratio FAILS the gate here,
// matching passesRatioGate's own strict default; see its doc comment in
// anatomy-render.js for how this diverges from buildDsAnatomyDocMap's R2
// floor (ds-anatomy-map.js), which intentionally keeps missing-ratio docs.
function coverage(slugs, opts) {
  opts = opts || {};
  var minRatio = typeof opts.minRatio === "number" ? opts.minRatio : 0.6;
  var built = {};
  (opts.builtSlugs || []).forEach(function (s) {
    built[s] = true;
  });
  return (slugs || []).map(function (slug) {
    // An override does not consult the anatomy doc at all, so a renderability
    // verdict is meaningless for it: report null, not false.
    if (built[slug])
      return {
        slug: slug,
        tier: "override",
        ratio: null,
        renderable: null,
        why: "",
      };
    var spec = loadAnatomy(slug, opts.anatomyLoader);
    if (!spec || !spec.root)
      return {
        slug: slug,
        tier: "chip",
        ratio: null,
        renderable: false,
        why: "no anatomy doc",
      };
    var ratio =
      spec.quality && typeof spec.quality.ratio === "number"
        ? spec.quality.ratio
        : null;
    // tier still reflects what the RENDERER actually does today (the R2 ratio
    // floor). renderable reflects the TRUTH. Reporting both side by side is
    // the whole point: where they disagree, the floor is faking it.
    var tier = passesRatioGate(ratio, minRatio) ? "anatomy" : "degraded";
    var verdict = isRenderable(spec);
    return {
      slug: slug,
      tier: tier,
      ratio: ratio,
      renderable: verdict.ok,
      why: verdict.why,
    };
  });
}

// Parse authorable slugs from the markdown table in ds-components-authoring.md.
// This is the SINGLE parse of that table. Both the CLI report below and the CI
// budget gate (tests/renderers/blank-box-budget.test.js) call this function,
// so the two can never silently disagree on which slugs count as authorable.
function authorableSlugs() {
  var mdPath = path.resolve(
    __dirname,
    "..",
    "..",
    "references",
    "generate-flow",
    "ds-components-authoring.md",
  );
  var mdContent = fs.readFileSync(mdPath, "utf8");
  var slugs = [];
  mdContent.split("\n").forEach(function (line) {
    var m = line.match(/^\|\s*`([^`]+)`/);
    if (m) slugs.push(m[1]);
  });
  return slugs;
}

// Exported so the CI gate (tests/renderers/blank-box-budget.test.js) measures
// the SAME thing this report prints, by construction rather than by
// coincidence. Two independent measurers would be free to drift, and the gate
// would then guard a number nobody is looking at.
//
// Renders every authorable slug through the REAL seam (the same doc map
// assemble-flow-share builds) and counts the empty grey placeholder boxes it
// emits. This is the number a PM actually sees on a generated flow.
function measureBlankBoxes(opts) {
  opts = opts || {};
  var slugs = opts.slugs || authorableSlugs();
  var built = {};
  (dsMap.BUILT_SLUGS || []).forEach(function (s) {
    built[s] = true;
  });

  var total = 0;
  var perSlug = {};
  var anyAnatomy = false;
  var chipSlugs = [];

  dsMap.setAnatomyDocMap(buildDsAnatomyDocMap(slugs, {}));
  try {
    slugs.forEach(function (slug) {
      if (built[slug]) return;
      var html = "";
      try {
        html = String(
          dsMap.renderDSComponent({
            dsSlug: slug,
            library: "ds",
            props: {},
            variant: "",
          }),
        );
      } catch (e) {
        html = "";
      }
      if (html.indexOf('data-ds-slug="') !== -1) anyAnatomy = true;
      if (html.indexOf('class="ds-component"') !== -1) chipSlugs.push(slug);
      var n = countBlankBoxes(html);
      perSlug[slug] = n;
      total += n;
    });
  } finally {
    // Reset module-level state so it never leaks into a later assembly, same
    // convention as assemble-flow-share.js's render loop.
    dsMap.setAnatomyDocMap(null);
  }

  return {
    slugs: slugs,
    total: total,
    perSlug: perSlug,
    chipSlugs: chipSlugs,
    anyAnatomy: anyAnatomy,
  };
}

module.exports = {
  coverage: coverage,
  authorableSlugs: authorableSlugs,
  measureBlankBoxes: measureBlankBoxes,
};

if (require.main === module) {
  var BUILT_SLUGS = dsMap.BUILT_SLUGS;

  var slugs = authorableSlugs();
  var rows = coverage(slugs, { builtSlugs: BUILT_SLUGS });
  var measured = measureBlankBoxes({ slugs: slugs });
  var blanks = measured.perSlug;
  var blankTotal = measured.total;

  // Print table
  var col1 = Math.max(
    "slug".length,
    rows.length
      ? Math.max.apply(
          null,
          rows.map(function (r) {
            return r.slug.length;
          }),
        )
      : "slug".length,
  );
  var col2 = 8; // "degraded".length

  function pad(s, n) {
    return (
      String(s == null ? "" : s) +
      " ".repeat(Math.max(0, n - String(s == null ? "" : s).length))
    );
  }

  console.log(
    pad("slug", col1) +
      "  " +
      pad("tier", col2) +
      "  " +
      pad("ratio", 6) +
      "  " +
      pad("renders?", 9) +
      "  " +
      pad("blanks", 6) +
      "  why",
  );
  console.log(
    "-".repeat(col1) +
      "  " +
      "-".repeat(col2) +
      "  " +
      "-".repeat(6) +
      "  " +
      "-".repeat(9) +
      "  " +
      "-".repeat(6) +
      "  ---",
  );
  rows.forEach(function (r) {
    var ratioStr = r.ratio != null ? r.ratio.toFixed(2) : "—";
    var rend = r.renderable == null ? "—" : r.renderable ? "yes" : "NO";
    console.log(
      pad(r.slug, col1) +
        "  " +
        pad(r.tier, col2) +
        "  " +
        pad(ratioStr, 6) +
        "  " +
        pad(rend, 9) +
        "  " +
        pad(String(blanks[r.slug] || 0), 6) +
        "  " +
        (r.why || ""),
    );
  });

  // Counts summary
  var counts = { override: 0, anatomy: 0, degraded: 0, chip: 0 };
  rows.forEach(function (r) {
    if (counts[r.tier] != null) counts[r.tier]++;
  });
  console.log("\n--- Counts ---");
  console.log("override: " + counts.override);
  console.log("anatomy:  " + counts.anatomy);
  console.log("degraded: " + counts.degraded);
  console.log("chip:     " + counts.chip);
  console.log("total:    " + rows.length);

  var fakingIt = rows.filter(function (r) {
    return r.tier === "anatomy" && r.renderable === false;
  }).length;
  console.log("\n--- Fidelity ---");
  console.log("BLANK BOXES (total):      " + blankTotal);
  console.log(
    "slugs emitting blanks:    " +
      rows.filter(function (r) {
        return (blanks[r.slug] || 0) > 0;
      }).length,
  );
  console.log(
    "anatomy-tier but NOT renderable (the floor is faking these): " + fakingIt,
  );
}
