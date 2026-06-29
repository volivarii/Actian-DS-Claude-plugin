#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);

var QUIET = { skipTokens: true, skipTerminology: true, skipAvoidWords: true };

// data-product's standard fields (typed shape preserved by resolve-properties)
var PROPS = [
  "name",
  "description",
  {
    name: "status",
    label: "Status",
    type: "enum",
    states: ["Draft", "Published"],
  },
  "datasets",
];

// A header-row table cell carrying up to 5 column labels.
function tableHeader(labels) {
  var props = {};
  var keys = ["Label", "Label 2", "Label 3", "Label 4", "Label 5"];
  labels.slice(0, 5).forEach(function (l, i) {
    props[keys[i]] = l;
  });
  return {
    type: "INSTANCE",
    ref: "fmTableCell",
    variant: "Type=Header",
    props: props,
  };
}

// A form field with a label.
function field(label) {
  return {
    type: "INSTANCE",
    ref: "fmTextInput",
    variant: "State=Default",
    props: { "Label Text": label },
  };
}

function flow(entityProperties, screens) {
  var glossary = { app: "Studio", entity: "Data product" };
  if (entityProperties !== undefined)
    glossary.entityProperties = entityProperties;
  return {
    meta: { feature: "t", app: "Studio", library: "ds", _glossary: glossary },
    screens: screens,
  };
}

function screen(id, content) {
  return { id: id, name: id, template: "studio", content: content };
}

function propFindings(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) {
    return f.kind === "properties-ungrounded";
  });
}

describe("validate-properties-grounding (S3b, advisory)", function () {
  it("table whose columns reflect entity fields → no finding", function () {
    var data = flow(PROPS, [
      screen("s1", [tableHeader(["Name", "Status", "Datasets"])]),
    ]);
    assert.strictEqual(propFindings(data).length, 0);
  });

  it("form whose fields reflect entity fields → no finding", function () {
    var data = flow(PROPS, [
      screen("s1", [field("Name"), field("Description")]),
    ]);
    assert.strictEqual(propFindings(data).length, 0);
  });

  it("table/form reflecting NONE of the entity fields → 1 properties-ungrounded info, screen ''", function () {
    var data = flow(PROPS, [
      screen("s1", [tableHeader(["Column A", "Column B", "Value"])]),
    ]);
    var f = propFindings(data);
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "properties-ungrounded");
    assert.strictEqual(f[0].severity, "info");
    assert.strictEqual(f[0].screen, "");
    assert.ok(f[0].message && f[0].message.length > 0);
  });

  it("no _glossary.entityProperties (legacy) → no findings", function () {
    var data = flow(undefined, [
      screen("s1", [tableHeader(["Column A", "Column B"])]),
    ]);
    assert.strictEqual(propFindings(data).length, 0);
  });

  it("screen with no table/form → skipped (can't judge)", function () {
    var data = flow(PROPS, [screen("s1", [{ type: "TEXT", text: "hello" }])]);
    assert.strictEqual(propFindings(data).length, 0);
  });

  it("flow-level: one grounded screen grounds the whole flow", function () {
    var data = flow(PROPS, [
      screen("s1", [tableHeader(["Name", "Status"])]), // grounded
      screen("s2", [tableHeader(["Column A", "Column B"])]), // not grounded on its own
    ]);
    assert.strictEqual(propFindings(data).length, 0);
  });

  it("flow-level: all table/form screens ungrounded → exactly 1 flow-level finding", function () {
    var data = flow(PROPS, [
      screen("s1", [tableHeader(["Column A", "Column B"])]),
      screen("s2", [field("Field one"), field("Field two")]),
    ]);
    assert.strictEqual(propFindings(data).length, 1);
  });

  it("camelCase property grounded by its humanized label → no finding (S3c regression guard)", function () {
    // apiVersion (real: data-product, data-contract) → humanizeName → "Api version".
    // The screen-generator writes the column header from .label, but the grounding
    // check tokenizes .name. tokenizeLabel("apiVersion")=["apiversion"] vs the header
    // "Api version"=["api","version"] — no overlap unless the check also tokenizes .label.
    var props = [{ name: "apiVersion", label: "Api version", type: "string" }];
    var data = flow(props, [screen("s1", [tableHeader(["Api version"])])]);
    assert.strictEqual(propFindings(data).length, 0);
  });

  it("the finding is advisory — info, not error/P0", function () {
    var data = flow(PROPS, [
      screen("s1", [tableHeader(["Column A", "Column B"])]),
    ]);
    var f = propFindings(data);
    assert.strictEqual(f.length, 1);
    assert.notStrictEqual(f[0].severity, "error");
    assert.notStrictEqual(f[0].severity, "P0");
  });
});

describe("validate-properties-grounding (CLI visibility)", function () {
  var execFileSync = require("child_process").execFileSync;
  var fs = require("fs");
  var os = require("os");
  var NODE = process.execPath;
  var CLI = path.join(
    PLUGIN_ROOT,
    "scripts",
    "validation",
    "validate-flow-data.js",
  );

  it("properties-ungrounded reaches CLI --json output (not silently dropped)", function () {
    var data = flow(PROPS, [
      screen("s1", [tableHeader(["Column A", "Column B"])]),
    ]);
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "s3b-prop-"));
    var file = path.join(dir, "flow-data.json");
    fs.writeFileSync(file, JSON.stringify(data));
    var out = "";
    try {
      out = execFileSync(
        NODE,
        [
          CLI,
          file,
          "--json",
          "--skip-tokens",
          "--skip-terminology",
          "--skip-avoid-words",
        ],
        { encoding: "utf8" },
      );
    } catch (e) {
      out = (e.stdout || "").toString(); // validator exits non-zero on warnings; stdout carries JSON
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    var issues = JSON.parse(out);
    var found = issues.some(function (i) {
      return i.check === "properties-ungrounded";
    });
    assert.ok(
      found,
      "CLI --json output should include a properties-ungrounded entry",
    );
  });
});
