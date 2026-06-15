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
