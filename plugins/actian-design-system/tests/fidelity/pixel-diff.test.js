// tests/fidelity/pixel-diff.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var P = require("../../scripts/fidelity/pixel-diff");

// Helper: build a w×h white RGBA buffer, then paint given pixels {x,y,rgb}.
function img(w, h, paints) {
  var d = Buffer.alloc(w * h * 4, 255); // all white, opaque
  (paints || []).forEach(function (p) {
    var i = (p.y * w + p.x) * 4;
    d[i] = p.r;
    d[i + 1] = p.g;
    d[i + 2] = p.b;
    d[i + 3] = 255;
  });
  return { width: w, height: h, data: d };
}

test("contentBox finds the bounding box of non-white pixels", function () {
  // 4×4 white with a black 2×2 block at (1,1)-(2,2)
  var im = img(4, 4, [
    { x: 1, y: 1, r: 0, g: 0, b: 0 },
    { x: 2, y: 1, r: 0, g: 0, b: 0 },
    { x: 1, y: 2, r: 0, g: 0, b: 0 },
    { x: 2, y: 2, r: 0, g: 0, b: 0 },
  ]);
  assert.deepEqual(P.contentBox(im.data, 4, 4), { x: 1, y: 1, w: 2, h: 2 });
});

test("contentBox on an all-white image returns the whole canvas", function () {
  var im = img(3, 2, []);
  assert.deepEqual(P.contentBox(im.data, 3, 2), { x: 0, y: 0, w: 3, h: 2 });
});

test("crop extracts the box region", function () {
  var im = img(4, 4, [{ x: 1, y: 1, r: 10, g: 20, b: 30 }]);
  var c = P.crop(im.data, 4, 4, { x: 1, y: 1, w: 2, h: 2 });
  assert.equal(c.length, 2 * 2 * 4);
  assert.deepEqual([c[0], c[1], c[2], c[3]], [10, 20, 30, 255]); // top-left of crop
});

test("resizeNearest upscales by replicating nearest source pixels", function () {
  // 1×1 red → 2×2 should be all red
  var src = Buffer.from([200, 0, 0, 255]);
  var out = P.resizeNearest(src, 1, 1, 2, 2);
  assert.equal(out.length, 16);
  for (var i = 0; i < 4; i++) {
    assert.deepEqual(
      [out[i * 4], out[i * 4 + 1], out[i * 4 + 2]],
      [200, 0, 0],
    );
  }
});

test("aspectMismatch flags divergent aspect ratios", function () {
  assert.equal(P.aspectMismatch({ w: 100, h: 50 }, { w: 100, h: 51 }, 0.1), false);
  assert.equal(P.aspectMismatch({ w: 100, h: 50 }, { w: 100, h: 90 }, 0.1), true);
});

test("normalizePair trims + resizes to a common canvas for same-aspect images", function () {
  // both have a centered block of the same aspect, different absolute sizes
  var a = img(4, 4, [
    { x: 1, y: 1, r: 0, g: 0, b: 0 },
    { x: 2, y: 1, r: 0, g: 0, b: 0 },
    { x: 1, y: 2, r: 0, g: 0, b: 0 },
    { x: 2, y: 2, r: 0, g: 0, b: 0 },
  ]); // content box 2×2
  var b = img(2, 2, [{ x: 0, y: 0, r: 0, g: 0, b: 0 }, { x: 1, y: 0, r: 0, g: 0, b: 0 }, { x: 0, y: 1, r: 0, g: 0, b: 0 }, { x: 1, y: 1, r: 0, g: 0, b: 0 }]); // content box 2×2
  var out = P.normalizePair(a, b, {});
  assert.equal(out.mismatch, undefined);
  assert.equal(out.w, 2);
  assert.equal(out.h, 2);
  assert.equal(out.a.length, out.b.length);
});

test("normalizePair returns {mismatch:true} on divergent aspect ratios", function () {
  var a = img(4, 2, [{ x: 0, y: 0, r: 0, g: 0, b: 0 }, { x: 3, y: 0, r: 0, g: 0, b: 0 }]); // wide content
  var b = img(2, 4, [{ x: 0, y: 0, r: 0, g: 0, b: 0 }, { x: 0, y: 3, r: 0, g: 0, b: 0 }]); // tall content
  var out = P.normalizePair(a, b, { aspectTol: 0.15 });
  assert.equal(out.mismatch, true);
});

test("diffRatio is 0 for identical buffers, ~0.25 for one differing pixel of four", function () {
  var same = Buffer.alloc(2 * 2 * 4, 255);
  assert.equal(P.diffRatio(same, Buffer.from(same), 2, 2, {}).ratio, 0);
  var other = Buffer.from(same);
  other[0] = 0;
  other[1] = 0;
  other[2] = 0; // make one pixel black
  var r = P.diffRatio(same, other, 2, 2, {});
  assert.equal(r.diffPixels, 1);
  assert.equal(r.ratio, 0.25);
});

test("gridVerdict fails if any cell exceeds threshold; passes empty", function () {
  assert.equal(P.gridVerdict([0.01, 0.02], 0.05).pass, true);
  assert.equal(P.gridVerdict([0.01, 0.09], 0.05).pass, false);
  assert.equal(P.gridVerdict([], 0.05).pass, true);
});
