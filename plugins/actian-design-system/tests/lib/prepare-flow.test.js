#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var spawnSync = require("child_process").spawnSync;

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var SCRIPT = path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "prepare-flow.js");
var prepare = require(SCRIPT);

describe("prepare-flow (brief per flow)", function () {
  it("joins chrome, patterns, entity data and labels for studio + data-product", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [
        { name: "Data products", template: "studio" },
        { name: "Data product detail", template: "studio" },
      ],
    });
    assert.strictEqual(brief.app, "studio");
    assert.strictEqual(brief.entity, "data-product");
    assert.ok(Array.isArray(brief.glossary.chrome.sidebar) && brief.glossary.chrome.sidebar.length > 0);
    assert.ok(brief.glossary.patterns.length > 0);
    assert.ok(brief.glossary.entityProperties.length > 0);
    assert.ok(brief.glossary.relationships.length > 0);
    brief.glossary.chrome.sidebar.forEach(function (item) {
      assert.ok(brief.labels.indexOf(item.label) !== -1, "sidebar label " + item.label + " is a known label");
    });
    brief.glossary.entityProperties.forEach(function (p) {
      assert.ok(brief.labels.indexOf(p.label) !== -1, "property label " + p.label + " is a known label");
    });
    assert.strictEqual(brief.screens.length, 2);
    assert.strictEqual(brief.screens[0].name, "Data products");
    assert.strictEqual(brief.screens[0].template, "studio");
  });

  it("picks a pattern by name overlap and carries its recipe, components and property rules", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [{ name: "Access request management", template: "studio" }],
    });
    var s = brief.screens[0];
    assert.strictEqual(s.pattern.slug, "access-request-management");
    assert.ok(Array.isArray(s.components) && s.components.length > 0);
    Object.keys(s.propertyRules).forEach(function (slug) {
      assert.ok(Array.isArray(s.propertyRules[slug].required));
      assert.ok(Array.isArray(s.propertyRules[slug].defaultTrueBooleans));
    });
    assert.ok(s.archetype === null || typeof s.archetype.archetype === "string");
  });

  it("carries the page recipe when the substrate captured that pattern for the app", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Faceted browse", template: "studio" }],
    });
    var s = brief.screens[0];
    assert.strictEqual(s.pattern.slug, "faceted-browse");
    assert.ok(s.pageRecipe && s.pageRecipe.slug === "faceted-browse", "faceted-browse is a captured Studio page");
    assert.ok(s.pageRecipe.skeleton && Array.isArray(s.pageRecipe.skeleton.content));
    assert.ok(Array.isArray(s.pageRecipe.renderNotes));
  });

  it("gives null pattern, null recipe and empty rules to a screen nothing matches", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Zzzz qqqq", template: "bare" }],
    });
    var s = brief.screens[0];
    assert.strictEqual(s.pattern, null);
    assert.strictEqual(s.pageRecipe, null);
    assert.deepStrictEqual(s.components, []);
    assert.deepStrictEqual(s.propertyRules, {});
  });

  it("works without an entity: empty entity arrays, labels from chrome only", function () {
    var brief = prepare.prepareFlow({ app: "explorer", screens: [{ name: "Home", template: "explorer" }] });
    assert.strictEqual(brief.entity, null);
    assert.deepStrictEqual(brief.glossary.entityProperties, []);
    assert.deepStrictEqual(brief.glossary.relationships, []);
    assert.strictEqual(brief.join, null);
  });

  it("CLI: --screen-list in, -o out, usage on missing flags, stdout when no -o", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "prep-"));
    try {
      var list = path.join(dir, "screen-list.json");
      fs.writeFileSync(list, JSON.stringify({ screens: [{ name: "Data products", template: "studio" }] }));
      var out = path.join(dir, ".brief.json");
      var r = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--entity", "data-product", "--screen-list", list, "-o", out], { encoding: "utf8" });
      assert.strictEqual(r.status, 0, r.stderr);
      assert.match(r.stderr, /prepare-flow: wrote .*\.brief\.json \(1 screens\)/);
      var brief = JSON.parse(fs.readFileSync(out, "utf8"));
      assert.strictEqual(brief.screens.length, 1);

      var r2 = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--screen-list", list], { encoding: "utf8" });
      assert.strictEqual(r2.status, 0);
      assert.strictEqual(JSON.parse(r2.stdout).app, "studio");

      var r3 = spawnSync(process.execPath, [SCRIPT, "--app", "studio"], { encoding: "utf8" });
      assert.strictEqual(r3.status, 1);
      assert.match(r3.stderr, /^usage: prepare-flow\.js/);

      var r4 = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--screen-list", path.join(dir, "missing.json")], { encoding: "utf8" });
      assert.strictEqual(r4.status, 1);
      assert.match(r4.stderr, /prepare-flow: cannot read/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("component-property-rules inspectSlugs", function () {
  it("returns the --inspect --json shape for FM and DS slugs", function () {
    var rules = require(path.join(PLUGIN_ROOT, "scripts", "validation", "component-property-rules.js"));
    var r = rules.inspectSlugs(["button", "fmButton"]);
    assert.ok(Array.isArray(r.button.required) && r.button.required.length > 0);
    assert.ok(Array.isArray(r.fmButton.defaultTrueBooleans));
  });
});
