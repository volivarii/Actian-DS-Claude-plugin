#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Banned placeholder strings (P0 — blocks push)
// ---------------------------------------------------------------------------

var BANNED_STRINGS = [
  "Page Title",
  "Description text",
  "Button label",
  "Label",
  "Nav Item",
  "Tag",
  "Header",
  "Feature Name",
  "Flow Description",
  "User Persona",
  "Dropdown item",
  "Input text",
  "Caption",
];

// Props to check for banned text
var BANNED_PROP_KEYS = ["Label", "Input Text", "Title", "Subtitle", "Dropdown Text",
  "Label Text", "Caption Text", "Feature", "Flow", "User"];

// ---------------------------------------------------------------------------
// Walk content nodes recursively
// ---------------------------------------------------------------------------

function walkNodes(nodes, screenName, pathPrefix, visitor) {
  if (!Array.isArray(nodes)) return;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var nodePath = pathPrefix + "[" + i + "]";
    visitor(node, screenName, nodePath);
    if (node.children) {
      walkNodes(node.children, screenName, nodePath + ".children", visitor);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 1: Banned text detection
// ---------------------------------------------------------------------------

function findBannedText(data) {
  var issues = [];

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    // Check pageHeader
    if (screen.pageHeader) {
      if (screen.pageHeader.title && BANNED_STRINGS.indexOf(screen.pageHeader.title) !== -1) {
        issues.push({
          severity: "P0",
          check: "banned-text",
          screen: screenName,
          path: "pageHeader.title",
          value: screen.pageHeader.title,
        });
      }
      if (screen.pageHeader.subtitle && BANNED_STRINGS.indexOf(screen.pageHeader.subtitle) !== -1) {
        issues.push({
          severity: "P0",
          check: "banned-text",
          screen: screenName,
          path: "pageHeader.subtitle",
          value: screen.pageHeader.subtitle,
        });
      }
    }

    // Walk content nodes
    walkNodes(screen.content, screenName, "content", function (node, sName, nPath) {
      // Check TEXT node content
      if (node.type === "TEXT" && node.content && BANNED_STRINGS.indexOf(node.content) !== -1) {
        issues.push({
          severity: "P0",
          check: "banned-text",
          screen: sName,
          path: nPath + ".content",
          value: node.content,
        });
      }

      // Check INSTANCE props
      if (node.props) {
        for (var k = 0; k < BANNED_PROP_KEYS.length; k++) {
          var propKey = BANNED_PROP_KEYS[k];
          if (node.props[propKey] && BANNED_STRINGS.indexOf(node.props[propKey]) !== -1) {
            issues.push({
              severity: "P0",
              check: "banned-text",
              screen: sName,
              path: nPath + ".props." + propKey,
              value: node.props[propKey],
            });
          }
        }
      }
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Exports (for testing) and CLI
// ---------------------------------------------------------------------------

module.exports = { findBannedText: findBannedText };

if (require.main === module) {
  if (process.argv.length < 3 || process.argv[2] === "--help") {
    var helpObj = {
      name: "validate-flow-data",
      description: "Validate flow-data.json before Figma push",
      usage: "validate-flow-data.js <flow-data.json> [options]",
      flags: [
        { name: "--skip-tokens", description: "Skip token reference validation" },
        { name: "--skip-terminology", description: "Skip terminology check" },
        { name: "--json", description: "Output issues as JSON" },
        { name: "--help", description: "Show this help" },
      ],
    };
    if (process.argv[2] === "--help") {
      process.stdout.write(JSON.stringify(helpObj, null, 2) + "\n");
      process.exit(0);
    }
    process.stderr.write("Usage: validate-flow-data.js <flow-data.json> [options]\n");
    process.exit(1);
  }

  var dataPath = path.resolve(process.argv[2]);
  var flags = process.argv.slice(3);
  var skipTokens = flags.indexOf("--skip-tokens") !== -1;
  var skipTerminology = flags.indexOf("--skip-terminology") !== -1;
  var jsonOutput = flags.indexOf("--json") !== -1;

  var data;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (e) {
    process.stderr.write("Error reading " + dataPath + ": " + e.message + "\n");
    process.exit(1);
  }

  var allIssues = [];

  // Check 1: Banned text
  allIssues = allIssues.concat(findBannedText(data));

  // Report
  if (jsonOutput) {
    process.stdout.write(JSON.stringify(allIssues, null, 2) + "\n");
  } else {
    if (allIssues.length === 0) {
      process.stdout.write("validate-flow-data: 0 issues\n");
    } else {
      process.stderr.write("validate-flow-data: " + allIssues.length + " issue(s) found\n\n");
      for (var i = 0; i < allIssues.length; i++) {
        var issue = allIssues[i];
        process.stderr.write(
          issue.severity + " [" + issue.check + "] " + issue.screen + " → " + issue.path + " = " + JSON.stringify(issue.value) + "\n"
        );
      }
    }
  }

  var hasP0 = allIssues.some(function (issue) { return issue.severity === "P0"; });
  var hasP1 = allIssues.some(function (issue) { return issue.severity === "P1"; });
  process.exit(hasP0 ? 1 : hasP1 ? 2 : 0);
}
