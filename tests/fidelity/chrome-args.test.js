#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var H = require("../../plugins/actian-design-system/scripts/fidelity/render-leaf.js");
var S = require("../../plugins/actian-design-system/scripts/fidelity/structural-check.js");

var LINUX = ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--disable-lcd-text"];

describe("chrome arg builders carry the Linux-determinism flags", function () {
  it("screenshotArgs includes the flags + the screenshot/window args", function () {
    var a = H.screenshotArgs({ outPng: "/tmp/x.png", htmlPath: "/tmp/x.html", width: 100, height: 50 });
    LINUX.forEach(function (f) { assert.ok(a.indexOf(f) !== -1, "missing " + f); });
    assert.ok(a.indexOf("--screenshot=/tmp/x.png") !== -1);
    assert.ok(a.indexOf("--window-size=100,50") !== -1);
  });
  it("screenshotArgs uses opts.url in place of the htmlPath file URL when given", function () {
    var a = H.screenshotArgs({ outPng: "/tmp/x.png", url: "file:///tmp/other.html?step=2", width: 100, height: 50 });
    assert.strictEqual(a[a.length - 1], "file:///tmp/other.html?step=2");
  });
  it("measureArgs includes the flags + --dump-dom", function () {
    var a = S.measureArgs({ htmlPath: "/tmp/x.html", width: 360 });
    LINUX.forEach(function (f) { assert.ok(a.indexOf(f) !== -1, "missing " + f); });
    assert.ok(a.indexOf("--dump-dom") !== -1);
    assert.ok(a.indexOf("--window-size=360,900") !== -1);
  });
});

// F6: a wedged headless Chrome ignores SIGTERM for a while; execFileSync's
// timeout sends SIGTERM and then WAITS for the child to exit, so a screenshot
// bounded at 60s can still take much longer in the wedged case. killSignal
// SIGKILL only matters once a timeout is set at all, so callers that pass no
// timeout must see no killSignal either: execOpts stays exactly {stdio:"pipe"}.
describe("screenshot sets killSignal SIGKILL only when a timeout is set", function () {
  it("no timeoutMs: execOpts is exactly {stdio:\"pipe\"}, no timeout, no killSignal", function () {
    var seen = null;
    H.screenshot({
      chrome: "/chrome",
      outPng: "/tmp/x.png",
      htmlPath: "/tmp/x.html",
      width: 100,
      height: 50,
      exec: function (bin, args, execOpts) { seen = execOpts; },
    });
    assert.deepStrictEqual(seen, { stdio: "pipe" });
  });
  it("a timeoutMs sets both timeout and killSignal SIGKILL", function () {
    var seen = null;
    H.screenshot({
      chrome: "/chrome",
      outPng: "/tmp/x.png",
      htmlPath: "/tmp/x.html",
      width: 100,
      height: 50,
      timeoutMs: 60000,
      exec: function (bin, args, execOpts) { seen = execOpts; },
    });
    assert.deepStrictEqual(seen, { stdio: "pipe", timeout: 60000, killSignal: "SIGKILL" });
  });
});
