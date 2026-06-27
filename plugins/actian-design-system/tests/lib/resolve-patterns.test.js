#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-patterns.js",
  ),
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
    assert.deepStrictEqual(resolver.slugTags("search-filtered-table"), [
      "search",
      "filtered",
      "table",
    ]);
  });
});

describe("resolve-patterns (CLI)", function () {
  var execFileSync = require("child_process").execFileSync;
  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-patterns.js",
  );

  it("--app studio prints { app, patterns, useCases } and exits 0", function () {
    var out = execFileSync(NODE, [CLI, "--app", "studio"], {
      encoding: "utf8",
    });
    var parsed = JSON.parse(out);
    assert.strictEqual(parsed.app, "studio");
    assert.ok(Array.isArray(parsed.patterns) && parsed.patterns.length > 0);
    assert.ok(Array.isArray(parsed.useCases) && parsed.useCases.length === 2);
  });

  it("--app <unknown> exits 1", function () {
    assert.throws(function () {
      execFileSync(NODE, [CLI, "--app", "nope"], {
        encoding: "utf8",
        stdio: "pipe",
      });
    });
  });
});

describe("resolve-patterns (extensibility — synthetic 4th app, zero code change)", function () {
  var synthetic = {
    apps: {
      observability: {
        header: { type: "Observability" },
        sidebar: [{ label: "Monitors", id: "monitors" }],
        signals: ["monitor", "alert", "health"],
        useCases: [
          {
            audience: ["sre"],
            jobs: ["watch pipeline health"],
            patterns: ["alert-timeline"],
          },
        ],
      },
    },
    patterns: {
      "alert-timeline": {
        apps: ["observability"],
        label: "Alert Timeline",
        description: "Chronological alert feed.",
      },
      "search-filtered-table": {
        apps: ["studio"],
        label: "Search-filtered table",
        description: "A studio-only pattern.",
      },
    },
  };

  it("resolves the new app's scoped patterns + useCases via the injection seam", function () {
    var ps = resolver.resolvePatterns("observability", synthetic);
    assert.strictEqual(ps.length, 1);
    assert.strictEqual(ps[0].slug, "alert-timeline");
    assert.deepStrictEqual(ps[0].tags, ["alert", "timeline"]);

    var uc = resolver.resolveUseCases("observability", synthetic);
    assert.strictEqual(uc.length, 1);
    assert.deepStrictEqual(uc[0].jobs, ["watch pipeline health"]);

    assert.ok(resolver.listApps(synthetic).indexOf("observability") !== -1);
  });

  it("does not leak other apps' patterns into the new app", function () {
    var slugs = resolver
      .resolvePatterns("observability", synthetic)
      .map(function (p) {
        return p.slug;
      });
    assert.strictEqual(slugs.indexOf("search-filtered-table"), -1);
  });
});
