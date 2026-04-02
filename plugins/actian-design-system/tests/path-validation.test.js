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

var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 FAIL: " + message + "\n");
  }
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

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
  "docs/meta-kit/meta-kit-reference.md",
  "tokens/actian-ds.tokens.css",
  "docs/foundations/_index.json",
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
  // Template variables: {project_working_directory}, ${CLAUDE_PLUGIN_ROOT}, etc.
  if (/\{[^}]+\}/.test(p)) return true;
  if (/\$\{/.test(p)) return true;
  // Angle-bracket placeholders: <dir>, <data.json>, <output.html>, <slug>, <relevant>
  if (/<[a-zA-Z][^>]*>/.test(p)) return true;
  // Square-bracket placeholders: [name], [feature-name], [component-name], [topic-slug]
  if (/\[[a-zA-Z]/.test(p)) return true;
  // Date template placeholders: YYYY-MM-DD, YYYY_MM_DD
  if (/YYYY|MM-DD/.test(p)) return true;
  // URLs
  if (/^https?:\/\//.test(p)) return true;
  // Bare anchors
  if (/^#/.test(p)) return true;
  // JS arrow function fragments that look like paths
  if (/=>/.test(p)) return true;
  // Filter expressions like .filter(([_, def])
  if (/\(\[/.test(p)) return true;
  return false;
}

/**
 * Check if a path looks like a real file reference rather than prose or code.
 */
function looksLikeFilePath(p) {
  // Must have a slash or a file extension
  if (p.indexOf("/") === -1 && p.indexOf(".") === -1) return false;
  // Must have an extension or end with / (directory reference)
  if (!/\.[a-zA-Z]{1,10}$/.test(p) && !p.endsWith("/") && p.indexOf("*") === -1)
    return false;
  // Skip if it's just a dotted name without slash (e.g., "Alpine.js")
  if (p.indexOf("/") === -1 && /^[A-Z]/.test(p)) return false;
  return true;
}

/**
 * Extract file path references from a single line of markdown.
 * Returns array of { path: string, line: number }.
 */
function extractPaths(lineText) {
  var paths = [];
  var match;

  // Pattern 1: Relative paths starting with ../../
  var relRe = /(?:^|[`"'\s(])(\.\.\/.+?)(?:[`"'\s)§]|$)/g;
  while ((match = relRe.exec(lineText)) !== null) {
    var p = match[1].replace(/[)§,;:]+$/, "").trim();
    // Strip trailing markdown/prose fragments
    p = p.replace(/\s.*$/, "");
    if (p && !isPlaceholder(p)) paths.push(p);
  }

  // Pattern 2: Backtick-quoted paths that start with a known root prefix
  var btRe = /`([^`]+)`/g;
  while ((match = btRe.exec(lineText)) !== null) {
    var candidate = match[1].trim();
    if (isPlaceholder(candidate)) continue;
    // Check if it starts with a known root prefix
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
    var linkPath = match[1].split("#")[0].trim(); // strip anchor
    if (!linkPath) continue;
    if (isPlaceholder(linkPath)) continue;
    if (/^https?:\/\//.test(linkPath)) continue;
    if (looksLikeFilePath(linkPath)) paths.push(linkPath);
  }

  return paths;
}

/**
 * Resolve a path reference to an absolute path.
 * - ../../ paths resolve relative to the .md file's directory
 * - Root-prefixed paths resolve relative to PLUGIN_ROOT
 * - Glob patterns: verify the directory portion exists
 */
function resolvePath(refPath, mdFileDir) {
  // For relative paths (starting with . or ..)
  if (refPath.indexOf("./") === 0 || refPath.indexOf("../") === 0) {
    var resolved = path.resolve(mdFileDir, refPath);
    // If glob pattern, check directory only
    if (refPath.indexOf("*") !== -1) {
      return path.dirname(resolved);
    }
    return resolved;
  }

  // For root-relative paths
  for (var i = 0; i < ROOT_PREFIXES.length; i++) {
    if (refPath.indexOf(ROOT_PREFIXES[i]) === 0) {
      var resolved2 = path.join(PLUGIN_ROOT, refPath);
      if (refPath.indexOf("*") !== -1) {
        return path.dirname(resolved2);
      }
      return resolved2;
    }
  }

  // Fallback: resolve from plugin root
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

section("Scanning " + allMdFiles.length + " .md files for path references");

// ---------------------------------------------------------------------------
// Validate paths
// ---------------------------------------------------------------------------

var totalPaths = 0;
var brokenPaths = [];

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
        brokenPaths.push({
          source: relMdFile,
          line: ln + 1,
          path: refPath,
          resolved: path.relative(PLUGIN_ROOT, resolved),
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

section("Path validation results");

var skippedSyncOutputs = [];

for (var b = 0; b < brokenPaths.length; b++) {
  var bp = brokenPaths[b];

  // Check if resolved path matches a known sync output
  var isSyncOutput = false;
  for (var k = 0; k < KNOWN_SYNC_OUTPUTS.length; k++) {
    if (bp.resolved === KNOWN_SYNC_OUTPUTS[k]) {
      isSyncOutput = true;
      break;
    }
  }

  if (isSyncOutput) {
    skippedSyncOutputs.push(bp);
    process.stdout.write(
      "  ~ skipped (sync output): " +
        bp.source +
        ":" +
        bp.line +
        " — " +
        bp.path +
        " → " +
        bp.resolved +
        "\n",
    );
    continue;
  }

  assert(
    false,
    bp.source +
      ":" +
      bp.line +
      " — " +
      bp.path +
      " → " +
      bp.resolved +
      " (not found)",
  );
}

if (failed === 0) {
  process.stdout.write(
    "  \u2713 All " +
      totalPaths +
      " path references resolve to existing files\n",
  );
  passed++;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n");
var skippedNote =
  skippedSyncOutputs.length > 0
    ? ", " + skippedSyncOutputs.length + " skipped (sync outputs)"
    : "";
process.stdout.write(
  "Results: " +
    passed +
    " passed, " +
    failed +
    " failed" +
    skippedNote +
    " (" +
    totalPaths +
    " paths validated)\n",
);

if (failures.length > 0) {
  process.stdout.write("\nBroken path references:\n");
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write("  - " + failures[i] + "\n");
  }
  process.exit(1);
} else {
  process.stdout.write("All path references are valid.\n");
}
