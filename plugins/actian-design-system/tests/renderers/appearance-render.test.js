// tests/renderers/appearance-render.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var r = require("../../scripts/renderers/appearance-render.js");

var TAG_STATUS_DOC = {
  slug: "tag-status",
  variantDefaults: { Status: "Fail" },
  root: {
    name: "Status=Fail",
    kind: "container",
    id: "7370:4928",
    layout: {
      axis: "row",
      gap: "4px",
      padding: { top: "0px", right: "8px", bottom: "0px", left: "8px" },
      align: { main: "start", cross: "center" },
    },
    appearance: {
      background: "#fff4ec",
      border: { color: "#ffdacf", width: "1px" },
      radius: "4px",
      variants: [
        { prop: "Status", values: ["Success"], background: "#f0ffec", border: { color: "#d3efcd", width: "1px" } },
      ],
    },
    children: [
      { name: "misuse--outline", kind: "instance", id: "7370:4929" },
      { name: "Tag-Name", kind: "text", id: "7370:4930", text: "Fail", appearance: { text: { color: "#50505d", size: "12px", weight: 400 } } },
    ],
  },
};

test("resolveNodeAppearance: base when variant is default", function () {
  var ap = r.resolveNodeAppearance(TAG_STATUS_DOC.root, { Status: "Fail" });
  assert.equal(ap.background, "#fff4ec");
  assert.deepEqual(ap.border, { color: "#ffdacf", width: "1px" });
});

test("resolveNodeAppearance: variant delta merges over base", function () {
  var ap = r.resolveNodeAppearance(TAG_STATUS_DOC.root, { Status: "Success" });
  assert.equal(ap.background, "#f0ffec");
  assert.deepEqual(ap.border, { color: "#d3efcd", width: "1px" });
  assert.equal(ap.radius, "4px"); // untouched by the delta
});

test("resolveNodeAppearance: no appearance -> null", function () {
  assert.equal(r.resolveNodeAppearance({ kind: "instance" }, null), null);
});

test("renderAppearanceComponent: default variant emits base colors, escapes, recurses", function () {
  var html = r.renderAppearanceComponent(TAG_STATUS_DOC, { variant: { Status: "Fail" } });
  assert.match(html, /data-ds-slug="tag-status"/);
  assert.match(html, /background:#fff4ec/);
  assert.match(html, /border:1px solid #ffdacf/);
  assert.match(html, /border-radius:4px/);
  assert.match(html, /<span class="ds-appearance__text"[^>]*>Fail<\/span>/);
  assert.match(html, /color:#50505d/);
  assert.match(html, /display:flex/); // layout preserved
});

test("renderAppearanceComponent: Success variant recolors the root", function () {
  var html = r.renderAppearanceComponent(TAG_STATUS_DOC, { variant: { Status: "Success" } });
  assert.match(html, /background:#f0ffec/);
  assert.doesNotMatch(html, /background:#fff4ec/);
});

test("renderAppearanceComponent: missing root -> empty string", function () {
  assert.equal(r.renderAppearanceComponent({ slug: "x" }, {}), "");
  assert.equal(r.renderAppearanceComponent(null, {}), "");
});
