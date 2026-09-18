"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var V = require(
  path.join(
    __dirname,
    "..",
    "..",
    "scripts",
    "validation",
    "validate-flow-data.js",
  ),
);
function kinds(f) {
  return f
    .map(function (x) {
      return x.check;
    })
    .sort();
}

describe("layer and goto", function () {
  it("fires every hard error on a known-bad flow", function () {
    var data = {
      screens: [
        {
          id: "a",
          name: "A",
          content: [
            { type: "FRAME", name: "f", goto: "nowhere", children: [] },
          ],
        },
        {
          id: "b",
          name: "B",
          layer: { kind: "popover", over: "zzz" },
          content: [],
        },
        {
          id: "c",
          name: "C",
          layer: { kind: "toast", over: "b" },
          content: [{ type: "FRAME", name: "g", adds: "Ghost", children: [] }],
        },
      ],
    };
    assert.deepEqual(kinds(V.findLayerIssues(data)), [
      "adds-undeclared-name",
      "goto-target-missing",
      "layer-kind-unknown",
      "layer-over-layer",
      "layer-target-missing",
    ]);
  });
  it("reports a dead end only when no node has goto", function () {
    assert.deepEqual(
      kinds(
        V.findLayerIssues({ screens: [{ id: "a", name: "A", content: [] }] }),
      ),
      ["prototype-dead-end"],
    );
  });

  it("reports a declared exit that no node carries a goto for, and only that", function () {
    var data = {
      screens: [
        { id: "a", name: "A", exit: { via: "selects rows", to: "b" }, content: [{ type: "FRAME", name: "f", children: [] }] },
        {
          id: "b",
          name: "B",
          exit: { via: "Save", to: "c" },
          content: [{ type: "FRAME", name: "f", children: [{ type: "INSTANCE", name: "Save", goto: "c" }] }],
        },
        { id: "c", name: "C", content: [] },
        { id: "d", name: "D", status: "pending", exit: { via: "later", to: "e" } },
      ],
    };
    var noExit = V.findLayerIssues(data).filter(function (x) {
      return x.check === "screen-no-exit";
    });
    assert.equal(noExit.length, 1);
    assert.equal(noExit[0].screenId, "a");
    assert.equal(noExit[0].severity, "warning");
    assert.match(noExit[0].value, /selects rows/);
    assert.match(noExit[0].value, /\bb\b/);
  });

  it("an unwired flow that declares no exits still gets only the flow-level info", function () {
    var data = {
      screens: [
        { id: "a", name: "A", content: [] },
        { id: "b", name: "B", content: [] },
      ],
    };
    assert.deepEqual(kinds(V.findLayerIssues(data)), ["prototype-dead-end"]);
  });
});

describe("undeclared invention", function () {
  var deep = {
    type: "FRAME",
    name: "Panel",
    children: [
      {
        type: "FRAME",
        name: "Row",
        children: [
          {
            type: "FRAME",
            name: "Cell",
            children: [{ type: "TEXT", content: "x" }],
          },
        ],
      },
    ],
  };
  it("flags a nested FRAME tree with no INSTANCE and no adds", function () {
    assert.deepEqual(
      kinds(
        V.findUndeclaredInvention({
          meta: { hifi: true },
          screens: [{ id: "a", name: "A", content: [deep] }],
        }),
      ),
      ["undeclared-invention"],
    );
  });
  it("is silent when the tree is declared, or the screen is freehand", function () {
    var declared = Object.assign({}, deep, { adds: "Panel" });
    assert.deepEqual(
      V.findUndeclaredInvention({
        meta: { hifi: true },
        screens: [
          {
            id: "a",
            name: "A",
            adds: [{ name: "Panel", composedFrom: [], why: "w" }],
            content: [declared],
          },
        ],
      }),
      [],
    );
    assert.deepEqual(
      V.findUndeclaredInvention({
        meta: { hifi: true },
        screens: [{ id: "a", name: "A", layout: "freehand", content: [deep] }],
      }),
      [],
    );
  });
  it("is silent on the identical tree when meta.hifi is not true (FM authoring)", function () {
    assert.deepEqual(
      V.findUndeclaredInvention({
        screens: [{ id: "a", name: "A", content: [deep] }],
      }),
      [],
    );
    assert.deepEqual(
      V.findUndeclaredInvention({
        meta: { hifi: false },
        screens: [{ id: "a", name: "A", content: [deep] }],
      }),
      [],
    );
  });
});

describe("hardcoded color positive control", function () {
  it("a raw hex fill on a FRAME is already a P0", function () {
    var f = V.findHardcodedColors({
      screens: [
        {
          id: "a",
          name: "A",
          content: [
            { type: "FRAME", name: "f", fills: ["#1a6ee0"], children: [] },
          ],
        },
      ],
    });
    assert.ok(
      f.some(function (x) {
        return x.check === "hardcoded-color";
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// CLI exit codes (fix round 1): the "error"/"warning"/"info" severity these
// checks write does not reach the CLI's own mapTier() by default, because the
// CLI's `_legacy` pass-through bypasses it. Spawn the real CLI (never require
// the module for this part) so the exit code is the one thing under test.
// ---------------------------------------------------------------------------

describe("CLI exit codes for layer/goto/invention findings", function () {
  var fs = require("fs");
  var os = require("os");
  var { spawnSync } = require("node:child_process");
  var CLI = path.join(
    __dirname,
    "..",
    "..",
    "scripts",
    "validation",
    "validate-flow-data.js",
  );

  function runCli(data) {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "goto-layer-cli-"));
    var dataPath = path.join(tmpDir, "flow-data.json");
    fs.writeFileSync(dataPath, JSON.stringify(data));
    var result = spawnSync(
      process.execPath,
      [
        CLI,
        dataPath,
        "--skip-tokens",
        "--skip-terminology",
        "--skip-avoid-words",
      ],
      { encoding: "utf8" },
    );
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return result;
  }

  it("the known-bad flow exits 1 and lists all five hard errors as P0", function () {
    var data = {
      meta: { feature: "CLI known-bad" },
      screens: [
        {
          id: "a",
          name: "A",
          content: [
            { type: "FRAME", name: "f", goto: "nowhere", children: [] },
          ],
        },
        {
          id: "b",
          name: "B",
          layer: { kind: "popover", over: "zzz" },
          content: [],
        },
        {
          id: "c",
          name: "C",
          layer: { kind: "toast", over: "b" },
          content: [{ type: "FRAME", name: "g", adds: "Ghost", children: [] }],
        },
      ],
    };
    var r = runCli(data);
    assert.strictEqual(
      r.status,
      1,
      "expected exit 1, got " + r.status + ": " + r.stderr,
    );
    [
      "goto-target-missing",
      "layer-kind-unknown",
      "layer-target-missing",
      "layer-over-layer",
      "adds-undeclared-name",
    ].forEach(function (kind) {
      assert.ok(
        new RegExp("P0 \\[" + kind + "\\]").test(r.stderr),
        "expected a P0 [" + kind + "] line; got:\n" + r.stderr,
      );
    });
  });

  it("an undeclared-invention-only flow exits 2 with a P1 line", function () {
    var data = {
      meta: { feature: "CLI invention-only", hifi: true },
      screens: [
        {
          id: "a",
          name: "A",
          content: [
            { type: "FRAME", name: "nav", goto: "b", children: [] },
            {
              type: "FRAME",
              name: "Panel",
              children: [
                {
                  type: "FRAME",
                  name: "Row",
                  children: [{ type: "FRAME", name: "Cell", children: [] }],
                },
              ],
            },
          ],
        },
        { id: "b", name: "B", content: [] },
      ],
    };
    var r = runCli(data);
    assert.strictEqual(
      r.status,
      2,
      "expected exit 2, got " + r.status + ": " + r.stderr,
    );
    assert.ok(
      /P1 \[undeclared-invention\]/.test(r.stderr),
      "expected a P1 [undeclared-invention] line; got:\n" + r.stderr,
    );
  });

  it("a dead-end-only flow exits 0 and prints the P2 line", function () {
    var data = {
      meta: { feature: "CLI dead-end-only" },
      screens: [{ id: "a", name: "A", content: [] }],
    };
    var r = runCli(data);
    assert.strictEqual(
      r.status,
      0,
      "expected exit 0, got " + r.status + ": " + r.stderr,
    );
    assert.ok(
      /P2 \[prototype-dead-end\]/.test(r.stderr),
      "expected a P2 [prototype-dead-end] line; got:\n" + r.stderr,
    );
  });
});
