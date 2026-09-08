#!/usr/bin/env node
"use strict";

/**
 * generate-flow-gates-text.test.js — The "Frame by use case (S2)" paragraph
 * must not add a fourth, default-less question ("if still ambiguous, ask in
 * one short line"): when neither use-case keyword list matches, the skill
 * takes useCases[0] and names it in the announcement instead of stopping to
 * ask. The "Announce the app (S2)" line must add the "(inferred ...)"
 * parenthesis only when the app was actually inferred, never when the prompt
 * named it outright.
 * Run: node --test tests/integration/generate-flow-gates-text.test.js
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

describe("generate-flow gates text (use-case default, conditional app inference)", function () {
  var skill = fs.readFileSync(path.join(PLUGIN_ROOT, "skills/generate-flow/SKILL.md"), "utf8");

  it("the use-case choice has a default instead of a fourth question", function () {
    assert.doesNotMatch(skill, /ask in one short line/);
    assert.match(skill, /useCases\[0\]/);
  });

  it("the app announcement is conditional on inference", function () {
    assert.match(skill, /only when the app was inferred/);
  });
});
