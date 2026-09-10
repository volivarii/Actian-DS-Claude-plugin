#!/usr/bin/env node
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
// README.md lives at the repo (marketplace) root, two levels above the plugin
// root (PLUGIN_ROOT holds .claude-plugin/plugin.json; the repo root holds
// .claude-plugin/marketplace.json plus README.md), same convention as
// sync-doc-counts.test.js's REPO_ROOT.
const REPO_ROOT = path.resolve(PLUGIN_ROOT, "..", "..");
const skill = fs.readFileSync(
  path.join(PLUGIN_ROOT, "skills/generate-flow/SKILL.md"),
  "utf8",
);
const agent = fs.readFileSync(
  path.join(PLUGIN_ROOT, "agents/screen-generator.md"),
  "utf8",
);
const readme = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");

describe("generate-flow wires the brief", () => {
  it("Step 3.5 runs prepare-flow.js into flows/.brief.json", () => {
    assert.match(skill, /scripts\/lib\/app-context\/prepare-flow\.js/);
    assert.match(skill, /flows\/\.brief\.json/);
    assert.match(skill, /brief\.glossary/);
  });
  it("Step 5 authors every screen count in the agent and merges incrementally", () => {
    assert.doesNotMatch(skill, /Sequential mode/);
    assert.doesNotMatch(skill, /Parallel mode \(6\+/);
    assert.match(skill, /one .* per screen/i);
    assert.match(skill, /flows\/\.brief\//);
    assert.match(skill, /--incremental --screen-list/);
  });
  it("the agent reads the brief and no longer opens app-context.json or runs the inspector by default", () => {
    assert.match(agent, /Brief path/);
    assert.match(agent, /propertyRules/);
    assert.match(agent, /flows\/\.brief\//);
    assert.doesNotMatch(
      agent,
      /read `vendor\/app-context\/dist\/app-context\.json`/,
    );
    assert.match(agent, /^model: sonnet$/m);
  });
  it("the README agents table no longer says 6+ screens", () => {
    assert.doesNotMatch(readme, /Flow generation \(6\+ screens\)/);
  });
});
