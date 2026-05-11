"use strict";

// Tests for paths-manifest.json schema correctness. Tests run against
// the LIVE manifest, not fixtures, so they double as drift detection.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "paths-manifest.json");

test("paths-manifest.json — schema correctness", async (t) => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

  await t.test("has required top-level fields", () => {
    assert.equal(manifest.manifest_schema_version, "v1");
    assert.ok(manifest.knowledge_version, "knowledge_version is set");
    assert.ok(manifest.paths, "paths object exists");
    assert.ok(manifest.collections, "collections object exists");
    assert.ok(manifest.aliases !== undefined, "aliases field present");
  });

  await t.test("every path entry has required fields", () => {
    for (const [name, entry] of Object.entries(manifest.paths)) {
      assert.ok(entry.path, `${name}: missing path`);
      assert.ok(entry.type, `${name}: missing type`);
      assert.ok(entry.origin, `${name}: missing origin`);
      assert.ok(entry.description, `${name}: missing description`);
      assert.ok(
        ["markdown", "json", "css"].includes(entry.type),
        `${name}: invalid type "${entry.type}"`,
      );
      assert.ok(
        ["human", "ci", "hybrid"].includes(entry.origin),
        `${name}: invalid origin "${entry.origin}"`,
      );
      if (entry.origin === "ci") {
        assert.ok(
          entry.generator,
          `${name}: ci entry missing generator field`,
        );
      }
    }
  });

  await t.test("every collection entry has required fields", () => {
    for (const [name, entry] of Object.entries(manifest.collections)) {
      assert.ok(entry.dir, `${name}: missing dir`);
      assert.ok(entry.pattern, `${name}: missing pattern`);
      assert.ok(entry.type, `${name}: missing type`);
      assert.ok(entry.origin, `${name}: missing origin`);
      assert.ok(entry.description, `${name}: missing description`);
    }
  });

  await t.test("no key conflicts between paths and collections", () => {
    const pathKeys = new Set(Object.keys(manifest.paths));
    for (const collKey of Object.keys(manifest.collections)) {
      assert.ok(
        !pathKeys.has(collKey),
        `Collection "${collKey}" conflicts with paths entry of same name`,
      );
    }
  });

  await t.test("every path entry resolves to a real file", () => {
    for (const [name, entry] of Object.entries(manifest.paths)) {
      const fullPath = path.join(REPO_ROOT, entry.path);
      assert.ok(
        fs.existsSync(fullPath),
        `${name}: path ${entry.path} does not exist`,
      );
    }
  });

  await t.test("every collection dir resolves to a real directory", () => {
    for (const [name, entry] of Object.entries(manifest.collections)) {
      const fullPath = path.join(REPO_ROOT, entry.dir);
      assert.ok(
        fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(),
        `${name}: dir ${entry.dir} does not exist or is not a directory`,
      );
    }
  });
});
