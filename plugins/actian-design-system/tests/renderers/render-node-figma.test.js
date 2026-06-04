"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var validateNode = require("../../scripts/renderers/html-renderers/validate-node.js");

describe("validate-node — flow-field coverage", function () {
  it("accepts a flow content node carrying `intent`", function () {
    var errors = validateNode.validateTree({
      type: "INSTANCE",
      ref: "fmButton",
      intent: "destructive-action",
    });
    assert.deepEqual(errors, []);
  });

  it("still rejects an unknown/fidelity key", function () {
    var errors = validateNode.validateTree({
      type: "FRAME",
      className: "fm-x",
    });
    assert.ok(
      errors.some(function (e) {
        return e.path === "className";
      }),
    );
  });
});

var cp = require("node:child_process");
var path = require("node:path");
var EMITTER = path.resolve(
  __dirname,
  "../../scripts/renderers/html-renderers/render-node-figma.js",
);

function runEmitter(specObj, parentId) {
  return cp.spawnSync(
    process.execPath,
    [EMITTER, "--parent-id", parentId || "1:1"],
    {
      input: JSON.stringify(specObj),
      encoding: "utf8",
    },
  );
}

describe("render-node-figma — CLI + gate", function () {
  it("rejects an invalid tree with exit 1 + structured errors on stderr", function () {
    var r = runEmitter({ content: [{ type: "BOGUS" }] }, "1:1");
    assert.equal(r.status, 1);
    var report = JSON.parse(r.stderr);
    assert.equal(report.ok, false);
    assert.ok(report.errors.length >= 1);
    assert.equal(r.stdout.trim(), "");
  });

  it("accepts a valid empty tree with exit 0", function () {
    var r = runEmitter({ content: [] }, "1:1");
    assert.equal(r.status, 0);
  });
});

describe("render-node-figma — FRAME", function () {
  it("emits an auto-layout frame with mapped layout/sizing/fills", function () {
    var r = runEmitter(
      {
        content: [
          {
            type: "FRAME",
            name: "Row",
            layout: {
              mode: "HORIZONTAL",
              spacing: 8,
              primaryAxisAlignItems: "SPACE_BETWEEN",
            },
            sizing: { horizontal: "FILL" },
            fills: ["#FFFFFF"],
            cornerRadius: 4,
          },
        ],
      },
      "1:1",
    );
    assert.equal(r.status, 0);
    var js = r.stdout;
    assert.match(js, /createFrame\(\)/);
    assert.match(js, /layoutMode\s*=\s*["']HORIZONTAL["']/);
    assert.match(js, /itemSpacing\s*=\s*8/);
    assert.match(js, /primaryAxisAlignItems\s*=\s*["']SPACE_BETWEEN["']/);
    assert.match(js, /topLeftRadius\s*=\s*4/);
  });
});

describe("render-node-figma — TEXT", function () {
  it("emits a text node with font preload, literal size, object lineHeight", function () {
    var r = runEmitter(
      {
        content: [
          {
            type: "TEXT",
            content: "Hello",
            font: "Inter:Medium",
            size: 14,
            color: "#1A1A1A",
            lineHeight: { value: 20, unit: "PIXELS" },
          },
        ],
      },
      "1:1",
    );
    assert.equal(r.status, 0);
    var js = r.stdout;
    assert.match(
      js,
      /loadFontAsync\(\s*\{[^}]*family:\s*["']Inter["'][^}]*style:\s*["']Medium["']/,
    );
    assert.match(js, /createText\(\)/);
    assert.match(js, /\.characters\s*=\s*"Hello"/);
    assert.match(js, /\.fontSize\s*=\s*14/);
    assert.match(
      js,
      /lineHeight\s*=\s*\{\s*value:\s*20,\s*unit:\s*["']PIXELS["']/,
    );
  });
});

describe("render-node-figma — shapes", function () {
  it("emits rect, ellipse, divider", function () {
    var r = runEmitter(
      {
        content: [
          {
            type: "RECT",
            width: 32,
            height: 8,
            fills: ["#CBD2E0"],
            cornerRadius: 2,
          },
          { type: "ELLIPSE", width: 16, height: 16, fills: ["#888888"] },
          { type: "DIVIDER" },
        ],
      },
      "1:1",
    );
    assert.equal(r.status, 0);
    var js = r.stdout;
    assert.match(js, /createRectangle\(\)/);
    assert.match(js, /createEllipse\(\)/);
    assert.match(js, /createLine\(\)|createRectangle\(\)[\s\S]*height\s*=\s*1/);
  });
});
