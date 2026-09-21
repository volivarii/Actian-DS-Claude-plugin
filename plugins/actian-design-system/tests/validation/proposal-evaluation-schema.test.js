"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var validateSchema = require("../../scripts/validation/validate-schema.js");

var ROOT = path.resolve(__dirname, "..", "..");
var SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-evaluation.schema.json"), "utf8"));

// A minimal, valid --evaluate output: the framing and the product read, one decision
// named but not yet answered. No options, no comparison, no pick: those belong to the
// finished proposal-data.json this stage never writes.
function evaluation() {
  return {
    meta: {
      title: "DIP-I-496: show role and permission for a logged-in user",
      date: "2026-09-14",
      apps: ["explorer"],
      skill: "actian-ux-proposal",
      stage: "evaluation",
    },
    source: {
      system: "jira",
      id: "DIP-I-496",
      body: "As a user I want to see which permission group I belong to.",
    },
    context: {
      question: "How does a logged-in user see their assigned role and permission group?",
      product: ["A permission group is a Group record in Administration."],
      sources: ["app-context: explorer chrome"],
    },
    scope: {
      goals: ["A user can read their permission group without leaving the dropdown."],
      nonGoals: ["Editing a permission group from the dropdown; assignment stays in Administration."],
    },
    research: {
      ran: false,
      findings: [],
      skippedBecause: "--no-research",
    },
    decisions: [
      { id: "where-the-reach-shows", question: "Where does an admin see a share's real reach?" },
    ],
  };
}

function errors(d) {
  return validateSchema(d, SCHEMA).filter(function (e) { return e.indexOf("(warning)") === -1; });
}

describe("proposal-evaluation.schema.json", function () {
  it("accepts an evaluation with only id and question on each decision", function () {
    assert.deepStrictEqual(errors(evaluation()), []);
  });

  it("refuses an evaluation with no source", function () {
    var d = evaluation();
    delete d.source;
    assert.ok(errors(d).some(function (e) { return e.indexOf("source") !== -1; }));
  });

  it("refuses a fifth decision, and refuses none at all", function () {
    var d = evaluation();
    while (d.decisions.length < 5) d.decisions.push({ id: "x" + d.decisions.length, question: "And then what?" });
    assert.ok(errors(d).some(function (e) { return e.indexOf("maximum is 4") !== -1; }));
    var e = evaluation();
    e.decisions = [];
    assert.ok(errors(e).some(function (x) { return x.indexOf("minimum is 1") !== -1; }));
  });

  it("keeps every shared key identical to the proposal schema", function () {
    var ev = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-evaluation.schema.json"), "utf8"));
    var pr = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-data.schema.json"), "utf8"));
    ["context", "scope", "research", "openQuestions", "source"].forEach(function (key) {
      assert.deepStrictEqual(ev.properties[key], pr.properties[key],
        key + " has drifted between the two stages; the evaluation is a strict prefix, not a second data model");
    });
  });
});
