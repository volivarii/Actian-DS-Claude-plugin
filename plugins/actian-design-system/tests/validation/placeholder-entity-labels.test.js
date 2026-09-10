#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);

var QUIET = { skipTokens: true, skipTerminology: true, skipAvoidWords: true };

// placeholder-entity-labels.test.js — Pass 2's placeholder-text check must
// not fire on a string that is itself a known entity-property or
// sidebar-item label (e.g. an entity property literally called
// "Description"), while still catching a genuine leaked component default
// when the flow carries no such grounding (the check must be able to fail).

function flowWithGlossary(glossary) {
  var data = {
    meta: {},
    screens: [
      {
        id: "s1",
        name: "Screen 1",
        template: "studio",
        content: [{ type: "TEXT", content: "Description" }],
      },
    ],
  };
  if (glossary) data.meta._glossary = glossary;
  return data;
}

function placeholderFindings(result) {
  return result.findings.filter(function (f) {
    return f.kind === "placeholder-text";
  });
}

describe("placeholder-text: label-aware (entity properties + sidebar)", function () {
  it("no finding when the text matches an entityProperties label", function () {
    var data = flowWithGlossary({
      entityProperties: [{ name: "description", label: "Description" }],
      chrome: { sidebar: [] },
    });
    var result = validate.validate(data, QUIET);
    assert.strictEqual(placeholderFindings(result).length, 0);
  });

  it("the same flow without the glossary entry still yields a finding (proves the check can fail)", function () {
    var data = flowWithGlossary({
      entityProperties: [],
      chrome: { sidebar: [] },
    });
    var result = validate.validate(data, QUIET);
    var findings = placeholderFindings(result);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].severity, "error");
  });

  it("no finding when the text matches a chrome.sidebar label, case-insensitively", function () {
    var data = flowWithGlossary({
      entityProperties: [],
      chrome: { sidebar: [{ label: "description", id: "description" }] },
    });
    var result = validate.validate(data, QUIET);
    assert.strictEqual(placeholderFindings(result).length, 0);
  });

  it("a flow with no _glossary at all still catches the placeholder (backwards compatible)", function () {
    var data = flowWithGlossary(null);
    var result = validate.validate(data, QUIET);
    assert.strictEqual(placeholderFindings(result).length, 1);
  });

  it("an unrelated placeholder string is unaffected by an unrelated glossary label", function () {
    var data = {
      meta: {
        _glossary: {
          entityProperties: [{ name: "owner", label: "Owner" }],
          chrome: { sidebar: [] },
        },
      },
      screens: [
        {
          id: "s1",
          name: "Screen 1",
          template: "studio",
          content: [{ type: "TEXT", content: "Page Title" }],
        },
      ],
    };
    var result = validate.validate(data, QUIET);
    assert.strictEqual(placeholderFindings(result).length, 1);
  });
});
