"use strict";

// flow-share-a1-overrides.test.js — DELIVERABLE-level proof for the Hi-Fi A1
// degraded-slug leaf overrides. The canonical generate-flow deliverable is the
// server-side flow-share render (Node, no window). A leaf can pass every unit
// test yet be inert in this path (Slice-1 durable lesson), so we assert each
// override's signature class appears in assembleFlowShare output — and that the
// slug does NOT fall back to a chip (data-slug) or anatomy (data-ds-slug).
//
// Markers (non-substring, per Slice-1): override = a distinct ds-* class;
// chip = data-slug="<slug>"; anatomy = data-ds-slug="<slug>".
// Repo style: node:test + node:assert.

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");

// slug → override signature class. Grown per batch as overrides land.
var A1_OVERRIDES = [
  { slug: "popover", cls: "ds-popover" },
  { slug: "account-dropdown", cls: "ds-account-menu" },
  { slug: "app-switcher-dropdown", cls: "ds-app-switcher" },
  { slug: "segmented-control", cls: "ds-segmented" },
  { slug: "toolbar", cls: "ds-toolbar" },
  { slug: "sticky-footer", cls: "ds-sticky-footer" },
  { slug: "loader", cls: "ds-loader" },
  { slug: "calendar", cls: "ds-calendar" },
];

function fixture(slug) {
  return {
    meta: { library: "ds", app: "Test App", feature: "A1 overrides" },
    screens: [
      {
        name: "Screen 1",
        library: "ds",
        content: [{ type: "INSTANCE", library: "ds", dsSlug: slug, props: {} }],
      },
    ],
  };
}

describe("flow-share: A1 override slugs render as leaves, not chips/anatomy", function () {
  A1_OVERRIDES.forEach(function (t) {
    it(
      t.slug + " → " + t.cls + " in the canonical flow-share output",
      function () {
        var html = assembleFlowShare(fixture(t.slug));
        assert.ok(
          html.indexOf(t.cls) !== -1,
          t.slug + " must render its override class " + t.cls,
        );
        assert.strictEqual(
          html.indexOf('data-slug="' + t.slug + '"'),
          -1,
          t.slug + " must NOT fall back to a chip (data-slug)",
        );
        assert.strictEqual(
          html.indexOf('data-ds-slug="' + t.slug + '"'),
          -1,
          t.slug + " must NOT fall back to anatomy (data-ds-slug)",
        );
      },
    );
  });
});
