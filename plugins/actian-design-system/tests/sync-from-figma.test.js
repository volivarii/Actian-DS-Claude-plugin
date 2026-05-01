#!/usr/bin/env node
"use strict";

// Integration tests for the sync-from-figma orchestrator.
// REST module is mocked; output goes to per-test tempdirs.

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var os = require("os");

var sync = require("../scripts/sync-from-figma.js");

// ---- Fixtures ----

var BUTTON_SET = {
  key: "btn-key",
  node_id: "1:1",
  name: "Button",
  description: "Primary action",
  containing_frame: { pageName: "Button" },
};

var BUTTON_NODE = {
  document: {
    id: "1:1",
    name: "Button",
    type: "COMPONENT_SET",
    componentPropertyDefinitions: {
      Type: {
        type: "VARIANT",
        defaultValue: "Primary",
        variantOptions: ["Primary", "Secondary"],
      },
      "Label#1:0": { type: "TEXT", defaultValue: "Button" },
    },
    children: [],
  },
};

var TEXT_STYLE_NODE = {
  document: {
    id: "100:1",
    name: "body",
    type: "TEXT",
    style: {
      fontFamily: "Roboto",
      fontStyle: "Regular",
      fontSize: 14,
      lineHeightUnit: "PIXELS",
      lineHeightPx: 20,
      letterSpacing: 0,
    },
  },
};

var EFFECT_STYLE_NODE = {
  document: {
    id: "200:1",
    name: "shadow",
    type: "RECTANGLE",
    effects: [
      {
        type: "DROP_SHADOW",
        visible: true,
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
      },
    ],
  },
};

function buildBasicData() {
  return {
    componentSets: { dsk: [BUTTON_SET], fmk: [], mtk: [] },
    components: { dsk: [], fmk: [], mtk: [] },
    styles: {
      dsk: [
        {
          key: "tk1",
          node_id: "100:1",
          style_type: "TEXT",
          name: "body",
          description: "",
        },
        {
          key: "ek1",
          node_id: "200:1",
          style_type: "EFFECT",
          name: "shadow",
          description: "",
        },
      ],
      fmk: [],
      mtk: [],
    },
    nodes: {
      dsk: {
        "1:1": BUTTON_NODE,
        "100:1": TEXT_STYLE_NODE,
        "200:1": EFFECT_STYLE_NODE,
      },
      fmk: {},
      mtk: {},
    },
  };
}

var BASIC_KEYS = { dsKit: "dsk", fmKit: "fmk", metaKit: "mtk" };

function buildMockRest(data) {
  return {
    getComponentSets: function (k) {
      return Promise.resolve({
        meta: { component_sets: data.componentSets[k] || [] },
      });
    },
    getComponents: function (k) {
      return Promise.resolve({
        meta: { components: data.components[k] || [] },
      });
    },
    getStyles: function (k) {
      return Promise.resolve({ meta: { styles: data.styles[k] || [] } });
    },
    getNodes: function (k, ids) {
      var nodesForKey = data.nodes[k] || {};
      var out = {};
      (ids || []).forEach(function (id) {
        if (nodesForKey[id]) out[id] = nodesForKey[id];
      });
      return Promise.resolve({ nodes: out });
    },
  };
}

function freshDirs() {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), "sync-test-"));
  return {
    root: root,
    outputDir: path.join(root, "docs", "generated"),
    releaseNotesDir: path.join(root, "release-notes"),
    artifactsDir: path.join(root, "artifacts"),
  };
}

function baseOpts(dirs, overrides) {
  return Object.assign(
    {
      keys: BASIC_KEYS,
      outputDir: dirs.outputDir,
      releaseNotesDir: dirs.releaseNotesDir,
      artifactsDir: dirs.artifactsDir,
      date: "2026-04-30",
    },
    overrides || {},
  );
}

// ---- Tests ----

describe("sync-from-figma", function () {
  describe("initial run (phase=all, no before files)", function () {
    var dirs = freshDirs();
    var result;

    it("writes 3 registry files + meta-kit/styles.json", async function () {
      result = await sync.run(
        baseOpts(dirs, { rest: buildMockRest(buildBasicData()) }),
      );
      assert.ok(
        fs.existsSync(path.join(dirs.outputDir, "dskit.json")),
        "dskit.json not written",
      );
      assert.ok(
        fs.existsSync(path.join(dirs.outputDir, "fmkit.json")),
        "fmkit.json not written",
      );
      assert.ok(
        fs.existsSync(path.join(dirs.outputDir, "metakit.json")),
        "metakit.json not written",
      );
      assert.ok(
        fs.existsSync(path.join(dirs.outputDir, "meta-kit", "styles.json")),
        "styles.json not written",
      );
    });

    it("writes release notes file with date in name", function () {
      assert.ok(
        fs.existsSync(path.join(dirs.releaseNotesDir, "sync-2026-04-30.md")),
      );
    });

    it("writes /artifacts/sync-verdict.txt and sync-changelog.md for GH workflow", function () {
      var verdict = fs
        .readFileSync(path.join(dirs.artifactsDir, "sync-verdict.txt"), "utf8")
        .trim();
      assert.strictEqual(verdict, "additive");
      assert.ok(
        fs.existsSync(path.join(dirs.artifactsDir, "sync-changelog.md")),
      );
    });

    it("verdict = additive, exitCode = 0 (because Button + 2 styles are net new)", function () {
      assert.strictEqual(result.category, "additive");
      assert.strictEqual(result.exitCode, 0);
    });

    it("DS Kit registry contains Button slug with expected fields", function () {
      var ds = JSON.parse(
        fs.readFileSync(path.join(dirs.outputDir, "dskit.json"), "utf8"),
      );
      assert.strictEqual(ds.library, "ds");
      assert.strictEqual(ds.fileKey, "dsk");
      assert.ok("button" in ds.components);
      assert.strictEqual(ds.components.button.name, "Button");
      assert.strictEqual(ds.components.button.importMethod, "set");
    });

    it("styles.json contains both text and effect styles", function () {
      var styles = JSON.parse(
        fs.readFileSync(
          path.join(dirs.outputDir, "meta-kit", "styles.json"),
          "utf8",
        ),
      );
      assert.strictEqual(styles.textStyles.length, 1);
      assert.strictEqual(styles.effectStyles.length, 1);
      assert.strictEqual(styles.textStyles[0].name, "body");
      assert.strictEqual(styles.effectStyles[0].name, "shadow");
    });
  });

  describe("--phase registries (skips styles)", function () {
    it("does not write styles.json", async function () {
      var dirs = freshDirs();
      await sync.run(
        baseOpts(dirs, {
          rest: buildMockRest(buildBasicData()),
          phase: "registries",
        }),
      );
      assert.ok(fs.existsSync(path.join(dirs.outputDir, "dskit.json")));
      assert.ok(
        !fs.existsSync(path.join(dirs.outputDir, "meta-kit", "styles.json")),
      );
    });
  });

  describe("--phase styles (skips registries)", function () {
    it("does not write registry files", async function () {
      var dirs = freshDirs();
      await sync.run(
        baseOpts(dirs, {
          rest: buildMockRest(buildBasicData()),
          phase: "styles",
        }),
      );
      assert.ok(
        fs.existsSync(path.join(dirs.outputDir, "meta-kit", "styles.json")),
      );
      assert.ok(!fs.existsSync(path.join(dirs.outputDir, "dskit.json")));
    });
  });

  describe("re-run with identical data", function () {
    it("verdict = unchanged, exitCode = 0", async function () {
      var dirs = freshDirs();
      var rest = buildMockRest(buildBasicData());
      await sync.run(baseOpts(dirs, { rest: rest }));
      var second = await sync.run(baseOpts(dirs, { rest: rest }));
      assert.strictEqual(second.category, "unchanged");
      assert.strictEqual(second.exitCode, 0);
    });

    it("does not rewrite registry/styles files when unchanged (avoids GH PR churn)", async function () {
      var dirs = freshDirs();
      var rest = buildMockRest(buildBasicData());
      await sync.run(baseOpts(dirs, { rest: rest }));

      var dskPath = path.join(dirs.outputDir, "dskit.json");
      var stylesPath = path.join(dirs.outputDir, "meta-kit", "styles.json");
      var dskBefore = fs.readFileSync(dskPath, "utf8");
      var stylesBefore = fs.readFileSync(stylesPath, "utf8");

      var second = await sync.run(baseOpts(dirs, { rest: rest }));

      assert.strictEqual(
        fs.readFileSync(dskPath, "utf8"),
        dskBefore,
        "dskit.json should not be rewritten",
      );
      assert.strictEqual(
        fs.readFileSync(stylesPath, "utf8"),
        stylesBefore,
        "styles.json should not be rewritten",
      );
      // Also surface the wrote flag in the per-file result for workflow logging.
      var dskResult = second.results.find(function (r) {
        return r.fileLabel === "dskit.json";
      });
      assert.strictEqual(dskResult.wrote, false);
    });
  });

  describe("breaking diff (component removed)", function () {
    it("verdict = breaking, exitCode = 1", async function () {
      var dirs = freshDirs();
      // First run: Button present
      await sync.run(baseOpts(dirs, { rest: buildMockRest(buildBasicData()) }));
      // Second run: Button removed
      var data2 = buildBasicData();
      data2.componentSets.dsk = [];
      delete data2.nodes.dsk["1:1"];
      var second = await sync.run(
        baseOpts(dirs, { rest: buildMockRest(data2) }),
      );
      assert.strictEqual(second.category, "breaking");
      assert.strictEqual(second.exitCode, 1);
    });
  });

  describe("per-phase guard (one kit fails)", function () {
    it("dskit still written; verdict = error; exitCode = 2", async function () {
      var dirs = freshDirs();
      var rest = buildMockRest(buildBasicData());
      var origGetCS = rest.getComponentSets;
      rest.getComponentSets = function (k) {
        if (k === "fmk") return Promise.reject(new Error("simulated REST 500"));
        return origGetCS(k);
      };
      var r = await sync.run(baseOpts(dirs, { rest: rest }));
      assert.strictEqual(r.category, "error");
      assert.strictEqual(r.exitCode, 2);
      assert.ok(
        fs.existsSync(path.join(dirs.outputDir, "dskit.json")),
        "dskit.json should still be written despite fmkit failure",
      );
      assert.ok(
        !fs.existsSync(path.join(dirs.outputDir, "fmkit.json")),
        "fmkit.json should NOT be written when its fetch failed",
      );
    });
  });

  describe("metaKit templates field preservation", function () {
    it("preserves templates on resync", async function () {
      var dirs = freshDirs();
      fs.mkdirSync(dirs.outputDir, { recursive: true });
      var existing = {
        library: "meta-kit",
        fileKey: "mtk",
        lastSynced: "2026-01-01T00:00:00Z",
        componentCount: 0,
        components: {},
        templates: { "section-header": { key: "tplkey", nodeId: "9:9" } },
      };
      fs.writeFileSync(
        path.join(dirs.outputDir, "metakit.json"),
        JSON.stringify(existing, null, 2),
        "utf8",
      );
      await sync.run(baseOpts(dirs, { rest: buildMockRest(buildBasicData()) }));
      var after = JSON.parse(
        fs.readFileSync(path.join(dirs.outputDir, "metakit.json"), "utf8"),
      );
      assert.deepStrictEqual(after.templates, existing.templates);
    });
  });

  describe("node fetch batching", function () {
    it("calls rest.getNodes once per phase (not once per id)", async function () {
      // 20 component sets — without batching that's 20 separate calls.
      // With batching it should collapse to a single rest.getNodes call.
      var componentSets = [];
      var nodes = {};
      for (var i = 0; i < 20; i++) {
        var nodeId = "9:" + i;
        componentSets.push({
          key: "k" + i,
          node_id: nodeId,
          name: "Comp" + i,
          description: "",
          containing_frame: { pageName: "Page" },
        });
        nodes[nodeId] = {
          document: {
            id: nodeId,
            name: "Comp" + i,
            type: "COMPONENT_SET",
            componentPropertyDefinitions: {},
            children: [],
          },
        };
      }
      var data = {
        componentSets: { dsk: componentSets, fmk: [], mtk: [] },
        components: { dsk: [], fmk: [], mtk: [] },
        styles: { dsk: [], fmk: [], mtk: [] },
        nodes: { dsk: nodes, fmk: {}, mtk: {} },
      };

      var rest = buildMockRest(data);
      var origGetNodes = rest.getNodes;
      var calls = [];
      rest.getNodes = function (k, ids) {
        calls.push({ key: k, idCount: (ids || []).length });
        return origGetNodes(k, ids);
      };

      var dirs = freshDirs();
      await sync.run(baseOpts(dirs, { rest: rest, phase: "registries" }));

      // Empty arrays short-circuit in fetchNodesMap, so empty-input kits
      // (fmk, mtk standalones, dsk standalones) don't call getNodes at all.
      var dsCalls = calls.filter(function (c) {
        return c.key === "dsk";
      });
      assert.strictEqual(
        dsCalls.length,
        1,
        "DS Kit should batch all 20 component sets into 1 getNodes call",
      );
      assert.strictEqual(dsCalls[0].idCount, 20);
    });
  });

  describe("CLI parseArgs", function () {
    it("parses --phase, --output-dir, --release-notes-dir, --keys-file, --artifacts-dir", function () {
      var p = sync.parseArgs([
        "--phase",
        "registries",
        "--output-dir",
        "/foo/docs",
        "--release-notes-dir",
        "/foo/notes",
        "--keys-file",
        "/foo/keys.json",
        "--artifacts-dir",
        "/tmp/sync",
      ]);
      assert.strictEqual(p.phase, "registries");
      assert.strictEqual(p.outputDir, "/foo/docs");
      assert.strictEqual(p.releaseNotesDir, "/foo/notes");
      assert.strictEqual(p.keysFile, "/foo/keys.json");
      assert.strictEqual(p.artifactsDir, "/tmp/sync");
    });

    it("defaults phase to 'all'", function () {
      assert.strictEqual(sync.parseArgs([]).phase, "all");
    });
  });
});
