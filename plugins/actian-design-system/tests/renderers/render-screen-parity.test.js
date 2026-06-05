"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

// flow-renderer.js has a UMD Node tail; requiring it in Node resolves
// fm-html-map + render-node and gives us the per-screen renderer.
var flow = require("../../scripts/renderers/html-renderers/flow-renderer.js");

var GOLDEN_DIR = path.join(__dirname, "__goldens__");
var UPDATE = process.env.UPDATE_GOLDENS === "1";
if (!fs.existsSync(GOLDEN_DIR)) fs.mkdirSync(GOLDEN_DIR, { recursive: true });

function golden(name, html) {
  var file = path.join(GOLDEN_DIR, name + ".html");
  if (UPDATE) {
    fs.writeFileSync(file, html);
    return;
  }
  assert.ok(
    fs.existsSync(file),
    "missing golden " + name + " (run UPDATE_GOLDENS=1)",
  );
  assert.equal(html, fs.readFileSync(file, "utf8"), "golden drift: " + name);
}

var FIXTURE = path.join(__dirname, "..", "fixtures", "admin-dashboard.json");
var data = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));

test("renderScreen is exported and is the same function as screen", function () {
  assert.equal(typeof flow.renderScreen, "function", "renderScreen exported");
  assert.equal(
    flow.renderScreen,
    flow.screen,
    "renderScreen IS screen (no drift)",
  );
});

test("renderScreen produces real content for admin-dashboard screens", function () {
  var s0 = flow.renderScreen(data.screens[0]);
  assert.ok(s0.indexOf('class="screen"') !== -1, "screen wrapper rendered");
  assert.ok(s0.indexOf("fm-page-header") !== -1, "page header chrome rendered");
  assert.ok(s0.indexOf("Dashboard") !== -1, "Dashboard page title rendered");
  assert.ok(
    s0.indexOf("Active Users") !== -1 || s0.indexOf("ACTIVE USERS") !== -1,
    "screen content rendered",
  );
  assert.ok(s0.indexOf("data-name=") !== -1, "data-name attributes present");
});

data.screens.forEach(function (s, i) {
  test("golden: render-screen-" + i, function () {
    golden("render-screen-" + i, flow.renderScreen(s));
  });
});
