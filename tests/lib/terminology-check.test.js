"use strict";
// terminology-check.js: the notUse words from the app context and the content
// rules' avoid words, over every screen's header and content copy.
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var check = require(path.join(__dirname, "..", "..", "plugins", "actian-design-system", "scripts", "lib", "terminology-check.js"));

function flow(nodes, glossary) {
  return {
    meta: { feature: "t", app: "studio", _glossary: glossary || {} },
    screens: [{ id: "t-1", name: "Screen", content: nodes }],
  };
}
function texts(list) {
  return list.map(function (t) { return { type: "TEXT", content: t }; });
}

describe("findTerminologyIssues", function () {
  it("does not flag a known label that holds a notUse word, and still flags a real miss", function () {
    // "Record count" holds a notUse word ("record"); a known label is masked
    // before the rules run, so only the free sentence is flagged.
    var glossary = {
      chrome: { header: { type: "Studio" }, sidebar: [{ label: "Access requests" }] },
      entityProperties: [{ label: "Api version" }, { label: "Record count" }],
      relationships: [{ label: "Input port" }, { label: "Output port" }],
    };
    var issues = check.findTerminologyIssues(flow(texts(["Input ports (2)", "Api version", "Record count", "Choose a record for this port"]), glossary));
    assert.strictEqual(issues.length, 1, JSON.stringify(issues));
    assert.strictEqual(issues[0].check, "terminology");
    assert.strictEqual(issues[0].severity, "P1");
    assert.strictEqual(issues[0].screenId, "t-1");
    assert.strictEqual(issues[0].path, "content[3].content");
    assert.match(issues[0].value, /Choose a record/);
    assert.match(issues[0].suggestion, /^use "/);
  });

  it("reads the page header", function () {
    var data = flow([]);
    data.screens[0].pageHeader = { title: "Choose a record" };
    var issues = check.findTerminologyIssues(data);
    assert.deepStrictEqual(issues.map(function (i) { return i.path; }), ["pageHeader.title"]);
  });

  it("never scans variant, name, template, id or dsSlug props", function () {
    var data = flow([{ type: "INSTANCE", props: { variant: "record", name: "record", template: "record", id: "record", dsSlug: "record", Label: "Save" } }]);
    assert.deepStrictEqual(check.findTerminologyIssues(data), []);
  });

  it("returns nothing for a file with no screens array", function () {
    assert.deepStrictEqual(check.findTerminologyIssues({}), []);
    assert.deepStrictEqual(check.findTerminologyIssues(null), []);
  });
});

describe("findAvoidWords", function () {
  it("flags an avoid word in copy and in a copy prop, and names the reason", function () {
    var issues = check.findAvoidWords(flow([{ type: "INSTANCE", props: { Label: "Please save" }, children: texts(["Please wait"]) }]));
    assert.deepStrictEqual(issues.map(function (i) { return i.path; }), ["content[0].props.Label", "content[0].children[0].content"]);
    issues.forEach(function (i) {
      assert.strictEqual(i.check, "avoid-word");
      assert.ok(i.reason, "carries the rule's reason");
    });
  });

  it("does not read a structural prop as copy", function () {
    assert.deepStrictEqual(check.findAvoidWords(flow([{ type: "INSTANCE", props: { State: "please", Type: "please" } }])), []);
  });
});
