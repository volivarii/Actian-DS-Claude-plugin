"use strict";
/**
 * retired-skills.test.js: generate-presentation and convert-to-hifi were hidden
 * from the skill set on 2026-09-10; compare-flows, component-brief and
 * create-component followed on 2026-09-21 (roadmap 711) with the four agents
 * only they dispatched. Their code was deleted on 2026-09-22 (git history is
 * the restore point). Nothing under skills/ or agents/ may reintroduce them,
 * and the companion may not route to them.
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
  it("the retired code is gone: no retired/ directory and none of its machinery", function () {
    [
      "retired",
      "scripts/office",
      "assets/office",
      "scripts/evals",
      "evals",
      "recipes/brief",
      "recipes/presentation",
      "scripts/renderers/figma-table",
      "scripts/renderers/html-renderers/brief-renderer.js",
      "scripts/renderers/html-renderers/presentation-renderer.js",
      "schemas/brief-data.schema.json",
      "schemas/slide-data.schema.json",
      "references/component-brief",
      "references/create-component",
      "references/convert-to-hifi",
      "references/generate-presentation",
      "references/office",
    ].forEach(function (rel) {
      assert.ok(
        !fs.existsSync(path.join(PLUGIN_ROOT, rel)),
        rel + " was deleted with the retired skills",
      );
    });
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
          // MIGRATIONS.md and the CHANGELOG.
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
