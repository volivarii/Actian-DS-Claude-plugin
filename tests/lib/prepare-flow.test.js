#!/usr/bin/env node
"use strict";
// prepare-flow.js: the screen list in, the prototype's brief out. The direct
// block itself is direct-brief.test.js's; this file holds the screen list's
// checks, the flow ids, layers, exits, use cases and the CLI.
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var spawnSync = require("child_process").spawnSync;

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var SCRIPT = path.join(PLUGIN_ROOT, "scripts", "lib", "app-context", "prepare-flow.js");
var prepare = require(SCRIPT);

function writeList(list) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "prep-flow-"));
  var file = path.join(dir, "screen-list.json");
  fs.writeFileSync(file, JSON.stringify(list));
  return { dir: dir, file: file };
}
function cli(args) {
  return spawnSync(process.execPath, [SCRIPT].concat(args), { encoding: "utf8" });
}

var SCREENS = [
  { name: "Catalog, no description", template: "studio", pattern: "faceted-browse", exit: "selects several items" },
  { name: "Several items selected", template: "studio", pattern: "faceted-browse", exit: "Describe" },
  { name: "Describe items", template: "studio", pattern: "right-sliding-drawer", layer: { kind: "drawer", over: 2 }, exit: "Save" },
  { name: "Descriptions saved", template: "studio", layer: { kind: "toast", over: 2 } },
];

describe("prepare-flow: the brief", function () {
  it("carries the app's rail labels and header as labels, and only the patterns the steps declare", function () {
    var brief = prepare.prepareFlow({ app: "studio", feature: "Describe catalog items", screens: SCREENS });
    assert.strictEqual(brief.app, "studio");
    assert.ok(brief.glossary.chrome.sidebar.length > 0);
    brief.glossary.chrome.sidebar.forEach(function (s) {
      assert.ok(brief.labels.indexOf(s.label) !== -1, s.label);
    });
    assert.ok(brief.labels.indexOf(brief.glossary.chrome.header.type) !== -1);
    assert.deepStrictEqual(brief.glossary.patterns.map(function (p) { return p.slug; }).sort(), ["faceted-browse", "right-sliding-drawer"]);
    brief.glossary.patterns.forEach(function (p) {
      assert.ok(p.description, p.slug + " carries the knowledge's description");
    });
  });

  it("lists every step in flow with its id, from the feature, or screen-<n> without one", function () {
    var brief = prepare.prepareFlow({ app: "studio", feature: "Describe catalog items", screens: SCREENS });
    assert.deepStrictEqual(
      brief.flow.map(function (f) { return [f.n, f.id, f.name]; }),
      [
        [1, "describe-catalog-items-1", "Catalog, no description"],
        [2, "describe-catalog-items-2", "Several items selected"],
        [3, "describe-catalog-items-3", "Describe items"],
        [4, "describe-catalog-items-4", "Descriptions saved"],
      ],
    );
    assert.deepStrictEqual(brief.direct.steps.map(function (s) { return s.id; }), brief.flow.map(function (f) { return f.id; }));
    assert.strictEqual(prepare.prepareFlow({ app: "studio", screens: [{ name: "Catalog" }] }).flow[0].id, "screen-1");
  });

  it("carries a declared layer with its base's id and name, and a declared exit aimed at the next step", function () {
    var brief = prepare.prepareFlow({ app: "studio", feature: "Describe catalog items", screens: SCREENS });
    assert.deepStrictEqual(brief.direct.steps[2].layer, { kind: "drawer", over: 2, overId: "describe-catalog-items-2", overName: "Several items selected" });
    assert.strictEqual(brief.direct.steps[0].layer, null);
    assert.deepStrictEqual(brief.direct.steps[0].exit, { via: "selects several items", toId: "describe-catalog-items-2", toName: "Several items selected" });
    assert.strictEqual(brief.direct.steps[3].exit, null);
  });

  it("a step with a pattern carries its capture, even as a layer; a layer with no pattern carries none", function () {
    var brief = prepare.prepareFlow({ app: "studio", feature: "Describe catalog items", screens: SCREENS });
    assert.strictEqual(brief.direct.steps[2].capture, "studio-quick-edit-drawer");
    assert.strictEqual(brief.direct.steps[3].pattern, null);
    assert.strictEqual(brief.direct.steps[3].capture, null);
    assert.deepStrictEqual(brief.screens[3].components, []);
  });

  it("--use-case narrows glossary.useCases to the first match on any audience word; an unknown one keeps all", function () {
    var one = [{ name: "Catalog", template: "studio" }];
    var steward = prepare.prepareFlow({ app: "studio", screens: one, useCase: "steward" });
    assert.strictEqual(steward.glossary.useCases.length, 1);
    assert.match(steward.glossary.useCases[0].audience[0], /steward/i);
    // Studio's use cases share "Data steward" first; "engineer" is only in audience[1].
    var engineer = prepare.prepareFlow({ app: "studio", screens: one, useCase: "engineer" });
    assert.strictEqual(engineer.glossary.useCases.length, 1);
    assert.ok(engineer.glossary.useCases[0].audience.indexOf("Data engineer") !== -1);
    var all = prepare.prepareFlow({ app: "studio", screens: one });
    assert.ok(all.glossary.useCases.length > 1);
    assert.strictEqual(prepare.prepareFlow({ app: "studio", screens: one, useCase: "spaceman" }).glossary.useCases.length, all.glossary.useCases.length);
  });
});

describe("prepare-flow: the screen list's checks", function () {
  function invalid(options, pattern) {
    assert.throws(function () {
      prepare.prepareFlow(options);
    }, function (e) {
      assert.strictEqual(e.code, "SCREEN_LIST_INVALID");
      assert.match(e.message, pattern);
      return true;
    });
  }

  it("refuses a pattern the app lacks, naming the screen and listing the app's slugs", function () {
    invalid({ app: "studio", screens: [{ name: "Catalog", template: "studio", pattern: "catalog-browse" }] },
      /screen 1 "Catalog": pattern "catalog-browse" is not one of this app's patterns: .*faceted-browse/);
  });

  it("refuses each malformed layer, naming the screen", function () {
    function problemsFor(list) {
      return prepare.screenListProblems(list, [{ slug: "faceted-browse" }]).join("\n");
    }
    var a = { name: "A", template: "studio" };
    assert.match(problemsFor([a, { name: "B", layer: { kind: "popover", over: 1 } }]), /screen 2 "B": layer.kind must be panel, drawer, modal or toast/);
    assert.match(problemsFor([a, { name: "B", layer: { kind: "drawer", over: 9 } }]), /screen 2 "B": layer.over must be a screen number from 1 to 2/);
    assert.match(problemsFor([a, { name: "B", layer: { kind: "drawer", over: "1" } }]), /layer.over must be a screen number/);
    assert.match(problemsFor([a, { name: "B", layer: { kind: "drawer", over: 2 } }]), /screen 2 "B": layer.over cannot be the screen itself/);
    assert.match(problemsFor([a, { name: "B", layer: { kind: "drawer", over: 1 } }, { name: "C", layer: { kind: "toast", over: 2 } }]),
      /screen 3 "C": layer.over points at screen 2, which is itself a layer/);
    assert.strictEqual(problemsFor([a, { name: "B", layer: { kind: "drawer", over: 1 } }]), "");
  });

  it("refuses a meta.nav or a step's nav the app's rail lacks, and any nav on an app with no rail", function () {
    var two = [{ name: "Catalog", template: "studio", exit: "x" }, { name: "Done", template: "studio" }];
    invalid({ app: "studio", screens: two, nav: "marketplace" }, /meta\.nav "marketplace" is not one of this app's sidebar ids: dashboard, catalog/);
    invalid({ app: "studio", screens: [{ name: "Catalog", nav: "nope", exit: "x" }, { name: "Done" }] }, /screen 1 "Catalog": nav "nope"/);
    invalid({ app: "explorer", screens: [{ name: "Search" }], nav: "catalog" }, /this app has no side rail/);
    assert.strictEqual(prepare.prepareFlow({ app: "studio", nav: "catalog", screens: [{ name: "Catalog", nav: "topics", exit: "x" }, { name: "Done" }] }).direct.app.activeNav, "catalog");
  });

  it("under mode generate, refuses a non-final step with no exit; with no mode it is accepted", function () {
    var two = [{ name: "Catalog", template: "studio" }, { name: "Done", template: "studio" }];
    invalid({ app: "studio", mode: "generate", screens: two }, /screen 1 "Catalog": exit is required: say what the user does here to reach screen 2 "Done"/);
    assert.doesNotThrow(function () { prepare.prepareFlow({ app: "studio", screens: two }); });
    assert.doesNotThrow(function () { prepare.prepareFlow({ app: "studio", mode: "generate", screens: two.slice(0, 1) }); });
  });

  it("refuses an exit on the last step, and an exit that is not a phrase", function () {
    invalid({ app: "studio", screens: [{ name: "Catalog", exit: "x" }, { name: "Done", exit: "y" }] }, /screen 2 "Done": exit: nothing follows the last screen/);
    invalid({ app: "studio", screens: [{ name: "Catalog", exit: "   " }, { name: "Done" }] }, /screen 1 "Catalog": exit must be a short phrase/);
  });
});

describe("prepare-flow: the CLI", function () {
  var LIST = path.resolve(__dirname, "../fixtures/direct/screen-list.json");

  it("writes the same brief with and without --direct, and no slices", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "prep-flow-cli-"));
    var a = path.join(dir, "a.json"), b = path.join(dir, "b.json");
    var ra = cli(["--app", "studio", "--screen-list", LIST, "-o", a]);
    var rb = cli(["--app", "studio", "--screen-list", LIST, "--direct", "-o", b]);
    assert.strictEqual(ra.status, 0, ra.stderr);
    assert.strictEqual(rb.status, 0, rb.stderr);
    assert.strictEqual(fs.readFileSync(a, "utf8"), fs.readFileSync(b, "utf8"));
    assert.ok(JSON.parse(fs.readFileSync(a, "utf8")).direct.steps.length === 4);
    assert.ok(!fs.existsSync(path.join(dir, ".brief")));
  });

  it("prints the brief on stdout without -o, and the usage without --app or --screen-list", function () {
    var r = cli(["--app", "studio", "--screen-list", LIST]);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(JSON.parse(r.stdout).direct.steps.length, 4);
    var u = cli(["--app", "studio"]);
    assert.strictEqual(u.status, 1);
    assert.match(u.stderr, /^usage: prepare-flow\.js/);
  });

  it("reads meta.feature, meta.mode and meta.nav from the list, and exits 1 writing nothing when it cannot be routed", function () {
    var w = writeList({
      meta: { feature: "F", mode: "generate", nav: "marketplace" },
      screens: [{ name: "Catalog", template: "studio", pattern: "catalog-browse" }, { name: "Done", template: "studio" }],
    });
    var out = path.join(w.dir, ".brief.json");
    var r = cli(["--app", "studio", "--screen-list", w.file, "-o", out]);
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /meta\.nav "marketplace"/);
    assert.match(r.stderr, /exit is required/);
    assert.match(r.stderr, /is not one of this app's patterns/);
    assert.strictEqual(fs.existsSync(out), false);
    var ok = writeList({ meta: { feature: "Describe catalog items" }, screens: SCREENS });
    var r2 = cli(["--app", "studio", "--screen-list", ok.file]);
    assert.strictEqual(r2.status, 0, r2.stderr);
    assert.strictEqual(JSON.parse(r2.stdout).direct.steps[3].id, "describe-catalog-items-4");
  });
});
