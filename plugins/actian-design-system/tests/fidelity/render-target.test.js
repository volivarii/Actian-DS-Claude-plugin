#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var H = require("../../scripts/fidelity/render-leaf.js");

describe("renderTarget seam", function () {
  it("returns the fragment and a full HTML doc embedding it + the ready signal", function () {
    var t = H.renderTarget("button");
    assert.ok(typeof t.fragment === "string" && t.fragment.length > 0);
    assert.ok(/<!doctype html>/i.test(t.html));
    assert.ok(t.html.indexOf(t.fragment) !== -1, "html should embed the fragment");
    assert.ok(/data-fidelity-ready/.test(t.html), "html should carry the ready signal");
  });
  it("readySignalScript sets data-fidelity-ready after fonts.ready", function () {
    var s = H.readySignalScript();
    assert.ok(/document\.fonts\.ready/.test(s));
    assert.ok(/data-fidelity-ready/.test(s));
  });
});
