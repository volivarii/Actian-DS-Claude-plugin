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

var RELS = [
  { relationship: "hasLineage", relatedEntity: "lineage", label: "Lineage" },
  { relationship: "hasGlossaryItems", relatedEntity: "glossary-item", label: "Glossary item" },
];

function tabNode(label) {
  return { type: "INSTANCE", ref: "fmTab", props: { "Tab label": label } };
}

function flow(relationships, matchedRecipe, tabLabels) {
  var glossary = { app: "Studio", entity: "Catalog object" };
  if (relationships !== undefined) glossary.relationships = relationships;
  return {
    meta: { feature: "t", app: "Studio", library: "ds", _glossary: glossary },
    screens: [
      {
        id: "s1",
        name: "S",
        template: "studio",
        matchedRecipe: matchedRecipe,
        content: (tabLabels || []).map(tabNode),
      },
    ],
  };
}

function relFindings(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) {
    return f.kind === "relationships-ungrounded";
  });
}

describe("validate-relationship-grounding (S3, advisory)", function () {
  it("detail screen whose tabs reflect a relationship → no finding", function () {
    var f = relFindings(flow(RELS, "detail-view", ["Overview", "Lineage", "Settings"]));
    assert.strictEqual(f.length, 0);
  });

  it("detail screen whose tabs reflect NO relationship → relationships-ungrounded info", function () {
    var f = relFindings(flow(RELS, "detail-view", ["Overview", "Activity", "Settings"]));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "relationships-ungrounded");
    assert.strictEqual(f[0].severity, "info");
    assert.strictEqual(f[0].screen, "s1");
    assert.ok(f[0].message, "finding should carry a non-empty message");
  });

  it("no _glossary.relationships (legacy) → no findings", function () {
    assert.strictEqual(relFindings(flow(undefined, "detail-view", ["Activity"])).length, 0);
  });

  it("non-detail recipe → skipped", function () {
    assert.strictEqual(relFindings(flow(RELS, "table-list", ["Activity"])).length, 0);
  });

  it("detail screen with no tabs → skipped (can't judge)", function () {
    assert.strictEqual(relFindings(flow(RELS, "detail-view", [])).length, 0);
  });

  it("the finding is advisory — info, not error/P0", function () {
    var all = validate.validate(flow(RELS, "detail-view", ["Activity"]), QUIET).findings;
    var ours = all.filter(function (f) { return f.kind === "relationships-ungrounded"; });
    assert.strictEqual(ours.length, 1);
    assert.notStrictEqual(ours[0].severity, "error");
    assert.notStrictEqual(ours[0].severity, "P0");
  });
});

describe("validate-relationship-grounding (CLI visibility)", function () {
  var execFileSync = require("child_process").execFileSync;
  var fs = require("fs");
  var os = require("os");
  var NODE = process.execPath;
  var CLI = path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js");

  it("relationships-ungrounded reaches CLI --json output (not silently dropped)", function () {
    var data = flow(RELS, "detail-view", ["Overview", "Activity", "Settings"]);
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), "s3-rel-"));
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
      // validator exits non-zero on warnings; stdout still carries the JSON
      out = (e.stdout || "").toString();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    var issues = JSON.parse(out);
    var found = issues.some(function (i) {
      return i.check === "relationships-ungrounded";
    });
    assert.ok(found, "CLI --json output should include a relationships-ungrounded entry");
  });
});
