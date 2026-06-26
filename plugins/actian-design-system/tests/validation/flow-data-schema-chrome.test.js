#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var schema = JSON.parse(
  fs.readFileSync(
    path.join(PLUGIN_ROOT, "schemas", "flow-data.schema.json"),
    "utf8",
  ),
);

function findKey(obj, key) {
  if (obj && typeof obj === "object") {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
    for (var k in obj) {
      var r = findKey(obj[k], key);
      if (r) return r;
    }
  }
  return null;
}

describe("flow-data schema: _glossary chrome grounding", function () {
  var glossary = findKey(schema, "_glossary");

  it("defines _glossary.chrome with header + sidebar", function () {
    assert.ok(glossary && glossary.properties, "_glossary.properties missing");
    var chrome = glossary.properties.chrome;
    assert.ok(chrome, "chrome property missing");
    assert.ok(chrome.properties.header, "chrome.header missing");
    assert.ok(chrome.properties.sidebar, "chrome.sidebar missing");
  });

  it("defines _glossary.chromeJustification with minLength 30", function () {
    var cj = glossary.properties.chromeJustification;
    assert.ok(cj, "chromeJustification missing");
    assert.strictEqual(cj.minLength, 30);
  });
});
