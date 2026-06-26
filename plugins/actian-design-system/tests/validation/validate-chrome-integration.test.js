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
var LABELS = STUDIO.sidebar.map(function (s) { return s.label; });

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function nav(active) {
  return LABELS.map(function (l) {
    return l === active ? { label: l, state: "On" } : { label: l };
  });
}
function screen(id, active, navItems) {
  return {
    id: id,
    name: id,
    template: "studio",
    navItems: navItems === undefined ? nav(active) : navItems,
    content: [],
  };
}
function kinds(data) {
  return validate.validate(data, QUIET).findings
    .filter(function (f) { return f.kind && f.kind.indexOf("chrome-") === 0; })
    .map(function (f) { return f.kind; })
    .sort();
}

describe("validate-chrome integration (A + B together)", function () {
  it("3-screen grounded+coherent flow → zero chrome findings", function () {
    var data = {
      meta: { feature: "f", app: "Studio", library: "ds", _glossary: { app: "Studio", chrome: clone(STUDIO) } },
      screens: [screen("s1", "Dashboard"), screen("s2", "Catalog"), screen("s3", "Analytics")],
    };
    assert.deepStrictEqual(kinds(data), []);
  });

  it("flow drift + one incoherent screen → chrome-drift + chrome-incoherent", function () {
    var diverged = clone(STUDIO);
    diverged.sidebar.push({ label: "Reports", id: "reports" }); // no justification
    var divergedLabels = diverged.sidebar.map(function (s) { return s.label; });
    function navD(active) {
      return divergedLabels.map(function (l) {
        return l === active ? { label: l, state: "On" } : { label: l };
      });
    }
    var data = {
      meta: { feature: "f", app: "Studio", library: "ds", _glossary: { app: "Studio", chrome: diverged } },
      screens: [
        // s1 coherent with the diverged 8-item chrome; s2 out of step
        { id: "s1", name: "s1", template: "studio", navItems: navD("Reports"), content: [] },
        { id: "s2", name: "s2", template: "studio", navItems: [{ label: "Dashboard" }, { label: "Catalog" }], content: [] },
      ],
    };
    assert.deepStrictEqual(kinds(data), ["chrome-drift", "chrome-incoherent"]);
  });

  it("justified flow-wide divergence, all screens coherent → only chrome-divergence (info)", function () {
    var diverged = clone(STUDIO);
    diverged.sidebar.push({ label: "Reports", id: "reports" });
    var divergedLabels = diverged.sidebar.map(function (s) { return s.label; });
    function navD(active) {
      return divergedLabels.map(function (l) {
        return l === active ? { label: l, state: "On" } : { label: l };
      });
    }
    var data = {
      meta: {
        feature: "f", app: "Studio", library: "ds",
        _glossary: {
          app: "Studio", chrome: diverged,
          chromeJustification: "Adds a Reports section across the flow per the explicit request",
        },
      },
      screens: [
        { id: "s1", name: "s1", template: "studio", navItems: navD("Reports"), content: [] },
        { id: "s2", name: "s2", template: "studio", navItems: navD("Catalog"), content: [] },
      ],
    };
    assert.deepStrictEqual(kinds(data), ["chrome-divergence"]);
  });

  it("legacy flow without _glossary.chrome → no chrome findings", function () {
    var data = {
      meta: { feature: "f", app: "Studio", library: "ds", _glossary: { app: "Studio" } },
      screens: [{ id: "s1", name: "s1", template: "studio", navItems: 7, content: [] }],
    };
    assert.deepStrictEqual(kinds(data), []);
  });
});
