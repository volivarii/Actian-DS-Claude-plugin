"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var core = require("../../scripts/vendor/vendor-snapshot-core.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vex-"));
}

test("vendorContent skips a declared excluded sub-path but copies its siblings", function () {
  var root = tmp();
  // A fake extracted knowledge tarball root.
  fs.mkdirSync(path.join(root, "components", "render", "src"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, "components", "render", "dist", "fragments"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, "components", "render", "src", "button.html"),
    "SEED",
  );
  fs.writeFileSync(
    path.join(root, "components", "render", "dist", "render.css"),
    "CSS",
  );
  fs.writeFileSync(
    path.join(root, "components", "render", "dist", "fragments", "button.html"),
    "FRAG",
  );
  fs.writeFileSync(
    path.join(root, "vendor-include.json"),
    JSON.stringify({ include: ["components", "vendor-include.json"] }),
  );
  fs.writeFileSync(
    path.join(root, "vendor-exclude.json"),
    JSON.stringify({ exclude: ["components/render/src"] }),
  );

  var vendorDir = path.join(tmp(), "vendor");
  core.vendorContent(root, vendorDir, null);

  assert.ok(
    fs.existsSync(
      path.join(vendorDir, "components", "render", "dist", "render.css"),
    ),
    "dist copied",
  );
  assert.ok(
    fs.existsSync(
      path.join(
        vendorDir,
        "components",
        "render",
        "dist",
        "fragments",
        "button.html",
      ),
    ),
    "fragments copied",
  );
  assert.ok(
    !fs.existsSync(path.join(vendorDir, "components", "render", "src")),
    "src excluded",
  );
});

test("vendorContent fallback mode (no vendor-include.json) honors BOTH the caller's top-level excludeSet and a declared sub-path exclude", function () {
  var root = tmp();
  // No vendor-include.json here: forces the legacy exclude-fallback branch in
  // selectEntries, which relies on the caller's top-level excludeSet param.
  fs.mkdirSync(path.join(root, "components", "render", "src"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, "components", "render", "dist"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "components", "render", "src", "button.html"),
    "SEED",
  );
  fs.writeFileSync(
    path.join(root, "components", "render", "dist", "render.css"),
    "CSS",
  );
  fs.writeFileSync(path.join(root, "scripts", "build.js"), "BUILD");
  fs.writeFileSync(
    path.join(root, "vendor-exclude.json"),
    JSON.stringify({ exclude: ["components/render/src"] }),
  );

  var vendorDir = path.join(tmp(), "vendor");
  // The caller's top-level excludeSet parameter (config.excludeTopLevel):
  // "scripts" must NOT be vendored, regardless of the sub-path exclude.
  core.vendorContent(root, vendorDir, new Set(["scripts"]));

  assert.ok(
    !fs.existsSync(path.join(vendorDir, "scripts")),
    "top-level excludeSet param honored: scripts NOT copied",
  );
  assert.ok(
    !fs.existsSync(path.join(vendorDir, "components", "render", "src")),
    "sub-path exclude honored: src NOT copied",
  );
  assert.ok(
    fs.existsSync(
      path.join(vendorDir, "components", "render", "dist", "render.css"),
    ),
    "components copied (not excluded)",
  );
});
