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
 * (from the repository root)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var execSync = require("child_process").execSync;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var SCRIPTS_DIR = path.join(PLUGIN_ROOT, "scripts");
var RENDERERS_DIR = path.join(SCRIPTS_DIR, "renderers", "html-renderers");
var TEMPLATES_DIR = path.join(PLUGIN_ROOT, "templates");
var RENDERER = require(path.join(SCRIPTS_DIR, "lib", "renderer.js"));

// ---------------------------------------------------------------------------
// Part 1: CLI command contracts
// ---------------------------------------------------------------------------

var SKILL_FILES = ["actian-ux", "actian-ux-proposal", "actian-ux-prototype", "actian-ux-audit"].map(function (n) {
  return { name: n, path: path.join(PLUGIN_ROOT, "skills", n, "SKILL.md") };
});
// Cards that must name at least one script command (actian-ux only routes).
var CARDS_WITH_COMMANDS = ["actian-ux-proposal", "actian-ux-prototype", "actian-ux-audit"];

/**
 * Extract CLI commands from a SKILL.md file.
 */
function extractCommands(mdContent) {
  var commands = [];
  var seen = {};

  // Match node script invocations
  // The cards write each command as an inline code span, `scripts/<path>.js <args>`.
  var cardRe = /`(scripts\/[^\s`]+\.js)([^`]*)`/g;
  var match;
  while ((match = cardRe.exec(mdContent)) !== null) {
    var script = match[1];
    var flags = [];
    var flagRe = /\s(--[a-z][-a-z]*|-[a-z])\b/g;
    var fmatch;
    while ((fmatch = flagRe.exec(match[2])) !== null) {
      if (flags.indexOf(fmatch[1]) === -1) flags.push(fmatch[1]);
    }
    var key = script + ":" + flags.sort().join(",");
    if (!seen[key]) {
      seen[key] = true;
      commands.push({ script: script, flags: flags });
    }
  }

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
      if (CARDS_WITH_COMMANDS.indexOf(skill.name) !== -1)
        it(skill.name + " names at least one script command", function () {
          assert.ok(commands.length > 0, skill.name + ": no `scripts/...` command was read, so nothing was checked");
        });

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
  // references/actian-ux-prototype/figma-spec-builder.md, which was deleted in
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
          RENDERER.modulePath("html-renderers/fm-html-map.js"),
          path.join(RENDERERS_DIR, "flow-renderer.js"),
        ],
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
