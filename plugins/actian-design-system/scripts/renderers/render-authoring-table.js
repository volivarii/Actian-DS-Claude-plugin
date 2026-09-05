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

// The icon slug list in the same file is generated from the vendored
// icons.json for the same reason as the table: a hand copy named 37 slugs of
// which 12 did not exist, and an unknown slug renders nothing, silently.
var ICONS_BEGIN =
  "<!-- BEGIN GENERATED icons: node scripts/renderers/render-authoring-table.js -->";
var ICONS_END = "<!-- END GENERATED icons -->";

function iconSlugs() {
  var j = JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8"));
  return Object.keys(j.icons || {}).sort();
}

function renderIconsBlock() {
  var slugs = iconSlugs();
  return [
    ICONS_BEGIN,
    slugs.length +
      " icons are vendored (`vendor/components/dist/icons/icons.json`). Use these slug values in",
    "`renderIcon()` calls or when setting icon-bearing props. An unknown slug renders nothing, with no",
    "error, so check against this list.",
    "",
    "```",
  ]
    .concat(slugs)
    .concat(["```", ICONS_END])
    .join("\n");
}

function replaceIcons(md) {
  var start = md.indexOf(ICONS_BEGIN);
  var end = md.indexOf(ICONS_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      "generated-icons markers not found (or out of order) in " +
        MD_PATH +
        ". Expected " +
        ICONS_BEGIN +
        " ... " +
        ICONS_END,
    );
  }
  return (
    md.slice(0, start) + renderIconsBlock() + md.slice(end + ICONS_END.length)
  );
}

// The sentence introducing the table states the same count the rows are
// generated from, and it was hand-maintained. It drifted twice: 71 against a
// published 73, then 73 against 74 when the 2026-09-03 breaking sync landed
// three renames and one new component. A number a person has to remember to
// bump after every sync is a number that will be wrong, in the file the screen
// generator reads as its DS vocabulary, so the generator writes it now.
var COUNT_RE = /covers the \d+ authorable slugs/;
function replaceCount(md) {
  if (!COUNT_RE.test(md)) {
    throw new Error(
      "the sentence stating the authorable slug count was not found in " +
        MD_PATH +
        ". Expected to match " +
        COUNT_RE +
        ", which tests/integration/authoring-table-sync.test.js also reads.",
    );
  }
  return md.replace(
    COUNT_RE,
    "covers the " + authorableEntries().length + " authorable slugs",
  );
}

module.exports = {
  authorableEntries: authorableEntries,
  renderTableRows: renderTableRows,
  replaceTable: replaceTable,
  statusFor: statusFor,
  iconSlugs: iconSlugs,
  replaceIcons: replaceIcons,
  replaceCount: replaceCount,
  MD_PATH: MD_PATH,
  TABLE_HEADER: TABLE_HEADER,
  ICONS_BEGIN: ICONS_BEGIN,
  ICONS_END: ICONS_END,
};

if (require.main === module) {
  var md = fs.readFileSync(MD_PATH, "utf8");
  var out = replaceCount(replaceIcons(replaceTable(md, renderTableRows())));
  if (out !== md) {
    fs.writeFileSync(MD_PATH, out);
    console.log(
      "[authoring-table] rewrote vocabulary table (" +
        renderTableRows().length +
        " rows) and icon list (" +
        iconSlugs().length +
        " slugs)",
    );
  } else {
    console.log("[authoring-table] no change");
  }
}
