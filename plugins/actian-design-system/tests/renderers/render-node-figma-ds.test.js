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
  it("emits a real DS Kit instance for a library:ds node (ref shape — convert-to-hifi path)", function () {
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

  it("emits a real DS Kit instance for a dsSlug-only node (canonical --hifi flow shape, no ref)", function () {
    // This is the CANONICAL shape from generate-flow --hifi recipes.
    // The node carries dsSlug (kebab) and NO ref — the emitter must derive
    // the lookup ref via slugToRef("button","ds") = "dsButton".
    var expectedKey = DS_KEYS[shared.slugToRef("button", "ds")].key;
    var nodes = [
      {
        type: "INSTANCE",
        library: "ds",
        dsSlug: "button",
        variant: "Type=Default, State=Focused",
        props: { "Placeholder text": "Search…" },
      },
    ];
    var out = rnf.emit(nodes, "1:2");
    var code = out.code;
    assert.ok(
      code.indexOf("importComponentByKeyAsync") !== -1 ||
        code.indexOf("importComponentSetByKeyAsync") !== -1,
      "emits an import call",
    );
    assert.ok(code.indexOf(expectedKey) !== -1, "emits the DS Kit button key");
    assert.ok(code.indexOf("createInstance") !== -1, "calls createInstance");
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

  it("fails loud (exit 1) on an unknown DS dsSlug, naming it", function () {
    // Bogus dsSlug — no ref — must still fail loud and name the slug
    var spec = JSON.stringify({
      content: [
        {
          type: "INSTANCE",
          library: "ds",
          dsSlug: "not-a-real-slug",
          variant: "Type=Default",
        },
      ],
    });
    var r = cp.spawnSync(process.execPath, [CLI, "--parent-id", "1:2"], {
      input: spec,
      encoding: "utf8",
    });
    assert.strictEqual(r.status, 1, "exits 1 on unknown dsSlug");
    assert.ok(
      (r.stderr || "").indexOf("not-a-real-slug") !== -1,
      "error names the bad dsSlug",
    );
    assert.strictEqual(
      (r.stdout || "").trim(),
      "",
      "no Plugin API code on invalid spec",
    );
  });

  it("fails loud (exit 1) when dsSlug is set but library is not 'ds' (validation gap)", function () {
    // An INSTANCE with dsSlug but no library (or library:"fm") must be
    // rejected at structural validation — not silently skipped then crash
    // in emitInstance with FM_KEYS[undefined].method.
    var spec = JSON.stringify({
      content: [
        {
          type: "INSTANCE",
          dsSlug: "button",
          // deliberately omit library (or could be "fm") — no ref either
          variant: "Type=Primary",
        },
      ],
    });
    var r = cp.spawnSync(process.execPath, [CLI, "--parent-id", "1:2"], {
      input: spec,
      encoding: "utf8",
    });
    assert.strictEqual(r.status, 1, "exits 1 on dsSlug without library:ds");
    assert.ok(
      (r.stderr || "").indexOf("library") !== -1 ||
        (r.stderr || "").indexOf("dsSlug") !== -1,
      "error mentions library or dsSlug requirement",
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
