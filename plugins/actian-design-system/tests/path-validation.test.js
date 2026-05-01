#!/usr/bin/env node
"use strict";

/**
 * path-validation.test.js — Verify all file path references in .md files resolve to actual files.
 *
 * Scans SKILL.md files, reference docs, templates, and CLAUDE.md for file path
 * references (relative ../../ paths, plugin-root-relative paths, backtick-quoted
 * paths) and checks that each one resolves to an existing file or directory.
 *
 * Run with: node tests/path-validation.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..");

var SCAN_DIRS = [
  path.join(PLUGIN_ROOT, "skills"),
  path.join(PLUGIN_ROOT, "references"),
  path.join(PLUGIN_ROOT, "templates"),
];

var SCAN_FILES = [path.join(PLUGIN_ROOT, "CLAUDE.md")];

// Paths that only exist after running /sync-design-system.
// These are expected outputs referenced in sync skill docs — skip them in assertions
// but still log them so they stay visible.
var KNOWN_SYNC_OUTPUTS = [
  "docs/generated/meta-kit/meta-kit-reference.md",
  "tokens/actian-ds.tokens.css",
  "docs/foundations/_index.json",
  // Sprint 1 Wave 1: REST orchestrator output, populated on first nightly run.
  "docs/generated/meta-kit/styles.json",
];

// Known root-relative prefixes (resolve from plugin root)
var ROOT_PREFIXES = [
  "scripts/",
  "docs/",
  "tokens/",
  "templates/",
  "references/",
  "skills/",
  ".claude-plugin/",
  "evals/",
  "hooks/",
  "agents/",
  "tests/",
  "release-notes/",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .md files in a directory.
 */
function collectMdFiles(dir) {
  var results = [];
  if (!fs.existsSync(dir)) return results;
  var entries = fs.readdirSync(dir);
  for (var i = 0; i < entries.length; i++) {
    var full = path.join(dir, entries[i]);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(collectMdFiles(full));
    } else if (entries[i].endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Check if a string looks like a placeholder / template variable rather than
 * a real file path.
 */
function isPlaceholder(p) {
  if (/\{[^}]+\}/.test(p)) return true;
  if (/\$\{/.test(p)) return true;
  if (/<[a-zA-Z][^>]*>/.test(p)) return true;
  if (/\[[a-zA-Z]/.test(p)) return true;
  if (/YYYY|MM-DD/.test(p)) return true;
  if (/^https?:\/\//.test(p)) return true;
  if (/^#/.test(p)) return true;
  if (/=>/.test(p)) return true;
  if (/\(\[/.test(p)) return true;
  return false;
}

/**
 * Check if a path looks like a real file reference rather than prose or code.
 */
function looksLikeFilePath(p) {
  if (p.indexOf("/") === -1 && p.indexOf(".") === -1) return false;
  if (!/\.[a-zA-Z]{1,10}$/.test(p) && !p.endsWith("/") && p.indexOf("*") === -1)
    return false;
  if (p.indexOf("/") === -1 && /^[A-Z]/.test(p)) return false;
  return true;
}

/**
 * Extract file path references from a single line of markdown.
 */
function extractPaths(lineText) {
  var paths = [];
  var match;

  // Pattern 1: Relative paths starting with ../../
  var relRe = /(?:^|[`"'\s(])(\.\.\/.+?)(?:[`"'\s)§]|$)/g;
  while ((match = relRe.exec(lineText)) !== null) {
    var p = match[1].replace(/[)§,;:]+$/, "").trim();
    p = p.replace(/\s.*$/, "");
    if (p && !isPlaceholder(p)) paths.push(p);
  }

  // Pattern 2: Backtick-quoted paths that start with a known root prefix
  var btRe = /`([^`]+)`/g;
  while ((match = btRe.exec(lineText)) !== null) {
    var candidate = match[1].trim();
    if (isPlaceholder(candidate)) continue;
    var isRootRelative = false;
    for (var i = 0; i < ROOT_PREFIXES.length; i++) {
      if (candidate.indexOf(ROOT_PREFIXES[i]) === 0) {
        isRootRelative = true;
        break;
      }
    }
    if (isRootRelative && looksLikeFilePath(candidate)) {
      paths.push(candidate);
    }
  }

  // Pattern 3: Markdown links with relative file paths [text](path)
  var linkRe = /\]\(([^)]+)\)/g;
  while ((match = linkRe.exec(lineText)) !== null) {
    var linkPath = match[1].split("#")[0].trim();
    if (!linkPath) continue;
    if (isPlaceholder(linkPath)) continue;
    if (/^https?:\/\//.test(linkPath)) continue;
    if (looksLikeFilePath(linkPath)) paths.push(linkPath);
  }

  return paths;
}

/**
 * Resolve a path reference to an absolute path.
 */
function resolvePath(refPath, mdFileDir) {
  if (refPath.indexOf("./") === 0 || refPath.indexOf("../") === 0) {
    var resolved = path.resolve(mdFileDir, refPath);
    if (refPath.indexOf("*") !== -1) {
      return path.dirname(resolved);
    }
    return resolved;
  }

  for (var i = 0; i < ROOT_PREFIXES.length; i++) {
    if (refPath.indexOf(ROOT_PREFIXES[i]) === 0) {
      var resolved2 = path.join(PLUGIN_ROOT, refPath);
      if (refPath.indexOf("*") !== -1) {
        return path.dirname(resolved2);
      }
      return resolved2;
    }
  }

  var resolved3 = path.join(PLUGIN_ROOT, refPath);
  if (refPath.indexOf("*") !== -1) {
    return path.dirname(resolved3);
  }
  return resolved3;
}

// ---------------------------------------------------------------------------
// Collect all .md files
// ---------------------------------------------------------------------------

var allMdFiles = [];
for (var d = 0; d < SCAN_DIRS.length; d++) {
  allMdFiles = allMdFiles.concat(collectMdFiles(SCAN_DIRS[d]));
}
for (var s = 0; s < SCAN_FILES.length; s++) {
  if (fs.existsSync(SCAN_FILES[s])) {
    allMdFiles.push(SCAN_FILES[s]);
  }
}

// ---------------------------------------------------------------------------
// Scan for broken paths
// ---------------------------------------------------------------------------

var totalPaths = 0;
var brokenPaths = [];
var skippedSyncOutputs = [];

for (var f = 0; f < allMdFiles.length; f++) {
  var mdFile = allMdFiles[f];
  var mdDir = path.dirname(mdFile);
  var relMdFile = path.relative(PLUGIN_ROOT, mdFile);
  var lines = fs.readFileSync(mdFile, "utf8").split("\n");

  for (var ln = 0; ln < lines.length; ln++) {
    var refs = extractPaths(lines[ln]);
    for (var r = 0; r < refs.length; r++) {
      var refPath = refs[r];
      var resolved = resolvePath(refPath, mdDir);
      totalPaths++;

      if (!fs.existsSync(resolved)) {
        var relResolved = path.relative(PLUGIN_ROOT, resolved);
        var isSyncOutput = KNOWN_SYNC_OUTPUTS.indexOf(relResolved) !== -1;

        if (isSyncOutput) {
          skippedSyncOutputs.push({
            source: relMdFile,
            line: ln + 1,
            path: refPath,
            resolved: relResolved,
          });
        } else {
          brokenPaths.push({
            source: relMdFile,
            line: ln + 1,
            path: refPath,
            resolved: relResolved,
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Path Validation", function () {
  describe(
    "Scanning " + allMdFiles.length + " .md files for path references",
    function () {
      it(
        "all " + totalPaths + " path references resolve to existing files",
        function () {
          if (brokenPaths.length > 0) {
            var details = brokenPaths
              .map(function (bp) {
                return (
                  bp.source +
                  ":" +
                  bp.line +
                  " — " +
                  bp.path +
                  " → " +
                  bp.resolved +
                  " (not found)"
                );
              })
              .join("\n  ");
            assert.fail("Broken path references:\n  " + details);
          }
          // If we get here, all paths resolved
        },
      );

      if (skippedSyncOutputs.length > 0) {
        it("sync output paths are expected to be missing (skipped)", function () {
          // These paths only exist after /sync-design-system — always passes
          assert.ok(
            true,
            skippedSyncOutputs.length + " sync output paths skipped",
          );
        });
      }
    },
  );
});
