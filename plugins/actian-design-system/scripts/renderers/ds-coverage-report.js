#!/usr/bin/env node
"use strict";
var path = require("path");
var { renderAnatomy, loadAnatomy } = require(
  path.join(__dirname, "anatomy-render.js"),
);

function coverage(slugs, opts) {
  opts = opts || {};
  var minRatio = typeof opts.minRatio === "number" ? opts.minRatio : 0.6;
  var built = {};
  (opts.builtSlugs || []).forEach(function (s) {
    built[s] = true;
  });
  return (slugs || []).map(function (slug) {
    if (built[slug]) return { slug: slug, tier: "override", ratio: null };
    var spec = loadAnatomy(slug, opts.anatomyLoader);
    if (!spec || !spec.root) return { slug: slug, tier: "chip", ratio: null };
    var ratio =
      spec.quality && typeof spec.quality.ratio === "number"
        ? spec.quality.ratio
        : null;
    var html = renderAnatomy(slug, {
      loader: opts.anatomyLoader,
      minRatio: minRatio,
    });
    return { slug: slug, tier: html ? "anatomy" : "degraded", ratio: ratio };
  });
}

module.exports = { coverage: coverage };

if (require.main === module) {
  var fs = require("fs");
  var BUILT_SLUGS = require(
    path.join(__dirname, "html-renderers", "ds-html-map.js"),
  ).BUILT_SLUGS;

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

  console.log(pad("slug", col1) + "  " + pad("tier", col2) + "  " + "ratio");
  console.log(
    "-".repeat(col1) + "  " + "-".repeat(col2) + "  " + "-".repeat(6),
  );
  rows.forEach(function (r) {
    var ratioStr = r.ratio != null ? r.ratio.toFixed(2) : "—";
    console.log(pad(r.slug, col1) + "  " + pad(r.tier, col2) + "  " + ratioStr);
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

  process.exit(0);
}
