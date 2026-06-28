#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-relationships.js",
  ),
);

describe("resolve-relationships (resolver core)", function () {
  it("resolves catalog-object's relationships as {relationship,relatedEntity,label}", function () {
    var rels = resolver.resolveRelationships("catalog-object");
    assert.ok(
      Array.isArray(rels) && rels.length >= 5,
      "expected catalog-object edges",
    );
    rels.forEach(function (r) {
      assert.ok(
        typeof r.relationship === "string" && r.relationship.length > 0,
      );
      assert.ok(
        typeof r.relatedEntity === "string" && r.relatedEntity.length > 0,
      );
      assert.ok(typeof r.label === "string" && r.label.length > 0);
    });
    var related = rels.map(function (r) {
      return r.relatedEntity;
    });
    assert.ok(
      related.indexOf("lineage") !== -1,
      "catalog-object → lineage edge expected",
    );
  });

  it("humanizeSlug capitalizes the first token, hyphens→spaces", function () {
    assert.strictEqual(resolver.humanizeSlug("glossary-item"), "Glossary item");
    assert.strictEqual(resolver.humanizeSlug("lineage"), "Lineage");
    assert.strictEqual(resolver.humanizeSlug(""), "");
  });

  it("normalizes case/whitespace; returns [] for unknown/empty", function () {
    assert.ok(resolver.resolveRelationships("  Catalog-Object ").length >= 5);
    assert.deepStrictEqual(resolver.resolveRelationships("nope"), []);
    assert.deepStrictEqual(resolver.resolveRelationships(""), []);
    assert.deepStrictEqual(resolver.resolveRelationships(null), []);
  });

  it("listEntities includes catalog-object", function () {
    assert.ok(resolver.listEntities().indexOf("catalog-object") !== -1);
  });
});

describe("resolve-relationships (CLI)", function () {
  var execFileSync = require("child_process").execFileSync;
  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-relationships.js",
  );

  it("--entity catalog-object prints { entity, relationships } and exits 0", function () {
    var out = execFileSync(NODE, [CLI, "--entity", "catalog-object"], {
      encoding: "utf8",
    });
    var parsed = JSON.parse(out);
    assert.strictEqual(parsed.entity, "catalog-object");
    assert.ok(
      Array.isArray(parsed.relationships) && parsed.relationships.length >= 5,
    );
  });

  it("--entity <unknown> exits 1", function () {
    assert.throws(function () {
      execFileSync(NODE, [CLI, "--entity", "nope"], {
        encoding: "utf8",
        stdio: "pipe",
      });
    });
  });
});
