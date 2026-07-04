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
        {
          prop: "Status",
          values: ["Success"],
          background: "#f0ffec",
          border: { color: "#d3efcd", width: "1px" },
        },
      ],
    },
    children: [
      { name: "misuse--outline", kind: "instance", id: "7370:4929" },
      {
        name: "Tag-Name",
        kind: "text",
        id: "7370:4930",
        text: "Fail",
        appearance: { text: { color: "#50505d", size: "12px", weight: 400 } },
      },
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

test("resolveNodeAppearance: color-only border delta preserves base width (C1 deep-merge)", function () {
  var node = {
    kind: "container",
    appearance: {
      border: { color: "#c7c7ce", width: "2px" },
      variants: [
        // delta changes ONLY the color — base width must survive
        { prop: "State", values: ["Selected"], border: { color: "#0f5fdc" } },
      ],
    },
  };
  var ap = r.resolveNodeAppearance(node, { State: "Selected" });
  assert.deepEqual(ap.border, { color: "#0f5fdc", width: "2px" });
});

test("resolveNodeAppearance: color-only text delta preserves base size/weight (C1 deep-merge)", function () {
  var node = {
    kind: "text",
    appearance: {
      text: { color: "#50505d", size: "12px", weight: 400 },
      variants: [
        { prop: "State", values: ["Selected"], text: { color: "#ffffff" } },
      ],
    },
  };
  var ap = r.resolveNodeAppearance(node, { State: "Selected" });
  assert.deepEqual(ap.text, { color: "#ffffff", size: "12px", weight: 400 });
});

test("resolveNodeAppearance: null border delta still replaces wholesale (C1)", function () {
  var node = {
    kind: "container",
    appearance: {
      border: { color: "#c7c7ce", width: "1px" },
      variants: [{ prop: "State", values: ["Bare"], border: null }],
    },
  };
  var ap = r.resolveNodeAppearance(node, { State: "Bare" });
  assert.equal(ap.border, null);
});

test("renderAppearanceComponent: default variant emits base colors, escapes, recurses", function () {
  var html = r.renderAppearanceComponent(TAG_STATUS_DOC, {
    variant: { Status: "Fail" },
  });
  assert.match(html, /data-ds-slug="tag-status"/);
  assert.match(html, /background:#fff4ec/);
  assert.match(html, /border:1px solid #ffdacf/);
  assert.match(html, /border-radius:4px/);
  assert.match(html, /<span class="ds-appearance__text"[^>]*>Fail<\/span>/);
  assert.match(html, /color:#50505d/);
  assert.match(html, /display:flex/); // layout preserved
});

test("renderAppearanceComponent: Success variant recolors the root", function () {
  var html = r.renderAppearanceComponent(TAG_STATUS_DOC, {
    variant: { Status: "Success" },
  });
  assert.match(html, /background:#f0ffec/);
  assert.doesNotMatch(html, /background:#fff4ec/);
});

test("renderAppearanceComponent: missing root -> empty string", function () {
  assert.equal(r.renderAppearanceComponent({ slug: "x" }, {}), "");
  assert.equal(r.renderAppearanceComponent(null, {}), "");
});

test("renderAppearanceComponent: escapes HTML special characters in text nodes", function () {
  var doc = {
    slug: "escape-test",
    variantDefaults: {},
    root: {
      name: "EscapeTest",
      kind: "container",
      id: "test:001",
      layout: {
        axis: "row",
        gap: "0px",
        padding: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
        align: { main: "start", cross: "start" },
      },
      children: [
        {
          name: "TextWithEscapes",
          kind: "text",
          id: "test:002",
          text: 'a & b < c > d "e"',
          appearance: { text: { color: "#000000", size: "14px", weight: 400 } },
        },
      ],
    },
  };
  var html = r.renderAppearanceComponent(doc, {});
  // Assert escaped forms are present
  assert.match(html, /a &amp; b &lt; c &gt; d &quot;e&quot;/);
  // Assert raw unescaped angle bracket from text content is NOT present
  // (but &lt; and &gt; should be)
  assert.doesNotMatch(html, />\s*a & b < c >/);
});
