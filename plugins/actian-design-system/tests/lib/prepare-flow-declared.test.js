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
    assert.strictEqual(undeclared.screens[0].pattern.slug, "faceted-browse", "baseline: the name routes to faceted-browse");
    var declared = prepare.prepareFlow({
      app: "studio",
      entity: "data-product",
      screens: [{ name: "Data products", template: "studio", pattern: "asset-detail-360" }],
    });
    assert.strictEqual(declared.screens[0].pattern.slug, "asset-detail-360");
    assert.strictEqual(declared.screens[0].pageRecipe.slug, "asset-detail-360");
  });

  it("wins over name scoring: the side-panel name that scored data-steward-agent-panel reaches the quick-edit drawer capture", function () {
    var undeclared = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Write descriptions in the side panel", template: "studio" }],
    });
    assert.strictEqual(undeclared.screens[0].pattern.slug, "data-steward-agent-panel", "baseline: the name scores the AI panel");
    var declared = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Write descriptions in the side panel", template: "studio", pattern: "right-sliding-drawer" }],
    });
    assert.strictEqual(declared.screens[0].pattern.slug, "right-sliding-drawer");
    assert.strictEqual(declared.screens[0].pageRecipe.slug, "studio-quick-edit-drawer");
  });

  it("refuses a slug the app lacks, naming the screen and listing the app's slugs", function () {
    assert.throws(
      function () {
        prepare.prepareFlow({
          app: "studio",
          screens: [{ name: "Catalog", template: "studio", pattern: "catalog-browse" }],
        });
      },
      function (e) {
        assert.strictEqual(e.code, "SCREEN_LIST_INVALID");
        assert.match(e.message, /screen 1 "Catalog": pattern "catalog-browse" is not one of this app's patterns/);
        assert.match(e.message, /faceted-browse/);
        return true;
      },
    );
  });

  it("ignores pattern on a freehand screen", function () {
    var brief = prepare.prepareFlow({
      app: "studio",
      screens: [{ name: "Three panes", template: "studio", layout: "freehand", pattern: "not-a-pattern" }],
    });
    assert.strictEqual(brief.screens[0].pattern, null);
  });

  it("the CLI exits 1 on an unknown slug and writes no brief", function () {
    var t = writeList({ screens: [{ name: "Catalog", template: "studio", pattern: "catalog-browse" }] });
    var out = path.join(t.dir, ".brief.json");
    var r = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--screen-list", t.file, "-o", out], { encoding: "utf8" });
    assert.strictEqual(r.status, 1, r.stderr);
    assert.match(r.stderr, /is not one of this app's patterns/);
    assert.strictEqual(fs.existsSync(out), false);
  });

  it("says on stderr when an undeclared screen falls back to a keyword archetype, and only then", function () {
    var t = writeList({
      screens: [
        { name: "Several items selected", template: "studio" },
        { name: "Catalog, no description", template: "studio", pattern: "faceted-browse" },
      ],
    });
    var r = spawnSync(process.execPath, [SCRIPT, "--app", "studio", "--screen-list", t.file, "-o", path.join(t.dir, ".brief.json")], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stderr, /prepare-flow: screen 1 "Several items selected": no pattern declared or matched, archetype detail-view by keyword/);
    assert.doesNotMatch(r.stderr, /screen 2 "Catalog, no description": no pattern/);
  });
});
