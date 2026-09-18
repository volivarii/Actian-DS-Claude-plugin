#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var spawnSync = require("child_process").spawnSync;

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var SCRIPT = path.join(
  PLUGIN_ROOT,
  "scripts",
  "lib",
  "app-context",
  "prepare-flow.js",
);
var prepare = require(SCRIPT);

function writeList(list) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "prep-declared-"));
  var file = path.join(dir, "screen-list.json");
  fs.writeFileSync(file, JSON.stringify(list));
  return { dir: dir, file: file };
}

describe("prepare-flow: a declared pattern routes the screen", function () {
  it("wins over entity routing: 'Data products' routes to faceted-browse undeclared, asset-detail-360 declared", function () {
    var undeclared = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [{ name: "Data products", template: "studio" }],
    });
    assert.strictEqual(
      undeclared.screens[0].pattern.slug,
      "faceted-browse",
      "baseline: the name routes to faceted-browse",
    );
    var declared = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [
        {
          name: "Data products",
          template: "studio",
          pattern: "asset-detail-360",
        },
      ],
    });
    assert.strictEqual(declared.screens[0].pattern.slug, "asset-detail-360");
    assert.strictEqual(declared.screens[0].pageRecipe.slug, "asset-detail-360");
  });

  it("wins over name scoring: the side-panel name that scored data-steward-agent-panel reaches the quick-edit drawer capture", function () {
    var undeclared = prepare.prepareFlow({
      app: "studio",
      screens: [
        { name: "Write descriptions in the side panel", template: "studio" },
      ],
    });
    assert.strictEqual(
      undeclared.screens[0].pattern.slug,
      "data-steward-agent-panel",
      "baseline: the name scores the AI panel",
    );
    var declared = prepare.prepareFlow({
      app: "studio",
      screens: [
        {
          name: "Write descriptions in the side panel",
          template: "studio",
          pattern: "right-sliding-drawer",
        },
      ],
    });
    assert.strictEqual(
      declared.screens[0].pattern.slug,
      "right-sliding-drawer",
    );
    assert.strictEqual(
      declared.screens[0].pageRecipe.slug,
      "studio-quick-edit-drawer",
    );
  });

  it("refuses a slug the app lacks, naming the screen and listing the app's slugs", function () {
    assert.throws(
      function () {
        prepare.prepareFlow({
          app: "studio",
          screens: [
            { name: "Catalog", template: "studio", pattern: "catalog-browse" },
          ],
        });
      },
      function (e) {
        assert.strictEqual(e.code, "SCREEN_LIST_INVALID");
        assert.match(
          e.message,
          /screen 1 "Catalog": pattern "catalog-browse" is not one of this app's patterns/,
        );
        assert.match(e.message, /faceted-browse/);
        return true;
      },
    );
  });

  it("ignores pattern on a freehand screen", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [
        {
          name: "Three panes",
          template: "studio",
          layout: "freehand",
          pattern: "not-a-pattern",
        },
      ],
    });
    assert.strictEqual(brief.screens[0].pattern, null);
  });

  it("the CLI exits 1 on an unknown slug and writes no brief", function () {
    var t = writeList({
      screens: [
        { name: "Catalog", template: "studio", pattern: "catalog-browse" },
      ],
    });
    var out = path.join(t.dir, ".brief.json");
    var r = spawnSync(
      process.execPath,
      [SCRIPT, "--app", "studio", "--screen-list", t.file, "-o", out],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 1, r.stderr);
    assert.match(r.stderr, /is not one of this app's patterns/);
    assert.strictEqual(fs.existsSync(out), false);
  });

  it("says on stderr when an undeclared screen falls back to a keyword archetype, and only then", function () {
    var t = writeList({
      screens: [
        { name: "Several items selected", template: "studio" },
        {
          name: "Catalog, no description",
          template: "studio",
          pattern: "faceted-browse",
        },
      ],
    });
    var r = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--app",
        "studio",
        "--screen-list",
        t.file,
        "-o",
        path.join(t.dir, ".brief.json"),
      ],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(
      r.stderr,
      /prepare-flow: screen 1 "Several items selected": no pattern declared or matched, archetype detail-view by keyword/,
    );
    assert.doesNotMatch(
      r.stderr,
      /screen 2 "Catalog, no description": no pattern/,
    );
  });
});

describe("prepare-flow: declared layers and the flow's screen ids", function () {
  var screens = [
    {
      name: "Catalog, no description",
      template: "studio",
      pattern: "faceted-browse",
    },
    {
      name: "Several items selected",
      template: "studio",
      pattern: "faceted-browse",
    },
    {
      name: "Describe items",
      template: "studio",
      pattern: "right-sliding-drawer",
      layer: { kind: "drawer", over: 2 },
    },
    {
      name: "Descriptions saved",
      template: "studio",
      layer: { kind: "toast", over: 2 },
    },
  ];

  it("lists every screen in flow with the id merge will stamp", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      feature: "Describe catalog items",
      screens: screens,
    });
    assert.deepStrictEqual(
      brief.flow.map(function (f) {
        return [f.n, f.id, f.name];
      }),
      [
        [1, "describe-catalog-items-1", "Catalog, no description"],
        [2, "describe-catalog-items-2", "Several items selected"],
        [3, "describe-catalog-items-3", "Describe items"],
        [4, "describe-catalog-items-4", "Descriptions saved"],
      ],
    );
  });

  it("derives screen-<n> ids when the list names no feature, as stampScreenIds does", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: screens.slice(0, 1),
    });
    assert.strictEqual(brief.flow[0].id, "screen-1");
  });

  it("carries a declared layer with its base's id and name, and nothing on an unlayered screen", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      feature: "Describe catalog items",
      screens: screens,
    });
    assert.deepStrictEqual(brief.screens[2].layer, {
      kind: "drawer",
      over: 2,
      overId: "describe-catalog-items-2",
      overName: "Several items selected",
    });
    assert.strictEqual(brief.screens[0].layer, undefined);
  });

  it("hands every slice the flow and its own layer", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      feature: "Describe catalog items",
      screens: screens,
    });
    var slice = prepare.sliceBrief(brief, 3);
    assert.deepStrictEqual(slice.flow, brief.flow);
    assert.deepStrictEqual(slice.screen.layer, brief.screens[2].layer);
    assert.strictEqual(prepare.sliceBrief(brief, 1).screen.layer, undefined);
  });

  it("refuses each malformed layer, naming the screen", function () {
    function problemsFor(list) {
      return prepare
        .screenListProblems(list, [{ slug: "faceted-browse" }])
        .join("\n");
    }
    var a = { name: "A", template: "studio" };
    assert.match(
      problemsFor([
        a,
        { name: "B", template: "studio", layer: { kind: "popover", over: 1 } },
      ]),
      /screen 2 "B": layer.kind must be panel, drawer, modal or toast/,
    );
    assert.match(
      problemsFor([
        a,
        { name: "B", template: "studio", layer: { kind: "drawer", over: 9 } },
      ]),
      /screen 2 "B": layer.over must be a screen number from 1 to 2/,
    );
    assert.match(
      problemsFor([
        a,
        { name: "B", template: "studio", layer: { kind: "drawer", over: "1" } },
      ]),
      /layer.over must be a screen number/,
    );
    assert.match(
      problemsFor([
        a,
        { name: "B", template: "studio", layer: { kind: "drawer", over: 2 } },
      ]),
      /screen 2 "B": layer.over cannot be the screen itself/,
    );
    assert.match(
      problemsFor([
        a,
        { name: "B", template: "studio", layer: { kind: "drawer", over: 1 } },
        { name: "C", template: "studio", layer: { kind: "toast", over: 2 } },
      ]),
      /screen 3 "C": layer.over points at screen 2, which is itself a layer/,
    );
    assert.strictEqual(
      problemsFor([
        a,
        { name: "B", template: "studio", layer: { kind: "drawer", over: 1 } },
      ]),
      "",
    );
  });

  it("the CLI reads meta.feature into the slices' flow ids", function () {
    var t = writeList({
      meta: { feature: "Describe catalog items" },
      screens: screens,
    });
    var out = path.join(t.dir, ".brief.json");
    var r = spawnSync(
      process.execPath,
      [SCRIPT, "--app", "studio", "--screen-list", t.file, "-o", out],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 0, r.stderr);
    var slice3 = JSON.parse(
      fs.readFileSync(path.join(t.dir, ".brief", "3.json"), "utf8"),
    );
    assert.strictEqual(slice3.flow[3].id, "describe-catalog-items-4");
    assert.strictEqual(slice3.screen.layer.overId, "describe-catalog-items-2");
  });

  it("a layer with no declared pattern gets no page skeleton, and prints no keyword-guess line", function () {
    var t = writeList({
      meta: { feature: "Describe catalog items" },
      screens: screens,
    });
    var out = path.join(t.dir, ".brief.json");
    var r = spawnSync(
      process.execPath,
      [SCRIPT, "--app", "studio", "--screen-list", t.file, "-o", out],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stderr, /screen 4 .*by keyword/);
    var brief = JSON.parse(fs.readFileSync(out, "utf8"));
    var toastScreen = brief.screens[3];
    assert.strictEqual(toastScreen.archetype, null);
    assert.strictEqual(toastScreen.pageRecipe, null);
    assert.deepStrictEqual(toastScreen.sections, []);
    assert.deepStrictEqual(toastScreen.components, []);
    assert.strictEqual(toastScreen.layer.overId, "describe-catalog-items-2");
    assert.strictEqual(toastScreen.layout, undefined);
    assert.deepStrictEqual(brief.sectionsByScreen["Descriptions saved"], []);
    var slice4 = JSON.parse(
      fs.readFileSync(path.join(t.dir, ".brief", "4.json"), "utf8"),
    );
    assert.strictEqual(slice4.screen.archetype, null);
    assert.strictEqual(slice4.screen.pageRecipe, null);
  });

  it("a screen declaring both layer and pattern still carries that pattern's page recipe", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      feature: "Describe catalog items",
      screens: screens,
    });
    var drawerScreen = brief.screens[2];
    assert.strictEqual(drawerScreen.pattern.slug, "right-sliding-drawer");
    assert.strictEqual(
      drawerScreen.pageRecipe.slug,
      "studio-quick-edit-drawer",
    );
    assert.strictEqual(drawerScreen.layer.overId, "describe-catalog-items-2");
  });
});

describe("prepare-flow: declared nav and exits", function () {
  var TWO = [
    { name: "Catalog", template: "studio", exit: "selects the rows" },
    { name: "Catalog, rows selected", template: "studio" },
  ];

  it("refuses a meta.nav the app's rail lacks, listing the rail's ids", function () {
    assert.throws(
      function () {
        prepare.prepareFlow({ app: "studio", screens: TWO, nav: "marketplace" });
      },
      function (e) {
        assert.strictEqual(e.code, "SCREEN_LIST_INVALID");
        assert.match(e.message, /meta\.nav "marketplace"/);
        assert.match(e.message, /dashboard, catalog, topics/);
        return true;
      },
    );
  });

  it("refuses a screen's nav the rail lacks, naming the screen", function () {
    assert.throws(
      function () {
        prepare.prepareFlow({
          app: "studio",
          screens: [
            { name: "Catalog", template: "studio", nav: "nope", exit: "x" },
            { name: "Done", template: "studio" },
          ],
        });
      },
      function (e) {
        assert.match(e.message, /screen 1 "Catalog": nav "nope"/);
        return true;
      },
    );
  });

  it("refuses any nav on an app with no rail, saying so", function () {
    assert.throws(
      function () {
        prepare.prepareFlow({
          app: "explorer",
          screens: [{ name: "Search", template: "explorer" }],
          nav: "catalog",
        });
      },
      /this app has no side rail/,
    );
  });

  it("accepts a valid meta.nav and a valid per-screen nav", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      nav: "catalog",
      screens: [
        { name: "Catalog", template: "studio", nav: "topics", exit: "x" },
        { name: "Done", template: "studio" },
      ],
    });
    assert.strictEqual(brief.screens.length, 2);
  });

  it("under mode generate, refuses a non-final screen with no exit, naming it and the screen it should reach", function () {
    assert.throws(
      function () {
        prepare.prepareFlow({
          app: "studio",
          mode: "generate",
          screens: [
            { name: "Catalog", template: "studio" },
            { name: "Done", template: "studio" },
          ],
        });
      },
      function (e) {
        assert.match(e.message, /screen 1 "Catalog": exit is required/);
        assert.match(e.message, /screen 2 "Done"/);
        return true;
      },
    );
  });

  it("with no mode, or mode refine, a missing exit is accepted", function () {
    var screens = [
      { name: "Catalog", template: "studio" },
      { name: "Done", template: "studio" },
    ];
    assert.doesNotThrow(function () {
      prepare.prepareFlow({ app: "studio", screens: screens });
    });
    assert.doesNotThrow(function () {
      prepare.prepareFlow({ app: "studio", mode: "refine", screens: screens });
    });
  });

  it("a single-screen generate flow needs no exit", function () {
    assert.doesNotThrow(function () {
      prepare.prepareFlow({
        app: "studio",
        mode: "generate",
        screens: [{ name: "Catalog", template: "studio" }],
      });
    });
  });

  it("refuses an exit on the last screen, and an exit that is not a phrase", function () {
    assert.throws(function () {
      prepare.prepareFlow({
        app: "studio",
        screens: [
          { name: "Catalog", template: "studio", exit: "x" },
          { name: "Done", template: "studio", exit: "y" },
        ],
      });
    }, /screen 2 "Done": exit: nothing follows the last screen/);
    assert.throws(function () {
      prepare.prepareFlow({
        app: "studio",
        screens: [
          { name: "Catalog", template: "studio", exit: "   " },
          { name: "Done", template: "studio" },
        ],
      });
    }, /screen 1 "Catalog": exit must be a short phrase/);
  });

  it("carries the exit on the brief screen and the slice, aimed at the id merge will stamp", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      feature: "Describe catalog items",
      screens: TWO,
    });
    assert.deepStrictEqual(brief.screens[0].exit, {
      via: "selects the rows",
      toId: "describe-catalog-items-2",
      toName: "Catalog, rows selected",
    });
    assert.strictEqual(brief.screens[0].exit.toId, brief.flow[1].id);
    assert.strictEqual(brief.screens[1].exit, undefined);
    var slice = prepare.sliceBrief(brief, 1);
    assert.strictEqual(slice.screen.exit.toId, "describe-catalog-items-2");
  });

  it("accepts a nav the list's own justified chrome adds, through the CLI", function () {
    var w = writeList({
      meta: {
        feature: "F",
        nav: "reports",
        _glossary: {
          chrome: {
            app: "studio",
            header: { type: "Studio" },
            sidebar: [
              { label: "Catalog", id: "catalog" },
              { label: "Reports", id: "reports" },
            ],
          },
        },
      },
      screens: [{ name: "Reports", template: "studio" }],
    });
    var out = path.join(w.dir, ".brief.json");
    var r = spawnSync(
      process.execPath,
      [SCRIPT, "--app", "studio", "--screen-list", w.file, "-o", out],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(fs.existsSync(out), true);
  });

  it("the CLI reads meta.mode and meta.nav from the list", function () {
    var w = writeList({
      meta: { feature: "F", mode: "generate", nav: "marketplace" },
      screens: [
        { name: "Catalog", template: "studio" },
        { name: "Done", template: "studio" },
      ],
    });
    var r = spawnSync(
      process.execPath,
      [SCRIPT, "--app", "studio", "--screen-list", w.file, "-o", path.join(w.dir, ".brief.json")],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /meta\.nav "marketplace"/);
    assert.match(r.stderr, /exit is required/);
    assert.strictEqual(fs.existsSync(path.join(w.dir, ".brief.json")), false);
  });
});
