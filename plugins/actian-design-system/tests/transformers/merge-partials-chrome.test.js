"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var cp = require("node:child_process");

var SCRIPT = path.resolve(
  __dirname,
  "../../scripts/transformers/merge-partials.js",
);
var TREE = require(
  path.resolve(
    __dirname,
    "../../scripts/renderers/html-renderers/ds-screen-tree.js",
  ),
);

function run(list, partials) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-chrome-"));
  fs.mkdirSync(path.join(dir, ".partial"), { recursive: true });
  (partials || []).forEach(function (p, i) {
    fs.writeFileSync(
      path.join(dir, ".partial", "screens-" + (i + 1) + ".json"),
      JSON.stringify(p),
    );
  });
  var lp = path.join(dir, "screen-list.json");
  fs.writeFileSync(lp, JSON.stringify(list));
  var out = path.join(dir, "flow-data.json");
  var r = cp.spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--type",
      "flow",
      "--incremental",
      "--screen-list",
      lp,
      "--partials-dir",
      path.join(dir, ".partial"),
      "--output",
      out,
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(fs.readFileSync(out, "utf8"));
}

var RAIL = [
  { label: "Dashboard", id: "dashboard" },
  { label: "Catalog", id: "catalog" },
  { label: "Topics", id: "topics" },
];

function list(over) {
  var base = {
    meta: {
      feature: "Describe catalog items",
      nav: "catalog",
      _glossary: { chrome: { app: "studio", header: { type: "Studio" }, sidebar: RAIL } },
    },
    screens: [
      { name: "Catalog", template: "studio", exit: "selects the rows" },
      { name: "Catalog, rows selected", template: "studio", exit: "Edit descriptions" },
      { name: "Edit descriptions", template: "studio", layer: { kind: "panel", over: 2 } },
    ],
  };
  return Object.assign(base, over || {});
}

var STAMPED = [
  { label: "Dashboard" },
  { label: "Catalog", state: "On" },
  { label: "Topics" },
];

describe("merge-partials --incremental: the rail is stamped from the screen list", function () {
  it("replaces an empty navItems the agent wrote (the #396 case)", function () {
    var partial = { screens: [{ name: "Catalog, rows selected", template: "studio", navItems: [], content: [] }] };
    assert.deepStrictEqual(partial.screens[0].navItems, [], "the partial really holds the wrong value");
    var res = run(list(), [partial]);
    assert.deepStrictEqual(res.screens[1].navItems, STAMPED);
    assert.strictEqual(res.screens[1].activeNavItem, "Catalog");
  });

  it("replaces a wrong active item and a legacy sidebar object the agent wrote", function () {
    var res = run(list(), [
      {
        screens: [
          {
            name: "Catalog",
            template: "studio",
            navItems: [{ label: "Dashboard", state: "On" }, { label: "Invented" }],
            activeNavItem: "Dashboard",
            sidebar: { items: ["Invented"], activeItem: "Invented" },
            content: [],
          },
        ],
      },
    ]);
    assert.deepStrictEqual(res.screens[0].navItems, STAMPED);
    assert.strictEqual(res.screens[0].activeNavItem, "Catalog");
    assert.strictEqual(res.screens[0].sidebar, undefined);
  });

  it("stamps a pending stub too, so the skeleton already shows the rail", function () {
    var res = run(list());
    assert.strictEqual(res.screens[0].status, "pending");
    assert.deepStrictEqual(res.screens[0].navItems, STAMPED);
  });

  it("a screen's own nav beats meta.nav", function () {
    var l = list();
    l.screens[0].nav = "topics";
    var res = run(l);
    assert.strictEqual(res.screens[0].activeNavItem, "Topics");
    assert.strictEqual(res.screens[1].activeNavItem, "Catalog");
  });

  it("a layer screen ends with no chrome fields, whatever the agent wrote", function () {
    var res = run(list(), [
      {
        screens: [
          { name: "Edit descriptions", template: "studio", navItems: [{ label: "X" }], activeNavItem: "X", sidebar: { items: ["X"] }, content: [] },
        ],
      },
    ]);
    assert.strictEqual(res.screens[2].navItems, undefined);
    assert.strictEqual(res.screens[2].activeNavItem, undefined);
    assert.strictEqual(res.screens[2].sidebar, undefined);
  });

  it("leaves a template with no rail untouched", function () {
    var l = list();
    l.screens[0].template = "bare";
    var res = run(l, [{ screens: [{ name: "Catalog", template: "bare", navItems: 3, content: [] }] }]);
    assert.strictEqual(res.screens[0].navItems, 3);
    assert.strictEqual(res.screens[0].activeNavItem, undefined);
  });

  it("stamps a justified custom chrome, because it reads the list's chrome, not the app's", function () {
    var l = list();
    l.meta._glossary.chrome.sidebar = [{ label: "Catalog", id: "catalog" }, { label: "Glossary", id: "glossary" }];
    var res = run(l);
    assert.deepStrictEqual(res.screens[0].navItems, [{ label: "Catalog", state: "On" }, { label: "Glossary" }]);
  });

  it("with no nav declared, stamps the rail with no active entry", function () {
    var l = list();
    delete l.meta.nav;
    var res = run(l);
    assert.deepStrictEqual(res.screens[0].navItems, [{ label: "Dashboard" }, { label: "Catalog" }, { label: "Topics" }]);
    assert.strictEqual(res.screens[0].activeNavItem, undefined);
  });

  it("with no chrome in the list, stamps nothing", function () {
    var l = list();
    delete l.meta._glossary;
    var res = run(l, [{ screens: [{ name: "Catalog", template: "studio", navItems: [{ label: "Kept" }], content: [] }] }]);
    assert.deepStrictEqual(res.screens[0].navItems, [{ label: "Kept" }]);
  });

  it("the stamped screen renders Catalog active through the real chrome builder", function () {
    var res = run(list(), [{ screens: [{ name: "Catalog, rows selected", template: "studio", navItems: [], content: [] }] }]);
    var s = res.screens[1];
    var nodes = TREE.chromeNodes(
      TREE.resolveChrome(s),
      { items: s.navItems, activeItem: s.activeNavItem },
      null,
      null,
    );
    assert.strictEqual(nodes.sidebar.props.Items, "Dashboard, Catalog, Topics");
    assert.strictEqual(nodes.sidebar.props.Active, "Catalog");
  });
});

describe("merge-partials --incremental: a declared exit", function () {
  it("is stamped with the next screen's id, replacing what an agent wrote", function () {
    var res = run(list(), [
      { screens: [{ name: "Catalog", template: "studio", exit: { via: "made up", to: "nowhere" }, content: [] }] },
    ]);
    assert.deepStrictEqual(res.screens[0].exit, { via: "selects the rows", to: "describe-catalog-items-2" });
    assert.deepStrictEqual(res.screens[1].exit, { via: "Edit descriptions", to: "describe-catalog-items-3" });
  });

  it("is removed from a screen the list gives none", function () {
    var res = run(list(), [
      { screens: [{ name: "Edit descriptions", template: "studio", exit: { via: "x", to: "y" }, content: [] }] },
    ]);
    assert.strictEqual(res.screens[2].exit, undefined);
  });
});
