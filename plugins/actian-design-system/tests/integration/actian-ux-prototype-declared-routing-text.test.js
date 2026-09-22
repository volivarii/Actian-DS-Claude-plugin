"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..", "..");
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("declared routing: the author agent's text", function () {
  var agent = read("agents/screen-generator.md");
  var ref = read("references/actian-ux-prototype/html-reference.md");

  it("tells the agent a layered slice is its body only, and where goto ids come from", function () {
    assert.match(agent, /`screen\.layer`/);
    assert.match(agent, /layer body only/);
    assert.match(agent, /`flow`/);
    assert.match(agent, /Never emit `screen\.id`/);
    assert.doesNotMatch(agent, /you MAY emit a kebab-case `id`/);
    assert.match(agent, /`flow` \(every screen's `\{ n, id, name \}`\)/);
  });

  it("html-reference clarifies that merge writes the layer, and author writes only body", function () {
    assert.match(ref, /the author agent writes only `name` and `content`/);
  });

  it("html-reference shows goto aimed at a flow id and drops the hand-written screen id", function () {
    assert.match(ref, /A slice carries `flow`/);
    assert.match(ref, /"goto": "describe-catalog-items-4"/);
    assert.doesNotMatch(ref, /"id": "toast-published"/);
  });
});

describe("declared routing: skill, gates and authoring text", function () {
  var skill = read("skills/actian-ux-prototype/SKILL.md");
  var gates = read("references/actian-ux-prototype/gates.md");
  var authoring = read("references/actian-ux-prototype/ds-components-authoring.md");

  it("Step 5.0 declares pattern and layer and says a declared pattern outranks the name", function () {
    assert.match(skill, /"pattern": "<slug>"/);
    assert.match(skill, /"layer": \{ "kind", "over": <n> \}/);
    assert.match(skill, /a declared pattern outranks the name/);
    assert.match(skill, /gates\.md, Screen list/);
  });

  it("gates.md's Gate 3 parser accepts lofi and fm as answers", function () {
    assert.match(gates, /`hifi`, `lofi`, `fm`/);
    assert.match(gates, /Valid: hifi, lofi, fm,/);
  });

  it("the Look is its own step after the final render, not a push sub-bullet", function () {
    assert.match(skill, /6\.6\. \*\*Look\*\* \(gates\.md, Look\)/);
    assert.doesNotMatch(
      skill,
      /Run the look \(gates\.md, Look\) before the Step 7\.5 gate/,
    );
  });

  it("the skill's paths resolve from the plugin root and unknown-ds-slug has a recovery", function () {
    assert.match(
      skill,
      /require\("\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/lib\/parse-push\.js"\)/,
    );
    assert.match(skill, /`pluginRoot` = `\$\{CLAUDE_PLUGIN_ROOT\}`/);
    assert.match(skill, /`unknown-ds-slug`:/);
  });

  it("gates.md carries the screen list contract, the Look command, and no stale text", function () {
    assert.match(gates, /## Screen list \(Step 5\.0, gated or not\)/);
    assert.match(
      gates,
      /"pattern": "right-sliding-drawer", "layer": \{ "kind": "drawer", "over": 2 \}/,
    );
    assert.match(gates, /## Look \(after the final render\)/);
    assert.match(
      gates,
      /look\.js" \{project_working_directory\}\/flows\/flow-data\.json/,
    );
    assert.match(
      gates,
      /--brief \{project_working_directory\}\/flows\/\.brief\.json/,
    );
    assert.match(gates, /largest differences \*\*in structure\*\*/);
    assert.match(gates, /a reference for page structure, never for appearance/);
    assert.doesNotMatch(gates, /Dormant today/);
    assert.doesNotMatch(
      gates,
      /\*\*Fat Marker\*\* \(fast lo-fi wireframe, FM palette; default\)/,
    );
    assert.doesNotMatch(gates, /use case\.useCases = \[chosen\]/);
    assert.doesNotMatch(gates, /`source scripts\/lib\/resolve-node\.sh/);
  });

  it("gates.md says what a layered screen with no pattern does", function () {
    assert.match(gates, /layer[^.]*no pattern[^.]*no page skeleton/i);
  });

  it("gates.md says how to report a Look that pairs some screens", function () {
    assert.match(gates, /screens? (that|which) paired/i);
  });

  it("the unpublished steward panel keeps its example and says not to author it", function () {
    var section = authoring
      .split("### `chat-with-ai-steward`")[1]
      .split("### `")[0];
    assert.match(section, /Not published right now/);
    assert.match(section, /`unknown-ds-slug`/);
    assert.match(section, /"dsSlug": "chat-with-ai-steward"/);
  });

  it("the rail and the exits are declared in the screen list, and the agent no longer writes the rail", function () {
    var agent = read("agents/screen-generator.md");
    var ref = read("references/actian-ux-prototype/html-reference.md");
    assert.match(skill, /"exit": "<what the user does to move on>"/);
    assert.match(skill, /`meta\.nav`/);
    assert.match(skill, /`screen-no-exit`/);
    assert.match(skill, /`chrome-active-undeclared`/);
    assert.doesNotMatch(skill, /authoritative shell every screen shares/);
    assert.match(agent, /Never write `navItems`, `activeNavItem` or `sidebar`/);
    assert.doesNotMatch(agent, /MUST set `navItems`/);
    assert.match(agent, /goto: "<screen\.exit\.toId>"/);
    assert.match(agent, /`screen\.exit\.via`/);
    assert.doesNotMatch(agent, /Put `goto` on the primary action/);
    assert.match(gates, /`meta\.nav`/);
    assert.match(gates, /`exit`/);
    assert.match(ref, /`screen\.exit`/);
  });
});
