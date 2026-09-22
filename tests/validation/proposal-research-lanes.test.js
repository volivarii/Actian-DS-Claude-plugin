"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var validate = require("../../plugins/actian-design-system/scripts/validation/validate-proposal.js");

var ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var FIXTURE = path.join(__dirname, "..", "fixtures", "proposal-dip-i-496.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }

function run(research) {
  var d = load();
  d.research = research;
  return validate.validateProposal(d).findings;
}
function kinds(findings, path) {
  return findings.filter(function (f) { return (f.path || "").indexOf(path) === 0; });
}
function severities(findings, path) {
  return kinds(findings, path).map(function (f) { return f.severity; });
}

var OK = {
  lanes: ["competitors", "designSystems", "ours"],
  ran: true,
  findings: [
    { lane: "competitors", claim: "Atlan puts effective access on the profile.", source: "Atlan, User profiles" },
    { lane: "designSystems", claim: "Carbon sets a role as secondary identity.", source: "Carbon, Account menu" },
    { lane: "ours", claim: "A read-only tag is the existing mark for access a user cannot change.", source: "guideline: read-only-tag" },
  ],
};

// Found in review. The four lane names are authored three times over: the schema's enum, the
// validator's list and the renderer's ordered labels. Nothing compared them, so adding a fifth
// lane in two of the three would render it, refuse it, or silently drop it depending on which
// one was missed. This is the comparison.
describe("the lane vocabulary agrees everywhere it is written down", function () {
  var SCHEMA = path.join(ROOT, "schemas", "proposal-data.schema.json");
  var EVAL = path.join(ROOT, "schemas", "proposal-evaluation.schema.json");
  function enumOf(file, where) {
    var s = JSON.parse(fs.readFileSync(file, "utf8"));
    var r = s.properties.research.properties;
    return where === "lanes" ? r.lanes.items.enum : r.findings.items.properties.lane.enum;
  }
  function jsList(file, name) {
    var src = fs.readFileSync(path.join(ROOT, file), "utf8");
    var m = src.match(new RegExp("var " + name + " = \\[([\\s\\S]*?)\\];"));
    assert.ok(m, name + " is not declared in " + file);
    return (m[1].match(/["']([a-zA-Z]+)["']/g) || []).map(function (q) { return q.slice(1, -1); });
  }

  it("names the same four lanes in the schema, the validator and the renderer", function () {
    var want = ["competitors", "designSystems", "ours", "yours"];
    assert.deepStrictEqual(enumOf(SCHEMA, "lanes"), want, "proposal schema research.lanes");
    assert.deepStrictEqual(enumOf(SCHEMA, "finding"), want, "proposal schema finding.lane");
    assert.deepStrictEqual(enumOf(EVAL, "lanes"), want, "evaluation schema research.lanes");
    assert.deepStrictEqual(jsList("scripts/validation/validate-proposal.js", "RESEARCH_LANES"), want, "the validator");
    // The renderer's list is objects; its ids are the first string in each.
    var rendered = jsList("scripts/renderers/assemble-proposal.js", "RESEARCH_LANES").filter(function (v) {
      return want.indexOf(v) !== -1;
    });
    assert.deepStrictEqual(rendered, want, "the renderer, in reading order");
  });
});

describe("validate-proposal: the research lanes", function () {
  it("passes the shape the gate produces", function () {
    assert.deepStrictEqual(severities(run(OK), "research"), [], "a clean research block reports something");
  });

  // The check that earns its place. An agent asked for "our own knowledge" will return a web
  // result with our name on it unless something makes it cite the substrate, and once that
  // claim is in the document nobody downstream can tell it from a real one.
  it("refuses an ours finding that cites no substrate source", function () {
    var bad = JSON.parse(JSON.stringify(OK));
    bad.findings[2].source = "Some blog about permissions";
    var f = kinds(run(bad), "research.findings[2].source");
    assert.strictEqual(f.length, 1, "no finding on an ungrounded ours claim");
    assert.strictEqual(f[0].severity, "P0");
  });

  it("accepts every substrate prefix the lane is allowed to read", function () {
    ["app-context: explorer chrome", "guideline: read-only-tag", "pattern: progressive disclosure", "accessibility: focus-keyboard", "foundations: color-primitives"].forEach(function (src) {
      var d = JSON.parse(JSON.stringify(OK));
      d.findings[2].source = src;
      assert.deepStrictEqual(severities(run(d), "research.findings[2]"), [], src + " was refused");
    });
  });

  it("refuses a finding in a lane nobody asked for", function () {
    var bad = JSON.parse(JSON.stringify(OK));
    bad.lanes = ["ours"];
    var f = kinds(run(bad), "research.findings[0].lane");
    assert.strictEqual(f.length, 1, "a finding outside the asked-for lanes passed");
    assert.strictEqual(f[0].severity, "P0");
  });

  // The schema's own enum refuses this and validateProposal returns on the first schema
  // error, so the check lives there rather than twice. What matters is that it is refused.
  it("refuses a lane that is not one of the three", function () {
    var bad = JSON.parse(JSON.stringify(OK));
    bad.lanes = ["competitors", "vibes"];
    var f = run(bad).filter(function (x) { return String(x.value || "").indexOf("research/lanes") !== -1; });
    assert.strictEqual(f.length, 1, "an invented lane passed: " + JSON.stringify(run(bad)));
    assert.strictEqual(f[0].severity, "P0");
    assert.match(f[0].value, /not in enum/, "refused for some other reason");
  });

  it("bounds a single lane at four findings, not the whole block at five", function () {
    var many = { lanes: ["competitors"], ran: true, findings: [] };
    for (var i = 0; i < 5; i++) {
      many.findings.push({ lane: "competitors", claim: "A claim number " + i + " about the surface.", source: "Somewhere, an article" });
    }
    var f = kinds(run(many), "research.findings");
    assert.ok(f.length >= 1, "five in one lane passed");
    assert.strictEqual(f[0].severity, "P0");
    many.findings.pop();
    assert.deepStrictEqual(severities(run(many), "research.findings"), [], "four in one lane was refused");
  });

  it("refuses research that says it ran with no lane behind it", function () {
    var bad = { lanes: [], ran: true, findings: [] };
    var f = kinds(run(bad), "research");
    assert.ok(
      f.some(function (x) { return x.severity === "P0"; }),
      "ran with no lanes reported no P0",
    );
  });

  // A reader who already knows the space can hand over the references rather than wait for a
  // sweep to rediscover them. Those are recorded, and a finding in that lane has to come from
  // one of them: otherwise "yours" is a lane where anything can be said in the reader's name.
  describe("the lane the reader supplies", function () {
    var YOURS = {
      lanes: ["yours"],
      ran: true,
      refs: ["https://atlan.com/product/governance", "the Okta admin console, groups page"],
      findings: [
        { lane: "yours", claim: "Okta prints the groups above the permissions they grant.", source: "the Okta admin console, groups page" },
      ],
    };

    it("passes a finding that comes from a ref the reader gave", function () {
      assert.deepStrictEqual(severities(run(YOURS), "research"), [], "a clean yours block reports something");
    });

    it("refuses a finding attributed to a ref nobody supplied", function () {
      var bad = JSON.parse(JSON.stringify(YOURS));
      bad.findings[0].source = "Some other page I found";
      var f = kinds(run(bad), "research.findings[0].source");
      assert.strictEqual(f.length, 1, "a yours finding invented its own source");
      assert.strictEqual(f[0].severity, "P0");
    });

    it("refuses the lane with no refs behind it", function () {
      var bad = JSON.parse(JSON.stringify(YOURS));
      delete bad.refs;
      var f = kinds(run(bad), "research.refs");
      assert.ok(f.length >= 1, "the yours lane ran on nothing");
      assert.strictEqual(f[0].severity, "P0");
    });
  });

  // Found in review. The default-to-competitors rule is a shim for files written before the
  // lanes existed, which have no lanes key at all. Applied to a file that DOES name its lanes,
  // it let a finding with no lane through: the validator said nothing, the ours and yours
  // grounding checks never ran on it, and the document printed a Competitors heading for a
  // lane nobody had asked for. A file that names its lanes names them on every finding.
  it("refuses a finding with no lane at all once the file names its lanes", function () {
    var bad = { lanes: ["ours"], ran: true, findings: [{ claim: "A claim from nowhere in particular.", source: "Some blog" }] };
    var f = kinds(run(bad), "research.findings[0].lane");
    assert.strictEqual(f.length, 1, "a lane-less finding passed a file that names its lanes");
    assert.strictEqual(f[0].severity, "P0");
  });

  // Every proposal already on disk has no lanes key at all.
  it("still passes a file written before the lanes existed", function () {
    var old = { ran: true, findings: [{ claim: "Account menus put the role under the name.", source: "SaaSUI" }] };
    assert.deepStrictEqual(severities(run(old), "research"), [], "an older file is now refused");
  });
});
