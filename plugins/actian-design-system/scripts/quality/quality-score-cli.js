#!/usr/bin/env node
"use strict";

// Computes the DS Quality Score from the live token-lint signal + the
// fidelity ledger, prints it (or --json), and (unless --no-write) appends a
// trend row to quality-ledger.jsonl. Report-only: always exits 0.

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths.js");
var lint = require("../lint/lint-tokens.js");
var fidelity = require("../fidelity/fidelity-report.js");
var q = require("./quality-score.js");

var LEDGER = path.join(__dirname, "..", "..", "tests", "renderers", "__fidelity__", "quality-ledger.jsonl");

// --- token gate (live) ---
var cssText = fs.readFileSync(PATHS.tokens.css, "utf8");
var tokensJson = JSON.parse(fs.readFileSync(PATHS.tokens.json, "utf8"));
var findings = lint.lintTokens({ cssText: cssText, tokensJson: tokensJson });
var counts = lint.countChecks({ cssText: cssText, tokensJson: tokensJson });
var tokens = q.tokenGate({ findings: findings, counts: counts });

// --- fidelity gate (from ledger, Program-C rows only) ---
var fidRows = fidelity.latestPerSlug(fidelity.readLedger());
var programC = fidRows.filter(function (r) {
  return r.fidelity && /two-gate/.test(r.fidelity.method || "");
});
var fid = q.fidelityGate(fidelity.aggregate(programC));

var date = new Date().toISOString().slice(0, 10);
var row = q.composeScore({ date: date, tokens: tokens, fidelity: fid });

if (process.argv.indexOf("--json") !== -1) {
  process.stdout.write(JSON.stringify(row) + "\n");
} else {
  process.stdout.write(q.formatReport(row) + "\n");
}

if (process.argv.indexOf("--no-write") === -1) {
  q.appendRow(LEDGER, row);
}

process.exit(0);
