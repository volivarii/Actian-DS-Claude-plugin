"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SCHEMA = path.resolve(__dirname, "../../schemas/flow-data.schema.json");

describe("flow-data.schema.json status field", function () {
  var schema = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));
  var screenProps = schema.properties.screens.items.properties;

  it("declares a status enum of pending|ready on screen items", function () {
    assert.ok(screenProps.status, "screens.items.properties.status must exist");
    assert.equal(screenProps.status.type, "string");
    assert.deepEqual(screenProps.status.enum, ["pending", "ready"]);
  });
});
