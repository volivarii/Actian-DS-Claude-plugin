"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var { assembleFlowShare } = require("../../scripts/renderers/assemble-flow-share.js");

var FIXTURE = path.join(__dirname, "..", "fixtures", "admin-dashboard.json");
var data = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));

describe("assembleFlowShare (direct)", function () {
  it("returns a self-contained two-view deliverable string", function () {
    var html = assembleFlowShare(data);
    assert.ok(html.indexOf("<!DOCTYPE html>") !== -1, "DOCTYPE");
    assert.ok(html.indexOf("proto-toggle") !== -1, "view toggle");
    assert.ok(html.indexOf("proto-stage--overview") !== -1, "overview");
    assert.strictEqual(html.split('class="proto-screen-cell"').length - 1, data.screens.length, "one cell per screen");
    assert.ok(html.indexOf("--zen-") !== -1 && html.indexOf("--fm-") !== -1, "tokens + fm CSS inlined");
    assert.ok(html.indexOf("cdn.jsdelivr.net") === -1 && html.indexOf("fonts.googleapis.com") === -1, "no CDN");
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), "no placeholder token leak");
  });
  it("escapes quotes in screen names (no attribute breakout)", function () {
    var html = assembleFlowShare({ meta: { feature: "Q", app: "S", pluginVersion: "1.0" }, screens: [{ name: 'A "x" <img onerror=z>', template: "studio", content: [] }] });
    assert.ok(html.indexOf("onerror=z>") === -1, "no live injected element");
    assert.ok(html.indexOf('x-for="item in screens"') !== -1, "markup after screens[] intact");
  });
  it("empty screens[] produces a valid shell", function () {
    var html = assembleFlowShare({ meta: { feature: "E" }, screens: [] });
    assert.ok(html.indexOf("<!DOCTYPE html>") !== -1 && html.indexOf("proto-stage") !== -1, "valid shell");
  });
});
