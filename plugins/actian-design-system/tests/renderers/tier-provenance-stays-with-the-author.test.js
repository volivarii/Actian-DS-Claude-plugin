#!/usr/bin/env node
"use strict";

/**
 * tier-provenance-stays-with-the-author.test.js
 *
 * Tier provenance (the tier a generated screen was classified as, the recipe it
 * matched, the confidence, whether it carried a justification) is for the
 * person who ran the generation. It must not reach the artifact.
 *
 * This replaces `tier-badge-author-only.test.js`, whose premise was wrong. That
 * guard enforced "hidden in the Prototype view, revealed under
 * .proto-stage--overview", on the reasoning that the Overview contact sheet's
 * reader is the author. It is not: the deliverable is ONE html file with a
 * Prototype/Overview toggle in its own top bar, and
 * `references/generate-flow/share.md` says that file is "the shareable
 * artifact handed to stakeholders, reviewers, or anyone who doesn't use
 * Figma". Both buttons ship, always rendered and always enabled. So the
 * previous fix moved the leak one click away rather than closing it, and its
 * code comment asserted something untrue about who reads that view.
 *
 * 🔑 There is no author-only view inside an artifact you hand to someone else.
 * The boundary that does exist is the FILE boundary: `flow-data.json` stays in
 * the author's working directory and is never shipped, and it already carries
 * all five fields. So the provenance is not lost by removing the badge, it is
 * simply read where it was always kept.
 *
 * The guard therefore asserts BOTH halves of that split, because either alone
 * is satisfiable by a mistake: "absent from the markup" alone also passes if
 * the classifier stopped running, and "present in flow-data" alone also passes
 * if the badge came back.
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..", "..");
var RENDERER_DIR = path.join(ROOT, "scripts", "renderers", "html-renderers");
var JS = fs.readFileSync(path.join(RENDERER_DIR, "flow-renderer.js"), "utf8");
var CSS = fs.readFileSync(path.join(RENDERER_DIR, "flow-renderer.css"), "utf8");

var flowRenderer = require(path.join(RENDERER_DIR, "flow-renderer.js"));

// A screen carrying every provenance field, so a leak of any one of them shows.
var SCREEN = {
  name: "Catalog",
  template: "studio",
  pageHeader: { title: "Catalog" },
  tier: "improvised",
  matchedRecipe: "table-list",
  composition: ["form-create", "sticky-footer"],
  confidence: 0.55,
  justification: "No archetype models a post-submit success page.",
  content: [],
};

describe("tier provenance stays with the author", function () {
  it("no provenance reaches the rendered screen", function () {
    var html = flowRenderer.screen(SCREEN);
    assert.ok(html && html.length > 0, "fixture sanity: the screen rendered");

    var leaks = [
      "tier-badge",
      "data-tier",
      "improvised",
      "table-list",
      "form-create+sticky-footer",
      "0.55",
      SCREEN.justification,
    ].filter(function (needle) {
      return html.indexOf(needle) !== -1;
    });

    assert.deepEqual(
      leaks,
      [],
      "These provenance values reached the markup. The deliverable is one file " +
        "with a Prototype/Overview toggle, handed to people outside the team, " +
        "so no view inside it is author-only. Read them from flow-data.json.",
    );
  });

  it("the renderer carries no tier-badge machinery at all", function () {
    // Belt to the braces above: an unused emitter is one call site away from
    // coming back, and the CSS that styled it is what made it look intentional.
    assert.equal(
      /tierBadge/.test(JS),
      false,
      "flow-renderer.js still defines or exports a tier badge emitter",
    );
    assert.equal(
      /tier-badge/.test(CSS),
      false,
      "flow-renderer.css still styles .tier-badge, so something is expected to " +
        "emit it",
    );
  });

  it("the classifier still runs, so the author has not lost the signal", function () {
    // Without this the file above is satisfiable by deleting tier classification
    // outright, which would "fix" the leak by destroying the thing it protects.
    var agent = fs.readFileSync(
      path.join(ROOT, "agents", "screen-generator.md"),
      "utf8",
    );
    var required = ["tier", "confidence", "matchedRecipe", "composition", "justification"];
    var missing = required.filter(function (f) {
      return agent.indexOf(f) === -1;
    });
    assert.deepEqual(
      missing,
      [],
      "screen-generator.md no longer asks for these provenance fields. They are " +
        "where the author reads the tier now, so they have to keep being written.",
    );
  });
});
