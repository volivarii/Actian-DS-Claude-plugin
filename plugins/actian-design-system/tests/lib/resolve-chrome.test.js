#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "resolve-chrome.js"),
);

describe("resolve-chrome", function () {
  it("resolves Studio: 7-item sidebar, header.type Studio, normalized app slug", function () {
    var c = resolver.resolveChrome("Studio");
    assert.ok(c, "expected non-null chrome");
    assert.strictEqual(c.app, "studio");
    assert.strictEqual(c.header.type, "Studio");
    assert.strictEqual(c.sidebar.length, 7);
    assert.strictEqual(c.sidebar[0].label, "Dashboard");
    assert.strictEqual(c.sidebar[0].id, "dashboard");
  });

  it("normalizes case and whitespace", function () {
    assert.strictEqual(resolver.normalizeApp("  Studio "), "studio");
  });

  it("resolves Explorer to an empty sidebar (search-first)", function () {
    var c = resolver.resolveChrome("Explorer");
    assert.ok(c);
    assert.strictEqual(c.sidebar.length, 0);
    assert.strictEqual(c.header.type, "Explorer");
  });

  it("returns null for app-agnostic / unknown / empty", function () {
    assert.strictEqual(resolver.resolveChrome("Actian"), null);
    assert.strictEqual(resolver.resolveChrome("nope"), null);
    assert.strictEqual(resolver.resolveChrome(""), null);
  });

  it("lists apps and exposes signals for detection", function () {
    assert.ok(resolver.listApps().indexOf("studio") !== -1);
    var sig = resolver.appSignals();
    assert.ok(Array.isArray(sig.studio) && sig.studio.length > 0);
  });
});
