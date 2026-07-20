#!/usr/bin/env node
"use strict";
// The vocabulary table in references/generate-flow/ds-components-authoring.md
// mis-steers screen-generator/generate-flow when it drifts from the code (at
// audit time: 16 BUILT slugs marked chip, `input` listed after it left the
// registry, text-input missing). The table is GENERATED from the two sources
// of truth — the vendored dskit registry (authorable slugs, names, variant
// axes) and ds-html-map.BUILT_SLUGS + coverage() tiers — and the gate test
// (tests/integration/authoring-table-sync.test.js) fails when the committed
// table no longer matches. Regenerate with:
//   node scripts/renderers/render-authoring-table.js
var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));
var BUILT_SLUGS = require("../lib/renderer.js").dsHtmlMap.BUILT_SLUGS;
var coverage = require(path.join(__dirname, "ds-coverage-report.js")).coverage;

var MD_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "references",
  "generate-flow",
  "ds-components-authoring.md",
);

function authorableEntries() {
  var reg = JSON.parse(
    fs.readFileSync(PATHS.components.registries.dskit, "utf8"),
  );
  return Object.keys(reg.components)
    .filter(function (slug) {
      var c = reg.components[slug];
      return c && c.section === "Components";
    })
    .sort()
    .map(function (slug) {
      return { slug: slug, component: reg.components[slug] };
    });
}

// Status mirrors what the render pipeline actually does per tier:
// override -> the bespoke BUILT leaf; anatomy -> the appearance renderer
// draws real captured values; degraded (below the ratio floor) and no-doc
// both fall through to the graceful chip.
function statusFor(tier) {
  if (tier === "override") return "**BUILT**";
  if (tier === "anatomy") return "appearance";
  return "chip";
}

function renderTableRows() {
  var entries = authorableEntries();
  var tiers = {};
  coverage(
    entries.map(function (e) {
      return e.slug;
    }),
    { builtSlugs: BUILT_SLUGS },
  ).forEach(function (row) {
    tiers[row.slug] = row.tier;
  });
  return entries.map(function (e) {
    var axes = Object.keys((e.component && e.component.variants) || {});
    return (
      "| `" +
      e.slug +
      "` | " +
      (e.component.name || e.slug) +
      " | " +
      statusFor(tiers[e.slug]) +
      " | " +
      (axes.length ? axes.join(" / ") : "—") +
      " |"
    );
  });
}

var TABLE_HEADER = "| Slug | Name | Status | Variant axes |";

function replaceTable(md, rows) {
  var lines = md.split("\n");
  var start = lines.indexOf(TABLE_HEADER);
  if (start === -1)
    throw new Error(
      "vocabulary table header not found in " + MD_PATH + ": " + TABLE_HEADER,
    );
  var end = start + 2; // header + |---| separator
  while (end < lines.length && lines[end].charAt(0) === "|") end++;
  return lines
    .slice(0, start + 2)
    .concat(rows, lines.slice(end))
    .join("\n");
}

module.exports = {
  authorableEntries: authorableEntries,
  renderTableRows: renderTableRows,
  replaceTable: replaceTable,
  statusFor: statusFor,
  MD_PATH: MD_PATH,
  TABLE_HEADER: TABLE_HEADER,
};

if (require.main === module) {
  var md = fs.readFileSync(MD_PATH, "utf8");
  var out = replaceTable(md, renderTableRows());
  if (out !== md) {
    fs.writeFileSync(MD_PATH, out);
    console.log(
      "[authoring-table] rewrote vocabulary table (" +
        renderTableRows().length +
        " rows)",
    );
  } else {
    console.log("[authoring-table] no change");
  }
}
