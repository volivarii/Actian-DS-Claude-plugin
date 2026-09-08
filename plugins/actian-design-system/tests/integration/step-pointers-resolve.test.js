#!/usr/bin/env node
"use strict";

/**
 * step-pointers-resolve.test.js: every "<doc> ... Step N" pointer in
 * skills/, references/, and agents/ prose must resolve to a heading or a
 * numbered list item in its target document. Catches drift like an agent
 * doc naming a step number absent from the target doc's headings and
 * numbered items.
 *
 * A pointer is either:
 *   (a) an explicit path to a markdown doc under agents/, skills/, or
 *       references/ (e.g. `agents/screen-generator.md`,
 *       `skills/generate-flow/SKILL.md`, `references/figma/prototype-wiring.md`),
 *       optionally backtick-wrapped, followed within 60 characters on the
 *       same line by "Step N": the target is that path; or
 *   (b) a bare `<skill-name>` (a directory under skills/, e.g.
 *       "generate-flow Step 5.5" or "`/component-brief` Step 1.5"),
 *       optionally backtick-wrapped and/or slash-prefixed, followed within
 *       60 characters by "Step N": the target is that skill's SKILL.md.
 *       The skill-name alternation is built from the filesystem at
 *       describe time, so a new skill is covered without editing this
 *       test.
 * N may be negative or dotted (-1, 0, 5.5, 7). A bare "Step N" matching
 * neither form on the line is skipped. It names no document to check.
 *
 * Run: node --test tests/integration/step-pointers-resolve.test.js
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

var SKIP_DIRS = new Set(["node_modules", "superpowers"]);

function walk(dir, files) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Form (a): an explicit agents/|skills/|references/ markdown path.
var PATH_RE = /`?((?:agents|skills|references)\/[\w-]+(?:\/[\w-]+)*\.md)`?[^\n]{0,60}?Step (-?\d+(?:\.\d+)?)/g;

// Form (b): a bare skill-name shorthand, built from the filesystem so a new
// skill is covered automatically. Sorted longest-first so no alternative
// shadows a longer one that shares its prefix. The negative lookbehind
// keeps this from matching a skill name that is really a segment of a
// form-(a) path (e.g. the "generate-flow" inside "skills/generate-flow/SKILL.md"),
// and the negative lookahead keeps it from matching a prefix of a longer
// identifier.
var SKILL_NAMES = fs
  .readdirSync(path.join(PLUGIN_ROOT, "skills"))
  .filter(function (name) {
    return fs.statSync(path.join(PLUGIN_ROOT, "skills", name)).isDirectory();
  });
var SKILL_ALT = SKILL_NAMES.slice()
  .sort(function (a, b) { return b.length - a.length; })
  .map(escapeRe)
  .join("|");
var SKILL_RE = new RegExp(
  "(?<![\\w/])`?\\/?(" + SKILL_ALT + ")`?(?![\\w-])[^\\n]{0,60}?Step (-?\\d+(?:\\.\\d+)?)",
  "g",
);

describe("step pointers resolve", function () {
  var files = []; ["skills", "references", "agents"].forEach(function (d) { walk(path.join(PLUGIN_ROOT, d), files); });
  files = files.filter(function (f) { return /\.md$/.test(f); });
  files.forEach(function (f) {
    var src = fs.readFileSync(f, "utf8");

    var m;
    PATH_RE.lastIndex = 0;
    while ((m = PATH_RE.exec(src)) !== null) {
      registerPointer(f, m[1], m[2]);
    }

    SKILL_RE.lastIndex = 0;
    while ((m = SKILL_RE.exec(src)) !== null) {
      registerPointer(f, "skills/" + m[1] + "/SKILL.md", m[2]);
    }
  });

  function registerPointer(source, target, step) {
    var body = fs.readFileSync(path.join(PLUGIN_ROOT, target), "utf8");
    var ok = new RegExp("^#+ .*Step " + step.replace(".", "\\.") + "\\b", "m").test(body) ||
             new RegExp("^\\s*" + step.replace(".", "\\.") + "\\.\\s", "m").test(body);
    it(source + " -> " + target + " Step " + step, function () { assert.ok(ok, "no heading or numbered item for Step " + step + " in " + target); });
  }
});
