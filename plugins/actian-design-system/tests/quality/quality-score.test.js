#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");

var q = require("../../scripts/quality/quality-score.js");

describe("tokenGate", function () {
  it("is 1.0 when there are no findings", function () {
    var g = q.tokenGate({
      findings: [],
      counts: { refsChecked: 50, contrastChecks: 12 },
    });
    assert.strictEqual(g.brokenRefRate, 1);
    assert.strictEqual(g.contrastRate, 1);
    assert.strictEqual(g.score, 1);
  });

  it("computes per-type pass-rates from findings and counts", function () {
    var findings = [
      { rule: "broken-ref", severity: "error", token: "--zen-x", message: "" },
      {
        rule: "contrast",
        severity: "error",
        token: "link [studio]",
        message: "",
      },
      {
        rule: "contrast",
        severity: "error",
        token: "link [explorer]",
        message: "",
      },
    ];
    var g = q.tokenGate({
      findings: findings,
      counts: { refsChecked: 50, contrastChecks: 12 },
    });
    assert.strictEqual(g.brokenRefRate, (50 - 1) / 50); // 0.98
    assert.strictEqual(g.contrastRate, (12 - 2) / 12); // ~0.833
    assert.strictEqual(g.score, (g.brokenRefRate + g.contrastRate) / 2);
  });

  it("treats a zero denominator as a full pass (no checks = nothing failing)", function () {
    var g = q.tokenGate({
      findings: [],
      counts: { refsChecked: 0, contrastChecks: 0 },
    });
    assert.strictEqual(g.score, 1);
  });

  it("clamps rate to [0,1] when fails exceed total", function () {
    assert.strictEqual(q.rate(10, 11), 0);
  });
});

describe("structuralGate (structural pass-rate)", function () {
  it("is n/a (null) when there are no Program-C rows", function () {
    var g = q.structuralGate({ count: 0, structuralPass: 0, pixelPass: 0 });
    assert.strictEqual(g.score, null);
    assert.strictEqual(g.total, 0);
  });
  it("scores the structural pass-rate over all rows (pixel is not scored)", function () {
    var g = q.structuralGate({
      count: 4,
      structuralPass: 3,
      pixelPass: 1,
      pixelFail: 1,
      pixelSkip: 2,
    });
    assert.strictEqual(g.score, 0.75);
    assert.strictEqual(g.structuralPass, 3);
    assert.strictEqual(g.total, 4);
    assert.strictEqual(g.pixelPass, 1);
    assert.strictEqual(g.pixelFail, 1);
    assert.strictEqual(g.pixelSkip, 2);
  });
});

describe("composeScore", function () {
  it("averages only gates that have data, ×100, rounded", function () {
    var row = q.composeScore({
      date: "2026-06-15",
      tokens: { brokenRefRate: 1, contrastRate: 0.8, score: 0.9, errors: 2 },
      structural: { score: 0.5, structuralPass: 2, total: 3 },
    });
    assert.strictEqual(row.score, 70); // mean(0.9, 0.5) = 0.7 → 70
    assert.strictEqual(row.scope, "ecosystem");
    assert.strictEqual(row.app, null);
    assert.strictEqual(row.theme, null);
    assert.strictEqual(row.gates.tokens.score, 0.9);
    assert.strictEqual(row.gates.structural.score, 0.5);
  });

  it("excludes a null-score gate from the headline", function () {
    var row = q.composeScore({
      date: "2026-06-15",
      tokens: { brokenRefRate: 1, contrastRate: 1, score: 1, errors: 0 },
      structural: { score: null, structuralPass: 0, total: 7 },
    });
    assert.strictEqual(row.score, 100); // only tokens counts → mean(1) = 1 → 100
  });

  it("carries optional app/theme/context axes through", function () {
    var row = q.composeScore({
      date: "2026-06-15",
      scope: "component",
      app: "studio",
      theme: "studio",
      tokens: { brokenRefRate: 1, contrastRate: 1, score: 1, errors: 0 },
      structural: { score: null, structuralPass: 0, total: 0 },
    });
    assert.strictEqual(row.scope, "component");
    assert.strictEqual(row.app, "studio");
    assert.strictEqual(row.theme, "studio");
  });

  it("produces a null headline when all gates are null", function () {
    var row = q.composeScore({
      date: "2026-06-15",
      tokens: { score: null },
      structural: { score: null },
    });
    assert.strictEqual(row.score, null);
  });

  it("does not throw when a gate is omitted (defensive)", function () {
    var row = q.composeScore({ date: "2026-06-15" });
    assert.strictEqual(row.score, null);
    assert.deepStrictEqual(row.gates.tokens, {});
    assert.deepStrictEqual(row.gates.structural, {});
  });
});

describe("noChecksRan", function () {
  it("is true when both denominators are zero", function () {
    assert.strictEqual(
      q.noChecksRan({ refsChecked: 0, contrastChecks: 0 }),
      true,
    );
    assert.strictEqual(q.noChecksRan({}), true);
    assert.strictEqual(q.noChecksRan(), true);
  });
  it("is false when any check ran", function () {
    assert.strictEqual(
      q.noChecksRan({ refsChecked: 50, contrastChecks: 0 }),
      false,
    );
    assert.strictEqual(
      q.noChecksRan({ refsChecked: 0, contrastChecks: 12 }),
      false,
    );
  });
});

var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");

describe("ledger + formatReport", function () {
  it("appends a row and reads it back", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "qledger-"));
    var file = path.join(dir, "quality-ledger.jsonl");
    var row = { date: "2026-06-15", scope: "ecosystem", score: 83, gates: {} };
    q.appendRow(file, row);
    q.appendRow(file, {
      date: "2026-06-16",
      scope: "ecosystem",
      score: 90,
      gates: {},
    });
    var rows = q.readLedger(file);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[1].score, 90);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("readLedger returns [] for a missing file", function () {
    assert.deepStrictEqual(q.readLedger("/no/such/quality-ledger.jsonl"), []);
  });

  it("formatReport renders the headline + gate breakdown", function () {
    var report = q.formatReport({
      date: "2026-06-15",
      scope: "ecosystem",
      score: 70,
      gates: {
        tokens: {
          brokenRefRate: 1,
          contrastRate: 0.83,
          score: 0.92,
          errors: 2,
        },
        structural: {
          score: 0.75,
          structuralPass: 3,
          total: 4,
          pixelPass: 0,
          pixelFail: 1,
          pixelSkip: 2,
        },
      },
    });
    assert.match(report, /DS Quality Score: 70/);
    assert.match(report, /tokens/);
    assert.match(report, /refs 100%/);
    assert.match(report, /structural : 75\/100/);
    assert.match(report, /visual/);
    assert.match(report, /1 fail, 2 skipped, 0 verified/);
  });

  it("renders n/a for a null token score and a null structural score", function () {
    var report = q.formatReport({
      date: "2026-06-15",
      scope: "ecosystem",
      score: null,
      gates: {
        tokens: { score: null },
        structural: {
          score: null,
          structuralPass: 0,
          total: 0,
          pixelPass: 0,
          pixelFail: 0,
          pixelSkip: 0,
        },
      },
    });
    assert.match(report, /tokens     : n\/a/);
    assert.match(report, /structural : n\/a/);
    assert.match(report, /visual     : n\/a/);
  });

  it("readLedger skips malformed lines instead of throwing", function () {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "qledger-bad-"));
    var file = path.join(dir, "ledger.jsonl");
    fs.writeFileSync(
      file,
      '{"slug":"a","score":1}\n' +
        "not json at all\n" +
        '{"slug":"b","score":2}\n',
    );
    var rows = q.readLedger(file);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[1].slug, "b");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
