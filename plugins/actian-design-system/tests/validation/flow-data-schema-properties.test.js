#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var fs = require("fs");
var validateSchema = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-schema.js"),
);
var SCHEMA = JSON.parse(
  fs.readFileSync(
    path.join(PLUGIN_ROOT, "schemas", "flow-data.schema.json"),
    "utf8",
  ),
);

function flowWithEntityProperties(entityProperties) {
  return {
    meta: {
      feature: "t",
      app: "Studio",
      library: "ds",
      _glossary: { app: "Studio", entity: "Data product", entityProperties: entityProperties },
    },
    screens: [{ id: "s1", name: "S1", template: "studio", content: [] }],
  };
}

// Schema errors scoped to the entityProperties path (ignore unrelated paths).
function entityPropErrors(entityProperties) {
  return validateSchema(flowWithEntityProperties(entityProperties), SCHEMA).filter(
    function (e) {
      return e.indexOf("entityProperties") !== -1;
    },
  );
}

describe("flow-data schema: _glossary.entityProperties shape (S3b)", function () {
  it("accepts the legacy string array (back-compat)", function () {
    assert.strictEqual(entityPropErrors(["name", "status"]).length, 0);
  });

  it("accepts the typed object array", function () {
    var props = [
      "name",
      { name: "status", label: "Status", type: "enum", states: ["Draft", "Published"] },
      { name: "kind", type: "string", example: "DataProduct" },
    ];
    assert.strictEqual(entityPropErrors(props).length, 0);
  });

  it("rejects an object item missing the required `name`", function () {
    var errs = entityPropErrors([{ label: "Status", type: "enum" }]);
    assert.ok(
      errs.some(function (e) {
        return e.indexOf('missing required field "name"') !== -1;
      }),
      "object without `name` should produce a missing-required error",
    );
  });
});
