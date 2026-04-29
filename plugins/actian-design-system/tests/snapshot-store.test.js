#!/usr/bin/env node
"use strict";

var { describe, it, before, after } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var os = require("os");
var store = require("../scripts/snapshot-store.js");

var tmpDir;

before(function () {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "snapshot-store-"));
});

after(function () {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("snapshot-store", function () {
  it("write + read round-trips data exactly", function () {
    var data = { meta: { feature: "x" }, screens: [{ id: "x-1" }] };
    store.write(tmpDir, data);
    var read = store.read(tmpDir);
    assert.deepStrictEqual(read, data);
  });

  it("read returns null when file is missing", function () {
    var emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "snapshot-empty-"));
    assert.strictEqual(store.read(emptyDir), null);
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it("read returns null when file is corrupt JSON", function () {
    var badDir = fs.mkdtempSync(path.join(os.tmpdir(), "snapshot-bad-"));
    fs.writeFileSync(path.join(badDir, store.SNAPSHOT_FILENAME), "not json{");
    assert.strictEqual(store.read(badDir), null);
    fs.rmSync(badDir, { recursive: true, force: true });
  });

  it("write overwrites existing snapshot", function () {
    store.write(tmpDir, { v: 1 });
    store.write(tmpDir, { v: 2 });
    assert.deepStrictEqual(store.read(tmpDir), { v: 2 });
  });

  it("exposes SNAPSHOT_FILENAME constant", function () {
    assert.strictEqual(store.SNAPSHOT_FILENAME, "flow-data.snapshot.json");
  });
});
