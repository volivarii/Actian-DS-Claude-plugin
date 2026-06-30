#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("node:path");
var cp = require("node:child_process");
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
var CLI = path.resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
  "render-node-figma.js",
);

var DS_KEYS = shared.buildKeyMapFromRegistry("dskit", "ds");

describe("render-node-figma — DS tier", function () {
  it("emits a real DS Kit instance for a library:ds node", function () {
    var dsBtnKey = DS_KEYS["dsButton"].key;
    var nodes = [
      {
        type: "INSTANCE",
        library: "ds",
        ref: "dsButton",
        variant: { Type: "Primary" },
        props: { "Label#text": "Save" },
      },
    ];
    var out = rnf.emit(nodes, "1:2");
    var code = out.code;
    assert.ok(
      code.indexOf("importComponentByKeyAsync") !== -1 ||
        code.indexOf("importComponentSetByKeyAsync") !== -1,
    );
    assert.ok(code.indexOf(dsBtnKey) !== -1, "emits the DS Kit component key");
    assert.ok(code.indexOf("createInstance") !== -1);
    assert.ok(code.indexOf("setProperties") !== -1, "sets instance properties");
  });

  it("fails loud (exit 1) on an unknown DS ref, naming it", function () {
    var spec = JSON.stringify({
      content: [
        { type: "INSTANCE", library: "ds", ref: "dsNotARealComponent" },
      ],
    });
    var r = cp.spawnSync(process.execPath, [CLI, "--parent-id", "1:2"], {
      input: spec,
      encoding: "utf8",
    });
    assert.strictEqual(r.status, 1);
    assert.ok(
      (r.stderr || "").indexOf("dsNotARealComponent") !== -1,
      "error names the bad ref",
    );
    assert.strictEqual(
      (r.stdout || "").trim(),
      "",
      "no Plugin API code on invalid spec",
    );
  });

  it("still emits FM instances unchanged (regression)", function () {
    var nodes = [
      { type: "INSTANCE", ref: "fmButton", props: { "Label#text": "Go" } },
    ];
    var out = rnf.emit(nodes, "1:2");
    assert.ok(out.code.indexOf("createInstance") !== -1);
  });
});
