"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var os = require("os");
var shared = require("../../scripts/renderers/assemble-shared.js");

test("buildDsIconsScript emits window.dsIcons with geometry-only entries", function () {
  var s = shared.buildDsIconsScript();
  assert.match(
    s,
    /<script>\s*window\.dsIcons\s*=/,
    "must assign window.dsIcons",
  );
  // Extract the geometry literal. It is now followed by a SECOND assignment
  // (window.dsIconsShadowedByComponent), so stop at that boundary rather than at
  // </script> — see the shadowed-slug test below for why it is there.
  var json = s
    .replace(/^[\s\S]*window\.dsIcons\s*=\s*/, "")
    .replace(/;\s*window\.dsIconsShadowedByComponent[\s\S]*$/, "")
    .replace(/;?\s*<\/script>[\s\S]*$/, "");
  var map = JSON.parse(json);
  var slugs = Object.keys(map);
  assert.ok(slugs.length >= 35, "expected >=35 icons, got " + slugs.length);
  assert.ok("simple-check" in map, "simple-check present");
  // geometry-only: each entry has exactly viewBox + body, no provenance.
  slugs.forEach(function (k) {
    assert.deepEqual(
      Object.keys(map[k]).sort(),
      ["body", "viewBox"],
      k + " must be geometry-only",
    );
  });
});

test("assembled flow HTML injects window.dsIcons before the renderers", function () {
  var data = {
    meta: { feature: "T", app: "Studio" },
    screens: [
      {
        name: "S",
        nodes: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "button",
            variant: "Type=Primary",
            props: { Label: "Go", "Leading icon show": true },
          },
        ],
      },
    ],
  };
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "p1a-"));
  var dataPath = path.join(dir, "flow.json");
  var outPath = path.join(dir, "out.html");
  fs.writeFileSync(dataPath, JSON.stringify(data));
  var NODE = process.execPath;
  // assemble-preview CLI: input data file is POSITIONAL; flags are --type and -o/--output.
  cp.execFileSync(
    NODE,
    [
      "scripts/renderers/assemble-preview.js",
      dataPath,
      "--type",
      "flow",
      "-o",
      outPath,
    ],
    { stdio: "ignore" },
  );
  var html = fs.readFileSync(outPath, "utf8");
  assert.match(
    html,
    /window\.dsIcons\s*=/,
    "assembled HTML must inject window.dsIcons",
  );
  assert.ok(
    html.indexOf("window.dsIcons") < html.indexOf("ds-html-map.js"),
    "window.dsIcons must precede ds-html-map.js",
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

// The renderer runs in the BROWSER here, so it has no registry to consult. Ship
// the shadowed-slug list next to the geometry or it cannot tell the `search`
// GLYPH from the Search COMPONENT — and global-header's anatomy nests `search`,
// meaning the whole field. Without this, the preview draws a tiny magnifier where
// an entire search input belongs.
test("buildDsIconsScript ships the shadowed-slug list alongside the geometry", function () {
  var s = shared.buildDsIconsScript();
  assert.match(
    s,
    /window\.dsIconsShadowedByComponent\s*=/,
    "the browser has no registry — it must be told which slugs are ambiguous",
  );
  var json = s
    .replace(/^[\s\S]*window\.dsIconsShadowedByComponent\s*=\s*/, "")
    .replace(/;?\s*<\/script>[\s\S]*$/, "");
  var shadowed = JSON.parse(json);
  assert.ok(Array.isArray(shadowed), "must be an array");
  // Sourced from knowledge's icons.json _meta, not hardcoded here: assert the
  // WIRING, not today's membership, so a new shadowed glyph does not fail CI.
  var doc = require(require("../../scripts/lib/paths.js").components.icons.svg);
  assert.deepEqual(
    shadowed,
    (doc._meta && doc._meta.shadowed_by_component) || [],
    "must mirror what the substrate declares",
  );
});
