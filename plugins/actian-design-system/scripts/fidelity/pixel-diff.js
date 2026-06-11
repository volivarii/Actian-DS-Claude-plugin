// scripts/fidelity/pixel-diff.js
"use strict";
var cp = require("node:child_process");

// Normalize: decode + autocrop to content + flatten onto a transparent canvas.
function buildNormalizeArgs(input, output) {
  return [input, "-trim", "+repage", "-background", "none", output];
}

// Compare two same-size images, RMSE metric, with a small fuzz to absorb
// antialiasing/font-rendering noise. (im6: `compare ...`; im7: `magick compare ...`).
function buildCompareArgs(o) {
  return ["-metric", "RMSE", "-fuzz", (o.fuzz || 2) + "%", o.a, o.b, "null:"];
}

// ImageMagick writes the metric to stderr as "<abs> (<normalized>)".
function parseMetric(stderr) {
  var m = /\(([0-9.eE+-]+)\)/.exec(String(stderr));
  if (m) return parseFloat(m[1]);
  var n = /^\s*([0-9.eE+-]+)\s*$/.exec(String(stderr));
  return n ? parseFloat(n[1]) : null;
}

function gridVerdict(cellRmses, threshold) {
  var worst = 0;
  for (var i = 0; i < cellRmses.length; i++) if (cellRmses[i] > worst) worst = cellRmses[i];
  return { pass: worst <= threshold, worstCell: worst, cells: cellRmses.length, threshold: threshold };
}

function aspectMismatch(d1, d2, tol) {
  var r1 = d1.w / d1.h,
    r2 = d2.w / d2.h;
  return Math.abs(r1 - r2) / r1 > tol;
}

// --- shell edge (gated on ImageMagick present) ---
function imExec(im, args) {
  var argv = im.mode === "im7" ? ["compare"].concat(args) : args;
  var res = cp.spawnSync(im.cmd, argv, { encoding: "utf8" });
  return res.stderr || res.stdout || "";
}

function normalize(im, input, output) {
  var convertCmd = im.mode === "im7" ? [im.cmd, "convert"] : ["convert"]; // im6 ships `convert`
  var argv = convertCmd.slice(1).concat(buildNormalizeArgs(input, output));
  cp.spawnSync(convertCmd[0], argv, { stdio: "ignore" });
  return output;
}

module.exports = { buildNormalizeArgs, buildCompareArgs, parseMetric, gridVerdict, aspectMismatch, imExec, normalize };
