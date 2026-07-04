"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var m = require("../../scripts/renderers/ds-anatomy-map.js");

test("buildDsAnatomyDocMap: injectable loader, skips built slugs, drops rootless", function () {
  var loaded = {
    "tag-status": { slug: "tag-status", root: { kind: "container" } },
    button: { slug: "button", root: { kind: "container" } },
    broken: { slug: "broken" },
  };
  var map = m.buildDsAnatomyDocMap(["tag-status", "button", "broken"], {
    builtSlugs: ["button"],
    anatomyLoader: function (slug) { return loaded[slug] || null; },
  });
  assert.deepEqual(Object.keys(map), ["tag-status"]);
  assert.equal(map["tag-status"].root.kind, "container");
});
