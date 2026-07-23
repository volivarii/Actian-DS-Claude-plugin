"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;

// The doc below is entirely synthetic, so the slug it is filed under is
// arbitrary — it only has to reach the default: appearance seam. It used to be
// filed under "tag-status", which knowledge #472 gave a bespoke ds-html-map
// leaf; that leaf correctly short-circuits before the doc map is consulted, so
// the test started asserting against a slug that no longer reaches the seam.
// A slug that is not a real component can never be built, which keeps this
// unit test independent of the gray-box-to-zero programme.
var SLUG = "zz-synthetic-appearance-specimen";

var DOC = {
  slug: SLUG,
  variantDefaults: { Status: "Fail" },
  root: {
    kind: "container",
    layout: { axis: "row" },
    appearance: {
      background: "#fff4ec",
      variants: [
        { prop: "Status", values: ["Success"], background: "#f0ffec" },
      ],
    },
    children: [
      {
        kind: "text",
        text: "Fail",
        appearance: { text: { color: "#50505d" } },
      },
    ],
  },
};

test("default: renders per-instance appearance from the injected doc map", function () {
  ds.setAnatomyDocMap({ [SLUG]: DOC });
  try {
    var fail = ds.renderDSComponent({
      type: "INSTANCE",
      library: "ds",
      dsSlug: SLUG,
      variant: "Status=Fail",
    });
    assert.match(fail, /background:#fff4ec/);
    var ok = ds.renderDSComponent({
      type: "INSTANCE",
      library: "ds",
      dsSlug: SLUG,
      variant: "Status=Success",
    });
    assert.match(ok, /background:#f0ffec/);
  } finally {
    ds.setAnatomyDocMap(null);
  }
});

test("default: no doc -> graceful chip, never throws", function () {
  ds.setAnatomyDocMap(null);
  var html = ds.renderDSComponent({
    type: "INSTANCE",
    library: "ds",
    dsSlug: "totally-unknown",
    name: "Nope",
  });
  assert.match(html, /class="ds-component"/);
  assert.match(html, /Nope/);
});
