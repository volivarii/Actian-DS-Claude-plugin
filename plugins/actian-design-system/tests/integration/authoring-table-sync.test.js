// tests/integration/authoring-table-sync.test.js
// Gate: the vocabulary table in ds-components-authoring.md is generated from
// the vendored dskit registry + ds-html-map.BUILT_SLUGS (see
// scripts/renderers/render-authoring-table.js). This test fails whenever the
// committed table drifts from those sources — the exact failure mode the
// 2026-07-05 audit found (16 BUILT slugs marked chip, a retired `input` row,
// text-input missing), which mis-steers screen-generator/generate-flow.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var gen = require("../../scripts/renderers/render-authoring-table.js");
var PATHS = require("../../scripts/lib/paths.js");
var unpublished = require("../helpers/unpublished.js");
var BUILT_SLUGS = require("../../scripts/lib/renderer.js").dsHtmlMap
  .BUILT_SLUGS;

test("ds-components-authoring.md vocabulary table, icon list and slug count are in sync with registry + BUILT_SLUGS + icons.json", function () {
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  // replaceCount too, and in the same order the CLI applies them, or the
  // generated sentence would be the one thing this file could not vouch for.
  var regenerated = gen.replaceCount(
    gen.replaceIcons(gen.replaceTable(md, gen.renderTableRows())),
  );
  assert.equal(
    regenerated,
    md,
    "Stale vocabulary table or icon list, regenerate and commit:\n" +
      "  node scripts/renderers/render-authoring-table.js",
  );
});

test("the prose slug count matches the table the generator writes", function () {
  // replaceTable() swaps only the rows between the header and the first
  // non-pipe line, so the sentence introducing the table used to be
  // hand-maintained, and it drifted twice in a file the screen generator reads
  // as its DS vocabulary: 71 against a published 73, then 73 against 74 when
  // the 2026-09-03 breaking sync landed three renames and one new component.
  // The generator writes the sentence now (replaceCount), so this reads the
  // number back out of the prose and joins it against the same source the rows
  // come from, which is what catches the generator itself going wrong.
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  var m = md.match(/covers the (\d+) authorable slugs/);
  assert.ok(
    m,
    "the sentence introducing the vocabulary table no longer states a slug " +
      "count in the form this gate reads; update the gate with the prose",
  );
  var reg = JSON.parse(
    fs.readFileSync(PATHS.components.registries.dskit, "utf8"),
  ).components;
  var authorable = Object.keys(reg).filter(function (slug) {
    return reg[slug].section === "Components";
  }).length;
  assert.equal(
    Number(m[1]),
    authorable,
    "the prose says " +
      m[1] +
      " authorable slugs but the registry publishes " +
      authorable,
  );
});

test("the icon list is generated from a non-empty icons.json", function () {
  // Non-vacuity: an empty or unreadable icons.json would regenerate an empty
  // block that the sync test above happily matches.
  assert.ok(gen.iconSlugs().length > 0, "icons.json has no icon slugs");
});

test("worked examples author only variant axes and values the registry publishes", function () {
  // The hand-authored examples below the generated blocks are what the screen
  // generator copies. Each example's top-level `"variant": "Axis=Value, ..."`
  // is joined against the registry's axes for that slug, so an example cannot
  // name a Breakpoint, a State, or a whole axis that Figma does not publish.
  var md = fs.readFileSync(gen.MD_PATH, "utf8");
  var reg = JSON.parse(
    fs.readFileSync(PATHS.components.registries.dskit, "utf8"),
  ).components;
  var checked = 0;
  var bad = [];
  md.split(/^### `/m)
    .slice(1)
    .forEach(function (section) {
      var slug = section.slice(0, section.indexOf("`"));
      var m = section.match(/^  "variant": "([^"]*)"/m);
      if (!m || !m[1]) return;
      // A component archived in Figma while it is rebuilt keeps its worked
      // example here, the same way upstream keeps its guidance, so nothing
      // has to be rewritten when it republishes. See tests/helpers/
      // unpublished.js; the staleness gate there un-skips it automatically.
      if (unpublished.skipReason(slug)) return;
      var axes = (reg[slug] && reg[slug].variants) || null;
      if (!axes) {
        return bad.push(
          reg[slug]
            ? slug + ": registry publishes no variant axes, so the example " +
              "must not declare a variant"
            : slug + ": not a registry component",
        );
      }
      checked++;
      m[1].split(",").forEach(function (pair) {
        var i = pair.indexOf("=");
        var axis = pair.slice(0, i).trim();
        var value = pair.slice(i + 1).trim();
        if (!axes[axis]) bad.push(slug + ": no axis " + JSON.stringify(axis));
        else if (axes[axis].indexOf(value) === -1)
          bad.push(
            slug + ": " + axis + " has no value " + JSON.stringify(value),
          );
      });
    });
  assert.ok(
    checked > 0,
    "no worked example carries a variant string; nothing was checked",
  );
  assert.deepEqual(
    bad,
    [],
    "worked examples disagree with the registry:\n  " + bad.join("\n  "),
  );
});

test("generated rows mark exactly the built-and-authorable slugs as BUILT", function () {
  // Invariant derived from data (never a frozen slug list): a row says BUILT
  // iff its slug is in BUILT_SLUGS. Registry-only slugs must not claim a
  // bespoke leaf, and no built slug that is authorable may hide as chip.
  var authorable = {};
  gen.authorableEntries().forEach(function (e) {
    authorable[e.slug] = true;
  });
  var built = {};
  BUILT_SLUGS.forEach(function (s) {
    if (authorable[s]) built[s] = true;
  });
  gen.renderTableRows().forEach(function (row) {
    var m = row.match(
      /^\| `([^`]+)` \|.*\| (\*\*BUILT\*\*|appearance|chip) \|/,
    );
    assert.ok(m, "unparseable generated row: " + row);
    assert.equal(
      m[2] === "**BUILT**",
      !!built[m[1]],
      m[1] + " status disagrees with BUILT_SLUGS membership",
    );
  });
});
