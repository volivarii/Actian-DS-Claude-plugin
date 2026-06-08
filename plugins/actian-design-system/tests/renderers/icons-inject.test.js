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
  // Extract the JSON object literal and parse it.
  var json = s
    .replace(/^[\s\S]*window\.dsIcons\s*=\s*/, "")
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
