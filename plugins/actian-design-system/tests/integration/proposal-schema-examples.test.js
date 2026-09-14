"use strict";
/**
 * The repo convention is that every schema property carries both a description and an
 * examples array, so an authoring agent reads the examples rather than the renderer.
 * Nothing enforced it: this gate does, for proposal-data.schema.json.
 *
 * Scoped deliberately. Measured 2026-09-14 under the rule below, the other three schemas
 * are 373 violations short between them (brief-data 235, flow-data 103, slide-data 35),
 * which is real debt but is not this branch's to pay, and a repo-wide gate that fails on
 * day one teaches everyone to skip it. The figure is dated because it is a measurement,
 * not a property: widening the rule moves it, and it already did once. An earlier draft
 * of this comment carried the count from before the items check existed.
 *
 * Known and currently latent: walk() visits a properties map and an items schema, which is
 * every way this file nests. A schema using $defs, $ref, oneOf, anyOf, allOf or
 * patternProperties would have subtrees it never reaches. proposal-data.schema.json uses
 * none of them; a future one that does needs walk() widened before this gate means
 * anything for it.
 */
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var SCHEMA = path.join(__dirname, "..", "..", "schemas", "proposal-data.schema.json");

// A container describes itself through its children, so asking it for its own examples
// would duplicate them: an object with properties, or an array whose items carry theirs.
function isContainer(node) {
  if (node.type === "object" && node.properties) return true;
  return node.type === "array" && !!node.items;
}

function check(node, at, missing) {
  if (!node.description) missing.push(at + ": no description");
  if (node.examples === undefined && !isContainer(node)) missing.push(at + ": no examples");
}

// Descends both ways a schema nests: a properties map, and an items schema. The items
// schema is checked as well as descended into. It used to be only descended into, which
// granted the array exemption on a premise ("its items carry theirs") that nothing
// verified: every array of scalars in the file was unchecked.
function walk(node, where, missing) {
  if (!node || typeof node !== "object") return;
  if (node.properties) {
    Object.keys(node.properties).forEach(function (key) {
      var prop = node.properties[key];
      var at = where + "." + key;
      check(prop, at, missing);
      walk(prop, at, missing);
    });
  }
  if (node.items) {
    check(node.items, where + "[]", missing);
    walk(node.items, where + "[]", missing);
  }
}

describe("proposal-data.schema.json authoring convention", function () {
  var schema = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));

  it("gives every property a description and an examples array", function () {
    var missing = [];
    walk(schema, "", missing);
    assert.deepStrictEqual(missing, [], missing.length + " properties short of the convention");
  });

  it("can fail: a property stripped of its examples is reported", function () {
    var mutated = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
    delete mutated.properties.answer.examples;
    var missing = [];
    walk(mutated, "", missing);
    assert.deepStrictEqual(missing, [".answer: no examples"], "the gate names the one stripped property");
  });

  it("does not demand examples on a container that describes itself through its children", function () {
    var missing = [];
    walk(schema, "", missing);
    assert.strictEqual(schema.properties.meta.examples, undefined, "meta is an object container");
    assert.ok(missing.indexOf(".meta: no examples") === -1, "and the gate does not ask for them");
    assert.strictEqual(schema.properties.decisions.examples, undefined, "decisions is an array container");
    assert.ok(missing.indexOf(".decisions: no examples") === -1, "nor from an array whose items carry them");
    assert.ok(schema.properties.decisions.items.properties.id.examples, "its items do carry them");
  });

  it("still demands examples from a leaf reached through a properties map", function () {
    var mutated = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
    delete mutated.properties.decisions.items.properties.id.examples;
    var missing = [];
    walk(mutated, "", missing);
    assert.deepStrictEqual(missing, [".decisions[].id: no examples"], "a container is not a blanket exemption");
  });

  // The array exemption is granted because the items schema carries the examples. That
  // premise has to be checked, or the exemption is unconditional: these are the cases
  // that used to return an empty list while the examples they were exempted for were gone.
  it("still demands examples from an items schema, which is what the array exemption rests on", function () {
    [
      ["meta", "apps"],
      ["context", "product"],
      ["context", "sources"],
      ["scope", "goals"],
      ["scope", "nonGoals"],
    ].forEach(function (pair) {
      var mutated = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
      delete mutated.properties[pair[0]].properties[pair[1]].items.examples;
      var missing = [];
      walk(mutated, "", missing);
      assert.deepStrictEqual(missing, ["." + pair[0] + "." + pair[1] + "[]: no examples"],
        pair.join(".") + " items stripped of examples is reported");
    });
  });

  it("still demands a description from an items schema", function () {
    var mutated = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
    delete mutated.properties.decisions.items.description;
    var missing = [];
    walk(mutated, "", missing);
    assert.deepStrictEqual(missing, [".decisions[]: no description"], "an object items schema is described too");
  });
});
