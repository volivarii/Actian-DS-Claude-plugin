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
function errorsOf(mutate) {
  var data = load(FIXTURE_PATH);
  mutate(data);
  return validate(data, load(SCHEMA_PATH));
}

describe("proposal-data.schema.json (document shape)", function () {
  it("accepts the DIP-I-496 fixture with zero errors", function () {
    var errors = validate(load(FIXTURE_PATH), load(SCHEMA_PATH));
    assert.deepEqual(errors, [], errors.join("\n"));
  });
  it("requires context, research, approaches, comparison and recommendation at the root", function () {
    ["context", "research", "approaches", "comparison", "recommendation"].forEach(function (k) {
      var errors = errorsOf(function (d) { delete d[k]; });
      assert.ok(errors.some(function (e) { return e.indexOf(k) !== -1; }), k + ": " + errors.join("\n"));
    });
  });
  it("rejects the old board shape (meta.recommendation string, root screens)", function () {
    var old = { meta: { title: "x", date: "2026-09-09", apps: ["explorer"], skill: "design-proposal", recommendation: "<p>x</p>" }, screens: [] };
    var errors = validate(old, load(SCHEMA_PATH));
    assert.ok(errors.length >= 1, "the board shape must not validate");
  });
  it("rejects an approach without an anchor, a screen without html, and an id that is not a slug", function () {
    assert.ok(errorsOf(function (d) { delete d.approaches[0].anchor; }).some(function (e) { return /anchor/.test(e); }));
    assert.ok(errorsOf(function (d) { delete d.approaches[0].screen.html; }).some(function (e) { return /html/.test(e); }));
    assert.ok(errorsOf(function (d) { d.approaches[0].id = "Role Line"; }).some(function (e) { return /id/.test(e); }));
  });
  it("rejects fewer than two approaches and a criterion with an unknown source", function () {
    assert.ok(errorsOf(function (d) { d.approaches = [d.approaches[0]]; }).some(function (e) { return /approaches/.test(e); }));
    assert.ok(errorsOf(function (d) { d.comparison.criteria[0].source = "vibes"; }).some(function (e) { return /source/.test(e); }));
  });
  it("rejects a research block without ran, and a finding without a source", function () {
    assert.ok(errorsOf(function (d) { delete d.research.ran; }).some(function (e) { return /ran/.test(e); }));
    assert.ok(errorsOf(function (d) { delete d.research.findings[0].source; }).some(function (e) { return /source/.test(e); }));
  });
  it("accepts entity null and entity as a string in an approach's screen list", function () {
    assert.deepEqual(errorsOf(function (d) { d.approaches[0].screens[0].entity = "data-product"; }), []);
    assert.deepEqual(errorsOf(function (d) { d.approaches[0].screens[0].entity = null; }), []);
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
