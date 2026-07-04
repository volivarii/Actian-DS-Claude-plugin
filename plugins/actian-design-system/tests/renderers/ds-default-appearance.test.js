"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");

var DOC = {
  slug: "tag-status",
  variantDefaults: { Status: "Fail" },
  root: {
    kind: "container",
    layout: { axis: "row" },
    appearance: {
      background: "#fff4ec",
      variants: [{ prop: "Status", values: ["Success"], background: "#f0ffec" }],
    },
    children: [{ kind: "text", text: "Fail", appearance: { text: { color: "#50505d" } } }],
  },
};

test("default: renders per-instance appearance from the injected doc map", function () {
  ds.setAnatomyDocMap({ "tag-status": DOC });
  try {
    var fail = ds.renderDSComponent({ type: "INSTANCE", library: "ds", dsSlug: "tag-status", variant: "Status=Fail" });
    assert.match(fail, /background:#fff4ec/);
    var ok = ds.renderDSComponent({ type: "INSTANCE", library: "ds", dsSlug: "tag-status", variant: "Status=Success" });
    assert.match(ok, /background:#f0ffec/);
  } finally {
    ds.setAnatomyDocMap(null);
  }
});

test("default: no doc -> graceful chip, never throws", function () {
  ds.setAnatomyDocMap(null);
  var html = ds.renderDSComponent({ type: "INSTANCE", library: "ds", dsSlug: "totally-unknown", name: "Nope" });
  assert.match(html, /class="ds-component"/);
  assert.match(html, /Nope/);
});
