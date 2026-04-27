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
var BANNED_PROP_KEYS = [
  "Label",
  "Input Text",
  "Title",
  "Subtitle",
  "Dropdown Text",
  "Label Text",
  "Caption Text",
  "Feature",
  "Flow",
  "User",
];

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
      if (
        screen.pageHeader.title &&
        BANNED_STRINGS.indexOf(screen.pageHeader.title) !== -1
      ) {
        issues.push({
          severity: "P0",
          check: "banned-text",
          screen: screenName,
          path: "pageHeader.title",
          value: screen.pageHeader.title,
        });
      }
      if (
        screen.pageHeader.subtitle &&
        BANNED_STRINGS.indexOf(screen.pageHeader.subtitle) !== -1
      ) {
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
    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        // Check TEXT node content
        if (
          node.type === "TEXT" &&
          node.content &&
          BANNED_STRINGS.indexOf(node.content) !== -1
        ) {
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
            if (
              node.props[propKey] &&
              BANNED_STRINGS.indexOf(node.props[propKey]) !== -1
            ) {
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
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Check 3: Token reference validation
// ---------------------------------------------------------------------------

function loadTokenNames() {
  var cssPath = path.join(PLUGIN_ROOT, "tokens", "tokens.css");
  try {
    var css = fs.readFileSync(cssPath, "utf8");
    var names = {};
    var re = /(--(?:zen|fm)-[a-z0-9-]+)/g;
    var m;
    while ((m = re.exec(css)) !== null) {
      names[m[1]] = true;
    }
    return names;
  } catch (e) {
    return null;
  }
}

function extractTokenRefs(obj) {
  var refs = [];
  if (typeof obj === "string") {
    var re = /var\((--(?:zen|fm)-[a-z0-9-]+)\)/g;
    var m;
    while ((m = re.exec(obj)) !== null) {
      refs.push(m[1]);
    }
  } else if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      refs = refs.concat(extractTokenRefs(obj[i]));
    }
  } else if (obj && typeof obj === "object") {
    var keys = Object.keys(obj);
    for (var k = 0; k < keys.length; k++) {
      refs = refs.concat(extractTokenRefs(obj[keys[k]]));
    }
  }
  return refs;
}

function findUnresolvedTokens(data) {
  var tokenNames = loadTokenNames();
  if (!tokenNames) return [];

  var issues = [];

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        var fieldsToCheck = ["fills", "color", "stroke"];
        for (var f = 0; f < fieldsToCheck.length; f++) {
          var field = fieldsToCheck[f];
          if (node[field]) {
            var refs = extractTokenRefs(node[field]);
            for (var r = 0; r < refs.length; r++) {
              if (!tokenNames[refs[r]]) {
                issues.push({
                  severity: "P1",
                  check: "token",
                  screen: sName,
                  path: nPath + "." + field,
                  value: "var(" + refs[r] + ") not found in tokens.css",
                });
              }
            }
          }
        }
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Check 4: Terminology check
// ---------------------------------------------------------------------------

function loadTerminology() {
  var appContextPath = path.join(PLUGIN_ROOT, "docs", "app-context.json");
  try {
    var appContext = JSON.parse(fs.readFileSync(appContextPath, "utf8"));
    return appContext.terminology || {};
  } catch (e) {
    return null;
  }
}

function buildTerminologyRules(terminology) {
  var rules = [];
  var keys = Object.keys(terminology);
  for (var i = 0; i < keys.length; i++) {
    var entry = terminology[keys[i]];
    if (!entry.notUse || entry.notUse.length === 0) continue;
    for (var j = 0; j < entry.notUse.length; j++) {
      var wrong = entry.notUse[j];
      // Strip parenthetical context notes like "dataset (when curated)"
      var cleanWrong = wrong.replace(/\s*\(.*?\)\s*$/, "").trim();
      if (cleanWrong.length < 3) continue;
      var escaped = cleanWrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rules.push({
        pattern: new RegExp("\\b" + escaped + "\\b", "i"),
        wrong: cleanWrong,
        correct: entry.use,
      });
    }
  }
  return rules;
}

function findTerminologyIssues(data) {
  var terminology = loadTerminology();
  if (!terminology) return [];

  var rules = buildTerminologyRules(terminology);
  if (rules.length === 0) return [];

  var issues = [];

  function checkText(text, screenName, nodePath) {
    if (!text || typeof text !== "string") return;
    for (var r = 0; r < rules.length; r++) {
      if (rules[r].pattern.test(text)) {
        issues.push({
          severity: "P1",
          check: "terminology",
          screen: screenName,
          path: nodePath,
          value: text,
          found: rules[r].wrong,
          suggestion: 'use "' + rules[r].correct + '"',
        });
      }
    }
  }

  for (var si = 0; si < data.screens.length; si++) {
    var screen = data.screens[si];
    var screenName = screen.name || "Screen " + (si + 1);

    if (screen.pageHeader) {
      checkText(screen.pageHeader.title, screenName, "pageHeader.title");
      checkText(screen.pageHeader.subtitle, screenName, "pageHeader.subtitle");
    }

    walkNodes(
      screen.content,
      screenName,
      "content",
      function (node, sName, nPath) {
        if (node.content) {
          checkText(node.content, sName, nPath + ".content");
        }
        if (node.props) {
          var propKeys = Object.keys(node.props);
          for (var pk = 0; pk < propKeys.length; pk++) {
            var val = node.props[propKeys[pk]];
            if (typeof val === "string") {
              checkText(val, sName, nPath + ".props." + propKeys[pk]);
            }
          }
        }
      },
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Check 5: Tier justification (Sprint B1 — fallback ladder)
// ---------------------------------------------------------------------------
//
// Schema requires a justification (>=30 chars) when a screen's tier is
// "adapted" or "improvised". Tier "recognized" needs no justification.
// Pre-tier flow-data (no `tier` field) is unaffected — backwards compatible.

function checkTierJustification(screen, findings) {
  if (!screen || !screen.tier) return; // backwards compat — pre-tier screens skip
  if (screen.tier !== "adapted" && screen.tier !== "improvised") return; // tier 1 doesn't need justification

  var j = screen.justification;
  var trimmed = typeof j === "string" ? j.trim() : "";
  var ok = typeof j === "string" && trimmed.length >= 30;
  if (!ok) {
    var sample;
    if (j == null) {
      sample = "null";
    } else {
      sample =
        '"' + String(j).slice(0, 40) + '…" (' + trimmed.length + " chars)";
    }
    findings.push({
      severity: "error",
      kind: "missing-justification",
      screen: screen.name,
      message:
        'Tier "' +
        screen.tier +
        '" requires a justification of 30+ chars; got ' +
        sample,
    });
  }
}

function findMissingJustifications(data) {
  var findings = [];
  if (!data || !Array.isArray(data.screens)) return findings;
  for (var si = 0; si < data.screens.length; si++) {
    checkTierJustification(data.screens[si], findings);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Aggregator — returns { findings } across all per-screen checks.
// Kept distinct from the legacy P0/P1 check functions which return their own
// shape. The aggregator normalises tier-related findings into the
// { severity, kind, screen, message } shape expected by callers that need
// a single entry point (e.g. parity-check, manifest gating).
// ---------------------------------------------------------------------------

function validate(data) {
  var findings = [];
  if (!data || !Array.isArray(data.screens)) {
    return { findings: findings };
  }
  for (var si = 0; si < data.screens.length; si++) {
    checkTierJustification(data.screens[si], findings);
  }
  return { findings: findings };
}

// ---------------------------------------------------------------------------
// Exports (for testing) and CLI
// ---------------------------------------------------------------------------

module.exports = {
  findBannedText: findBannedText,
  findUnresolvedTokens: findUnresolvedTokens,
  findTerminologyIssues: findTerminologyIssues,
  findMissingJustifications: findMissingJustifications,
  validate: validate,
};

if (require.main === module) {
  if (process.argv.length < 3 || process.argv[2] === "--help") {
    var helpObj = {
      name: "validate-flow-data",
      description: "Validate flow-data.json before Figma push",
      usage: "validate-flow-data.js <flow-data.json> [options]",
      flags: [
        {
          name: "--skip-tokens",
          description: "Skip token reference validation",
        },
        { name: "--skip-terminology", description: "Skip terminology check" },
        { name: "--json", description: "Output issues as JSON" },
        { name: "--help", description: "Show this help" },
      ],
    };
    if (process.argv[2] === "--help") {
      process.stdout.write(JSON.stringify(helpObj, null, 2) + "\n");
      process.exit(0);
    }
    process.stderr.write(
      "Usage: validate-flow-data.js <flow-data.json> [options]\n",
    );
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

  // Check 3: Token references
  if (!skipTokens) {
    allIssues = allIssues.concat(findUnresolvedTokens(data));
  }

  // Check 4: Terminology
  if (!skipTerminology) {
    allIssues = allIssues.concat(findTerminologyIssues(data));
  }

  // Check 5: Tier justification (B1 fallback ladder).
  // Map to legacy CLI shape so the existing reporter handles them uniformly.
  var tierFindings = findMissingJustifications(data);
  for (var ti = 0; ti < tierFindings.length; ti++) {
    var f = tierFindings[ti];
    allIssues.push({
      severity: "P0",
      check: f.kind,
      screen: f.screen || "(unknown)",
      path: "tier/justification",
      value: f.message,
    });
  }

  // Report
  if (jsonOutput) {
    process.stdout.write(JSON.stringify(allIssues, null, 2) + "\n");
  } else {
    if (allIssues.length === 0) {
      process.stdout.write("validate-flow-data: 0 issues\n");
    } else {
      process.stderr.write(
        "validate-flow-data: " + allIssues.length + " issue(s) found\n\n",
      );
      for (var i = 0; i < allIssues.length; i++) {
        var issue = allIssues[i];
        process.stderr.write(
          issue.severity +
            " [" +
            issue.check +
            "] " +
            issue.screen +
            " → " +
            issue.path +
            " = " +
            JSON.stringify(issue.value) +
            "\n",
        );
      }
    }
  }

  var hasP0 = allIssues.some(function (issue) {
    return issue.severity === "P0";
  });
  var hasP1 = allIssues.some(function (issue) {
    return issue.severity === "P1";
  });
  process.exit(hasP0 ? 1 : hasP1 ? 2 : 0);
}
