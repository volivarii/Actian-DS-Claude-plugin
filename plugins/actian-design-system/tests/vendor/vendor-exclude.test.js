"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var core = require("../../scripts/vendor/vendor-snapshot-core.js");

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), "vex-")); }

test("vendorContent skips a declared excluded sub-path but copies its siblings", function () {
  var root = tmp();
  // A fake extracted knowledge tarball root.
  fs.mkdirSync(path.join(root, "components", "render", "src"), { recursive: true });
  fs.mkdirSync(path.join(root, "components", "render", "dist", "fragments"), { recursive: true });
  fs.writeFileSync(path.join(root, "components", "render", "src", "button.html"), "SEED");
  fs.writeFileSync(path.join(root, "components", "render", "dist", "render.css"), "CSS");
  fs.writeFileSync(path.join(root, "components", "render", "dist", "fragments", "button.html"), "FRAG");
  fs.writeFileSync(path.join(root, "vendor-include.json"), JSON.stringify({ include: ["components", "vendor-include.json"] }));
  fs.writeFileSync(path.join(root, "vendor-exclude.json"), JSON.stringify({ exclude: ["components/render/src"] }));

  var vendorDir = path.join(tmp(), "vendor");
  core.vendorContent(root, vendorDir, null);

  assert.ok(fs.existsSync(path.join(vendorDir, "components", "render", "dist", "render.css")), "dist copied");
  assert.ok(fs.existsSync(path.join(vendorDir, "components", "render", "dist", "fragments", "button.html")), "fragments copied");
  assert.ok(!fs.existsSync(path.join(vendorDir, "components", "render", "src")), "src excluded");
});
