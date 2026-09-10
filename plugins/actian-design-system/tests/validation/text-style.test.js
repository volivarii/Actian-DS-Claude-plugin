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

function flowWithTextNode(font, color) {
  var node = { type: "TEXT", content: "Product overview" };
  if (font !== undefined) node.font = font;
  if (color !== undefined) node.color = color;
  return {
    meta: {},
    screens: [
      { id: "s1", name: "Screen 1", template: "studio", content: [node] },
    ],
  };
}

function textStyleFindings(result) {
  return result.findings.filter(function (f) {
    return f.kind === "text-style";
  });
}

describe("text-style finding: TEXT font/color shape", function () {
  it("an object-form font and an invalid color keyword yield two text-style findings", function () {
    var data = flowWithTextNode({ weight: "semibold" }, "muted");
    var result = validate.validate(data, QUIET);
    var findings = textStyleFindings(result);
    assert.strictEqual(findings.length, 2, JSON.stringify(findings, null, 2));
    findings.forEach(function (f) {
      assert.strictEqual(f.severity, "warning");
    });
  });

  it("the same nodes with a well-formed font string and a var(--zen-*) color yield none (proves the check can pass, not just fail)", function () {
    var data = flowWithTextNode("Inter:Semi Bold", "var(--zen-color-text-primary)");
    var result = validate.validate(data, QUIET);
    assert.strictEqual(textStyleFindings(result).length, 0);
  });

  it("a hex color is accepted (not flagged as an invalid color shape)", function () {
    var data = flowWithTextNode("Inter:Regular", "#1A1A1A");
    var result = validate.validate(data, QUIET);
    assert.strictEqual(textStyleFindings(result).length, 0);
  });

  it("a CSS colour keyword findHardcodedColorsRaw already treats as fine (transparent) is accepted too", function () {
    var data = flowWithTextNode("Inter:Regular", "transparent");
    var result = validate.validate(data, QUIET);
    assert.strictEqual(textStyleFindings(result).length, 0);
  });

  it("an object-form font alone (valid color) yields exactly one finding naming font", function () {
    var data = flowWithTextNode({ weight: "bold" }, "var(--zen-color-text-primary)");
    var result = validate.validate(data, QUIET);
    var findings = textStyleFindings(result);
    assert.strictEqual(findings.length, 1);
    assert.match(findings[0].message, /"font":\{"weight":"bold"\}/);
  });

  it("an invalid color alone (valid font string) yields exactly one finding naming color", function () {
    var data = flowWithTextNode("Inter:Regular", "muted");
    var result = validate.validate(data, QUIET);
    var findings = textStyleFindings(result);
    assert.strictEqual(findings.length, 1);
    assert.match(findings[0].message, /"color":"muted"/);
  });

  it("text-style is registered as CLI-visible", function () {
    var cliText = require("fs").readFileSync(
      path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
      "utf8",
    );
    var m = /CLI_VISIBLE_KINDS = \{([\s\S]*?)\};/.exec(cliText);
    assert.ok(m, "CLI_VISIBLE_KINDS block found");
    assert.match(m[1], /"text-style":\s*true/);
  });

  it("text-style is NOT a HARD_KINDS entry (non-blocking)", function () {
    var cliText = require("fs").readFileSync(
      path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
      "utf8",
    );
    var m = /var HARD_KINDS = \[([\s\S]*?)\];/.exec(cliText);
    assert.ok(m, "HARD_KINDS block found");
    assert.doesNotMatch(m[1], /"text-style"/);
  });
});
