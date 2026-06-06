"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var fm = require("../../scripts/renderers/html-renderers/fm-html-map.js");
var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");

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
  // Prop-key-drift regression guards (the fm-html-map case must render real
  // content, not just exist). fmStepper: numbered + labelled wizard step.
  fmStepperActive: {
    ref: "fmStepper",
    variant: "State=Active",
    props: { Label: "Choose connector", "Step number": "1" },
  },
  fmStepperUpcoming: {
    ref: "fmStepper",
    variant: "State=Upcoming",
    props: { Label: "Review", "Step number": "5" },
  },
  // #id-suffixed prop keys (as the Figma push consumes them) must resolve in
  // HTML too — guards normalizeProps() suffix-stripping.
  fmButtonSuffixedProps: {
    ref: "fmButton",
    variant: "Type=Outline, Size=md",
    props: { "Label#1411:32": "Cancel", "👁 Leading Icon#1410:3": false },
  },
  // Multi-column header row authored as one fmTableCell with numbered Labels.
  fmTableCellHeaderRow: {
    ref: "fmTableCell",
    variant: "Type=Header",
    props: { Label: "Name", "Label 2": "Type", "Label 3": "Status" },
  },
};

Object.keys(FIXTURES).forEach(function (name) {
  test("golden: " + name, function () {
    var node = Object.assign({ type: "INSTANCE" }, FIXTURES[name]);
    golden("component-" + name, fm.renderFMComponent(node));
  });
});

// Hi-fi DS tier goldens (Phase 0 scope: button, input, checkbox-with-label).
// Each fixture is a library:"ds" INSTANCE; renderDSComponent switches on dsSlug.
var DS_FIXTURES = {
  buttonPrimary: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Default",
    props: { Label: "Save" },
  },
  buttonSecondary: {
    dsSlug: "button",
    variant: "Type=Secondary, Size=Default",
    props: { Label: "Cancel" },
  },
  buttonTertiary: {
    dsSlug: "button",
    variant: "Type=Tertiary, Size=Default",
    props: { Label: "Skip" },
  },
  buttonCritical: {
    dsSlug: "button",
    variant: "Type=Critical primary, Size=Default",
    props: { Label: "Delete" },
  },
  buttonDisabled: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Default, State=Disabled",
    props: { Label: "Save" },
  },
  buttonSmall: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Small",
    props: { Label: "Go" },
  },
  buttonWithIcons: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Default",
    props: {
      Label: "Add",
      "Leading icon show": true,
      "Trailing icon show": true,
    },
  },
  inputDefault: {
    dsSlug: "input",
    variant: "States=Default",
    props: { Label: "Email", "Placeholder text": "you@co" },
  },
  inputTrailingIcon: {
    dsSlug: "input",
    variant: "States=Default",
    props: {
      Label: "Date",
      "Placeholder text": "Select a date",
      "Trailing icon": "chevron",
    },
  },
  inputDisabled: {
    dsSlug: "input",
    variant: "States=Disabled",
    props: { Label: "Email", "Placeholder text": "you@co" },
  },
  checkboxOff: {
    dsSlug: "checkbox-with-label",
    variant: "Selected=No",
    props: { Label: "Agree to terms" },
  },
  checkboxOn: {
    dsSlug: "checkbox-with-label",
    variant: "Selected=Yes",
    props: { Label: "Agree to terms" },
  },
  checkboxDisabled: {
    dsSlug: "checkbox-with-label",
    variant: "Selected=No, State=Disabled",
    props: { Label: "Agree to terms" },
  },
};

Object.keys(DS_FIXTURES).forEach(function (name) {
  test("golden(ds): " + name, function () {
    var node = Object.assign(
      { type: "INSTANCE", library: "ds" },
      DS_FIXTURES[name],
    );
    golden("ds-" + name, ds.renderDSComponent(node));
  });
});

var renderNode;
try {
  renderNode = require("../../scripts/renderers/html-renderers/render-node.js");
} catch (e) {
  renderNode = null;
}

var STRUCT_FIXTURES = {
  frameRow: {
    type: "FRAME",
    layout: { mode: "HORIZONTAL" },
    children: [
      { type: "TEXT", content: "A", width: 80 },
      { type: "TEXT", content: "B" },
    ],
  },
  textClamped: {
    type: "TEXT",
    content: "A very long label that should clamp",
    width: 100,
  },
  textUpper: { type: "TEXT", content: "header", textCase: "UPPER" },
  textMetrics: {
    type: "TEXT",
    content: "Metrics",
    font: "Inter:Regular",
    size: 14,
    lineHeight: { value: 20, unit: "PIXELS" },
    letterSpacing: { value: 0.5, unit: "PIXELS" },
  },
  textDefaultFont: { type: "TEXT", content: "Defaulted", font: ":Bold" },
  rectFallback: { type: "RECT" },
  ellipseFallback: { type: "ELLIPSE" },
  divider: { type: "DIVIDER" },
  frameJustified: {
    type: "FRAME",
    layout: {
      mode: "HORIZONTAL",
      primaryAxisAlignItems: "SPACE_BETWEEN",
      counterAxisAlignItems: "CENTER",
    },
    children: [
      { type: "TEXT", content: "L" },
      { type: "TEXT", content: "R" },
    ],
  },
  framePadded: {
    type: "FRAME",
    layout: { mode: "VERTICAL", padding: [12, 8, 4, 16] },
    children: [{ type: "TEXT", content: "x" }],
  },
};
Object.keys(STRUCT_FIXTURES).forEach(function (name) {
  test("golden(struct/inter): " + name, function () {
    assert.ok(renderNode, "render-node.js must exist");
    golden(
      "struct-inter-" + name,
      renderNode.renderNode(STRUCT_FIXTURES[name], { defaultFont: "Inter" }),
    );
  });
  test("golden(struct/roboto): " + name, function () {
    assert.ok(renderNode, "render-node.js must exist");
    golden(
      "struct-roboto-" + name,
      renderNode.renderNode(STRUCT_FIXTURES[name], { defaultFont: "Roboto" }),
    );
  });
});
