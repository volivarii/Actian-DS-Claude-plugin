"use strict";
/**
 * skill-name-rename.test.js: the 2026.9.59 rename (design-proposal to
 * actian-ux-proposal) must not strand data files authored before it. The
 * proposal schemas accept the old meta.skill value and the new one, and reject
 * anything else, so an old proposal-data.json still resumes with --from.
 */
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var validate = require(path.join(ROOT, "scripts", "validation", "validate-schema"));

function load(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}
// Fixtures live in the tests tree, not under the plugin.
function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8"));
}

// Only the errors raised at meta.skill itself: the validator prefixes each
// error with its JSON path, so an unrelated error that mentions "skill" in
// its text cannot count.
function skillErrors(data, schema) {
  return validate(data, schema).filter(function (e) {
    return /^\/meta\/skill:/.test(e);
  });
}

function assertRejected(errors, name) {
  assert.ok(errors.length > 0, name + " is rejected");
  assert.ok(
    errors.every(function (e) {
      return e.indexOf("not in enum") !== -1;
    }),
    name + " is rejected by the enum, not by something else: " + errors.join("; "),
  );
}

describe("meta.skill accepts the name before the rename and the name after it", function () {
  var proposalSchema = load("schemas/proposal-data.schema.json");
  var evaluationSchema = load("schemas/proposal-evaluation.schema.json");

  it("proposal-data: actian-ux-proposal and design-proposal validate, another name does not", function () {
    var data = loadFixture("proposal-dip-i-496.json");
    ["actian-ux-proposal", "design-proposal"].forEach(function (name) {
      data.meta.skill = name;
      assert.deepStrictEqual(skillErrors(data, proposalSchema), [], name);
    });
    data.meta.skill = "propose";
    assertRejected(skillErrors(data, proposalSchema), "propose");
  });

  it("proposal evaluation: both names validate, another name does not", function () {
    var data = loadFixture("proposal-dip-i-496-evaluation.json");
    ["actian-ux-proposal", "design-proposal"].forEach(function (name) {
      data.meta.skill = name;
      assert.deepStrictEqual(skillErrors(data, evaluationSchema), [], name);
    });
    data.meta.skill = "evaluate";
    assertRejected(skillErrors(data, evaluationSchema), "evaluate");
  });

  it("the fixtures carry the new name", function () {
    assert.strictEqual(loadFixture("proposal-dip-i-496.json").meta.skill, "actian-ux-proposal");
  });
});
