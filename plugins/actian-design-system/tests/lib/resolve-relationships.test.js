#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "resolve-relationships.js"),
);

describe("resolve-relationships (resolver core)", function () {
  it("resolves catalog-object's relationships as {relationship,relatedEntity,label}", function () {
    var rels = resolver.resolveRelationships("catalog-object");
    assert.ok(Array.isArray(rels) && rels.length >= 5, "expected catalog-object edges");
    rels.forEach(function (r) {
      assert.ok(typeof r.relationship === "string" && r.relationship.length > 0);
      assert.ok(typeof r.relatedEntity === "string" && r.relatedEntity.length > 0);
      assert.ok(typeof r.label === "string" && r.label.length > 0);
    });
    var related = rels.map(function (r) { return r.relatedEntity; });
    assert.ok(related.indexOf("lineage") !== -1, "catalog-object → lineage edge expected");
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
