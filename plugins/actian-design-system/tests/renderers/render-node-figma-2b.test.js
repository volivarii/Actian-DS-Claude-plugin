#!/usr/bin/env node
// tests/renderers/render-node-figma-2b.test.js
// TDD for Task 2b: emitInstance sizing fix, emitFrame minHeight, whole-tree smoke.
//
// Phase RED (before fixes):
//   - T1/T2: emitInstance drops FILL sizing → tests fail (no layoutSizingHorizontal/Vertical)
//   - T4: emitFrame ignores minHeight → test fails (no .minHeight = 960 in output)
//   - T5: already passes (no minHeight emitted)
//   - T6: whole-tree fails because minHeight validation blocks OR sizing dropped on INSTANCE nodes
//   - T3: FM regression — already passes
//
// Phase GREEN (after fixes in render-node-figma.js + validate-node.js):
//   All tests pass.
//
// Run: source scripts/lib/resolve-node.sh && "$NODE_BIN" --test tests/renderers/render-node-figma-2b.test.js

"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("node:path");

var shared = require(
  path.resolve(__dirname, "..", "..", "scripts", "lib", "shared-constants.js"),
);
var rnf = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "html-renderers",
    "render-node-figma.js",
  ),
);
var dst = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "html-renderers",
    "ds-screen-tree.js",
  ),
);

var DS_KEYS = shared.buildKeyMapFromRegistry("dskit", "ds");

describe("render-node-figma — 2b: emitInstance sizing + emitFrame minHeight + whole-tree smoke", function () {

  // ---------------------------------------------------------------------------
  // T1: DS INSTANCE with sizing.horizontal FILL → post-append layoutSizingHorizontal
  // ---------------------------------------------------------------------------
  it("DS INSTANCE with sizing.horizontal:FILL emits layoutSizingHorizontal = 'FILL' post-append (RED: sizing dropped before fix)", function () {
    var nodes = [
      {
        type: "INSTANCE",
        library: "ds",
        dsSlug: "button",
        sizing: { horizontal: "FILL" },
      },
    ];
    var out = rnf.emit(nodes, "parent:1");
    var code = out.code;
    assert.ok(
      code.indexOf("layoutSizingHorizontal") !== -1,
      "emits layoutSizingHorizontal for DS INSTANCE",
    );
    assert.ok(code.indexOf("'FILL'") !== -1, "value is 'FILL'");
    // The FILL assignment must appear AFTER the parent appendChild (post-append contract)
    var lastAppend = code.lastIndexOf("__parent.appendChild");
    var sizeIdx = code.indexOf("layoutSizingHorizontal");
    assert.ok(
      sizeIdx > lastAppend,
      "FILL sizing applied after appendChild (post-append contract)",
    );
  });

  // ---------------------------------------------------------------------------
  // T2: DS INSTANCE with sizing.vertical FILL → post-append layoutSizingVertical
  // ---------------------------------------------------------------------------
  it("DS INSTANCE with sizing.vertical:FILL emits layoutSizingVertical = 'FILL' post-append (RED: sizing dropped before fix)", function () {
    var nodes = [
      {
        type: "INSTANCE",
        library: "ds",
        dsSlug: "side-nav",
        variant: "App=Studio, View=Expanded",
        sizing: { vertical: "FILL" },
      },
    ];
    var out = rnf.emit(nodes, "parent:1");
    var code = out.code;
    assert.ok(
      code.indexOf("layoutSizingVertical") !== -1,
      "emits layoutSizingVertical for DS INSTANCE",
    );
    var lastAppend = code.lastIndexOf("__parent.appendChild");
    var sizeIdx = code.indexOf("layoutSizingVertical");
    assert.ok(
      sizeIdx > lastAppend,
      "FILL sizing applied after appendChild (post-append contract)",
    );
  });

  // ---------------------------------------------------------------------------
  // T3: FM INSTANCE regression — unchanged after the ctx threading
  // ---------------------------------------------------------------------------
  it("FM INSTANCE emit unchanged — createInstance + setProperties (regression)", function () {
    var nodes = [
      {
        type: "INSTANCE",
        ref: "fmButton",
        props: { "Label#text": "Go" },
      },
    ];
    var out = rnf.emit(nodes, "parent:1");
    var code = out.code;
    assert.ok(code.indexOf("createInstance") !== -1, "FM: createInstance present");
    assert.ok(code.indexOf("setProperties") !== -1, "FM: setProperties present");
    // FM nodes have no sizing → no FILL entries leaked
    assert.ok(
      code.indexOf("layoutSizingHorizontal") === -1,
      "FM: no spurious horizontal FILL",
    );
    assert.ok(
      code.indexOf("layoutSizingVertical") === -1,
      "FM: no spurious vertical FILL",
    );
  });

  // ---------------------------------------------------------------------------
  // T4: emitFrame emits .minHeight when node.minHeight is set
  // ---------------------------------------------------------------------------
  it("emitFrame emits .minHeight = 960 when node.minHeight is 960 (RED: not emitted before fix)", function () {
    var nodes = [
      {
        type: "FRAME",
        name: "Screen",
        layout: { mode: "VERTICAL" },
        sizing: { horizontal: 1440 },
        minHeight: 960,
        children: [],
      },
    ];
    var out = rnf.emit(nodes, "parent:1");
    var code = out.code;
    assert.ok(
      code.indexOf(".minHeight = 960;") !== -1,
      "emits .minHeight = 960; on frame with minHeight set",
    );
  });

  // ---------------------------------------------------------------------------
  // T5: emitFrame omits .minHeight when not set (already passes — regression guard)
  // ---------------------------------------------------------------------------
  it("emitFrame does NOT emit .minHeight when node.minHeight is absent", function () {
    var nodes = [
      {
        type: "FRAME",
        name: "Ordinary Frame",
        layout: { mode: "VERTICAL" },
        children: [],
      },
    ];
    var out = rnf.emit(nodes, "parent:1");
    assert.ok(
      out.code.indexOf(".minHeight") === -1,
      "no .minHeight emitted when property absent",
    );
  });

  // ---------------------------------------------------------------------------
  // T6: Whole-tree smoke — screenTree → emit → chrome keys + content present
  // ---------------------------------------------------------------------------
  it("whole-tree smoke — screenTree(studio+sidebar+pageHeader+content) fed to emit contains chrome DS keys and content node", function () {
    var screen = {
      name: "Studio Test",
      template: "studio",
      library: "ds",
      header: {},
      sidebar: { items: ["Catalog", "Lineage"], activeItem: "Catalog" },
      pageHeader: { title: "Catalog", subtitle: "Browse" },
      content: [
        {
          type: "TEXT",
          content: "Hello from content",
          font: "Inter:Regular",
        },
      ],
    };
    var tree = dst.screenTree(screen);

    // Resolve expected DS Kit keys
    var globalHeaderKey = DS_KEYS[shared.slugToRef("global-header", "ds")].key;
    var sideNavKey = DS_KEYS[shared.slugToRef("side-nav", "ds")].key;
    var pageHeaderKey = DS_KEYS[shared.slugToRef("page-header", "ds")].key;

    var out = rnf.emit([tree], "parent:1");
    var code = out.code;

    assert.ok(
      code.indexOf(globalHeaderKey) !== -1,
      "global-header DS Kit key present in emitted JS",
    );
    assert.ok(
      code.indexOf(sideNavKey) !== -1,
      "side-nav DS Kit key present in emitted JS",
    );
    assert.ok(
      code.indexOf(pageHeaderKey) !== -1,
      "page-header DS Kit key present in emitted JS",
    );
    assert.ok(
      code.indexOf("Hello from content") !== -1,
      "content TEXT node present in emitted JS",
    );
    assert.ok(
      code.indexOf(".minHeight = 960;") !== -1,
      "root screen frame has minHeight = 960",
    );
    // Global-header and sidebar must have post-append FILL sizing
    assert.ok(
      code.indexOf("layoutSizingHorizontal") !== -1,
      "chrome FILL horizontal sizing applied (global-header, etc.)",
    );
    assert.ok(
      code.indexOf("layoutSizingVertical") !== -1,
      "sidebar FILL vertical sizing applied",
    );
  });
});
