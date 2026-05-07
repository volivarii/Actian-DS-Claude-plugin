#!/usr/bin/env node
"use strict";

/**
 * doc-conventions.test.js — Lint markdown bash code blocks for Node-invocation
 * conventions.
 *
 * Catches the doc/runtime drift that produced the v1.71.0 regression:
 *   - Bare `node` invocations (Node isn't on PATH on Claude Desktop)
 *   - `$NODE_BIN` used without sourcing `resolve-node.sh` in the same Bash call
 *   - `$PLUGIN_ROOT` instead of `$CLAUDE_PLUGIN_ROOT` (the former is unset in
 *     skill invocations)
 *
 * Mirrors `scripts/hooks/check-bare-node.sh` (the PreToolUse runtime hook) at
 * write time. When the AI follows the docs literally, the hook would block
 * bare invocations at runtime; this test catches the same problem before merge.
 *
 * Run with: node tests/integration/doc-conventions.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

var SCAN_DIRS = [
  path.join(PLUGIN_ROOT, "skills"),
  path.join(PLUGIN_ROOT, "references"),
];
var SCAN_FILES = [
  path.join(PLUGIN_ROOT, "CLAUDE.md"),
  path.join(PLUGIN_ROOT, "ARCHITECTURE.md"),
  path.join(PLUGIN_ROOT, "MIGRATIONS.md"),
  path.join(PLUGIN_ROOT, "README.md"),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * Extract fenced bash/sh/shell code blocks from markdown content.
 *
 * Skips any block preceded (within the 3 lines immediately above the opening
 * fence) by an HTML comment `<!-- doc-lint:ignore-block -->`. Use this when
 * a doc intentionally shows an anti-pattern (e.g. CLAUDE.md's "Anti-pattern
 * (will fail on Desktop)" examples).
 *
 * Returns: [{ startLine: 1-indexed line of first content line, content: string }]
 */
function extractBashBlocks(mdContent) {
  var blocks = [];
  var lines = mdContent.split("\n");
  var inBlock = false;
  var blockStart = -1;
  var blockLines = [];
  var blockLang = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!inBlock) {
      var m = line.match(/^```(\S*)/);
      if (m) {
        // Look back up to 3 lines for the opt-out marker.
        var skip = false;
        for (var lb = Math.max(0, i - 3); lb < i; lb++) {
          if (lines[lb].indexOf("doc-lint:ignore-block") !== -1) {
            skip = true;
            break;
          }
        }
        if (skip) {
          // Still need to consume the fenced block so we don't trip over it.
          inBlock = true;
          blockLang = "_skipped_";
          blockStart = -1;
          blockLines = [];
        } else {
          inBlock = true;
          blockLang = m[1].toLowerCase();
          blockStart = i + 2; // 1-indexed line of first content line (after fence)
          blockLines = [];
        }
      }
    } else {
      if (line.match(/^```/)) {
        if (
          blockLang === "bash" ||
          blockLang === "sh" ||
          blockLang === "shell"
        ) {
          blocks.push({
            startLine: blockStart,
            content: blockLines.join("\n"),
          });
        }
        inBlock = false;
        blockLang = "";
      } else {
        blockLines.push(line);
      }
    }
  }
  return blocks;
}

/**
 * Lint a single bash block. Returns array of { lineOffset, message } violations.
 *
 * lineOffset is the 0-indexed line within the block where the violation occurred
 * (caller adds it to the block's startLine to get the absolute md line number).
 */
function lintBashBlock(content) {
  var violations = [];
  var lines = content.split("\n");
  var hasSourceResolveNode = /resolve-node\.sh/.test(content);

  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];

    // Skip comment lines (start with optional whitespace + #)
    if (/^\s*#/.test(ln)) continue;

    // -----------------------------------------------------------------------
    // Bare-node detection (mirrors check-bare-node.sh)
    //
    // Match `node ` (with trailing space/arg) at start of line, or after
    // `&&` / `;` / `|`, or after a pipe redirect.
    // EXCLUDE: $NODE_BIN, $\{NODE_BIN\}, node_modules, nvm/fnm references,
    // and "Node.js" / "Node " in prose-like contexts (caught by code-block
    // boundary, but defensive).
    // -----------------------------------------------------------------------
    if (
      /(^|[;&|]\s*)node\s/.test(ln) &&
      !/\$NODE_BIN|\$\{NODE_BIN\}|resolve-node|node_modules|nvm|fnm/.test(ln)
    ) {
      violations.push({
        lineOffset: i,
        message:
          'Bare `node` invocation. Use `source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && "$NODE_BIN" ...` (mirrors check-bare-node.sh runtime hook).',
      });
    }

    // -----------------------------------------------------------------------
    // $PLUGIN_ROOT detection — must be $CLAUDE_PLUGIN_ROOT.
    //
    // Match $PLUGIN_ROOT or ${PLUGIN_ROOT} but NOT $CLAUDE_PLUGIN_ROOT or
    // ${CLAUDE_PLUGIN_ROOT} (we look for the $PLUGIN_ROOT token specifically).
    // -----------------------------------------------------------------------
    var plRe = /\$\{?PLUGIN_ROOT\b/g;
    if (plRe.test(ln)) {
      violations.push({
        lineOffset: i,
        message:
          "Use `$CLAUDE_PLUGIN_ROOT` (set by the Claude harness), not `$PLUGIN_ROOT` (unset in skill invocations — path will resolve to /scripts/...).",
      });
    }

    // -----------------------------------------------------------------------
    // $NODE_BIN without resolve-node.sh sourced in the same block.
    //
    // Each Bash invocation is a fresh shell — $NODE_BIN is empty unless
    // resolved in this command. The runtime hook also enforces this.
    // -----------------------------------------------------------------------
    if (
      (/\$NODE_BIN/.test(ln) || /\$\{NODE_BIN\}/.test(ln)) &&
      !hasSourceResolveNode
    ) {
      violations.push({
        lineOffset: i,
        message:
          "$NODE_BIN used without `source resolve-node.sh` earlier in the same block. The variable is empty across Bash invocations unless resolved per-call.",
      });
      // Reported once per block is enough — break to avoid spam.
      break;
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Collect markdown files + lint every bash block
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

var allViolations = [];
var totalBlocks = 0;
for (var f = 0; f < allMdFiles.length; f++) {
  var mdFile = allMdFiles[f];
  var relMdFile = path.relative(PLUGIN_ROOT, mdFile);
  var content = fs.readFileSync(mdFile, "utf8");
  var blocks = extractBashBlocks(content);

  for (var b = 0; b < blocks.length; b++) {
    totalBlocks++;
    var block = blocks[b];
    var violations = lintBashBlock(block.content);
    for (var v = 0; v < violations.length; v++) {
      allViolations.push({
        file: relMdFile,
        line: block.startLine + violations[v].lineOffset,
        message: violations[v].message,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Self-tests for the linter — known-good and known-bad blocks. Catches
// regressions in the linter itself.
// ---------------------------------------------------------------------------

describe("Doc Conventions Linter — self-tests", function () {
  it("flags bare `node` invocations", function () {
    var v = lintBashBlock("node script.js");
    assert.ok(
      v.some(function (x) {
        return /Bare `node`/.test(x.message);
      }),
    );
  });

  it("flags $PLUGIN_ROOT", function () {
    var v = lintBashBlock(
      'source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && \\\n' +
        '  "$NODE_BIN" "$PLUGIN_ROOT/scripts/foo.js"',
    );
    assert.ok(
      v.some(function (x) {
        return /CLAUDE_PLUGIN_ROOT/.test(x.message);
      }),
    );
  });

  it("flags $NODE_BIN without sourcing resolve-node.sh", function () {
    var v = lintBashBlock('"$NODE_BIN" /path/to/script.js');
    assert.ok(
      v.some(function (x) {
        return /resolve-node/.test(x.message);
      }),
    );
  });

  it("accepts the canonical pattern", function () {
    var v = lintBashBlock(
      'source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && \\\n' +
        '  "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/some-script.js" --arg value',
    );
    assert.deepEqual(v, []);
  });

  it("ignores comment lines containing bare `node`", function () {
    var v = lintBashBlock(
      "# Don't do this: node script.js (bare invocation)\n" +
        'source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && \\\n' +
        '  "$NODE_BIN" /path/script.js',
    );
    assert.deepEqual(v, []);
  });

  it("does not flag node_modules / nvm references", function () {
    var v = lintBashBlock(
      "rm -rf node_modules && npm install\n" + "nvm use 20",
    );
    assert.deepEqual(v, []);
  });

  it("the opt-out marker skips a block", function () {
    var md =
      "Some prose.\n\n" +
      "<!-- doc-lint:ignore-block -->\n" +
      "```bash\n" +
      "node script.js\n" +
      "```\n\n" +
      "More prose.\n";
    assert.equal(extractBashBlocks(md).length, 0);
  });

  it("the opt-out marker only skips the immediately following block", function () {
    var md =
      "<!-- doc-lint:ignore-block -->\n" +
      "```bash\n" +
      "node bad.js\n" +
      "```\n\n" +
      "Prose between.\n\n" +
      "```bash\n" +
      "node also-bad.js\n" +
      "```\n";
    var blocks = extractBashBlocks(md);
    assert.equal(blocks.length, 1);
    assert.match(blocks[0].content, /also-bad\.js/);
  });
});

// ---------------------------------------------------------------------------
// Tests against the actual docs in the repo
// ---------------------------------------------------------------------------

describe("Doc Conventions", function () {
  describe(
    "Scanning " +
      allMdFiles.length +
      " .md files (" +
      totalBlocks +
      " bash blocks)",
    function () {
      it("all Node invocations follow project conventions (resolve-node.sh + $NODE_BIN + $CLAUDE_PLUGIN_ROOT)", function () {
        if (allViolations.length > 0) {
          var msg =
            "Doc-convention violations (mirror of check-bare-node.sh PreToolUse hook):\n" +
            allViolations
              .map(function (v) {
                return "  " + v.file + ":" + v.line + " — " + v.message;
              })
              .join("\n") +
            "\n\nFix at the doc. Bare `node` and unresolved `$NODE_BIN` will be blocked at runtime on Claude Desktop.";
          assert.fail(msg);
        }
      });
    },
  );
});
