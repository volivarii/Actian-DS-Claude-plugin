"use strict";
/**
 * doc-counts-recipes.test.js: the recipe count in scripts/lib/doc-counts.js is
 * derived from the recipe kinds a live skills/<name>/SKILL.md names a path
 * under, and a total of zero throws instead of reaching the docs. Both halves
 * are proven here on a throwaway plugin root, because the fixer
 * (scripts/vendor/sync-doc-counts.js) runs before the guard in the nightly
 * vendor workflow and would otherwise write "0 recipes" into README.md and
 * marketplace.json.
 */
var { describe, it, before, after } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var counts = require("../../scripts/lib/doc-counts.js");

function makeRoot(skillText, recipeFiles) {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), "doc-counts-recipes-"));
  fs.mkdirSync(path.join(root, "skills", "one"), { recursive: true });
  fs.writeFileSync(path.join(root, "skills", "one", "SKILL.md"), skillText);
  if (recipeFiles) {
    fs.mkdirSync(path.join(root, "recipes", "flow"), { recursive: true });
    recipeFiles.forEach(function (f) {
      fs.writeFileSync(path.join(root, "recipes", "flow", f), "{}");
    });
  }
  return root;
}

describe("the recipe count derives from what a live skill names", function () {
  var roots = [];
  after(function () {
    roots.forEach(function (r) {
      fs.rmSync(r, { recursive: true, force: true });
    });
  });

  it("counts the recipe files of a named kind, minus its index", function () {
    var root = makeRoot("- `recipes/flow/_index.json` is the catalog\n", [
      "_index.json",
      "a.json",
      "b.json",
    ]);
    roots.push(root);
    assert.deepStrictEqual(counts.liveRecipeKinds(root), ["flow"]);
    assert.strictEqual(counts.deriveRecipes(root), 2);
  });

  it("names a kind from a file path under it, not only from its index", function () {
    var root = makeRoot("read `recipes/flow/<file>` per card\n", [
      "_index.json",
      "a.json",
    ]);
    roots.push(root);
    assert.deepStrictEqual(counts.liveRecipeKinds(root), ["flow"]);
    assert.strictEqual(counts.deriveRecipes(root), 1);
  });

  it("throws when no live skill names a kind, even with recipes on disk", function () {
    var root = makeRoot("the recipe catalog lives under recipes\n", [
      "_index.json",
      "a.json",
    ]);
    roots.push(root);
    assert.deepStrictEqual(counts.liveRecipeKinds(root), []);
    assert.throws(function () {
      counts.deriveRecipes(root);
    }, /derived to 0 \(live kinds named: none\)/);
  });

  it("throws when the named kind has no directory or no recipe files", function () {
    var missing = makeRoot("- `recipes/flow/_index.json`\n", null);
    roots.push(missing);
    assert.throws(function () {
      counts.deriveRecipes(missing);
    }, /derived to 0 \(live kinds named: flow\)/);
    var empty = makeRoot("- `recipes/flow/_index.json`\n", ["_index.json"]);
    roots.push(empty);
    assert.throws(function () {
      counts.deriveRecipes(empty);
    }, /derived to 0 \(live kinds named: flow\)/);
  });

  it("derives 12 on the real plugin today, from the flow kind alone", function () {
    assert.deepStrictEqual(counts.liveRecipeKinds(), ["flow"]);
    assert.strictEqual(counts.deriveRecipes(), 12);
  });
});
