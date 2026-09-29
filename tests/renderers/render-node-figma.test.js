"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var validateNode = require("../../plugins/actian-design-system/scripts/renderers/html-renderers/validate-node.js");

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
  __dirname, "../../plugins/actian-design-system/scripts/renderers/html-renderers/render-node-figma.js",
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

describe("render-node-figma — INSTANCE", function () {
  it("emits import + createInstance + setProperties for an FM ref", function () {
    var r = runEmitter(
      {
        content: [
          {
            type: "INSTANCE",
            ref: "fmButton",
            props: { Label: "Save" },
          },
        ],
      },
      "1:1",
    );
    assert.equal(r.status, 0);
    var js = r.stdout;
    assert.match(js, /importComponent(Set)?ByKeyAsync\(/);
    assert.match(js, /createInstance\(\)/);
    assert.match(js, /setProperties\(/);
  });

  it("rejects an INSTANCE whose ref is not in the registry", function () {
    var r = runEmitter(
      { content: [{ type: "INSTANCE", ref: "fmNope" }] },
      "1:1",
    );
    assert.equal(r.status, 1);
  });

  it("single-method ref (fmChip) uses importComponentByKeyAsync, not importComponentSetByKeyAsync, and calls createInstance()", function () {
    // fmChip is the first ref in the registry whose method is not "set".
    // This exercises the else-branch in emitInstance (importComponentByKeyAsync
    // + .createInstance() without .defaultVariant).
    var r = runEmitter(
      {
        content: [
          {
            type: "INSTANCE",
            ref: "fmChip",
          },
        ],
      },
      "1:1",
    );
    assert.equal(r.status, 0);
    var js = r.stdout;
    assert.match(js, /importComponentByKeyAsync\(/);
    assert.doesNotMatch(js, /importComponentSetByKeyAsync\(/);
    assert.match(js, /\.createInstance\(\)/);
  });
});

describe("render-node-figma — assembly", function () {
  it("preloads fonts before any node, appends roots into --parent-id, sets FILL after append, returns IDs", function () {
    var r = runEmitter(
      {
        content: [
          {
            type: "FRAME",
            sizing: { horizontal: "FILL" },
            children: [
              { type: "TEXT", content: "Hi", font: "Inter:Regular", size: 12 },
            ],
          },
        ],
      },
      "42:7",
    );
    assert.equal(r.status, 0);
    var js = r.stdout;
    // font preload precedes the first createText
    assert.ok(
      js.indexOf("loadFontAsync") < js.indexOf("createText"),
      "preload before create",
    );
    // appended into the parent retrieved by id
    assert.match(js, /getNodeByIdAsync\(\s*["']42:7["']\s*\)/);
    assert.match(js, /\.appendChild\(/);
    // FILL applied after append (layoutSizingHorizontal appears after the append call)
    assert.ok(
      js.lastIndexOf("appendChild") < js.indexOf("layoutSizingHorizontal"),
      "FILL after append",
    );
    // atomic return shape
    assert.match(js, /return\s*\{\s*createdNodeIds:/);
    assert.match(js, /mutatedNodeIds:/);
  });
});

describe("render-node-figma: screen push fixes (D5)", function () {
  var emit = require("../../plugins/actian-design-system/scripts/renderers/html-renderers/render-node-figma.js").emit;
  it("defaults text to Roboto", function () {
    var js = emit([{ type: "TEXT", text: "Hi" }], "1:2").code;
    assert.match(js, /family: "Roboto"/);
    assert.ok(!/Inter/.test(js));
  });
  it("places an absolute child with x and y", function () {
    var js = emit([{ type: "FRAME", layout: { mode: "VERTICAL" }, children: [{ type: "FRAME", positioning: "absolute", x: 890, y: 0, children: [] }] }], "1:2").code;
    assert.match(js, /layoutPositioning = "ABSOLUTE"/);
    assert.match(js, /\.x = 890;/);
    assert.match(js, /\.y = 0;/);
  });
  it("accepts positioning, x and y in a validated tree", function () {
    var errors = validateNode.validateTree({ type: "FRAME", positioning: "absolute", x: 1, y: 2, children: [] });
    assert.deepEqual(errors, []);
  });
  it("reads a three-digit hex without NaN", function () {
    var js = emit([{ type: "FRAME", fills: ["#fff"], children: [] }], "1:2").code;
    assert.ok(!/NaN/.test(js));
    assert.match(js, /r:1, g:1, b:1/);
  });
});

describe("render-node-figma: second review (code-review high, #426)", function () {
  var emit = require("../../plugins/actian-design-system/scripts/renderers/html-renderers/render-node-figma.js").emit;
  it("keeps the alpha of #RRGGBBAA as the paint's opacity", function () {
    var js = emit([{ type: "FRAME", fills: ["#00000066"], children: [] }], "1:2").code;
    assert.match(js, /color: \{ r:0, g:0, b:0 \}, opacity: 0\.4/);
  });
  it("never sets FILL sizing on an absolute child", function () {
    var js = emit([{ type: "FRAME", layout: { mode: "VERTICAL" }, children: [{ type: "FRAME", positioning: "absolute", x: 0, y: 0, sizing: { horizontal: "FILL", vertical: "FILL" }, children: [] }] }], "1:2").code;
    assert.ok(!/root0_c0\.layoutSizing(Horizontal|Vertical) = 'FILL'/.test(js), js);
  });
  it("sets layoutPositioning only inside an auto-layout parent, x and y always", function () {
    var js = emit([{ type: "FRAME", children: [{ type: "FRAME", positioning: "absolute", x: 5, y: 6, children: [] }] }], "1:2").code;
    assert.ok(!/layoutPositioning/.test(js));
    assert.match(js, /root0_c0\.x = 5;/);
  });
  it("validates positioning and x, y values", function () {
    assert.ok(validateNode.validateTree({ type: "FRAME", positioning: "fixed", children: [] }).length > 0);
    assert.ok(validateNode.validateTree({ type: "FRAME", positioning: "absolute", x: "right", children: [] }).length > 0);
  });
});
