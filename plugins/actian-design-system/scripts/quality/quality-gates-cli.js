#!/usr/bin/env node
"use strict";

// Live, Chrome-based DS Quality Score composite (the quality-gates CI job).
// Computes the token gate live, runs the fidelity gate live on the pilot trio
// (structural = scored, pixel = review-only diff artifacts), composes the
// headline, and prints it. Report-only: always exits 0. --no-write is accepted
// for symmetry (this CLI never mutates the committed ledger regardless).

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths.js");
var lint = require("../lint/lint-tokens.js");
var runFidelity = require("../fidelity/run-fidelity.js");
var fidelityReport = require("../fidelity/fidelity-report.js");
var q = require("./quality-score.js");

var PILOT = ["button", "checkbox-with-label", "alert-banner"];
var DIFF_DIR = path.join(__dirname, "..", "..", "tests", "renderers", "__fidelity__", "diffs");

// --- token gate (live) ---
var cssText = fs.readFileSync(PATHS.tokens.css, "utf8");
var tokensJson = JSON.parse(fs.readFileSync(PATHS.tokens.json, "utf8"));
var tokenFindings = lint.lintTokens({ cssText: cssText, tokensJson: tokensJson });
var tokenCounts = lint.countChecks({ cssText: cssText, tokensJson: tokensJson });
var tokens = q.tokenGate({ findings: tokenFindings, counts: tokenCounts });

// --- fidelity gate (live, structural-scored; pixel diffs saved as artifacts) ---
var rows = runFidelity.run(PILOT, { write: false, diffDir: DIFF_DIR });
var fidelity = q.fidelityGate(fidelityReport.aggregate(rows));

var date = new Date().toISOString().slice(0, 10);
var row = q.composeScore({ date: date, tokens: tokens, fidelity: fidelity });

if (process.argv.indexOf("--json") !== -1) {
  process.stdout.write(JSON.stringify(row) + "\n");
} else {
  process.stdout.write(q.formatReport(row) + "\n");
  process.stdout.write("(pixel diffs, if any, written to tests/renderers/__fidelity__/diffs/ — review-only)\n");
}

process.exit(0);
