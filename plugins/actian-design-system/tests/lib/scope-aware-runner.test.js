#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  parseScope,
  runGate,
  matchesPattern,
} = require("../../scripts/lib/scope-aware-runner.js");

describe("parseScope", function () {
  it("parses 'full'", function () {
    var p = parseScope("full");
    assert.strictEqual(p.kind, "full");
  });

  it("parses 'single-unit:<id>'", function () {
    var p = parseScope("single-unit:settings-2");
    assert.strictEqual(p.kind, "single-unit");
    assert.deepStrictEqual(p.ids, ["settings-2"]);
  });

  it("parses 'multi-unit:[id1,id2]'", function () {
    var p = parseScope("multi-unit:[settings-1,settings-3]");
    assert.strictEqual(p.kind, "multi-unit");
    assert.deepStrictEqual(p.ids, ["settings-1", "settings-3"]);
  });

  it("parses multi-unit with whitespace tolerance", function () {
    var p = parseScope("multi-unit:[a, b, c]");
    assert.deepStrictEqual(p.ids, ["a", "b", "c"]);
  });

  it("treats undefined/null/empty as 'full'", function () {
    assert.strictEqual(parseScope(undefined).kind, "full");
    assert.strictEqual(parseScope(null).kind, "full");
    assert.strictEqual(parseScope("").kind, "full");
  });

  it("treats unknown form as 'full' with unrecognized flag", function () {
    var p = parseScope("garbage");
    assert.strictEqual(p.kind, "full");
    assert.strictEqual(p.unrecognized, true);
  });

  it("treats 'single-unit' without colon as unrecognized", function () {
    var p = parseScope("single-unit");
    assert.strictEqual(p.kind, "full");
    assert.strictEqual(p.unrecognized, true);
  });
});

describe("matchesPattern", function () {
  it("matches exact scope.raw", function () {
    var s = parseScope("single-unit:s1");
    s.raw = "single-unit:s1";
    assert.strictEqual(matchesPattern(s, "single-unit:s1"), true);
  });

  it("matches wildcard prefix 'single-unit:*'", function () {
    var s = parseScope("single-unit:anything");
    s.raw = "single-unit:anything";
    assert.strictEqual(matchesPattern(s, "single-unit:*"), true);
  });

  it("does not match wildcard from different prefix", function () {
    var s = parseScope("single-unit:s1");
    s.raw = "single-unit:s1";
    assert.strictEqual(matchesPattern(s, "multi-unit:*"), false);
  });

  it("does not match 'full' against 'single-unit:*'", function () {
    var s = parseScope("full");
    s.raw = "full";
    assert.strictEqual(matchesPattern(s, "single-unit:*"), false);
  });
});

describe("runGate", function () {
  function fakeGate(findings, cfg) {
    return {
      gateConfig: cfg || {},
      run: function () {
        return { findings: findings.slice() };
      },
    };
  }

  it("runs gate with no scope = no filter, no skip, returns all findings", function () {
    var g = fakeGate([
      { kind: "x", screen: "s1" },
      { kind: "x", screen: "s2" },
    ]);
    var result = runGate(g, {}, {});
    assert.strictEqual(result.findings.length, 2);
    assert.strictEqual(result.skipped, undefined);
  });

  it("skips gate matching skipWhenScope (opts.scope)", function () {
    var g = fakeGate([{ kind: "x" }], {
      skipWhenScope: ["single-unit:*"],
    });
    var result = runGate(g, {}, { scope: "single-unit:s1" });
    assert.strictEqual(result.skipped, true);
    assert.ok(result.reason.indexOf("single-unit:s1") !== -1);
    assert.deepStrictEqual(result.findings, []);
  });

  it("does not skip gate when scope is 'full' and rule is 'single-unit:*'", function () {
    var g = fakeGate([{ kind: "x" }], {
      skipWhenScope: ["single-unit:*"],
    });
    var result = runGate(g, {}, { scope: "full" });
    assert.strictEqual(result.skipped, undefined);
    assert.strictEqual(result.findings.length, 1);
  });

  it("filters findings by scope (single-unit)", function () {
    var g = fakeGate(
      [
        { kind: "x", screen: "s1" },
        { kind: "x", screen: "s2" },
        { kind: "x", screen: "s3" },
      ],
      {
        filterFindingsByScope: function (f, scope) {
          if (scope.kind === "full") return true;
          return scope.ids.indexOf(f.screen) !== -1;
        },
      },
    );
    var result = runGate(g, {}, { scope: "single-unit:s2" });
    assert.strictEqual(result.findings.length, 1);
    assert.strictEqual(result.findings[0].screen, "s2");
  });

  it("filters findings by scope (multi-unit keeps multiple)", function () {
    var g = fakeGate(
      [
        { kind: "x", screen: "s1" },
        { kind: "x", screen: "s2" },
        { kind: "x", screen: "s3" },
      ],
      {
        filterFindingsByScope: function (f, scope) {
          if (scope.kind === "full") return true;
          return scope.ids.indexOf(f.screen) !== -1;
        },
      },
    );
    var result = runGate(g, {}, { scope: "multi-unit:[s1,s3]" });
    assert.strictEqual(result.findings.length, 2);
  });

  it("findings without screen pass through filter (heuristic: schema-level)", function () {
    var g = fakeGate(
      [
        { kind: "schema-error" /* no screen */ },
        { kind: "x", screen: "s2" },
      ],
      {
        filterFindingsByScope: function (f, scope) {
          if (scope.kind === "full") return true;
          if (!f.screen) return true;
          return scope.ids.indexOf(f.screen) !== -1;
        },
      },
    );
    var result = runGate(g, {}, { scope: "single-unit:s99" });
    assert.strictEqual(result.findings.length, 1);
    assert.strictEqual(result.findings[0].kind, "schema-error");
  });

  it("filter is no-op when gateConfig.filterFindingsByScope is missing", function () {
    var g = fakeGate(
      [
        { kind: "x", screen: "s1" },
        { kind: "x", screen: "s2" },
      ],
      {},
    );
    var result = runGate(g, {}, { scope: "single-unit:s1" });
    assert.strictEqual(result.findings.length, 2);
  });

  it("passes opts.skipTokens etc through to gate.run", function () {
    var capturedOpts;
    var g = {
      gateConfig: {},
      run: function (data, opts) {
        capturedOpts = opts;
        return { findings: [] };
      },
    };
    runGate(g, {}, { scope: "full", skipTokens: true, skipTerminology: true });
    assert.strictEqual(capturedOpts.skipTokens, true);
    assert.strictEqual(capturedOpts.skipTerminology, true);
  });
});
