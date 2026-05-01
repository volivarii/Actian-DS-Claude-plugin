"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var os = require("os");
var { spawnSync } = require("child_process");

var GOLDEN_DIR = path.join(__dirname, "fixtures", "foundations-parser", "golden");
var SCRIPT = path.join(__dirname, "..", "scripts", "derive-foundations.js");
var PARSER_MAP = path.join(__dirname, "..", "scripts", "foundations.parser.json");
var UPDATE = process.env.UPDATE_GOLDEN === "1";

describe("derive-foundations golden", function () {
  it("produces byte-identical output for the frozen foundations.md", function () {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "foundations-golden-"));
    var run = spawnSync(process.execPath, [
      SCRIPT,
      "--md", path.join(GOLDEN_DIR, "foundations.md"),
      "--map", PARSER_MAP,
      "--out", tmpDir,
    ], { encoding: "utf-8" });
    assert.strictEqual(run.status, 0, "parser run failed: " + run.stderr);

    var expectedDir = path.join(GOLDEN_DIR, "expected");
    var expectedFiles = fs.readdirSync(expectedDir).filter(function (f) {
      return f.endsWith(".json");
    });
    var actualFiles = fs.readdirSync(tmpDir).filter(function (f) {
      return f.endsWith(".json");
    });

    if (UPDATE) {
      fs.rmSync(expectedDir, { recursive: true, force: true });
      fs.mkdirSync(expectedDir, { recursive: true });
      actualFiles.forEach(function (f) {
        fs.copyFileSync(path.join(tmpDir, f), path.join(expectedDir, f));
      });
      console.log("[golden] updated " + actualFiles.length + " expected files");
      return;
    }

    assert.deepStrictEqual(
      actualFiles.sort(),
      expectedFiles.sort(),
      "file set mismatch — run with UPDATE_GOLDEN=1 if intentional"
    );

    for (var i = 0; i < expectedFiles.length; i++) {
      var name = expectedFiles[i];
      var expected = fs.readFileSync(path.join(expectedDir, name), "utf-8");
      var actual = fs.readFileSync(path.join(tmpDir, name), "utf-8");
      assert.strictEqual(actual, expected, "drift in " + name + " — run with UPDATE_GOLDEN=1 if intentional");
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
