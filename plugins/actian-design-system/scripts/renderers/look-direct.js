#!/usr/bin/env node
"use strict";

// look-direct.js: a screenshot of every step of a direct prototype, so its
// author can look at what it drew before handing it over. ?step=<n> puts the
// page in that step's state (assemble-direct's runtime). No browser here, or
// a browser that never answers, is not an error for the run: exit 2, and the
// handover says nobody looked.
//
// The plugin keeps one Chrome flag list, in render-leaf.js's screenshotArgs
// (also used by the fidelity gate): look-direct does not carry its own.
// screenshotArgs' opts.url lets a query string stand in for the plain
// file path; screenshot's opts.timeoutMs bounds a single shot so a browser
// that never answers cannot hang the whole run.

var fs = require("fs");
var path = require("path");
var url = require("url");
var resolveBinaries = require("../fidelity/resolve-binaries.js");
var renderLeaf = require("../fidelity/render-leaf.js");

var SHOT_TIMEOUT_MS = 60000;

function shots(steps, widths) {
  var out = [];
  for (var n = 1; n <= steps; n++)
    widths.forEach(function (w) {
      out.push({ n: n, width: w, file: "step-" + n + "-" + w + ".png" });
    });
  return out;
}

// The real resolver never returns null on this path: requireAll throws its
// own "missing required tool" error (the message the resolveChrome contract
// promises) instead, so main() below only ever needs one failure branch.
function defaultResolveChrome() {
  return resolveBinaries.requireAll(resolveBinaries.resolveAll()).chrome;
}

function firstLine(e) {
  var m = e && e.message != null ? e.message : e;
  return String(m).split("\n")[0];
}

function main(argv, deps) {
  deps = deps || {};
  var stderr = deps.stderr || function (m) { process.stderr.write(m); };
  var si = argv.indexOf("--steps"), oi = argv.indexOf("-o"), wi = argv.indexOf("--widths");
  var steps = si === -1 ? NaN : parseInt(argv[si + 1], 10);
  if (!argv[0] || oi === -1 || !(steps > 0)) {
    stderr("usage: look-direct.js <page.html> --steps <n> -o <dir> [--widths 1440,1280]\n");
    return 1;
  }
  var widths = (wi === -1 ? "1440,1280" : argv[wi + 1]).split(",").map(Number);
  var chrome;
  try {
    chrome = (deps.resolveChrome || defaultResolveChrome)();
  } catch (e) {
    stderr("look-direct: not looked at: no browser here. " + e.message + "\n");
    return 2;
  }
  var outDir = argv[oi + 1];
  (deps.mkdir || function (d) { fs.mkdirSync(d, { recursive: true }); })(outDir);
  var base = url.pathToFileURL(path.resolve(argv[0])).href;
  var takeScreenshot = deps.screenshot || renderLeaf.screenshot;
  var plan = shots(steps, widths);
  for (var i = 0; i < plan.length; i++) {
    var s = plan[i];
    try {
      takeScreenshot({
        chrome: chrome,
        url: base + "?step=" + s.n,
        outPng: path.join(outDir, s.file),
        width: s.width,
        timeoutMs: SHOT_TIMEOUT_MS,
      });
    } catch (e) {
      stderr("look-direct: not looked at: the browser did not answer (" + firstLine(e) + ")\n");
      return 2;
    }
  }
  stderr("look-direct: wrote " + plan.length + " screenshots to " + outDir + "\n");
  return 0;
}

module.exports = { shots: shots, main: main };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
