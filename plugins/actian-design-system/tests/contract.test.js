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
 *
 * Run with: node tests/contract.test.js
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
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var SCRIPTS_DIR = path.join(PLUGIN_ROOT, "scripts");
var RENDERERS_DIR = path.join(SCRIPTS_DIR, "html-renderers");
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
 * Looks for `node ${CLAUDE_PLUGIN_ROOT}/scripts/...` and
 * `${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh` patterns.
 *
 * Returns array of { script, flags[] } where script is the relative path
 * (e.g., "scripts/flow-to-figma.js") and flags are the --flag names used.
 */
function extractCommands(mdContent) {
  var commands = [];
  var seen = {};

  // Match node script invocations
  var nodeRe = /node\s+\$\{CLAUDE_PLUGIN_ROOT\}\/(scripts\/[^\s\\]+)/g;
  var match;
  while ((match = nodeRe.exec(mdContent)) !== null) {
    var script = match[1];
    // Find the full command block — grab everything until end of line or continuation
    var startIdx = match.index;
    var cmdBlock = "";
    var lines = mdContent.substring(startIdx).split("\n");
    for (var i = 0; i < lines.length; i++) {
      cmdBlock += lines[i];
      if (lines[i].trimRight().slice(-1) !== "\\") break;
      cmdBlock += " ";
    }

    // Extract flags (--something or -o style)
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

section("Part 1: CLI command contracts");

var allCommands = [];

for (var s = 0; s < SKILL_FILES.length; s++) {
  var skill = SKILL_FILES[s];
  var skillContent = fs.readFileSync(skill.path, "utf8");
  var commands = extractCommands(skillContent);

  for (var c = 0; c < commands.length; c++) {
    var cmd = commands[c];
    var scriptPath = path.join(PLUGIN_ROOT, cmd.script);
    var label = skill.name + " → " + cmd.script;

    // 1. Verify script file exists
    assert(fs.existsSync(scriptPath), label + " — script exists");
    if (fs.existsSync(scriptPath)) {
      process.stdout.write("  \u2713 " + label + " — script exists\n");
    }

    // 2. Verify each flag is parsed by the script
    if (cmd.flags.length > 0 && fs.existsSync(scriptPath)) {
      var scriptSrc = fs.readFileSync(scriptPath, "utf8");
      for (var f = 0; f < cmd.flags.length; f++) {
        var flag = cmd.flags[f];
        var flagLabel = label + " — flag " + flag + " parsed";
        var flagFound =
          scriptSrc.indexOf("'" + flag + "'") !== -1 ||
          scriptSrc.indexOf('"' + flag + '"') !== -1;
        assert(flagFound, flagLabel);
        if (flagFound) {
          process.stdout.write("  \u2713 " + flagLabel + "\n");
        }
      }
    }

    allCommands.push({
      skill: skill.name,
      script: cmd.script,
      flags: cmd.flags,
    });
  }
}

// ---------------------------------------------------------------------------
// Part 2: Template name contracts
// ---------------------------------------------------------------------------

section("Part 2: Template name contracts");

var templatesJson = JSON.parse(
  fs.readFileSync(path.join(SCRIPTS_DIR, "templates.json"), "utf8"),
);
var templateKeys = Object.keys(templatesJson["flow-templates"]);

var flowSkillMd = fs.readFileSync(
  path.join(PLUGIN_ROOT, "skills", "generate-flow", "SKILL.md"),
  "utf8",
);
var specBuilderMd = fs.readFileSync(
  path.join(
    PLUGIN_ROOT,
    "references",
    "generate-flow",
    "figma-spec-builder.md",
  ),
  "utf8",
);
var docsCombined = flowSkillMd + "\n" + specBuilderMd;

// 2a. Every template key in templates.json appears in at least one doc
for (var t = 0; t < templateKeys.length; t++) {
  var tKey = templateKeys[t];
  var label2a =
    "templates.json key '" +
    tKey +
    "' documented in SKILL.md or figma-spec-builder.md";
  var found = docsCombined.indexOf(tKey) !== -1;
  assert(found, label2a);
  if (found) {
    process.stdout.write("  \u2713 " + label2a + "\n");
  }
}

// 2b. Every template name mentioned in the Templates table exists in templates.json
//     The template table has rows like: | `admin` | 1440x960 | ... |
//     We match backtick-quoted names in rows that also contain a dimension (NNNxNNN)
//     or "None" or "header" (chrome column indicators).
var specLines = specBuilderMd.split("\n");
var docTemplateNames = {};
for (var li = 0; li < specLines.length; li++) {
  var line = specLines[li];
  // Only consider table rows with dimension or chrome indicators
  if (!/\|/.test(line)) continue;
  if (!/\d+x\d+|None|header|AI specifies/.test(line)) continue;
  var cellRe = /\|\s*`([a-z][-a-z]*)`\s*\|/g;
  var tmatch;
  while ((tmatch = cellRe.exec(line)) !== null) {
    docTemplateNames[tmatch[1]] = true;
  }
}

var docNames = Object.keys(docTemplateNames);
for (var d = 0; d < docNames.length; d++) {
  var dName = docNames[d];
  var label2b = "doc template '" + dName + "' exists in templates.json";
  var exists = templateKeys.indexOf(dName) !== -1;
  assert(exists, label2b);
  if (exists) {
    process.stdout.write("  \u2713 " + label2b + "\n");
  }
}

// ---------------------------------------------------------------------------
// Part 3: assemble-preview.js TYPE_CONFIGS
// ---------------------------------------------------------------------------

section("Part 3: assemble-preview.js type configs");

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

for (var ti = 0; ti < typeNames.length; ti++) {
  var typeName = typeNames[ti];
  var config = TYPE_CONFIGS[typeName];

  // CSS file exists
  var cssLabel =
    typeName + " — CSS file exists (" + path.basename(config.css) + ")";
  var cssExists = fs.existsSync(config.css);
  assert(cssExists, cssLabel);
  if (cssExists) {
    process.stdout.write("  \u2713 " + cssLabel + "\n");
  }

  // Renderer JS files exist
  for (var ri = 0; ri < config.renderers.length; ri++) {
    var rendererPath = config.renderers[ri];
    var rLabel =
      typeName + " — renderer exists (" + path.basename(rendererPath) + ")";
    var rExists = fs.existsSync(rendererPath);
    assert(rExists, rLabel);
    if (rExists) {
      process.stdout.write("  \u2713 " + rLabel + "\n");
    }
  }
}

// Annotation layer files (shared across all types)
for (var ai = 0; ai < ANNOTATION_FILES.length; ai++) {
  var annoFile = ANNOTATION_FILES[ai];
  var annoLabel = "annotation layer — " + path.basename(annoFile) + " exists";
  var annoExists = fs.existsSync(annoFile);
  assert(annoExists, annoLabel);
  if (annoExists) {
    process.stdout.write("  \u2713 " + annoLabel + "\n");
  }
}

// ---------------------------------------------------------------------------
// Part 4: --help output contracts
// ---------------------------------------------------------------------------

section("Part 4: --help output contracts");

var execSync = require("child_process").execSync;

var helpScripts = [
  {
    script: path.join(SCRIPTS_DIR, "flow-to-figma.js"),
    expectedName: "flow-to-figma",
  },
  {
    script: path.join(SCRIPTS_DIR, "brief-to-figma.js"),
    expectedName: "brief-to-figma",
  },
  {
    script: path.join(SCRIPTS_DIR, "slide-to-figma.js"),
    expectedName: "slide-to-figma",
  },
  {
    script: path.join(SCRIPTS_DIR, "assemble-preview.js"),
    expectedName: "assemble-preview",
  },
];

for (var hi = 0; hi < helpScripts.length; hi++) {
  var hs = helpScripts[hi];
  var hsLabel = hs.expectedName + " --help";

  // Run script with --help
  var helpOutput;
  var helpExitCode = 0;
  try {
    helpOutput = execSync("node " + JSON.stringify(hs.script) + " --help", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    helpExitCode = e.status || 1;
    helpOutput = (e.stdout || "") + (e.stderr || "");
  }

  // 1. Exits 0
  var exitLabel = hsLabel + " — exits 0";
  assert(helpExitCode === 0, exitLabel);
  if (helpExitCode === 0) {
    process.stdout.write("  \u2713 " + exitLabel + "\n");
  }

  // 2. Output is valid JSON
  var helpJson = null;
  try {
    helpJson = JSON.parse(helpOutput);
  } catch (e) {
    // parse failed
  }
  var jsonLabel = hsLabel + " — valid JSON output";
  assert(helpJson !== null, jsonLabel);
  if (helpJson !== null) {
    process.stdout.write("  \u2713 " + jsonLabel + "\n");
  }

  if (helpJson) {
    // 3. name field matches expected
    var nameLabel = hsLabel + " — name is '" + hs.expectedName + "'";
    assert(helpJson.name === hs.expectedName, nameLabel);
    if (helpJson.name === hs.expectedName) {
      process.stdout.write("  \u2713 " + nameLabel + "\n");
    }

    // 4. flags is an array
    var flagsLabel = hsLabel + " — flags is an array";
    assert(Array.isArray(helpJson.flags), flagsLabel);
    if (Array.isArray(helpJson.flags)) {
      process.stdout.write("  \u2713 " + flagsLabel + "\n");
    }

    // 5. Every flag name exists in the script's source code
    if (Array.isArray(helpJson.flags)) {
      var hsSrc = fs.readFileSync(hs.script, "utf8");
      for (var hf = 0; hf < helpJson.flags.length; hf++) {
        var flagName = helpJson.flags[hf].name;
        var flagSrcLabel =
          hsLabel + " — flag " + flagName + " parsed in source";
        var flagInSrc =
          hsSrc.indexOf("'" + flagName + "'") !== -1 ||
          hsSrc.indexOf('"' + flagName + '"') !== -1;
        assert(flagInSrc, flagSrcLabel);
        if (flagInSrc) {
          process.stdout.write("  \u2713 " + flagSrcLabel + "\n");
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n");
process.stdout.write("Results: " + passed + " passed, " + failed + " failed\n");

if (failures.length > 0) {
  process.stdout.write("\nContract violations:\n");
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write("  - " + failures[i] + "\n");
  }
  process.exit(1);
} else {
  process.stdout.write("All contracts verified.\n");
}
