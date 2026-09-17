"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var validateSchema = require("../../scripts/validation/validate-schema.js");

var ROOT = path.resolve(__dirname, "..", "..");
var SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-data.schema.json"), "utf8"));
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-one-decision.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function errors(d) {
  return validateSchema(d, SCHEMA).filter(function (e) { return e.indexOf("(warning)") === -1; });
}

describe("proposal-data.schema.json", function () {
  it("accepts the one-decision fixture", function () {
    assert.deepStrictEqual(errors(load()), []);
  });

  it("requires answer, decisions and change at the top level", function () {
    ["answer", "decisions", "change"].forEach(function (key) {
      var d = load();
      delete d[key];
      var e = errors(d);
      assert.ok(e.length > 0, key + " is required");
      assert.ok(e.join(" ").indexOf(key) !== -1, "the error names " + key + ", got: " + e.join(" "));
    });
  });

  // Named for what it checks. The schema does not REJECT the retired keys: it sets no
  // additionalProperties and validate-schema.js does not implement the keyword, so a
  // half-converted file carrying both shapes passes here. Catching that is the validator's
  // job, and Task 5 owns it; this test only pins that the keys are no longer described.
  it("no longer describes the retired top-level keys", function () {
    assert.ok(!SCHEMA.properties.approaches, "approaches is gone");
    assert.ok(!SCHEMA.properties.comparison, "comparison is gone");
    assert.ok(!SCHEMA.properties.recommendation, "recommendation is gone");
    assert.strictEqual(SCHEMA.required.indexOf("approaches"), -1, "approaches is not required");
  });

  it("requires a decision to carry its own question, options, comparison and pick", function () {
    ["question", "options", "comparison", "pick"].forEach(function (key) {
      var d = load();
      delete d.decisions[0][key];
      var e = errors(d);
      assert.ok(e.length > 0, "decisions[0]." + key + " is required, got no error");
    });
  });

  it("requires a pick to carry optionId, reasons and cost", function () {
    ["optionId", "reasons", "cost"].forEach(function (key) {
      var d = load();
      delete d.decisions[0].pick[key];
      assert.ok(errors(d).length > 0, "pick." + key + " is required");
    });
  });

  it("requires every reason to name a criterion", function () {
    var d = load();
    delete d.decisions[0].pick.reasons[0].criterionId;
    assert.ok(errors(d).length > 0, "reasons[].criterionId is required");
  });

  it("bounds decisions to four, which is the number its own description claims", function () {
    var d = load();
    assert.deepStrictEqual(errors(d), [], "the fixture's one decision is fine");
    while (d.decisions.length < 5) d.decisions.push(JSON.parse(JSON.stringify(d.decisions[0])));
    var e = errors(d);
    assert.strictEqual(e.length, 1, "five decisions is one error, got: " + e.join("; "));
    assert.ok(e[0].indexOf("decisions") !== -1 && e[0].indexOf("maximum is 4") !== -1, e[0]);
  });

  // Past four options a reader is weighing a list rather than a choice, and the comparison
  // table under them grows a column per option. The schema is the gate that stops a fifth
  // reaching the renderer, since the assembler throws on any schema error.
  it("bounds a decision's options to four", function () {
    var d = load();
    var opts = d.decisions[0].options;
    assert.deepStrictEqual(errors(d), [], "the fixture's options are fine");
    while (opts.length < 5) {
      var extra = JSON.parse(JSON.stringify(opts[0]));
      extra.id = "filler" + opts.length;
      opts.push(extra);
    }
    var e = errors(d);
    assert.ok(e.some(function (x) { return x.indexOf("options") !== -1 && x.indexOf("maximum is 4") !== -1; }),
      "five options is refused, got: " + e.join("; "));
  });

  it("bounds a decision's criteria to six, the ceiling its description claims", function () {
    var d = load();
    var crit = d.decisions[0].comparison.criteria;
    while (crit.length < 7) crit.push({ id: "filler" + crit.length, label: "Filler", source: "cost" });
    var e = errors(d);
    assert.ok(e.some(function (x) { return x.indexOf("criteria") !== -1 && x.indexOf("maximum is 6") !== -1; }),
      "seven criteria is refused, got: " + e.join("; "));
  });

  it("bounds context.product to six facts and requires it to be an array", function () {
    var d = load();
    assert.ok(Array.isArray(d.context.product), "product is an array in the fixture");
    d.context.product = ["a", "b", "c", "d", "e", "f", "g"];
    assert.ok(errors(d).length > 0, "seven facts is too many");
    var s = load();
    s.context.product = "one paragraph of prose";
    assert.ok(errors(s).length > 0, "a string is the old shape and must not validate");
  });

  it("describes a breadboard place with a grid position and an app", function () {
    var place = SCHEMA.properties.breadboard.properties.places.items;
    assert.deepStrictEqual(place.required, ["id", "name", "app", "affordances"]);
    ["row", "col", "isNew"].forEach(function (k) {
      assert.ok(place.properties[k], "place describes " + k);
    });
  });
});
