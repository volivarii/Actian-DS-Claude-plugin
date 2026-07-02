#!/usr/bin/env node
"use strict";

// ds-token-join-deliverable.test.js — deliverable-level gate for the
// anatomy-id → token-bindings-sidecar join (knowledge #333/#335 consumer).
// Runs the PRODUCTION path (buildDsAnatomyMap, default loaders) over the real
// vendored substrate for the two harvested Card slugs and asserts the emitted
// HTML carries per-part `property:var(--zen-*)` render facts. Real files, no
// fixtures: if the vendor tree loses the sidecars or anatomy loses node ids,
// this fails.

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var { buildDsAnatomyMap } = require(
  path.resolve(__dirname, "..", "..", "scripts", "renderers", "ds-anatomy-map.js"),
);

var SLUGS = ["card-for-perimeter", "card-for-grouped-content"];
var map = buildDsAnatomyMap(SLUGS);

describe("token-bindings join deliverable (real vendored Card sidecars)", function () {
  it("renders both harvested card slugs at the anatomy tier", function () {
    SLUGS.forEach(function (slug) {
      assert.ok(map[slug], slug + " should render (ratio above gate)");
      // Inline-CSS trap guard: prove we're looking at real element markup,
      // not a vacuous substring match on a stylesheet blob.
      assert.ok(map[slug].indexOf('class="') !== -1, slug + " emits elements");
    });
  });

  it("card-for-perimeter root carries the harvested shell facts, after structural declarations", function () {
    var html = map["card-for-perimeter"];
    [
      "background-color:var(--zen-color-bg-default)",
      "border-radius:var(--zen-border-radius-sm)",
      "padding:var(--zen-spacing-sm)",
    ].forEach(function (decl) {
      assert.ok(html.indexOf(decl) !== -1, "missing root fact: " + decl);
    });
    var structural = html.indexOf("padding:12px 12px 12px 12px");
    var fact = html.indexOf("padding:var(--zen-spacing-sm)");
    assert.ok(
      structural !== -1 && structural < fact,
      "token fact must follow the structural padding so it wins the cascade",
    );
  });

  it("card-for-perimeter inner parts carry gap/typography facts (incl. font-family)", function () {
    var html = map["card-for-perimeter"];
    [
      "gap:var(--zen-spacing-2xs)", // Body container
      "color:var(--zen-color-text-default)", // Name + counter
      "letter-spacing:var(--zen-font-letterspacing-2)", // primitive-grade fact still renders
      "font-family:var(--zen-font-family-text)", // text nodes
      "font-weight:var(--zen-font-weight-medium)", // Name
      "font-weight:var(--zen-font-weight-regular)", // Counter
    ].forEach(function (decl) {
      assert.ok(html.indexOf(decl) !== -1, "missing part fact: " + decl);
    });
  });

  it("instance nodes (excluded from harvest) carry no token facts", function () {
    SLUGS.forEach(function (slug) {
      var re = /<div class="ds-anatomy__instance"[^>]*>/g;
      var m;
      while ((m = re.exec(map[slug]))) {
        assert.ok(
          m[0].indexOf("var(") === -1,
          slug + ": instance node must stay token-free: " + m[0],
        );
      }
    });
  });

  it("card-for-grouped-content joins shell + slot facts", function () {
    var html = map["card-for-grouped-content"];
    assert.ok(
      html.indexOf("background-color:var(--zen-") !== -1 &&
        html.indexOf("border-radius:var(--zen-") !== -1,
      "shell facts missing",
    );
  });
});
