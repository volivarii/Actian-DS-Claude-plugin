#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validator = require(path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"));
var validate = require(path.join(PLUGIN_ROOT, "tests", "helpers", "validate-cli.js")).validate;

function flow(texts, glossary) {
  return {
    meta: { feature: "t", app: "studio", _glossary: glossary || {} },
    screens: [{
      id: "t-1", name: "Screen", template: "studio",
      content: texts.map(function (t) { return { type: "TEXT", content: t }; }),
    }],
  };
}

describe("terminology gate masks known terms", function () {
  it("maskKnownTerms blanks a term and its plural, keeps length, ignores case", function () {
    var out = validator.maskKnownTerms("Input ports (2) and input port", ["Input port"]);
    assert.strictEqual(out.length, "Input ports (2) and input port".length);
    assert.strictEqual(out.replace(/\s+/g, " ").trim(), "(2) and");
  });

  it("knownTermsFrom collects use terms, chrome labels, property and relationship labels", function () {
    var terms = validator.knownTermsFrom(
      { meta: { _glossary: {
        chrome: { header: { type: "Studio" }, sidebar: [{ label: "Access requests" }] },
        entityProperties: [{ label: "Api version" }],
        relationships: [{ label: "Input port" }],
      } } },
      { dc: { use: "Data contract", notUse: ["policy"] } }
    );
    ["Data contract", "Studio", "Access requests", "Api version", "Input port"].forEach(function (t) {
      assert.ok(terms.indexOf(t) !== -1, "missing " + t);
    });
  });

  it("does not flag the substrate's own labels, and still flags a real miss", function () {
    var glossary = {
      chrome: { header: { type: "Studio" }, sidebar: [{ label: "Access requests" }] },
      entityProperties: [{ label: "Api version" }],
      relationships: [{ label: "Input port" }, { label: "Output port" }],
    };
    var r = validate(flow(["Input ports (2)", "Api version", "Access request policy", "Choose a policy for this port"], glossary));
    var lines = r.out.split("\n").filter(function (l) { return /\[terminology\]/.test(l); });
    assert.strictEqual(lines.length, 1, "exactly one terminology finding, got:\n" + lines.join("\n"));
    assert.match(lines[0], /Choose a policy/);
  });

  it("never scans variant, name, template, id or dsSlug props", function () {
    var data = flow([]);
    data.screens[0].content = [{ type: "INSTANCE", ref: "fmButton", props: { variant: "policy", name: "policy", template: "policy", Label: "Save" } }];
    var r = validate(data);
    assert.ok(!/\[terminology\]/.test(r.out), r.out);
  });
});
