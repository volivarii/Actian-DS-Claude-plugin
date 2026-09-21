"use strict";
/**
 * skill-name-rename.test.js: the 2026.9.59 rename (generate-flow to
 * actian-ux-prototype, design-proposal to actian-ux-proposal) must not strand
 * data files authored before it. The schemas accept the old meta.skill values
 * and the new ones, and reject anything else, so an old flow-data.json still
 * refines and an old proposal-data.json still resumes with --from.
 */
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var ROOT = path.resolve(__dirname, "..", "..");
var validate = require(path.join(ROOT, "scripts", "validation", "validate-schema"));

function load(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function skillErrors(data, schema) {
  return validate(data, schema).filter(function (e) {
    return /skill/.test(e);
  });
}

describe("meta.skill accepts the name before the rename and the name after it", function () {
  var flowSchema = load("schemas/flow-data.schema.json");
  var proposalSchema = load("schemas/proposal-data.schema.json");
  var evaluationSchema = load("schemas/proposal-evaluation.schema.json");

  it("flow-data: actian-ux-prototype and generate-flow validate, another name does not", function () {
    var data = load("examples/flow-data-example.json");
    ["actian-ux-prototype", "generate-flow"].forEach(function (name) {
      data.meta.skill = name;
      assert.deepStrictEqual(skillErrors(data, flowSchema), [], name);
    });
    data.meta.skill = "make-flow";
    assert.ok(skillErrors(data, flowSchema).length > 0, "an unknown skill name is rejected");
  });

  it("proposal-data: actian-ux-proposal and design-proposal validate, another name does not", function () {
    var data = load("tests/fixtures/proposal-dip-i-496.json");
    ["actian-ux-proposal", "design-proposal"].forEach(function (name) {
      data.meta.skill = name;
      assert.deepStrictEqual(skillErrors(data, proposalSchema), [], name);
    });
    data.meta.skill = "propose";
    assert.ok(skillErrors(data, proposalSchema).length > 0, "an unknown skill name is rejected");
  });

  it("proposal evaluation: both names validate", function () {
    var data = load("tests/fixtures/proposal-dip-i-496-evaluation.json");
    ["actian-ux-proposal", "design-proposal"].forEach(function (name) {
      data.meta.skill = name;
      assert.deepStrictEqual(skillErrors(data, evaluationSchema), [], name);
    });
  });

  it("the example and the fixtures carry the new name", function () {
    assert.strictEqual(load("examples/flow-data-example.json").meta.skill, "actian-ux-prototype");
    assert.strictEqual(load("tests/fixtures/proposal-dip-i-496.json").meta.skill, "actian-ux-proposal");
  });
});
