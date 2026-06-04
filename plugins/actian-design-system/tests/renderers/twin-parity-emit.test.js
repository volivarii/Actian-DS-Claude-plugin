// Golden gate for the FIGMA emitter (render-node-figma.js) output. This pins the
// emitted Plugin-API script byte-for-byte. The HTML twin (render-node.js) for the
// same node specs is pinned separately by golden-snapshot.test.js (struct-* goldens).
// Field-level parity between the two twins is enforced by the shared node-lowering
// contract, not by a cross-output diff here.
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");
var cp = require("node:child_process");

var EMITTER = path.resolve(
  __dirname,
  "../../scripts/renderers/html-renderers/render-node-figma.js",
);
var FX = path.join(__dirname, "fixtures", "twin-emit");
var UPDATE = process.env.UPDATE_GOLDENS === "1";

["form-create", "table-list"].forEach(function (name) {
  describe("twin-parity emit — " + name, function () {
    it("emitted Plugin-API code matches golden", function () {
      var spec = fs.readFileSync(path.join(FX, name + ".content.json"), "utf8");
      var r = cp.spawnSync(process.execPath, [EMITTER, "--parent-id", "1:1"], {
        input: spec,
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      var goldenPath = path.join(FX, name + ".golden.js");
      if (UPDATE) {
        fs.writeFileSync(goldenPath, r.stdout);
        return;
      }
      assert.equal(r.stdout, fs.readFileSync(goldenPath, "utf8"));
    });
  });
});
