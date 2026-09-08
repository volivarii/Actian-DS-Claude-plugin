#!/usr/bin/env node
"use strict";

/**
 * step-pointers-resolve.test.js — Every "<doc> ... Step N" pointer in
 * skills/, references/, and agents/ prose must resolve to a heading or a
 * numbered list item in its target document. Catches drift like an agent
 * doc naming a step number the skill no longer uses under that number.
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

describe("step pointers resolve", function () {
  var files = []; ["skills", "references", "agents"].forEach(function (d) { walk(path.join(PLUGIN_ROOT, d), files); });
  files = files.filter(function (f) { return /\.md$/.test(f); });
  files.forEach(function (f) {
    var src = fs.readFileSync(f, "utf8");
    var re = /`?(agents\/[a-z-]+\.md|SKILL\.md)`?[^\n]{0,60}?Step (-?\d+(?:\.\d+)?)/g;
    var m;
    while ((m = re.exec(src)) !== null) {
      var target = m[1] === "SKILL.md" ? "skills/generate-flow/SKILL.md" : m[1];
      var body = fs.readFileSync(path.join(PLUGIN_ROOT, target), "utf8");
      var step = m[2];
      var ok = new RegExp("^#+ .*Step " + step.replace(".", "\\.") + "\\b", "m").test(body) ||
               new RegExp("^\\s*" + step.replace(".", "\\.") + "\\.\\s", "m").test(body);
      it(f + " -> " + target + " Step " + step, function () { assert.ok(ok, "no heading or numbered item for Step " + step + " in " + target); });
    }
  });
});
