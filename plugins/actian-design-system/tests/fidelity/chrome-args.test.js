#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var H = require("../../scripts/fidelity/render-leaf.js");
var S = require("../../scripts/fidelity/structural-check.js");

var LINUX = ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--disable-lcd-text"];

describe("chrome arg builders carry the Linux-determinism flags", function () {
  it("screenshotArgs includes the flags + the screenshot/window args", function () {
    var a = H.screenshotArgs({ outPng: "/tmp/x.png", htmlPath: "/tmp/x.html", width: 100, height: 50 });
    LINUX.forEach(function (f) { assert.ok(a.indexOf(f) !== -1, "missing " + f); });
    assert.ok(a.indexOf("--screenshot=/tmp/x.png") !== -1);
    assert.ok(a.indexOf("--window-size=100,50") !== -1);
  });
  it("measureArgs includes the flags + --dump-dom", function () {
    var a = S.measureArgs({ htmlPath: "/tmp/x.html", width: 360 });
    LINUX.forEach(function (f) { assert.ok(a.indexOf(f) !== -1, "missing " + f); });
    assert.ok(a.indexOf("--dump-dom") !== -1);
    assert.ok(a.indexOf("--window-size=360,900") !== -1);
  });
});
