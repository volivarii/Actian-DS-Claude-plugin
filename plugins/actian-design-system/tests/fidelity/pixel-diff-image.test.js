#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var P = require("../../scripts/fidelity/pixel-diff.js");

function solid(w, h, r, g, b) {
  var data = Buffer.alloc(w * h * 4);
  for (var i = 0; i < w * h; i++) {
    data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = 255;
  }
  return data;
}

describe("diffImage", function () {
  it("returns a decodable PNG buffer sized to the inputs", function () {
    var a = solid(8, 8, 0, 0, 0);
    var b = solid(8, 8, 255, 255, 255);
    var png = P.diffImage(a, b, 8, 8);
    assert.ok(Buffer.isBuffer(png) && png.length > 0);
    var decoded = P.decodePng(png);
    assert.strictEqual(decoded.width, 8);
    assert.strictEqual(decoded.height, 8);
  });
});
