#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var resolve = require("../scripts/resolve-unit.js");

var FIXTURE = path.join(__dirname, "fixtures", "refine-manifest.json");
var FIXTURE_PRE = path.join(
  __dirname,
  "fixtures",
  "refine-manifest-pre-screenId.json",
);

describe("parseFigmaUrl", function () {
  it("extracts fileKey + nodeId (dash form → colon form)", function () {
    var p = resolve.parseFigmaUrl(
      "https://figma.com/design/FaBwMaNkvdrcQIo3fl8I4D/Test?node-id=1-45",
    );
    assert.strictEqual(p.fileKey, "FaBwMaNkvdrcQIo3fl8I4D");
    assert.strictEqual(p.nodeId, "1:45");
  });

  it("returns null on malformed URL", function () {
    assert.strictEqual(resolve.parseFigmaUrl("not a url"), null);
    assert.strictEqual(resolve.parseFigmaUrl("https://example.com/x"), null);
  });

  it("returns null nodeId when query string lacks node-id", function () {
    var p = resolve.parseFigmaUrl(
      "https://figma.com/design/abc/Test",
    );
    assert.strictEqual(p.fileKey, "abc");
    assert.strictEqual(p.nodeId, null);
  });
});

describe("resolveByUrl", function () {
  it("exact match against pushedNodes[].id → kind=single-unit", function () {
    var r = resolve.resolveByUrl(
      "https://figma.com/design/FaBwMaNkvdrcQIo3fl8I4D/?node-id=1-45",
      FIXTURE,
    );
    assert.strictEqual(r.kind, "single-unit");
    assert.strictEqual(r.screenId, "notification-preferences-2");
    assert.strictEqual(r.figmaNodeId, "1:45");
  });

  it("exact match against pageNodeId → kind=full", function () {
    var r = resolve.resolveByUrl(
      "https://figma.com/design/FaBwMaNkvdrcQIo3fl8I4D/?node-id=1-10",
      FIXTURE,
    );
    assert.strictEqual(r.kind, "full");
    assert.strictEqual(r.screenId, null);
  });

  it("fileKey mismatch → kind=miss with reason", function () {
    var r = resolve.resolveByUrl(
      "https://figma.com/design/OTHER/?node-id=1-45",
      FIXTURE,
    );
    assert.strictEqual(r.kind, "miss");
    assert.strictEqual(r.reason, "file mismatch");
  });

  it("nodeId not in pushedNodes → kind=miss, reason=nested", function () {
    var r = resolve.resolveByUrl(
      "https://figma.com/design/FaBwMaNkvdrcQIo3fl8I4D/?node-id=99-999",
      FIXTURE,
    );
    assert.strictEqual(r.kind, "miss");
    assert.strictEqual(r.reason, "node not in pushedNodes");
  });

  it("unparseable URL → kind=miss, reason=unparseable", function () {
    var r = resolve.resolveByUrl("garbage", FIXTURE);
    assert.strictEqual(r.kind, "miss");
    assert.strictEqual(r.reason, "unparseable URL");
  });

  it("manifest path unreadable → kind=miss, reason=unreadable", function () {
    var r = resolve.resolveByUrl(
      "https://figma.com/design/abc/?node-id=1-1",
      "/nonexistent/manifest.json",
    );
    assert.strictEqual(r.kind, "miss");
    assert.strictEqual(r.reason, "manifest unreadable");
  });

  it("pre-v1.56 manifest (matched node, no screenId) → miss, reason=pre-screenId", function () {
    var r = resolve.resolveByUrl(
      "https://figma.com/design/FaBwMaNkvdrcQIo3fl8I4D/?node-id=1-23",
      FIXTURE_PRE,
    );
    assert.strictEqual(r.kind, "miss");
    assert.strictEqual(r.reason, "manifest pre-dates screenId");
  });
});
