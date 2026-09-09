"use strict";
/**
 * retired-skills.test.js: generate-presentation and convert-to-hifi were hidden
 * from the skill set on 2026-09-10 (moved to retired/, deletion follows the
 * 2026-09-15 demo). Nothing under skills/ or agents/ may reintroduce them, and
 * the companion may not route to them.
 */
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

describe("retired skills stay hidden", function () {
  it("skills/ holds neither generate-presentation nor convert-to-hifi", function () {
    var dirs = fs.readdirSync(path.join(PLUGIN_ROOT, "skills"));
    assert.ok(
      dirs.indexOf("generate-presentation") === -1,
      "generate-presentation is retired",
    );
    assert.ok(
      dirs.indexOf("convert-to-hifi") === -1,
      "convert-to-hifi is retired",
    );
  });
  it("agents/ no longer holds slide-generator.md", function () {
    assert.ok(
      !fs.existsSync(path.join(PLUGIN_ROOT, "agents", "slide-generator.md")),
    );
  });
  it("retired/ carries both skills, the agent and a README that names the deletion plan", function () {
    [
      "skills/generate-presentation/SKILL.md",
      "skills/convert-to-hifi/SKILL.md",
      "agents/slide-generator.md",
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
    assert.ok(/2026-09-1\d/.test(readme), "README dates the retirement");
    assert.ok(/Slice 5/.test(readme), "README names the deletion plan");
  });
  it("no loading skill or agent names a retired skill by its bare name", function () {
    var bareNames = [
      "convert-to-hifi",
      "generate-presentation",
      "slide-generator",
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
      6,
      "expected 6 skills/*/SKILL.md files, found " + skillFiles.length,
    );
    assert.strictEqual(
      agentFiles.length,
      8,
      "expected 8 agents/*.md files, found " + agentFiles.length,
    );

    files.forEach(function (rel) {
      var abs = path.join(PLUGIN_ROOT, rel);
      var lines = fs.readFileSync(abs, "utf8").split("\n");
      lines.forEach(function (line, idx) {
        bareNames.forEach(function (name) {
          var at = line.indexOf(name);
          if (at === -1) return;
          // A mention immediately followed by "(retired" on the same line is the
          // parity-analyzer heading documenting the retirement itself; allowed.
          var after = line.slice(at + name.length);
          var allowed = /^\s*\(retired/.test(after);
          assert.ok(
            allowed,
            rel +
              ":" +
              (idx + 1) +
              ' names retired skill "' +
              name +
              '" without a "(retired" marker: ' +
              line,
          );
        });
      });
    });
  });
});
