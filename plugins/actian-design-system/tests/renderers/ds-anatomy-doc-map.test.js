"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var m = require("../../scripts/lib/renderer.js").dsAnatomyMap;

test("buildDsAnatomyDocMap: injectable loader, skips built slugs, drops rootless", function () {
  var loaded = {
    "tag-status": { slug: "tag-status", root: { kind: "container" } },
    button: { slug: "button", root: { kind: "container" } },
    broken: { slug: "broken" },
  };
  var map = m.buildDsAnatomyDocMap(["tag-status", "button", "broken"], {
    builtSlugs: ["button"],
    anatomyLoader: function (slug) {
      return loaded[slug] || null;
    },
  });
  assert.deepEqual(Object.keys(map), ["tag-status"]);
  assert.equal(map["tag-status"].root.kind, "container");
});

test("buildDsAnatomyDocMap: skips low quality.ratio, keeps no-quality docs", function () {
  var loaded = {
    // ratio below the 0.6 floor -> skipped (falls through to gracefulChip)
    "glossary-diagram": {
      slug: "glossary-diagram",
      root: { kind: "container" },
      quality: { ratio: 0.15 },
    },
    // ratio at/above the floor -> kept
    "good-slug": {
      slug: "good-slug",
      root: { kind: "container" },
      quality: { ratio: 0.6 },
    },
    // NO quality/ratio field at all -> kept (synthetic/hand-built doc)
    "no-quality": { slug: "no-quality", root: { kind: "container" } },
  };
  var map = m.buildDsAnatomyDocMap(
    ["glossary-diagram", "good-slug", "no-quality"],
    {
      builtSlugs: [],
      anatomyLoader: function (slug) {
        return loaded[slug] || null;
      },
    },
  );
  assert.deepEqual(Object.keys(map).sort(), ["good-slug", "no-quality"]);
  assert.ok(!("glossary-diagram" in map), "ratio 0.15 doc must be skipped");
});
