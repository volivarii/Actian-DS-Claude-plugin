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
      assert.match(r.stderr, /prepare-flow: wrote .*\.brief\.json \(1 screens, 1 slices\)/);
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

  it("archetype fallback: a screen name matching no app pattern still gets an archetype, chosen by keyword", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [
        { name: "Publish setup", template: "studio" },
        { name: "Published", template: "studio" },
      ],
    });
    assert.strictEqual(brief.screens[0].pattern, null, "no app pattern matches either name");
    assert.strictEqual(brief.screens[1].pattern, null);
    assert.strictEqual(brief.screens[0].archetype.archetype, "form-create");
    assert.ok(brief.screens[0].archetype.skeleton, "form-create archetype carries a skeleton");
    assert.strictEqual(brief.screens[1].archetype.archetype, "detail-view");
    assert.ok(brief.screens[1].archetype.skeleton, "detail-view archetype carries a skeleton");
  });

  it("plain rule names: propertyRules.required and .defaultTrueBooleans both drop the Figma id suffix", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [{ name: "Access request management", template: "studio" }],
    });
    var button = brief.screens[0].propertyRules.button;
    assert.ok(button, "button is one of this screen's components");
    button.required.forEach(function (name) {
      assert.ok(name.indexOf("#") === -1, "required name '" + name + "' must be plain (validator's hasOverride accepts the base name)");
    });
    assert.ok(button.required.indexOf("Label") !== -1);
    button.defaultTrueBooleans.forEach(function (name) {
      assert.ok(name.indexOf("#") === -1, "defaultTrueBooleans name '" + name + "' must be plain too (validator's default-true-boolean-unset now uses the same base-name tolerance as hasOverride)");
    });
    assert.ok(button.defaultTrueBooleans.indexOf("Show leading icon") !== -1);
    assert.strictEqual(button.plain, undefined, "no separate .plain alias — the list itself is plain");
  });

  it("--list-entities prints app-context entity keys, one per line, exit 0", function () {
    var r = spawnSync(process.execPath, [SCRIPT, "--list-entities"], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stderr);
    var lines = r.stdout.trim().split("\n");
    assert.ok(lines.indexOf("data-product") !== -1, "data-product is a known entity");
    var properties = require(path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "resolve-properties.js"));
    assert.deepStrictEqual(lines, properties.listEntities());
  });

  it("sliceBrief: keeps only this screen's pattern, carries index/total/screen", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [
        { name: "Access request management", template: "studio" },
        { name: "Zzzz qqqq", template: "bare" },
      ],
    });
    var slice1 = prepare.sliceBrief(brief, 1);
    assert.strictEqual(slice1.index, 1);
    assert.strictEqual(slice1.total, 2);
    assert.deepStrictEqual(slice1.screen, brief.screens[0]);
    assert.strictEqual(slice1.glossary.patterns.length, 1);
    assert.strictEqual(slice1.glossary.patterns[0].slug, "access-request-management");
    assert.strictEqual(slice1.app, brief.app);
    assert.strictEqual(slice1.entity, brief.entity);
    assert.deepStrictEqual(slice1.labels, brief.labels);
    assert.deepStrictEqual(slice1.join, brief.join);

    var slice2 = prepare.sliceBrief(brief, 2);
    assert.strictEqual(slice2.index, 2);
    assert.strictEqual(slice2.total, 2);
    assert.deepStrictEqual(slice2.screen, brief.screens[1]);
    assert.deepStrictEqual(slice2.glossary.patterns, [], "unmatched screen carries no patterns");
  });

  it("CLI writes N slices beside -o, one per screen, and removes stale slices from a prior run", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "prep-slices-"));
    try {
      var list = path.join(dir, "screen-list.json");
      fs.writeFileSync(list, JSON.stringify({
        screens: [
          { name: "Data products", template: "studio" },
          { name: "Data product detail", template: "studio" },
        ],
      }));
      var out = path.join(dir, ".brief.json");
      var briefDir = path.join(dir, ".brief");
      fs.mkdirSync(briefDir, { recursive: true });
      fs.writeFileSync(path.join(briefDir, "stale.json"), "{}");
      var r = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--entity", "data-product", "--screen-list", list, "-o", out], { encoding: "utf8" });
      assert.strictEqual(r.status, 0, r.stderr);
      assert.match(r.stderr, /prepare-flow: wrote .*\.brief\.json \(2 screens, 2 slices\)/);
      var files = fs.readdirSync(briefDir).sort();
      assert.deepStrictEqual(files, ["1.json", "2.json"], "stale slice removed, exactly one slice per screen");
      var slice1 = JSON.parse(fs.readFileSync(path.join(briefDir, "1.json"), "utf8"));
      assert.strictEqual(slice1.index, 1);
      assert.strictEqual(slice1.total, 2);
      assert.strictEqual(slice1.screen.name, "Data products");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("stdout mode (-o omitted) writes no .brief slices", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "prep-noout-"));
    try {
      var list = path.join(dir, "screen-list.json");
      fs.writeFileSync(list, JSON.stringify({ screens: [{ name: "Data products", template: "studio" }] }));
      var r = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--screen-list", list], { encoding: "utf8" });
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(!fs.existsSync(path.join(dir, ".brief")), "no .brief dir created in stdout mode");
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
