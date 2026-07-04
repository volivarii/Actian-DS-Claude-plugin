// tests/renderers/appearance-render-realdata.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var r = require("../../scripts/renderers/appearance-render.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

function docs() {
  return fs
    .readdirSync(ANATOMY_DIR)
    .filter(function (f) {
      return f.endsWith(".json");
    })
    .map(function (f) {
      return {
        slug: f.replace(/\.json$/, ""),
        doc: JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8")),
      };
    });
}

test("every vendored anatomy renders without throwing", function () {
  docs().forEach(function (d) {
    var variant =
      d.doc.root && d.doc.root.name && d.doc.root.name.indexOf("=") !== -1
        ? parseName(d.doc.root.name)
        : null;
    var html;
    assert.doesNotThrow(function () {
      html = r.renderAppearanceComponent(d.doc, { variant: variant });
    }, d.slug);
    assert.equal(typeof html, "string", d.slug);
  });
});

test("slugs with root appearance emit at least one value declaration", function () {
  var withAppearance = docs().filter(function (d) {
    return d.doc.root && d.doc.root.appearance;
  });
  assert.ok(
    withAppearance.length >= 56,
    "expected many appearance-bearing slugs, got " + withAppearance.length,
  );
  withAppearance.forEach(function (d) {
    var html = r.renderAppearanceComponent(d.doc, { variant: null });
    assert.match(html, /style="/, d.slug + " should emit inline style");
  });
});

function parseName(name) {
  var out = {};
  String(name)
    .split(",")
    .forEach(function (pair) {
      var i = pair.indexOf("=");
      if (i !== -1) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    });
  return out;
}
