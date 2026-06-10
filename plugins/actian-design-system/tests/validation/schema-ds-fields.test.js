"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SCHEMA = path.resolve(__dirname, "../../schemas/flow-data.schema.json");

describe("flow-data.schema.json DS-node contract", function () {
  var schema = JSON.parse(fs.readFileSync(SCHEMA, "utf8"));

  // -------------------------------------------------------------------------
  // contentNode DS fields (render-node.js:348 reads node.library + node.dsSlug)
  // -------------------------------------------------------------------------
  it("contentNode declares library enum [ds]", function () {
    var cn = schema.$defs.contentNode.properties;
    assert.ok(cn.library, "contentNode.properties.library must exist");
    assert.deepStrictEqual(
      cn.library.enum,
      ["ds"],
      "library.enum must be [\"ds\"]",
    );
  });

  it("contentNode declares dsSlug as string", function () {
    var cn = schema.$defs.contentNode.properties;
    assert.ok(cn.dsSlug, "contentNode.properties.dsSlug must exist");
    assert.strictEqual(cn.dsSlug.type, "string");
  });

  // -------------------------------------------------------------------------
  // screens.items DS field (flow-renderer.js:405 reads s.library === "ds")
  // -------------------------------------------------------------------------
  it("screens.items declares library enum [ds]", function () {
    var screenProps = schema.properties.screens.items.properties;
    assert.ok(screenProps.library, "screens.items.properties.library must exist");
    assert.deepStrictEqual(
      screenProps.library.enum,
      ["ds"],
      "screens library.enum must be [\"ds\"]",
    );
  });

  // -------------------------------------------------------------------------
  // meta DS fields — library signal + hifi mode
  // -------------------------------------------------------------------------
  it("meta declares library enum [ds]", function () {
    var metaProps = schema.properties.meta.properties;
    assert.ok(metaProps.library, "meta.properties.library must exist");
    assert.deepStrictEqual(
      metaProps.library.enum,
      ["ds"],
      "meta library.enum must be [\"ds\"]",
    );
  });

  it("meta.mode enum includes hifi", function () {
    var metaProps = schema.properties.meta.properties;
    assert.ok(Array.isArray(metaProps.mode.enum), "meta.mode.enum must be an array");
    assert.ok(
      metaProps.mode.enum.includes("hifi"),
      "meta.mode.enum must include \"hifi\"",
    );
  });

  // -------------------------------------------------------------------------
  // Drift repairs — navItems rich shape
  // (flow-renderer.js:143 reads Array.isArray(config.items) with {label,state})
  // -------------------------------------------------------------------------
  it("navItems allows array shape (rich nav items) via oneOf", function () {
    var screenProps = schema.properties.screens.items.properties;
    assert.ok(
      Array.isArray(screenProps.navItems.oneOf),
      "navItems must declare oneOf to allow array + number shapes",
    );
    var hasArrayBranch = screenProps.navItems.oneOf.some(function (branch) {
      return branch.type === "array";
    });
    assert.ok(hasArrayBranch, "navItems.oneOf must include an array branch");
  });

  // -------------------------------------------------------------------------
  // Drift repairs — pageHeader.actions rich shape
  // (flow-renderer.js:190 reads string | {label,variant})
  // -------------------------------------------------------------------------
  it("pageHeader.actions items allow string or {label,variant} via oneOf", function () {
    var screenProps = schema.properties.screens.items.properties;
    var actionsItems = screenProps.pageHeader.properties.actions.items;
    assert.ok(
      Array.isArray(actionsItems.oneOf),
      "pageHeader.actions items must declare oneOf",
    );
    var hasStringBranch = actionsItems.oneOf.some(function (b) {
      return b.type === "string";
    });
    var hasObjectBranch = actionsItems.oneOf.some(function (b) {
      return b.type === "object";
    });
    assert.ok(hasStringBranch, "actions items.oneOf must include a string branch");
    assert.ok(hasObjectBranch, "actions items.oneOf must include an object branch");
  });

  // -------------------------------------------------------------------------
  // Drift repairs — contentNode renderer-read fields
  // (render-node.js:217 clipsContent, :249 textCase, :293 textAlign, :259 text)
  // -------------------------------------------------------------------------
  it("contentNode declares clipsContent as boolean", function () {
    var cn = schema.$defs.contentNode.properties;
    assert.ok(cn.clipsContent, "contentNode.properties.clipsContent must exist");
    assert.strictEqual(cn.clipsContent.type, "boolean");
  });

  it("contentNode declares textCase as string", function () {
    var cn = schema.$defs.contentNode.properties;
    assert.ok(cn.textCase, "contentNode.properties.textCase must exist");
    assert.strictEqual(cn.textCase.type, "string");
  });

  it("contentNode declares textAlign as object", function () {
    var cn = schema.$defs.contentNode.properties;
    assert.ok(cn.textAlign, "contentNode.properties.textAlign must exist");
    assert.strictEqual(cn.textAlign.type, "object");
  });

  it("contentNode declares text as string (fallback for node.content)", function () {
    var cn = schema.$defs.contentNode.properties;
    assert.ok(cn.text, "contentNode.properties.text must exist");
    assert.strictEqual(cn.text.type, "string");
  });
});
