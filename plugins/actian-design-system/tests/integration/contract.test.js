#!/usr/bin/env node
"use strict";

/**
 * contract.test.js — Verify SKILL.md CLI commands match actual script interfaces,
 * template names in SKILL.md match templates.json, and assemble-preview.js type
 * configs reference real files.
 *
 * Part 1: CLI command contracts — parse SKILL.md for node commands, verify scripts
 *         exist and parse the flags referenced.
 * Part 2: Template name contracts — templates.json keys vs SKILL.md + spec builder docs.
 * Part 3: assemble-preview.js TYPE_CONFIGS — CSS, renderer JS, annotation layer files.
 * Part 4: --help output contracts
 *
 * Run with: node tests/contract.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var execSync = require("child_process").execSync;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var SCRIPTS_DIR = path.join(PLUGIN_ROOT, "scripts");
var RENDERERS_DIR = path.join(SCRIPTS_DIR, "renderers", "html-renderers");
var TEMPLATES_DIR = path.join(PLUGIN_ROOT, "templates");

// ---------------------------------------------------------------------------
// Part 1: CLI command contracts
// ---------------------------------------------------------------------------

var SKILL_FILES = [
  {
    name: "generate-flow",
    path: path.join(PLUGIN_ROOT, "skills", "generate-flow", "SKILL.md"),
  },
  {
    name: "component-brief",
    path: path.join(PLUGIN_ROOT, "skills", "component-brief", "SKILL.md"),
  },
  {
    name: "generate-presentation",
    path: path.join(PLUGIN_ROOT, "skills", "generate-presentation", "SKILL.md"),
  },
];

/**
 * Extract CLI commands from a SKILL.md file.
 */
function extractCommands(mdContent) {
  var commands = [];
  var seen = {};

  // Match node script invocations
  var nodeRe = /node\s+\$\{CLAUDE_PLUGIN_ROOT\}\/(scripts\/[^\s\\]+)/g;
  var match;
  while ((match = nodeRe.exec(mdContent)) !== null) {
    var script = match[1];
    var startIdx = match.index;
    var cmdBlock = "";
    var lines = mdContent.substring(startIdx).split("\n");
    for (var i = 0; i < lines.length; i++) {
      cmdBlock += lines[i];
      if (lines[i].trimRight().slice(-1) !== "\\") break;
      cmdBlock += " ";
    }

    var flags = [];
    var flagRe = /\s(--[a-z][-a-z]*|-[a-z])\b/g;
    var fmatch;
    while ((fmatch = flagRe.exec(cmdBlock)) !== null) {
      var flag = fmatch[1];
      if (flags.indexOf(flag) === -1) flags.push(flag);
    }

    var key = script + ":" + flags.sort().join(",");
    if (!seen[key]) {
      seen[key] = true;
      commands.push({ script: script, flags: flags });
    }
  }

  // Match shell script invocations (ensure-server.sh)
  var shRe = /\$\{CLAUDE_PLUGIN_ROOT\}\/(scripts\/[^\s}"]+\.sh)/g;
  while ((match = shRe.exec(mdContent)) !== null) {
    var shScript = match[1];
    var shKey = shScript + ":";
    if (!seen[shKey]) {
      seen[shKey] = true;
      commands.push({ script: shScript, flags: [] });
    }
  }

  return commands;
}

describe("Contract Tests", function () {
  describe("Part 1: CLI command contracts", function () {
    SKILL_FILES.forEach(function (skill) {
      var skillContent = fs.readFileSync(skill.path, "utf8");
      var commands = extractCommands(skillContent);

      commands.forEach(function (cmd) {
        var scriptPath = path.join(PLUGIN_ROOT, cmd.script);
        var label = skill.name + " → " + cmd.script;

        it(label + " — script exists", function () {
          assert.ok(
            fs.existsSync(scriptPath),
            label + " — script not found at " + scriptPath,
          );
        });

        if (cmd.flags.length > 0) {
          it(label + " — all flags parsed by script", function () {
            assert.ok(fs.existsSync(scriptPath), label + " — script not found");
            var scriptSrc = fs.readFileSync(scriptPath, "utf8");
            var missingFlags = cmd.flags.filter(function (flag) {
              return (
                scriptSrc.indexOf("'" + flag + "'") === -1 &&
                scriptSrc.indexOf('"' + flag + '"') === -1
              );
            });
            assert.ok(
              missingFlags.length === 0,
              label +
                " — flags not found in source: " +
                missingFlags.join(", "),
            );
          });
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Part 2 — REMOVED. Previously cross-checked template names against
  // references/generate-flow/figma-spec-builder.md, which was deleted in
  // fc6bcad ("superseded by push-patterns"). Template name documentation is
  // now informal — this contract no longer applies.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Part 3: assemble-preview.js TYPE_CONFIGS
  // ---------------------------------------------------------------------------

  describe("Part 3: assemble-preview.js type configs", function () {
    var TYPE_CONFIGS = {
      flow: {
        css: path.join(RENDERERS_DIR, "flow-renderer.css"),
        renderers: [
          path.join(RENDERERS_DIR, "fm-html-map.js"),
          path.join(RENDERERS_DIR, "flow-renderer.js"),
        ],
      },
      brief: {
        css: path.join(RENDERERS_DIR, "brief-renderer.css"),
        renderers: [
          path.join(RENDERERS_DIR, "fm-html-map.js"),
          path.join(RENDERERS_DIR, "brief-renderer.js"),
        ],
      },
      presentation: {
        css: path.join(RENDERERS_DIR, "presentation-renderer.css"),
        renderers: [path.join(RENDERERS_DIR, "presentation-renderer.js")],
      },
    };

    var ANNOTATION_FILES = [
      path.join(TEMPLATES_DIR, "annotation-layer.css"),
      path.join(TEMPLATES_DIR, "annotation-layer.js"),
      path.join(TEMPLATES_DIR, "annotation-layer-markup.html"),
    ];

    var typeNames = Object.keys(TYPE_CONFIGS);

    typeNames.forEach(function (typeName) {
      var config = TYPE_CONFIGS[typeName];

      it(typeName + " — CSS and renderer files exist", function () {
        assert.ok(
          fs.existsSync(config.css),
          typeName + " — CSS file not found: " + path.basename(config.css),
        );
        config.renderers.forEach(function (rendererPath) {
          assert.ok(
            fs.existsSync(rendererPath),
            typeName + " — renderer not found: " + path.basename(rendererPath),
          );
        });
      });
    });

    it("annotation layer files exist", function () {
      ANNOTATION_FILES.forEach(function (annoFile) {
        assert.ok(
          fs.existsSync(annoFile),
          "annotation layer — " + path.basename(annoFile) + " not found",
        );
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Part 4: --help output contracts
  // ---------------------------------------------------------------------------

  describe("Part 4: --help output contracts", function () {
    var helpScripts = [
      {
        script: path.join(SCRIPTS_DIR, "renderers", "assemble-preview.js"),
        expectedName: "assemble-preview",
      },
    ];

    helpScripts.forEach(function (hs) {
      it(
        hs.expectedName +
          " --help: exits 0 with valid JSON, correct name and flags",
        function () {
          var helpOutput = "";
          var helpExitCode = 0;
          try {
            helpOutput = execSync(
              "node " + JSON.stringify(hs.script) + " --help",
              {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "pipe"],
              },
            );
          } catch (e) {
            helpExitCode = e.status || 1;
            helpOutput = (e.stdout || "") + (e.stderr || "");
          }

          assert.strictEqual(
            helpExitCode,
            0,
            hs.expectedName + " --help — exits 0",
          );

          var helpJson = null;
          try {
            helpJson = JSON.parse(helpOutput);
          } catch (e) {
            // parse failed
          }
          assert.ok(
            helpJson !== null,
            hs.expectedName + " --help — valid JSON output",
          );
          assert.strictEqual(
            helpJson && helpJson.name,
            hs.expectedName,
            hs.expectedName + " --help — name field matches",
          );
          assert.ok(
            Array.isArray(helpJson && helpJson.flags),
            hs.expectedName + " --help — flags is an array",
          );

          if (helpJson && Array.isArray(helpJson.flags)) {
            var hsSrc = fs.readFileSync(hs.script, "utf8");
            var missingFlagNames = helpJson.flags
              .filter(function (f) {
                return (
                  hsSrc.indexOf("'" + f.name + "'") === -1 &&
                  hsSrc.indexOf('"' + f.name + '"') === -1
                );
              })
              .map(function (f) {
                return f.name;
              });
            assert.ok(
              missingFlagNames.length === 0,
              hs.expectedName +
                " --help — flags not found in source: " +
                missingFlagNames.join(", "),
            );
          }
        },
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Part 5: Pattern 14 runtime-primitive module contracts (v1.69.0+)
// ---------------------------------------------------------------------------
//
// Pattern 14 (Specs Redline) was rewritten in v1.69.0 to use runtime
// primitives (createVector + createLine + createFrame) instead of Meta Kit
// component instances. The rewrite extracted pure decision logic into
// scripts/lib/dimension-line.js and scripts/lib/token-tag.js so the algorithm
// can be unit-tested. Pin those module exports here — catches accidental
// breakage in the Pattern 14 push-pattern code path.

describe("Pattern 14 + Pattern 9 module exports", function () {
  it("dimension-line.js exports the three pure functions", function () {
    var mod = require(
      path.join(PLUGIN_ROOT, "scripts", "lib", "dimension-line.js"),
    );
    assert.strictEqual(typeof mod.vectorPathFor, "function");
    assert.strictEqual(typeof mod.endcapPositions, "function");
    assert.strictEqual(typeof mod.labelAnchorFor, "function");
  });

  it("token-tag.js exports the two pure functions", function () {
    var mod = require(path.join(PLUGIN_ROOT, "scripts", "lib", "token-tag.js"));
    assert.strictEqual(typeof mod.tokenTagSpec, "function");
    assert.strictEqual(typeof mod.tokenTagDimensions, "function");
  });

  it("gutter-layout.js exports the two pure functions (v1.70.0+)", function () {
    var mod = require(
      path.join(PLUGIN_ROOT, "scripts", "lib", "gutter-layout.js"),
    );
    assert.strictEqual(typeof mod.computeGutterSlots, "function");
    assert.strictEqual(typeof mod.buildLeaderPath, "function");
  });

  it("anatomy-scale.js exports pickScale (v1.70.0+)", function () {
    var mod = require(
      path.join(PLUGIN_ROOT, "scripts", "lib", "anatomy-scale.js"),
    );
    assert.strictEqual(typeof mod.pickScale, "function");
  });

  it("anatomy-filter.js exports the two pure functions (v1.70.0+)", function () {
    var mod = require(
      path.join(PLUGIN_ROOT, "scripts", "lib", "anatomy-filter.js"),
    );
    assert.strictEqual(typeof mod.filterPartsByLayerExistence, "function");
    assert.strictEqual(typeof mod.pickClosestEdge, "function");
  });
});
