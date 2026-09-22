"use strict";
var { describe, it, after } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { spawnSync } = require("node:child_process");
var validateSchema = require("../../plugins/actian-design-system/scripts/validation/validate-schema.js");
var mig = require("../../plugins/actian-design-system/scripts/migrations/proposal-approaches-to-decisions.js");

var ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-data.schema.json"), "utf8"));
var CLI = path.join(ROOT, "scripts", "migrations", "proposal-approaches-to-decisions.js");
var LEGACY = path.join(__dirname, "..", "fixtures", "proposal-dip-i-496-legacy.json");
function legacy() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", "proposal-dip-i-496-legacy.json"), "utf8"));
}
function target() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", "proposal-dip-i-496-one-decision.json"), "utf8"));
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

  // Strengthened from "the three retired keys are absent", which convert() could not fail:
  // it builds its output field by field and never spreads the input, so no plausible typo
  // leaks a key back. Asserting the exact key SET does catch an accidental addition.
  it("emits exactly the top-level keys of the new shape, and no others", function () {
    var out = mig.convert(legacy());
    assert.deepStrictEqual(Object.keys(out).sort(), [
      "answer", "change", "context", "decisions", "latitude", "meta", "openQuestions", "research", "scope",
    ], "an unexpected or missing top-level key");
  });

  // decisions[0].id is load-bearing: the idempotence test above compares a fresh conversion
  // against the committed fixture, and that only holds while both say "the-decision". A
  // reviewer changed this literal and every one of the nine tests still passed.
  it("names the single decision `the-decision`, which the committed fixture also uses", function () {
    assert.strictEqual(mig.convert(legacy()).decisions[0].id, "the-decision");
    assert.strictEqual(target().decisions[0].id, "the-decision", "the fixture agrees");
  });

  it("does not split a sentence at a period that ends an abbreviation", function () {
    function productOf(text) {
      var d = legacy();
      d.context.product = text;
      return mig.convert(d).context.product;
    }
    assert.deepStrictEqual(productOf("See Fig. 2 for the shape."), ["See Fig. 2 for the shape."]);
    assert.deepStrictEqual(productOf("Use a badge, e.g. a pill. It wraps."), ["Use a badge, e.g. a pill.", "It wraps."]);
    assert.deepStrictEqual(productOf("The value is 3.5 today."), ["The value is 3.5 today."]);
    assert.deepStrictEqual(productOf("One fact. Two facts."), ["One fact.", "Two facts."], "a real boundary still splits");
  });

  it("passes an already-array product through instead of gluing it with a comma", function () {
    var d = legacy();
    d.context.product = ["Already an array.", "With two facts."];
    assert.deepStrictEqual(mig.convert(d).context.product, ["Already an array.", "With two facts."]);
  });

  it("moves recommendation.change to the top level", function () {
    var out = mig.convert(legacy());
    assert.deepStrictEqual(out.change, legacy().recommendation.change);
  });

  it("is idempotent on a file already converted", function () {
    var t = target();
    assert.deepStrictEqual(mig.convert(t), t, "converting a new-shape file returns it unchanged");
  });

  // The CLI is the whole point of this script, and nothing above touches it: every test
  // so far calls convert() directly. A write that ran before its own assignment shipped
  // green under exactly that gap, putting the string "undefined" where the document goes.
  // These run the binary.
  describe("the CLI", function () {
    function run(args) {
      return spawnSync(process.execPath, [CLI].concat(args), { encoding: "utf8" });
    }
    // Four directories per run, in the real tmpdir, so they are tracked and removed.
    var made = [];
    function tmp() {
      var dir = fs.mkdtempSync(path.join(os.tmpdir(), "proposal-convert-"));
      made.push(dir);
      return dir;
    }
    after(function () {
      made.forEach(function (dir) { fs.rmSync(dir, { recursive: true, force: true }); });
    });

    it("writes the converted document to -o, not the string undefined", function () {
      var dir = tmp();
      var out = path.join(dir, "converted.json");
      var r = run([LEGACY, "-o", out]);
      assert.strictEqual(r.status, 0, r.stderr);
      var text = fs.readFileSync(out, "utf8");
      assert.notStrictEqual(text.trim(), "undefined", "the file holds a document, not an undefined");
      var data = JSON.parse(text);
      assert.strictEqual(data.decisions.length, 1, "one decision");
      assert.strictEqual(data.decisions[0].options.length, legacy().approaches.length, "every approach became an option");
      assert.ok(/context.product split into \d+ facts/.test(r.stdout), "and it reports the fact count it actually wrote");
    });

    it("converts in place, which is the path that would destroy the input", function () {
      var dir = tmp();
      var file = path.join(dir, "proposal-data.json");
      fs.copyFileSync(LEGACY, file);
      var r = run([file]);
      assert.strictEqual(r.status, 0, r.stderr);
      var data = JSON.parse(fs.readFileSync(file, "utf8"));
      assert.strictEqual(data.decisions.length, 1, "the file that was overwritten is a document");
      assert.ok(!data.approaches, "and no longer the old shape");
    });

    it("refuses to clobber an existing -o and leaves it byte for byte", function () {
      var dir = tmp();
      var out = path.join(dir, "taken.json");
      fs.writeFileSync(out, "{ \"mine\": true }\n");
      var r = run([LEGACY, "-o", out]);
      assert.strictEqual(r.status, 1, "refused");
      assert.match(r.stderr, /already exists/);
      assert.strictEqual(fs.readFileSync(out, "utf8"), "{ \"mine\": true }\n", "untouched");
    });

    it("says so and changes nothing when the file is already converted", function () {
      var dir = tmp();
      var file = path.join(dir, "proposal-data.json");
      var before = JSON.stringify(target(), null, 2);
      fs.writeFileSync(file, before);
      var r = run([file]);
      assert.strictEqual(r.status, 0);
      assert.match(r.stderr, /already in the decisions\[\] shape/);
      assert.strictEqual(fs.readFileSync(file, "utf8"), before, "not rewritten");
    });
  });
});
