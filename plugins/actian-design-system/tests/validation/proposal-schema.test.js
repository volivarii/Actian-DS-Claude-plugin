"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var validate = require("../../scripts/validation/validate-schema.js");

var ROOT = path.resolve(__dirname, "..", "..");
var SCHEMA_PATH = path.join(ROOT, "schemas", "proposal-data.schema.json");
var FIXTURE_PATH = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json");

function load(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

describe("proposal-data.schema.json", function () {
  it("accepts the DIP-I-496 fixture with zero errors", function () {
    var errors = validate(load(FIXTURE_PATH), load(SCHEMA_PATH));
    assert.deepEqual(errors, [], errors.join("\n"));
  });
  it("rejects a screen without html", function () {
    var data = load(FIXTURE_PATH);
    delete data.screens[0].html;
    var errors = validate(data, load(SCHEMA_PATH));
    assert.ok(errors.some(function (e) { return /html/.test(e); }), errors.join("\n"));
  });
  it("rejects an unknown chrome value", function () {
    var data = load(FIXTURE_PATH);
    data.screens[0].chrome = "sidebar";
    var errors = validate(data, load(SCHEMA_PATH));
    assert.ok(errors.some(function (e) { return /chrome/.test(e); }), errors.join("\n"));
  });
  it("rejects a screen id that is not a slug", function () {
    var data = load(FIXTURE_PATH);
    data.screens[0].id = "Create Group";
    var errors = validate(data, load(SCHEMA_PATH));
    assert.ok(errors.some(function (e) { return /id/.test(e); }), errors.join("\n"));
  });
  it("every property carries a description, every text property carries examples", function () {
    var schema = load(SCHEMA_PATH);
    var missing = [];
    function walk(node, p) {
      if (!node || typeof node !== "object") return;
      if (node.properties) {
        Object.keys(node.properties).forEach(function (k) {
          var prop = node.properties[k];
          if (!prop.description) missing.push(p + k + ": description");
          if (prop.type === "string" && !prop.enum && !prop.examples) missing.push(p + k + ": examples");
          walk(prop, p + k + ".");
        });
      }
      if (node.items) walk(node.items, p + "[].");
    }
    walk(schema, "");
    assert.deepEqual(missing, [], missing.join("\n"));
  });
});
