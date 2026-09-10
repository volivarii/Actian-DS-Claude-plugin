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
    // The screen name equals access-request-management's label verbatim, so
    // the exact-label first pass in pickPattern wins outright, even though
    // access-request-workflow's authored "request" tag would otherwise
    // outscore it under the tag/label weighting.
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

  it("archetype fallback also applies when a pattern matched by name but the recipe ranker found nothing usable", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Activity timeline", template: "studio" }],
    });
    var s = brief.screens[0];
    assert.ok(s.pattern, "\"Activity timeline\" matches a Studio pattern by name");
    assert.ok(s.archetype, "the fallback still applies even though a pattern matched");
    assert.ok(typeof s.archetype.archetype === "string" && s.archetype.archetype.length > 0);
    assert.ok(s.archetype.skeleton, "fallback archetype carries a skeleton");
  });

  it("fallback keyword table: \"confirm\" now falls under detail-view, split out of the form-composition bucket", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Confirm publishing", template: "studio" }],
    });
    var s = brief.screens[0];
    assert.strictEqual(s.pattern, null, "no app pattern matches this name");
    assert.strictEqual(s.archetype.archetype, "detail-view");
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

describe("entity-aware routing (Task 13): a screen named after the entity reaches its own collection or detail pattern", function () {
  var patternsResolver = require(path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "resolve-patterns.js"));

  it("with entity data-product: collection, both detail spellings, and a name that is not just the entity's words", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [
        { name: "Data products", template: "studio" },
        { name: "Data product details", template: "studio" },
        { name: "Data product overview", template: "studio" },
        { name: "Data product published", template: "studio" },
        { name: "Readiness check", template: "studio" },
        { name: "Confirm publication", template: "studio" },
      ],
    });
    var byName = {};
    brief.screens.forEach(function (s) {
      byName[s.name] = s;
    });

    // Collection: "Data products" is the entity's own name with nothing left
    // over once the entity's words are subtracted, so it picks the first
    // entityPatterns entry tagged browse, list or search. Assert the RULE,
    // not a slug that could move if the vendored substrate re-authors tags
    // -- but print the slug so a failure shows what it actually picked.
    var collection = byName["Data products"];
    console.log("Data products -> pattern:", collection.pattern && collection.pattern.slug);
    assert.ok(collection.pattern, "\"Data products\" matches an entity pattern");
    var collectionTags = patternsResolver.patternTags(collection.pattern, collection.pattern.slug);
    assert.ok(
      collectionTags.indexOf("browse") !== -1 || collectionTags.indexOf("list") !== -1 || collectionTags.indexOf("search") !== -1,
      "the matched pattern's tags carry browse, list or search: " + JSON.stringify(collectionTags),
    );
    assert.ok(collection.pageRecipe, "the collection screen carries a page recipe");

    // Detail: two spellings of "the entity's detail page" land on the same
    // pattern, on the vendored data.
    ["Data product details", "Data product overview"].forEach(function (name) {
      var s = byName[name];
      assert.strictEqual(s.pattern && s.pattern.slug, "asset-detail-360", name + " routes to the entity's detail pattern");
      assert.strictEqual(s.pageRecipe && s.pageRecipe.slug, "asset-detail-360", name + " carries the detail page recipe");
    });

    // "Data product published" is neither the collection nor the detail page
    // (R = ["published"], not empty and not a DETAIL_WORDS subset): entity
    // routing does not apply, it falls through to the exact-label pass and
    // the scoring, matches no pattern, and lands on detail-view -- the
    // fallback keyword table's default, not the old raw-token ranker
    // matching "data".
    var published = byName["Data product published"];
    assert.strictEqual(published.pattern, null);
    assert.strictEqual(published.archetype.archetype, "detail-view");

    // Unaffected by entity-aware routing: neither name is just the entity's
    // own words, so both fall through exactly as before.
    assert.strictEqual(byName["Readiness check"].archetype.archetype, "detail-view");
    assert.strictEqual(byName["Confirm publication"].archetype.archetype, "detail-view");
  });

  it("without entity: the plural default and the extended keyword table apply generically, no entity routing involved", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [
        { name: "Data products", template: "studio" },
        { name: "Data product details", template: "studio" },
      ],
    });
    // No entity to route against (entity is null): "Data products" exercises
    // fallbackArchetype's new plural-last-word default directly -- no
    // keyword hits "data" or "products", and "products" ends in "s" (not
    // "ss").
    assert.strictEqual(brief.screens[0].pattern, null, "no app pattern matches this name");
    assert.strictEqual(brief.screens[0].archetype.archetype, "table-list");
    // "details" hits the keyword table's now-explicit detail-view row before
    // the plural default ever runs (which would otherwise say table-list).
    assert.strictEqual(brief.screens[1].archetype.archetype, "detail-view");
  });
});

describe("pickPattern (reweighted tag/label scoring)", function () {
  var appPatternsResolver = require(path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "resolve-patterns.js"));
  var studioPatterns = appPatternsResolver.resolvePatterns("studio");

  it("a single generic word no longer drags in an unrelated pattern", function () {
    assert.strictEqual(prepare.pickPattern("Data product overview", studioPatterns), null, "today: data-profiling-sampling on the word \"data\"");
    assert.strictEqual(prepare.pickPattern("Published data product", studioPatterns), null);
  });

  it("a real multi-word overlap still matches", function () {
    var p = prepare.pickPattern("Data products list", studioPatterns);
    assert.ok(p, "expected a match");
    assert.strictEqual(p.slug, "search-filtered-table");
  });

  it("an exact label match wins outright, even over a tag-heavy neighbour that would otherwise outscore it", function () {
    // access-request-workflow's authored "request" tag scores higher than
    // access-request-management's label-only overlap under the tag/label
    // weighting alone (4 vs 3) -- but the screen name equals
    // access-request-management's label verbatim, so the exact-label first
    // pass must win before scoring ever runs.
    var p = prepare.pickPattern("Access request management", studioPatterns);
    assert.ok(p, "expected a match");
    assert.strictEqual(p.slug, "access-request-management");

    // Case- and whitespace-insensitive too.
    var p2 = prepare.pickPattern("  ACCESS   request Management  ", studioPatterns);
    assert.ok(p2, "expected a match");
    assert.strictEqual(p2.slug, "access-request-management");
  });

  it("on a tie, the pattern named in the entity's own patterns[] wins over an equally-scored one that comes first", function () {
    var noEntity = prepare.pickPattern("Approve properties", studioPatterns);
    assert.ok(noEntity, "expected a match");
    assert.strictEqual(noEntity.slug, "access-request-management", "first-encountered tied pattern wins with no entity signal");

    var withEntity = prepare.pickPattern("Approve properties", studioPatterns, ["asset-detail-360"]);
    assert.ok(withEntity, "expected a match");
    assert.strictEqual(withEntity.slug, "asset-detail-360", "the entity's own pattern wins the tie");
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
