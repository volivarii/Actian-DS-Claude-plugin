"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var fm = require("../../scripts/renderers/html-renderers/fm-html-map.js");

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

var FIXTURES = {
  fmButton: {
    ref: "fmButton",
    variant: "Type=Primary, Size=md",
    props: { Label: "Save" },
  },
  fmTextInput: {
    ref: "fmTextInput",
    props: { "Label Text": "Email", "Input Text": "you@co" },
  },
  fmCheckbox: {
    ref: "fmCheckbox",
    variant: "State=On",
    props: { Label: "Agree" },
  },
  fmAlert: {
    ref: "fmAlert",
    variant: "Type=Warning",
    props: { Message: "Heads up" },
  },
  fmBadge: { ref: "fmBadge", props: { Label: "New" } },
  fmTabs: {
    ref: "fmTabs",
    props: { Tabs: "Overview, Details", Active: "Overview" },
  },
  fmMenu: { ref: "fmMenu", props: { Items: "Edit, Delete" } },
  fmNavBar: { ref: "fmNavBar", props: { Items: "Home, Reports" } },
  fmUser: { ref: "fmUser", props: { Name: "Ada Lovelace" } },
  fmMultiSelectMenuItem: {
    ref: "fmMultiSelectMenuItem",
    variant: "State=Selected",
    props: { Label: "Option" },
  },
  iconFallback: { ref: "fmAcademicCap", name: "Academic cap" },
};

Object.keys(FIXTURES).forEach(function (name) {
  test("golden: " + name, function () {
    var node = Object.assign({ type: "INSTANCE" }, FIXTURES[name]);
    golden("component-" + name, fm.renderFMComponent(node));
  });
});
