"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var cp = require("node:child_process");

var SCRIPT = path.resolve(
  __dirname,
  "../../scripts/transformers/merge-partials.js",
);

describe("merge-partials --incremental stamps screen ids", function () {
  it("the incremental skeleton merge stamps ids", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-ids-"));
    try {
      var partialsDir = path.join(dir, ".partial");
      fs.mkdirSync(partialsDir, { recursive: true });
      var listPath = path.join(dir, "screen-list.json");
      fs.writeFileSync(
        listPath,
        JSON.stringify({
          meta: { feature: "Access request" },
          screens: [{ name: "Marketplace", template: "browse" }],
        }),
      );
      var out = path.join(dir, "flow-data.json");
      var r = cp.spawnSync(
        process.execPath,
        [
          SCRIPT,
          "--type",
          "flow",
          "--incremental",
          "--screen-list",
          listPath,
          "--partials-dir",
          partialsDir,
          "--output",
          out,
        ],
        { encoding: "utf8" },
      );
      assert.equal(r.status, 0, r.stderr);
      var merged = JSON.parse(fs.readFileSync(out, "utf8"));
      assert.strictEqual(merged.screens[0].id, "access-request-1");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
