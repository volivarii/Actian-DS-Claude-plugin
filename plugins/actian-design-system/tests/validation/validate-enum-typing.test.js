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

// Entity with one enum property (status) + one plain string property.
var PROPS = [
  "name",
  { name: "status", label: "Status", type: "enum", states: ["Draft", "Published", "Deprecated"] },
];
// Entity with NO enum property.
var PLAIN_PROPS = ["name", "description"];

function tableHeader(labels) {
  var props = {};
  var keys = ["Label", "Label 2", "Label 3", "Label 4", "Label 5"];
  labels.slice(0, 5).forEach(function (l, i) { props[keys[i]] = l; });
  return { type: "INSTANCE", ref: "fmTableCell", variant: "Type=Header", props: props };
}
function pillCell(value) {
  return { type: "INSTANCE", ref: "fmTableCell", variant: "Type=Pill", props: { "Cell Text": value } };
}
function textCell(value) {
  return { type: "INSTANCE", ref: "fmTableCell", variant: "Type=Text", props: { "Cell Text": value } };
}
function flow(entityProperties, screens) {
  var glossary = { app: "Studio", entity: "Data product" };
  if (entityProperties !== undefined) glossary.entityProperties = entityProperties;
  return { meta: { feature: "t", app: "Studio", library: "ds", _glossary: glossary }, screens: screens };
}
function screen(id, content) {
  return { id: id, name: id, template: "studio", content: content };
}
function enumFindings(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) {
    return f.kind === "enum-not-typed";
  });
}

describe("validate-enum-typing (S3c, advisory)", function () {
  it("enum prop + table with NO pill cell → 1 enum-not-typed info, screen ''", function () {
    var data = flow(PROPS, [screen("s1", [tableHeader(["Name", "Status"]), textCell("Published")])]);
    var f = enumFindings(data);
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "enum-not-typed");
    assert.strictEqual(f[0].severity, "info");
    assert.strictEqual(f[0].screen, "");
    assert.ok(f[0].message && f[0].message.indexOf("Status") !== -1);
  });

  it("enum prop + table WITH a pill cell → no finding", function () {
    var data = flow(PROPS, [screen("s1", [tableHeader(["Name", "Status"]), pillCell("Published")])]);
    assert.strictEqual(enumFindings(data).length, 0);
  });

  it("no enum property → no finding (even with a table, no pill)", function () {
    var data = flow(PLAIN_PROPS, [screen("s1", [tableHeader(["Name", "Description"]), textCell("x")])]);
    assert.strictEqual(enumFindings(data).length, 0);
  });

  it("enum prop but NO table in the flow → no finding", function () {
    var data = flow(PROPS, [screen("s1", [{ type: "TEXT", text: "hello" }])]);
    assert.strictEqual(enumFindings(data).length, 0);
  });

  it("no _glossary.entityProperties (legacy) → no finding", function () {
    var data = flow(undefined, [screen("s1", [tableHeader(["Name"]), textCell("x")])]);
    assert.strictEqual(enumFindings(data).length, 0);
  });

  it("the finding is advisory — info, never error/P0", function () {
    var data = flow(PROPS, [screen("s1", [tableHeader(["Status"]), textCell("Draft")])]);
    var f = enumFindings(data);
    assert.strictEqual(f.length, 1);
    assert.notStrictEqual(f[0].severity, "error");
  });
});

describe("validate-enum-typing (CLI visibility)", function () {
  var execFileSync = require("child_process").execFileSync;
  var fs = require("fs");
  var os = require("os");
  var NODE = process.execPath;
  var CLI = path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js");

  it("enum-not-typed reaches CLI --json output (not silently dropped)", function () {
    var data = flow(PROPS, [screen("s1", [tableHeader(["Status"]), textCell("Draft")])]);
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "s3c-enum-"));
    var file = path.join(dir, "flow-data.json");
    fs.writeFileSync(file, JSON.stringify(data));
    var out = "";
    try {
      out = execFileSync(
        NODE,
        [CLI, file, "--json", "--skip-tokens", "--skip-terminology", "--skip-avoid-words"],
        { encoding: "utf8" },
      );
    } catch (e) {
      out = (e.stdout || "").toString();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    var issues = JSON.parse(out);
    var found = issues.some(function (i) { return i.check === "enum-not-typed"; });
    assert.ok(found, "CLI --json output should include an enum-not-typed entry");
  });
});
