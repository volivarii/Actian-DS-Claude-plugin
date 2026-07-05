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

var PILOT = [
  // Original pilot trio
  "button",
  "checkbox-with-label",
  "alert-banner",
  // Hi-Fi Slice 1 (Task 4) override leaves — all tier:override in ds-html-map,
  // render correctly server-side (real switch-case, no window.__dsAnatomyDocs
  // needed). This PILOT list predates the F1 fidelity wiring: as of
  // render-leaf.js's renderLeafFragment(), the Node/gate render path also
  // injects the appearance doc map via setAnatomyDocMap() before each render,
  // so anatomy-tier slugs (ds-html-map's default: case) now render their real
  // per-instance appearance HTML here too, not a chip. PILOT staying limited
  // to override-tier leaves is just scope, not a rendering limitation.
  "notification",
  "stepper",
  "tooltip",
  "input-date",
  "rich-text",
  "dropdown-select-default",
  "progress-bar-small",
  "tag-interactive",
  // Hi-Fi A1 (narrow) degraded-slug override leaves — same rationale as Slice 1
  // (real switch-case, render server-side in Node, no window.__dsAnatomyDocs).
  "popover",
  "account-dropdown",
  "app-switcher-dropdown",
  "segmented-control",
  "toolbar",
  "sticky-footer",
  "loader",
  "calendar",
];
var DIFF_DIR = path.join(
  __dirname,
  "..",
  "..",
  "tests",
  "renderers",
  "__fidelity__",
  "diffs",
);

// --- token gate (live) ---
var cssText = fs.readFileSync(PATHS.tokens.css, "utf8");
var tokensJson = JSON.parse(fs.readFileSync(PATHS.tokens.json, "utf8"));
var tokenFindings = lint.lintTokens({
  cssText: cssText,
  tokensJson: tokensJson,
});
var tokenCounts = lint.countChecks({
  cssText: cssText,
  tokensJson: tokensJson,
});
if (q.noChecksRan(tokenCounts)) {
  process.stderr.write(
    "warning: token lint ran 0 checks — the token source may be empty or unreadable; the token gate score is not meaningful.\n",
  );
}
var tokens = q.tokenGate({ findings: tokenFindings, counts: tokenCounts });

// --- structural gate (live, scored; pixel/visual = review-only artifacts) ---
var rows = runFidelity.run(PILOT, { write: false, diffDir: DIFF_DIR });
var structural = q.structuralGate(fidelityReport.aggregate(rows));

var date = new Date().toISOString().slice(0, 10);
var row = q.composeScore({
  date: date,
  tokens: tokens,
  structural: structural,
});

if (process.argv.indexOf("--json") !== -1) {
  process.stdout.write(JSON.stringify(row) + "\n");
} else {
  process.stdout.write(q.formatReport(row) + "\n");
  process.stdout.write(
    "(pixel diffs, if any, written to tests/renderers/__fidelity__/diffs/ — review-only)\n",
  );
}

process.exit(0);
