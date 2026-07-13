#!/usr/bin/env node
"use strict";
var path = require("path");
var { loadAnatomy, passesRatioGate } = require(
  path.join(__dirname, "anatomy-render.js"),
);
var { isRenderable } = require(path.join(__dirname, "renderability.js"));

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

module.exports = { coverage: coverage };

if (require.main === module) {
  var fs = require("fs");
  var dsMap = require(path.join(__dirname, "html-renderers", "ds-html-map.js"));
  var BUILT_SLUGS = dsMap.BUILT_SLUGS;
  var { buildDsAnatomyDocMap } = require(
    path.join(__dirname, "ds-anatomy-map.js"),
  );
  var { countBlankBoxes } = require(path.join(__dirname, "renderability.js"));

  // Parse authorable slugs from the markdown table in ds-components-authoring.md
  var mdPath = path.resolve(
    __dirname,
    "..",
    "..",
    "references",
    "generate-flow",
    "ds-components-authoring.md",
  );
  var mdContent = fs.readFileSync(mdPath, "utf8");
  var authorableSlugs = [];
  mdContent.split("\n").forEach(function (line) {
    var m = line.match(/^\|\s*`([^`]+)`/);
    if (m) authorableSlugs.push(m[1]);
  });

  var rows = coverage(authorableSlugs, { builtSlugs: BUILT_SLUGS });

  // Render every authorable slug through the REAL seam (the same doc map
  // assemble-flow-share builds) and count the empty grey placeholder boxes it
  // emits. This is the number a PM actually sees on a generated flow.
  dsMap.setAnatomyDocMap(buildDsAnatomyDocMap(authorableSlugs, {}));
  var blanks = {};
  var blankTotal = 0;
  rows.forEach(function (r) {
    if (r.tier === "override") {
      blanks[r.slug] = 0;
      return;
    }
    var html = "";
    try {
      html = String(
        dsMap.renderDSComponent({
          dsSlug: r.slug,
          library: "ds",
          props: {},
          variant: "",
        }),
      );
    } catch (e) {
      html = "";
    }
    var n = countBlankBoxes(html);
    blanks[r.slug] = n;
    blankTotal += n;
  });

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
  var col3 = 5; // "ratio".length

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

  process.exit(0);
}
