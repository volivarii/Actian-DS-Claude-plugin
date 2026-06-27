#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "resolve-patterns.js"),
);
var PATHS = require(path.join(PLUGIN_ROOT, "scripts", "lib", "paths.js"));

describe("resolve-patterns (resolver core)", function () {
  it("resolves Studio to its app-scoped patterns shaped {slug,label,description,tags}", function () {
    var ps = resolver.resolvePatterns("Studio");
    assert.ok(Array.isArray(ps) && ps.length > 0, "expected studio patterns");
    ps.forEach(function (p) {
      assert.ok(typeof p.slug === "string" && p.slug.length > 0);
      assert.ok(typeof p.label === "string");
      assert.ok(typeof p.description === "string");
      assert.ok(Array.isArray(p.tags) && p.tags.length > 0);
      assert.deepStrictEqual(
        p.tags,
        p.slug.toLowerCase().split("-").filter(Boolean),
        "tags are the hyphen-split slug tokens",
      );
    });
  });

  it("only returns patterns whose apps[] includes the requested app", function () {
    var ctx = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
    resolver.resolvePatterns("studio").forEach(function (p) {
      assert.ok(
        ctx.patterns[p.slug].apps.indexOf("studio") !== -1,
        p.slug + " should be studio-scoped",
      );
    });
  });

  it("normalizes case/whitespace; returns [] for unknown/empty", function () {
    assert.ok(resolver.resolvePatterns("  Studio ").length > 0);
    assert.deepStrictEqual(resolver.resolvePatterns("nope"), []);
    assert.deepStrictEqual(resolver.resolvePatterns(""), []);
    assert.deepStrictEqual(resolver.resolvePatterns(null), []);
  });

  it("resolveUseCases returns the app's useCases (Studio has 2, each {audience,jobs})", function () {
    var uc = resolver.resolveUseCases("Studio");
    assert.ok(Array.isArray(uc));
    assert.strictEqual(uc.length, 2);
    uc.forEach(function (u) {
      assert.ok(Array.isArray(u.audience));
      assert.ok(Array.isArray(u.jobs));
    });
  });

  it("resolveUseCases returns [] for unknown app", function () {
    assert.deepStrictEqual(resolver.resolveUseCases("nope"), []);
  });

  it("listApps includes studio; slugTags tokenizes a hyphenated slug", function () {
    assert.ok(resolver.listApps().indexOf("studio") !== -1);
    assert.deepStrictEqual(
      resolver.slugTags("search-filtered-table"),
      ["search", "filtered", "table"],
    );
  });
});
