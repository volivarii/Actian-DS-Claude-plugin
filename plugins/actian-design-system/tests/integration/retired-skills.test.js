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
    assert.ok(dirs.indexOf("generate-presentation") === -1, "generate-presentation is retired");
    assert.ok(dirs.indexOf("convert-to-hifi") === -1, "convert-to-hifi is retired");
  });
  it("agents/ no longer holds slide-generator.md", function () {
    assert.ok(!fs.existsSync(path.join(PLUGIN_ROOT, "agents", "slide-generator.md")));
  });
  it("retired/ carries both skills, the agent and a README that names the deletion plan", function () {
    ["skills/generate-presentation/SKILL.md", "skills/convert-to-hifi/SKILL.md", "agents/slide-generator.md", "README.md"].forEach(function (rel) {
      assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, "retired", rel)), "retired/" + rel);
    });
    var readme = fs.readFileSync(path.join(PLUGIN_ROOT, "retired", "README.md"), "utf8");
    assert.ok(/2026-09-1\d/.test(readme), "README dates the retirement");
    assert.ok(/Slice 5/.test(readme), "README names the deletion plan");
  });
  it("the companion never routes to a retired skill", function () {
    var src = fs.readFileSync(path.join(PLUGIN_ROOT, "skills", "companion", "SKILL.md"), "utf8");
    assert.ok(src.indexOf("/convert-to-hifi") === -1, "companion must not emit /convert-to-hifi");
    assert.ok(src.indexOf("/generate-presentation") === -1, "companion must not emit /generate-presentation");
  });
});
