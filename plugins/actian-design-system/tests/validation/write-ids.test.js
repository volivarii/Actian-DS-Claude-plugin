#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var crypto = require("crypto");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { spawnSync } = require("node:child_process");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var VALIDATE = path.join(
  PLUGIN_ROOT,
  "scripts",
  "validation",
  "validate-flow-data.js",
);

describe("validate-flow-data --write-ids", function () {
  it("--write-ids stamps screen ids into the file", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "ids-"));
    try {
      var input = path.join(dir, "flow-data.json");
      fs.writeFileSync(
        input,
        JSON.stringify({
          meta: { feature: "Data product publishing", app: "Studio" },
          screens: [{ name: "S1", template: "studio", content: [] }],
        }),
      );
      spawnSync(process.execPath, [VALIDATE, input, "--write-ids"]);
      var after = JSON.parse(fs.readFileSync(input, "utf8"));
      assert.strictEqual(after.screens[0].id, "data-product-publishing-1");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("without --write-ids the input file is left byte-identical", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "ids-"));
    try {
      var input = path.join(dir, "flow-data.json");
      fs.writeFileSync(
        input,
        JSON.stringify({
          meta: { feature: "Data product publishing", app: "Studio" },
          screens: [{ name: "S1", template: "studio", content: [] }],
        }),
      );
      var before = crypto
        .createHash("sha256")
        .update(fs.readFileSync(input))
        .digest("hex");
      spawnSync(process.execPath, [VALIDATE, input]);
      var after = crypto
        .createHash("sha256")
        .update(fs.readFileSync(input))
        .digest("hex");
      assert.strictEqual(after, before);
      var parsed = JSON.parse(fs.readFileSync(input, "utf8"));
      assert.strictEqual(parsed.screens[0].id, undefined);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
