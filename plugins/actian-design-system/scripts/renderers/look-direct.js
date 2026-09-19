#!/usr/bin/env node
"use strict";

// look-direct.js: a screenshot of every step of a direct prototype, so its
// author can look at what it drew before handing it over. ?step=<n> puts the
// page in that step's state (assemble-direct's runtime). No browser here is
// not an error for the run: exit 2, and the handover says nobody looked.

var fs = require("fs");
var path = require("path");
var url = require("url");
var cp = require("node:child_process");
var resolveBinaries = require("../fidelity/resolve-binaries.js");

function shots(steps, widths) {
  var out = [];
  for (var n = 1; n <= steps; n++)
    widths.forEach(function (w) {
      out.push({ n: n, width: w, file: "step-" + n + "-" + w + ".png" });
    });
  return out;
}

// Plain "--headless" (not "--headless=new"), because the new headless mode
// spins up a real GPU process for compositing, and in this environment that
// process crashes ("GPU process isn't usable. Goodbye") a shot or two in,
// which kills Chrome mid-run. The old headless path never starts it.
// The no-first-run / no-networking flags cut a fresh profile's real cost:
// left default, every shot pays a first-run tax (background updater checks,
// sync, default-app registration) that dwarfs the page render itself.
function chromeArgs(o) {
  return [
    "--headless",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--no-first-run",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-client-side-phishing-detection",
    "--metrics-recording-only",
    "--no-default-browser-check",
    "--mute-audio",
    "--virtual-time-budget=3000",
    "--window-size=" + o.width + "," + (o.height || 900),
    "--screenshot=" + o.outPng,
    o.url,
  ];
}

// The real resolver never returns null on this path: requireAll throws its
// own "missing required tool" error (the message the resolveChrome contract
// promises) instead, so main() below only ever needs one failure branch.
function defaultResolveChrome() {
  return resolveBinaries.requireAll(resolveBinaries.resolveAll()).chrome;
}

function main(argv, deps) {
  deps = deps || {};
  var stderr =
    deps.stderr ||
    function (m) {
      process.stderr.write(m);
    };
  var si = argv.indexOf("--steps"),
    oi = argv.indexOf("-o"),
    wi = argv.indexOf("--widths");
  var steps = si === -1 ? NaN : parseInt(argv[si + 1], 10);
  if (!argv[0] || oi === -1 || !(steps > 0)) {
    stderr(
      "usage: look-direct.js <page.html> --steps <n> -o <dir> [--widths 1440,1280]\n",
    );
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
  (
    deps.mkdir ||
    function (d) {
      fs.mkdirSync(d, { recursive: true });
    }
  )(outDir);
  var base = url.pathToFileURL(path.resolve(argv[0])).href;
  var exec =
    deps.exec ||
    function (bin, args) {
      cp.execFileSync(bin, args, { stdio: "pipe" });
    };
  shots(steps, widths).forEach(function (s) {
    exec(
      chrome,
      chromeArgs({
        url: base + "?step=" + s.n,
        outPng: path.join(outDir, s.file),
        width: s.width,
      }),
    );
  });
  stderr(
    "look-direct: wrote " +
      steps * widths.length +
      " screenshots to " +
      outDir +
      "\n",
  );
  return 0;
}

module.exports = { shots: shots, chromeArgs: chromeArgs, main: main };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
