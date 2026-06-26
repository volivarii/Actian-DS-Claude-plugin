#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);

var QUIET = { skipTokens: true, skipTerminology: true, skipAvoidWords: true };

var STUDIO = {
  app: "studio",
  header: { type: "Studio" },
  sidebar: [
    { label: "Dashboard", id: "dashboard" },
    { label: "Catalog", id: "catalog" },
    { label: "Topics", id: "topics" },
    { label: "Import", id: "import" },
    { label: "Access requests", id: "access-requests" },
    { label: "Catalog design", id: "catalog-design" },
    { label: "Analytics", id: "analytics" },
  ],
};

var CANON_LABELS = STUDIO.sidebar.map(function (s) { return s.label; });

function navFromLabels(labels, activeLabel) {
  return labels.map(function (l) {
    return l === activeLabel ? { label: l, state: "On" } : { label: l };
  });
}

function flowWithScreen(navItems) {
  var screen = { id: "s1", name: "S", template: "studio", content: [] };
  if (navItems !== undefined) screen.navItems = navItems;
  return {
    meta: {
      feature: "t",
      app: "Studio",
      library: "ds",
      _glossary: { app: "Studio", chrome: JSON.parse(JSON.stringify(STUDIO)) },
    },
    screens: [screen],
  };
}

function incoherent(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) {
    return f.kind === "chrome-incoherent";
  });
}

describe("validate-chrome-coherence (check B)", function () {
  it("screen nav matching the flow chrome → no finding", function () {
    assert.strictEqual(incoherent(flowWithScreen(navFromLabels(CANON_LABELS, "Catalog"))).length, 0);
  });

  it("active state only (different active item) → no finding", function () {
    assert.strictEqual(incoherent(flowWithScreen(navFromLabels(CANON_LABELS, "Topics"))).length, 0);
  });

  it("structurally different nav → chrome-incoherent warning", function () {
    var f = incoherent(flowWithScreen([{ label: "Dashboard" }, { label: "Wrong" }]));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].severity, "warning");
    assert.strictEqual(f[0].screen, "s1");
  });

  it("legacy numeric navItems → skipped (no finding)", function () {
    assert.strictEqual(incoherent(flowWithScreen(7)).length, 0);
  });

  it("omitted navItems → skipped (inherits flow chrome)", function () {
    assert.strictEqual(incoherent(flowWithScreen(undefined)).length, 0);
  });
});
