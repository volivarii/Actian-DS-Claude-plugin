"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var PATHS = require("../../scripts/lib/paths.js");

function slugToRef(slug, prefix) {
  var stripped = slug.indexOf(prefix + "-") === 0 ? slug.slice(prefix.length + 1) : slug;
  return prefix + stripped.charAt(0).toUpperCase() +
    stripped.slice(1).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
}

var ALLOWLIST = new Set(["fmCursor", "fmTableExample"]);

test("every non-icon fm- component has a bespoke renderer case (or is allowlisted)", function () {
  var fmkit = JSON.parse(fs.readFileSync(PATHS.components.registries.fmkit, "utf8"));
  var src = fs.readFileSync(path.join(__dirname, "..", "..", "scripts", "renderers", "html-renderers", "fm-html-map.js"), "utf8");
  var cases = new Set();
  var re = /case\s+"([^"]+)":/g, m;
  while ((m = re.exec(src))) cases.add(m[1]);

  var missing = [];
  Object.keys(fmkit.components).forEach(function (slug) {
    if (slug.indexOf("fm-") !== 0) return;
    var ref = slugToRef(slug, "fm");
    if (ALLOWLIST.has(ref)) return;
    if (!cases.has(ref)) missing.push(ref + " (" + slug + ")");
  });
  assert.deepEqual(missing.sort(), [], "fm- components missing a renderer case: " + missing.join(", "));
});

test("the default fallback never emits a raw [ref] token", function () {
  var fmMap = require("../../scripts/renderers/html-renderers/fm-html-map.js");
  var html = fmMap.renderFMComponent({ type: "INSTANCE", ref: "fmAcademicCap", name: "Academic cap" });
  assert.ok(html.indexOf("[fmAcademicCap]") === -1, "no raw [ref] box");
  assert.ok(html.indexOf("Academic cap") !== -1, "renders the human name");
});
