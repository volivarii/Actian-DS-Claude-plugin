#!/usr/bin/env node
"use strict";

// Task 3 — Sub-project B: sync-side Figma description capture.
//
// Verifies that transform-registry captures node.description from the Figma
// REST component-set payload and persists it on each dskit.json entry.
// Uses synthetic component-set objects — no live Figma or registry I/O.
//
// Covered cases:
//   1. Component set with a description → entry.description matches
//   2. Component set with no description → entry.description === ""
//   3. Standalone component with a description → entry.description matches
//   4. Whitespace-only description → normalized to ""
//   5. Description longer than 200 chars → truncated to 200 chars
//   6. The low-level _trimDescription helper is exported and behaves correctly

var { describe, it } = require("node:test");
var assert = require("node:assert");

var transform = require("../../scripts/transformers/transformers/transform-registry.js");
var trimDescription = transform._trimDescription;

// ---------- helpers ----------

function makeSetMeta(name, description) {
  return {
    name: name,
    key: "abc" + name,
    node_id: "1:1",
    description: description,
    containing_frame: { pageName: "TestPage" },
  };
}

function makeSetNode() {
  return {
    document: {
      id: "1:1",
      name: "ignored",
      type: "COMPONENT_SET",
      componentPropertyDefinitions: {},
      children: [],
    },
  };
}

function makeSingleMeta(name, description) {
  return {
    name: name,
    key: "standalone" + name,
    node_id: "2:2",
    description: description,
    containing_frame: { pageName: "TestPage" },
  };
}

function makeSingleNode() {
  return {
    document: {
      id: "2:2",
      name: "ignored",
      type: "COMPONENT",
      componentPropertyDefinitions: {},
    },
  };
}

// ---------- tests ----------

describe("sync-description-capture", function () {
  describe("component set with description", function () {
    var meta = makeSetMeta("Button", "Primary trigger for a specific action.");
    var result = transform({
      library: "ds",
      fileKey: "filekey123",
      componentSets: [meta],
      componentSetNodes: { "1:1": makeSetNode() },
      standalones: [],
      standaloneNodes: {},
    });
    var entry = result.components.button;

    it("entry has description field", function () {
      assert.ok("description" in entry, "description field missing from registry entry");
    });

    it("entry.description matches the source node.description", function () {
      assert.strictEqual(entry.description, "Primary trigger for a specific action.");
    });
  });

  describe("component set with no description", function () {
    var meta = makeSetMeta("Badge", undefined);
    var result = transform({
      library: "ds",
      fileKey: "filekey123",
      componentSets: [meta],
      componentSetNodes: { "1:1": makeSetNode() },
      standalones: [],
      standaloneNodes: {},
    });
    var entry = result.components.badge;

    it("entry.description defaults to empty string (not null or undefined)", function () {
      assert.strictEqual(entry.description, "", "expected empty string for missing description");
    });
  });

  describe("component set with empty-string description", function () {
    var meta = makeSetMeta("Chip", "");
    var result = transform({
      library: "ds",
      fileKey: "filekey123",
      componentSets: [meta],
      componentSetNodes: { "1:1": makeSetNode() },
      standalones: [],
      standaloneNodes: {},
    });
    var entry = result.components.chip;

    it("entry.description is empty string (not null or undefined)", function () {
      assert.strictEqual(entry.description, "");
    });
  });

  describe("standalone component with description", function () {
    var meta = makeSingleMeta("Logo", "Actian brand mark. Use in header and splash screens.");
    var result = transform({
      library: "ds",
      fileKey: "filekey123",
      componentSets: [],
      componentSetNodes: {},
      standalones: [meta],
      standaloneNodes: { "2:2": makeSingleNode() },
    });
    var entry = result.components.logo;

    it("standalone entry has description field", function () {
      assert.ok("description" in entry, "description field missing from standalone registry entry");
    });

    it("standalone entry.description matches source", function () {
      assert.strictEqual(entry.description, "Actian brand mark. Use in header and splash screens.");
    });
  });

  describe("whitespace-only description normalization", function () {
    it("_trimDescription('   ') returns empty string", function () {
      assert.strictEqual(trimDescription("   "), "");
    });

    it("_trimDescription('\\t\\n') returns empty string", function () {
      assert.strictEqual(trimDescription("\t\n"), "");
    });

    it("_trimDescription preserves leading/trailing spaces in a real description", function () {
      // Only pure-whitespace strings are normalized; content with surrounding spaces
      // is kept as-is (the Figma REST API sometimes includes trailing newlines).
      var desc = "  Some description  ";
      assert.strictEqual(trimDescription(desc), desc);
    });

    it("component set with whitespace-only description produces entry.description = ''", function () {
      var meta = makeSetMeta("Ghost", "   ");
      var result = transform({
        library: "ds",
        fileKey: "filekey123",
        componentSets: [meta],
        componentSetNodes: { "1:1": makeSetNode() },
        standalones: [],
        standaloneNodes: {},
      });
      assert.strictEqual(result.components.ghost.description, "");
    });
  });

  describe("long description truncation", function () {
    it("description longer than 200 chars is truncated to 200", function () {
      var long = "A".repeat(300);
      var meta = makeSetMeta("Verbose", long);
      var result = transform({
        library: "ds",
        fileKey: "filekey123",
        componentSets: [meta],
        componentSetNodes: { "1:1": makeSetNode() },
        standalones: [],
        standaloneNodes: {},
      });
      var entry = result.components.verbose;
      assert.strictEqual(entry.description.length, 200);
      assert.strictEqual(entry.description, long.slice(0, 200));
    });

    it("description of exactly 200 chars is not truncated", function () {
      var exact = "B".repeat(200);
      var meta = makeSetMeta("Exact", exact);
      var result = transform({
        library: "ds",
        fileKey: "filekey123",
        componentSets: [meta],
        componentSetNodes: { "1:1": makeSetNode() },
        standalones: [],
        standaloneNodes: {},
      });
      assert.strictEqual(result.components.exact.description, exact);
    });
  });

  describe("_trimDescription export (low-level unit)", function () {
    it("null → empty string", function () {
      assert.strictEqual(trimDescription(null), "");
    });

    it("undefined → empty string", function () {
      assert.strictEqual(trimDescription(undefined), "");
    });

    it("non-empty string preserved", function () {
      assert.strictEqual(trimDescription("hello"), "hello");
    });

    it("string > 200 chars truncated", function () {
      var s = "x".repeat(201);
      assert.strictEqual(trimDescription(s).length, 200);
    });
  });
});
