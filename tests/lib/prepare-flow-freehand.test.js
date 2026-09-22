#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var SCRIPT = path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "prepare-flow.js");
var prepare = require(SCRIPT);

describe("prepare-flow: layout: \"freehand\" (Task 6.5)", function () {
  it("skips recipe snapping for a screen carrying layout: freehand", function () {
    var brief = prepare.prepareFlow({
      app: "Studio",
      screens: [{ name: "Three-pane catalog", template: "studio", layout: "freehand" }],
    });
    var s = brief.screens[0];
    assert.strictEqual(s.archetype, null, "a freehand screen carries no archetype");
    assert.strictEqual(s.pageRecipe, null, "a freehand screen carries no pageRecipe");
    assert.strictEqual(s.layout, "freehand");
  });

  it("leaves a screen with no layout field on the normal recipe-snapping path", function () {
    var brief = prepare.prepareFlow({
      app: "Studio",
      screens: [{ name: "Data products", template: "studio" }],
    });
    var s = brief.screens[0];
    assert.notStrictEqual(s.archetype, null, "a non-freehand screen still gets an archetype");
    assert.strictEqual(s.layout, undefined);
  });
});
