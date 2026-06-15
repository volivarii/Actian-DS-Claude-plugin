// scripts/fidelity/pixel-diff.js
// Gate 1 pixel-diff — pure JS via vendored pngjs (decode) + pixelmatch (diff).
// No system image tool. Inputs are Chrome PNG screenshots (leaf render + the
// webp oracle rasterized through Chrome). Pipeline: decode → trim to content box
// → resize both to a common canvas → pixelmatch → mismatch ratio.
"use strict";
var PNG = require("./vendor/pngjs").PNG;
var pixelmatch = require("./vendor/pixelmatch.js");

// Decode a PNG buffer → { width, height, data } (data = RGBA bytes).
function decodePng(buffer) {
  var png = PNG.sync.read(buffer);
  return { width: png.width, height: png.height, data: png.data };
}

// A pixel is "background" if transparent or near-white (the harness renders on #fff).
function isBackground(data, i) {
  if (data[i + 3] < 16) return true;
  return data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240;
}

// Bounding box of non-background pixels. All-background → the whole image.
function contentBox(data, w, h) {
  var minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (!isBackground(data, (y * w + x) * 4)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: w, h: h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function crop(data, w, h, box) {
  var out = Buffer.alloc(box.w * box.h * 4);
  for (var y = 0; y < box.h; y++) {
    for (var x = 0; x < box.w; x++) {
      var s = ((box.y + y) * w + (box.x + x)) * 4;
      var d = (y * box.w + x) * 4;
      out[d] = data[s];
      out[d + 1] = data[s + 1];
      out[d + 2] = data[s + 2];
      out[d + 3] = data[s + 3];
    }
  }
  return out;
}

// Nearest-neighbour resize — adequate for region-level fidelity comparison.
function resizeNearest(data, w, h, tw, th) {
  var out = Buffer.alloc(tw * th * 4);
  for (var y = 0; y < th; y++) {
    var sy = Math.min(h - 1, Math.floor((y * h) / th));
    for (var x = 0; x < tw; x++) {
      var sx = Math.min(w - 1, Math.floor((x * w) / tw));
      var s = (sy * w + sx) * 4;
      var d = (y * tw + x) * 4;
      out[d] = data[s];
      out[d + 1] = data[s + 1];
      out[d + 2] = data[s + 2];
      out[d + 3] = data[s + 3];
    }
  }
  return out;
}

// True when two content boxes' aspect ratios diverge beyond tolerance — a
// STRUCTURAL miss (e.g. single component vs a multi-variant oracle grid), which
// should fail Gate 1 outright rather than be averaged away by pixel diffing.
function aspectMismatch(d1, d2, tol) {
  // Degenerate (zero-dimension) box → incomparable, treat as a mismatch.
  if (!d1.w || !d1.h || !d2.w || !d2.h) return true;
  var r1 = d1.w / d1.h,
    r2 = d2.w / d2.h;
  // Symmetric: divide by the smaller ratio so swapping args gives the same answer.
  return Math.abs(r1 - r2) / Math.min(r1, r2) > tol;
}

// Trim both images to content, bail on aspect mismatch, else resize both to the
// common (smaller) canvas so pixelmatch sees equal dimensions.
function normalizePair(a, b, opts) {
  opts = opts || {};
  var tol = opts.aspectTol == null ? 0.15 : opts.aspectTol;
  var boxA = contentBox(a.data, a.width, a.height);
  var boxB = contentBox(b.data, b.width, b.height);
  if (aspectMismatch(boxA, boxB, tol)) {
    return { mismatch: true, boxA: boxA, boxB: boxB };
  }
  var tw = Math.min(boxA.w, boxB.w);
  var th = Math.min(boxA.h, boxB.h);
  return {
    a: resizeNearest(
      crop(a.data, a.width, a.height, boxA),
      boxA.w,
      boxA.h,
      tw,
      th,
    ),
    b: resizeNearest(
      crop(b.data, b.width, b.height, boxB),
      boxB.w,
      boxB.h,
      tw,
      th,
    ),
    w: tw,
    h: th,
  };
}

// Per-pixel diff fraction (0 = identical, 1 = fully different).
function diffRatio(aData, bData, w, h, opts) {
  opts = opts || {};
  var pm = opts.pmThreshold == null ? 0.1 : opts.pmThreshold;
  var diff = pixelmatch(aData, bData, null, w, h, { threshold: pm });
  return { diffPixels: diff, ratio: w * h ? diff / (w * h) : 0 };
}

// Render the visual diff to a PNG buffer (pixelmatch writes highlighted diffs
// into the output RGBA buffer; pngjs encodes it). Used for the report-only
// artifact humans review — never feeds the score.
function diffImage(aData, bData, w, h, opts) {
  opts = opts || {};
  var pm = opts.pmThreshold == null ? 0.1 : opts.pmThreshold;
  var out = Buffer.alloc(w * h * 4);
  pixelmatch(aData, bData, out, w, h, { threshold: pm });
  var png = new PNG({ width: w, height: h });
  out.copy(png.data);
  return PNG.sync.write(png);
}

function gridVerdict(cellRatios, threshold) {
  var worst = 0;
  for (var i = 0; i < cellRatios.length; i++) {
    if (cellRatios[i] > worst) worst = cellRatios[i];
  }
  return {
    pass: worst <= threshold,
    worstCell: worst,
    cells: cellRatios.length,
    threshold: threshold,
  };
}

module.exports = {
  decodePng: decodePng,
  contentBox: contentBox,
  crop: crop,
  resizeNearest: resizeNearest,
  aspectMismatch: aspectMismatch,
  normalizePair: normalizePair,
  diffRatio: diffRatio,
  diffImage: diffImage,
  gridVerdict: gridVerdict,
};
