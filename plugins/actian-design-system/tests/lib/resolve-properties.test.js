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
    "resolve-properties.js",
  ),
);

describe("resolve-properties (resolver core)", function () {
  it("resolves data-product's properties as normalized {name,label,type} objects", function () {
    var props = resolver.resolveProperties("data-product");
    assert.ok(
      Array.isArray(props) && props.length >= 8,
      "expected data-product props",
    );
    props.forEach(function (p) {
      assert.ok(typeof p.name === "string" && p.name.length > 0);
      assert.ok(typeof p.label === "string" && p.label.length > 0);
      assert.ok(typeof p.type === "string" && p.type.length > 0);
    });
    var names = props.map(function (p) {
      return p.name;
    });
    assert.ok(
      names.indexOf("name") !== -1,
      "data-product → name field expected",
    );
  });

  it("preserves the typed shape (enum + states) carried forward for S3c", function () {
    var props = resolver.resolveProperties("data-product");
    var status = props.filter(function (p) {
      return p.name === "status";
    })[0];
    assert.ok(status, "status property expected");
    assert.strictEqual(status.type, "enum");
    assert.deepStrictEqual(status.states, ["Draft", "Published", "Deprecated"]);
    assert.strictEqual(status.label, "Status");
  });

  it("humanizeName splits camelCase and sentence-cases", function () {
    assert.strictEqual(resolver.humanizeName("apiVersion"), "Api version");
    assert.strictEqual(resolver.humanizeName("createdAt"), "Created at");
    assert.strictEqual(resolver.humanizeName("rowCount"), "Row count");
  });

  it("humanizeName preserves S3b spaced-phrase behavior (regression)", function () {
    assert.strictEqual(resolver.humanizeName("use case"), "Use case");
    assert.strictEqual(resolver.humanizeName("created at"), "Created at");
    assert.strictEqual(resolver.humanizeName("name"), "Name");
    assert.strictEqual(resolver.humanizeName(""), "");
  });

  it("humanizeName normalizes underscores/hyphens and leaves digits attached", function () {
    assert.strictEqual(resolver.humanizeName("created_at"), "Created at");
    assert.strictEqual(resolver.humanizeName("rowCount2"), "Row count2");
  });

  it("normalizes case/whitespace; returns [] for unknown/empty", function () {
    assert.ok(resolver.resolveProperties("  Data-Product ").length >= 8);
    assert.deepStrictEqual(resolver.resolveProperties("nope"), []);
    assert.deepStrictEqual(resolver.resolveProperties(""), []);
    assert.deepStrictEqual(resolver.resolveProperties(null), []);
  });

  it("listEntities includes data-product", function () {
    assert.ok(resolver.listEntities().indexOf("data-product") !== -1);
  });
});

describe("resolve-properties (mixed string/object array — synthetic, injection seam)", function () {
  var synthetic = {
    entities: {
      widget: {
        properties: [
          "foo",
          { name: "bar", type: "enum", states: ["A", "B"] },
          { name: "baz", type: "string", example: "qux" },
          "", // skipped (empty string)
          { type: "string" }, // skipped (no name)
        ],
      },
      empty: { properties: [] },
    },
  };

  it("normalizes both string and object entries; drops invalid ones; carries states/example", function () {
    var props = resolver.resolveProperties("widget", synthetic);
    assert.strictEqual(props.length, 3);
    assert.deepStrictEqual(props[0], {
      name: "foo",
      label: "Foo",
      type: "string",
    });
    assert.strictEqual(props[1].name, "bar");
    assert.strictEqual(props[1].type, "enum");
    assert.deepStrictEqual(props[1].states, ["A", "B"]);
    assert.strictEqual(props[2].example, "qux");
    assert.ok(resolver.listEntities(synthetic).indexOf("widget") !== -1);
  });

  it("returns [] for an entity with an empty properties array", function () {
    assert.deepStrictEqual(resolver.resolveProperties("empty", synthetic), []);
  });
});

describe("resolve-properties (CLI)", function () {
  var execFileSync = require("child_process").execFileSync;
  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "lib",
    "app-context",
    "resolve-properties.js",
  );

  it("--entity data-product prints { entity, properties } and exits 0", function () {
    var out = execFileSync(NODE, [CLI, "--entity", "data-product"], {
      encoding: "utf8",
    });
    var parsed = JSON.parse(out);
    assert.strictEqual(parsed.entity, "data-product");
    assert.ok(
      Array.isArray(parsed.properties) && parsed.properties.length >= 8,
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
