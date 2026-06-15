#!/usr/bin/env node
"use strict";

// Runs the token-quality lint against the vendored token files.
// Default: report-only (always exit 0). With --strict: exit 1 if any
// error-severity finding exists. --json: emit machine-readable findings.

var fs = require("fs");
var lint = require("./lint-tokens.js");
var PATHS = require("../lib/paths.js");

var cssText = fs.readFileSync(PATHS.tokens.css, "utf8");
var tokensJson = JSON.parse(fs.readFileSync(PATHS.tokens.json, "utf8"));

var findings = lint.lintTokens({ cssText: cssText, tokensJson: tokensJson });

if (process.argv.indexOf("--json") !== -1) {
  process.stdout.write(JSON.stringify({ findings: findings }, null, 2) + "\n");
} else {
  process.stdout.write(lint.formatReport(findings) + "\n");
}

var strict = process.argv.indexOf("--strict") !== -1;
var hasError = findings.some(function (f) {
  return f.severity === "error";
});
process.exit(strict && hasError ? 1 : 0);
