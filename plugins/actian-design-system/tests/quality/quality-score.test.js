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
});

describe("fidelityGate", function () {
  it("is n/a (null score) when no components are scored", function () {
    var g = q.fidelityGate({
      count: 7,
      scored: 0,
      skipped: 7,
      meanScore: null,
    });
    assert.strictEqual(g.score, null);
    assert.strictEqual(g.scored, 0);
  });

  it("uses the ledger meanScore when components are scored", function () {
    var g = q.fidelityGate({ count: 3, scored: 2, skipped: 1, meanScore: 0.5 });
    assert.strictEqual(g.score, 0.5);
    assert.strictEqual(g.scored, 2);
  });
});

describe("composeScore", function () {
  it("averages only gates that have data, ×100, rounded", function () {
    var row = q.composeScore({
      date: "2026-06-15",
      tokens: { brokenRefRate: 1, contrastRate: 0.8, score: 0.9, errors: 2 },
      fidelity: { score: 0.5, scored: 2, total: 3 },
    });
    assert.strictEqual(row.score, 70); // mean(0.9, 0.5) = 0.7 → 70
    assert.strictEqual(row.scope, "ecosystem");
    assert.strictEqual(row.app, null);
    assert.strictEqual(row.theme, null);
    assert.strictEqual(row.gates.tokens.score, 0.9);
    assert.strictEqual(row.gates.fidelity.score, 0.5);
  });

  it("excludes a null-score gate from the headline", function () {
    var row = q.composeScore({
      date: "2026-06-15",
      tokens: { brokenRefRate: 1, contrastRate: 1, score: 1, errors: 0 },
      fidelity: { score: null, scored: 0, total: 7 },
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
      fidelity: { score: null, scored: 0, total: 0 },
    });
    assert.strictEqual(row.scope, "component");
    assert.strictEqual(row.app, "studio");
    assert.strictEqual(row.theme, "studio");
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
        fidelity: { score: 0.5, scored: 2, total: 3 },
      },
    });
    assert.match(report, /DS Quality Score: 70/);
    assert.match(report, /tokens/);
    assert.match(report, /fidelity/);
  });
});
