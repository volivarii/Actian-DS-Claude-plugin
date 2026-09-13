"use strict";
/**
 * The repo convention is that every schema property carries both a description and an
 * examples array, so an authoring agent reads the examples rather than the renderer.
 * Nothing enforced it: this gate does, for proposal-data.schema.json.
 *
 * Scoped deliberately. The other three schemas violate the convention 370 times between
 * them, which is real debt but is not this branch's to pay, and a repo-wide gate that
 * fails on day one teaches everyone to skip it.
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

function walk(node, where, missing) {
  if (!node || typeof node !== "object") return;
  if (node.properties) {
    Object.keys(node.properties).forEach(function (key) {
      var prop = node.properties[key];
      var at = where + "." + key;
      if (!prop.description) missing.push(at + ": no description");
      if (prop.examples === undefined && !isContainer(prop)) missing.push(at + ": no examples");
      walk(prop, at, missing);
    });
  }
  if (node.items) walk(node.items, where + "[]", missing);
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

  it("still demands examples from a leaf inside a container", function () {
    var mutated = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
    delete mutated.properties.decisions.items.properties.id.examples;
    var missing = [];
    walk(mutated, "", missing);
    assert.deepStrictEqual(missing, [".decisions[].id: no examples"], "a container is not a blanket exemption");
  });
});
