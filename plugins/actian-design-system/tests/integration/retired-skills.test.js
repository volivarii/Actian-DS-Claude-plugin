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
  it("the retired code is gone: none of the files only the retired skills read is tracked or on disk", function () {
    // Files, not directories: a checkout that once ran the eval lane or the
    // Office renderer keeps ignored leftovers (evals/**/workspace/, __pycache__)
    // that a pull does not remove, and those must not fail this gate.
    [
      "retired/README.md",
      "scripts/office/render-office.py",
      "assets/office/Actian-Template-2026.pptx",
      "references/office/PROVENANCE.md",
      "references/generate-presentation/templates.md",
      "recipes/presentation/_index.json",
      "schemas/slide-data.schema.json",
      "scripts/renderers/html-renderers/presentation-renderer.js",
      "scripts/renderers/html-renderers/presentation-renderer.css",
      "examples/slide-data-example.json",
      "tests/office/conftest.py",
      "scripts/lib/resolve-python.sh",
      "recipes/brief/_index.json",
      "schemas/brief-data.schema.json",
      "scripts/renderers/html-renderers/brief-renderer.js",
      "scripts/renderers/html-renderers/brief-renderer.css",
      "scripts/renderers/figma-table/render-html.js",
      "templates/component-playground-wrapper.html",
      "templates/fm-wrapper.html",
      "references/component-brief/push-patterns.md",
      "references/create-component/push-patterns.md",
      "references/convert-to-hifi/anatomy/catalog-slice.json",
      "evals/component-brief/evals.json",
      "scripts/evals/run-component-brief.sh",
      "scripts/transformers/brief-sourcing.js",
      "scripts/lib/anatomy-filter.js",
      "scripts/lib/anatomy-scale.js",
      "scripts/lib/dimension-line.js",
      "scripts/lib/gutter-layout.js",
      "scripts/lib/specs-extraction.js",
      "scripts/lib/token-tag.js",
      "examples/brief-data-example.json",
      "tests/fixtures/button-brief-data.json",
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
