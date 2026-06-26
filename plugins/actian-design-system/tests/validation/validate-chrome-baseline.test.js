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

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function flow(chrome, justification) {
  var glossary = { app: "Studio" };
  if (chrome !== undefined) glossary.chrome = chrome;
  if (justification !== undefined) glossary.chromeJustification = justification;
  return {
    meta: { feature: "t", app: "Studio", library: "ds", _glossary: glossary },
    screens: [{ id: "s1", name: "S", template: "studio", content: [] }],
  };
}

function chromeFindings(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) {
    return f.kind && f.kind.indexOf("chrome-") === 0;
  });
}

describe("validate-chrome-baseline (check A)", function () {
  it("grounded chrome → no chrome findings", function () {
    assert.strictEqual(chromeFindings(flow(clone(STUDIO))).length, 0);
  });

  it("diverged + justification → chrome-divergence info", function () {
    var c = clone(STUDIO);
    c.sidebar.push({ label: "Reports", id: "reports" });
    var f = chromeFindings(flow(c, "Adds a Reports section per the explicit request"));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "chrome-divergence");
    assert.strictEqual(f[0].severity, "info");
  });

  it("diverged without justification → chrome-drift warning", function () {
    var c = clone(STUDIO);
    c.sidebar.push({ label: "Reports", id: "reports" });
    var f = chromeFindings(flow(c));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "chrome-drift");
    assert.strictEqual(f[0].severity, "warning");
  });

  it("header mismatch without justification → chrome-drift", function () {
    var c = clone(STUDIO);
    c.header.type = "Admin";
    var f = chromeFindings(flow(c));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "chrome-drift");
  });

  it("app-agnostic / unknown app baseline → chrome-ungrounded info", function () {
    var f = chromeFindings(flow({ app: "actian", header: { type: "Actian" }, sidebar: [] }));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "chrome-ungrounded");
    assert.strictEqual(f[0].severity, "info");
  });

  it("no chrome (legacy flow) → no chrome findings (backward compat)", function () {
    assert.strictEqual(chromeFindings(flow(undefined)).length, 0);
  });
});
