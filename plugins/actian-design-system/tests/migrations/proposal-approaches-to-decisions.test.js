"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var validateSchema = require("../../scripts/validation/validate-schema.js");
var mig = require("../../scripts/migrations/proposal-approaches-to-decisions.js");

var ROOT = path.resolve(__dirname, "..", "..");
var SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-data.schema.json"), "utf8"));
function legacy() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-legacy.json"), "utf8"));
}
function target() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-one-decision.json"), "utf8"));
}
function errors(d) {
  return validateSchema(d, SCHEMA).filter(function (e) { return e.indexOf("(warning)") === -1; });
}

describe("proposal-approaches-to-decisions", function () {
  it("recognises the old shape and only the old shape", function () {
    assert.strictEqual(mig.isOldShape(legacy()), true, "a file with approaches is the old shape");
    assert.strictEqual(mig.isOldShape(target()), false, "a file with decisions is not");
    assert.strictEqual(mig.isOldShape({}), false, "an empty object is not");
  });

  it("produces a file the schema accepts", function () {
    assert.deepStrictEqual(errors(mig.convert(legacy())), []);
  });

  it("carries every approach across as an option, in order, byte for byte", function () {
    var out = mig.convert(legacy());
    var old = legacy();
    assert.strictEqual(out.decisions.length, 1, "one decision");
    assert.strictEqual(out.decisions[0].options.length, old.approaches.length);
    out.decisions[0].options.forEach(function (o, i) {
      var a = old.approaches[i];
      ["id", "name", "whatItIs", "breaksWhen", "verdict"].forEach(function (k) {
        assert.strictEqual(o[k], a[k], "option " + i + " " + k);
      });
      assert.deepStrictEqual(o.anchor, a.anchor, "option " + i + " anchor");
      assert.deepStrictEqual(o.screen, a.screen, "option " + i + " screen");
      assert.deepStrictEqual(o.screens, a.screens, "option " + i + " screens");
    });
    assert.deepStrictEqual(out.decisions[0].comparison, old.comparison, "the comparison moves inside");
    assert.strictEqual(out.decisions[0].pick.optionId, old.recommendation.approachId, "the pick keeps its winner");
  });

  it("splits the product paragraph into one fact per sentence", function () {
    var out = mig.convert(legacy());
    assert.ok(Array.isArray(out.context.product), "product is an array");
    assert.ok(out.context.product.length >= 2, "more than one fact");
    out.context.product.forEach(function (f) {
      assert.ok(f.length > 0 && f === f.trim(), "each fact is trimmed and non-empty");
      assert.ok(/[.!?]$/.test(f), "each fact keeps its terminator: " + f);
    });
    assert.strictEqual(out.context.product.join(" "), legacy().context.product, "no text is lost or added");
  });

  it("takes the answer from the first sentence of the old summary", function () {
    var out = mig.convert(legacy());
    assert.ok(legacy().recommendation.summary.indexOf(out.answer) === 0, "the answer opens the old summary");
    assert.ok(/[.!?]$/.test(out.answer), "one whole sentence");
  });

  it("leaves the three judgements empty rather than inventing them", function () {
    var out = mig.convert(legacy());
    assert.strictEqual(out.decisions[0].pick.cost, "", "cost is the author's");
    assert.strictEqual(out.latitude, "", "latitude is the author's");
    out.decisions[0].pick.reasons.forEach(function (r, i) {
      assert.strictEqual(r.criterionId, "", "reason " + i + " names no criterion yet");
      assert.ok(r.text.length > 0, "reason " + i + " keeps its text");
    });
  });

  it("drops the three retired top-level keys", function () {
    var out = mig.convert(legacy());
    ["approaches", "comparison", "recommendation"].forEach(function (k) {
      assert.strictEqual(out[k], undefined, k + " is gone from the top level");
    });
  });

  it("moves recommendation.change to the top level", function () {
    var out = mig.convert(legacy());
    assert.deepStrictEqual(out.change, legacy().recommendation.change);
  });

  it("is idempotent on a file already converted", function () {
    var t = target();
    assert.deepStrictEqual(mig.convert(t), t, "converting a new-shape file returns it unchanged");
  });
});
