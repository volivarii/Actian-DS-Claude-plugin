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

function run(list, partials) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-layer-"));
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

var LIST = {
  meta: { feature: "Describe catalog items" },
  screens: [
    { name: "Catalog", template: "studio", pattern: "faceted-browse" },
    {
      name: "Describe items",
      template: "studio",
      layer: { kind: "drawer", over: 1 },
    },
  ],
};

describe("merge-partials --incremental: a declared layer", function () {
  it("lands on a pending stub with over as the base's stamped id", function () {
    var res = run(LIST);
    assert.deepStrictEqual(res.screens[1].layer, {
      kind: "drawer",
      over: "describe-catalog-items-1",
    });
    assert.strictEqual(res.screens[0].layer, undefined);
  });

  it("replaces a layer the agent wrote on the generated screen", function () {
    var res = run(LIST, [
      {
        screens: [
          {
            name: "Describe items",
            template: "studio",
            layer: { kind: "modal", over: "somewhere-else" },
            content: [{ type: "TEXT", content: "Body" }],
          },
        ],
      },
    ]);
    assert.strictEqual(
      res.screens[1].status,
      undefined,
      "the generated screen merged",
    );
    assert.deepStrictEqual(res.screens[1].layer, {
      kind: "drawer",
      over: "describe-catalog-items-1",
    });
  });
});

describe("merge-partials --incremental: every id is derived from the screen list", function () {
  var deriveScreenId = require("../../scripts/lib/screen-id.js").deriveScreenId;

  it("a partial carrying a clashing id still ends with ids <feature>-1..N in order", function () {
    var res = run(LIST, [
      {
        screens: [
          {
            name: "Describe items",
            template: "studio",
            id: "describe-catalog-items-1",
            content: [{ type: "TEXT", content: "Body" }],
          },
        ],
      },
    ]);
    assert.deepStrictEqual(
      res.screens.map(function (s) {
        return s.id;
      }),
      ["describe-catalog-items-1", "describe-catalog-items-2"],
    );
  });

  it("a list with no meta and a partial with meta.feature gives the ids prepare-flow's flow gives", function () {
    var list = {
      screens: [
        { name: "Catalog", template: "studio", pattern: "faceted-browse" },
        {
          name: "Describe items",
          template: "studio",
          layer: { kind: "drawer", over: 1 },
        },
      ],
    };
    var res = run(list, [
      {
        meta: { feature: "Describe catalog items" },
        screens: [
          {
            name: "Catalog",
            template: "studio",
            content: [{ type: "TEXT", content: "Body" }],
          },
        ],
      },
    ]);
    assert.deepStrictEqual(
      res.screens.map(function (s) {
        return s.id;
      }),
      [deriveScreenId(undefined, 0), deriveScreenId(undefined, 1)],
    );
  });

  it("two layered screens over the same base both get layer.over set to the base's id", function () {
    var list = {
      meta: { feature: "Describe catalog items" },
      screens: [
        { name: "Catalog", template: "studio", pattern: "faceted-browse" },
        {
          name: "Describe items",
          template: "studio",
          layer: { kind: "drawer", over: 1 },
        },
        {
          name: "Saved",
          template: "studio",
          layer: { kind: "toast", over: 1 },
        },
      ],
    };
    var res = run(list);
    assert.strictEqual(res.screens[1].layer.over, res.screens[0].id);
    assert.strictEqual(res.screens[2].layer.over, res.screens[0].id);
  });

  it("an agent-written layer on a screen the list does not layer is removed", function () {
    var res = run(LIST, [
      {
        screens: [
          {
            name: "Catalog",
            template: "studio",
            layer: { kind: "modal", over: "somewhere-else" },
            content: [{ type: "TEXT", content: "Body" }],
          },
        ],
      },
    ]);
    assert.strictEqual(res.screens[0].layer, undefined);
  });
});
