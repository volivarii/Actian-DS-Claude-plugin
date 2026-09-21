"use strict";
/**
 * retired-skills.test.js: generate-presentation and convert-to-hifi were hidden
 * from the skill set on 2026-09-10 (moved to retired/, deletion follows the
 * 2026-09-15 demo); compare-flows, component-brief and create-component
 * followed on 2026-09-21 (roadmap 711) with the four agents only they
 * dispatched. Nothing under skills/ or agents/ may reintroduce them, and the
 * companion may not route to them.
 */
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

describe("retired skills stay hidden", function () {
  it("skills/ holds none of the five retired skills", function () {
    var dirs = fs.readdirSync(path.join(PLUGIN_ROOT, "skills"));
    [
      "generate-presentation",
      "convert-to-hifi",
      "compare-flows",
      "component-brief",
      "create-component",
    ].forEach(function (name) {
      assert.ok(dirs.indexOf(name) === -1, name + " is retired");
    });
  });
  it("agents/ no longer holds the five agents only retired skills dispatched", function () {
    [
      "slide-generator.md",
      "brief-researcher.md",
      "card-generator.md",
      "brief-data-validator.md",
      "parity-analyzer.md",
    ].forEach(function (name) {
      assert.ok(
        !fs.existsSync(path.join(PLUGIN_ROOT, "agents", name)),
        "agents/" + name + " is retired",
      );
    });
  });
  it("retired/ carries the five skills, the five agents and a README that names the deletion plan", function () {
    [
      "skills/generate-presentation/SKILL.md",
      "skills/convert-to-hifi/SKILL.md",
      "skills/compare-flows/SKILL.md",
      "skills/component-brief/SKILL.md",
      "skills/create-component/SKILL.md",
      "agents/slide-generator.md",
      "agents/brief-researcher.md",
      "agents/card-generator.md",
      "agents/brief-data-validator.md",
      "agents/parity-analyzer.md",
      "README.md",
    ].forEach(function (rel) {
      assert.ok(
        fs.existsSync(path.join(PLUGIN_ROOT, "retired", rel)),
        "retired/" + rel,
      );
    });
    var readme = fs.readFileSync(
      path.join(PLUGIN_ROOT, "retired", "README.md"),
      "utf8",
    );
    assert.ok(/2026-09-10/.test(readme), "README dates the first retirement");
    assert.ok(/2026-09-21/.test(readme), "README dates the second retirement");
    assert.ok(/Slice 5/.test(readme), "README names the deletion plan");
    assert.ok(/711/.test(readme), "README names roadmap 711");
  });
  it("no loading skill or agent names a retired skill by its bare name", function () {
    var bareNames = [
      "convert-to-hifi",
      "generate-presentation",
      "slide-generator",
      "compare-flows",
      "component-brief",
      "create-component",
      "brief-researcher",
      "card-generator",
      "brief-data-validator",
      "parity-analyzer",
    ];
    var skillFiles = fs
      .readdirSync(path.join(PLUGIN_ROOT, "skills"))
      .filter(function (name) {
        return fs
          .statSync(path.join(PLUGIN_ROOT, "skills", name))
          .isDirectory();
      })
      .map(function (name) {
        return path.join("skills", name, "SKILL.md");
      });
    var agentFiles = fs
      .readdirSync(path.join(PLUGIN_ROOT, "agents"))
      .filter(function (name) {
        return name.endsWith(".md");
      })
      .map(function (name) {
        return path.join("agents", name);
      });
    var files = skillFiles.concat(agentFiles);
    assert.ok(files.length > 0, "file list must not be empty");
    assert.strictEqual(
      skillFiles.length,
      4,
      "expected 4 skills/*/SKILL.md files, found " + skillFiles.length,
    );
    assert.strictEqual(
      agentFiles.length,
      6,
      "expected 6 agents/*.md files, found " + agentFiles.length,
    );

    files.forEach(function (rel) {
      var abs = path.join(PLUGIN_ROOT, rel);
      var lines = fs.readFileSync(abs, "utf8").split("\n");
      lines.forEach(function (line, idx) {
        bareNames.forEach(function (name) {
          // Any mention fails: a loading skill or agent has no reason to name a
          // retired skill or agent, marked or not. The scan covers skills/ and
          // agents/ only; references that mark a retired skill as retired are
          // outside it, and the retirement itself is documented in
          // retired/README.md.
          assert.strictEqual(
            line.indexOf(name),
            -1,
            rel + ":" + (idx + 1) + ' names retired "' + name + '": ' + line,
          );
        });
      });
    });
  });
});
