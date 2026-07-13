#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");

var dsMap = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "html-renderers",
    "ds-html-map.js",
  ),
);
var { buildDsAnatomyDocMap } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-anatomy-map.js",
  ),
);
var { countBlankBoxes } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "renderability.js",
  ),
);

// The number of empty grey placeholder boxes the DS HTML renderer emits across
// the whole authorable vocabulary. This is a CEILING, and it RATCHETS DOWN:
//
//   2026-07-13  136  baseline (knowledge v0.34.96, 25 of 37 non-override slugs)
//
// Lower it as each lane lands. NEVER raise it without saying, in the commit
// message, which slugs regressed and why.
var BUDGET = 136;

function authorableSlugs() {
  var mdPath = path.resolve(
    __dirname,
    "..",
    "..",
    "references",
    "generate-flow",
    "ds-components-authoring.md",
  );
  var out = [];
  fs.readFileSync(mdPath, "utf8")
    .split("\n")
    .forEach(function (line) {
      var m = line.match(/^\|\s*`([^`]+)`/);
      if (m) out.push(m[1]);
    });
  return out;
}

function renderAll() {
  var slugs = authorableSlugs();
  dsMap.setAnatomyDocMap(buildDsAnatomyDocMap(slugs, {}));
  var built = {};
  dsMap.BUILT_SLUGS.forEach(function (s) {
    built[s] = true;
  });
  var total = 0;
  var perSlug = {};
  var anyAnatomy = false;
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
    var n = countBlankBoxes(html);
    perSlug[slug] = n;
    total += n;
  });
  return {
    total: total,
    perSlug: perSlug,
    anyAnatomy: anyAnatomy,
    slugs: slugs,
  };
}

describe("blank-box budget", function () {
  it("POSITIVE CONTROL: the anatomy doc map is actually live", function () {
    // Without this, a broken/unset doc map chips every slug, emits zero blank
    // boxes, and the budget below passes while measuring NOTHING. Assert the
    // anatomy marker attribute (data-ds-slug=) is present in real output.
    var r = renderAll();
    assert.ok(
      r.anyAnatomy,
      "no slug rendered anatomy markup, so the doc map is not live and the " +
        "blank-box budget would pass vacuously",
    );
  });

  it("the authorable vocabulary is non-empty (guards a silent parse break)", function () {
    var r = renderAll();
    assert.ok(
      r.slugs.length > 50,
      "expected the ds-components-authoring.md table to parse to >50 slugs, got " +
        r.slugs.length,
    );
  });

  it("emits no more blank grey boxes than the budget", function () {
    var r = renderAll();
    var worst = Object.keys(r.perSlug)
      .filter(function (s) {
        return r.perSlug[s] > 0;
      })
      .sort(function (a, b) {
        return r.perSlug[b] - r.perSlug[a];
      })
      .slice(0, 8)
      .map(function (s) {
        return s + ":" + r.perSlug[s];
      })
      .join(", ");
    assert.ok(
      r.total <= BUDGET,
      "blank-box count regressed to " +
        r.total +
        " (budget " +
        BUDGET +
        "). " +
        "Worst offenders: " +
        worst,
    );
  });
});
