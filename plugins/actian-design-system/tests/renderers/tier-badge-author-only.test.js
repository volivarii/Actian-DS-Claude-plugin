#!/usr/bin/env node
"use strict";

/**
 * tier-badge-author-only.test.js
 *
 * The tier badge is author provenance: which tier the screen was classified
 * as, the recipe it matched, the confidence, and whether it carried a
 * justification. It is emitted INSIDE .screen__content-area, at all three of
 * screen()'s render paths, so it draws on the screen itself rather than in the
 * deliverable's chrome. That put "tier 2" next to the breadcrumb of every
 * screen in a prototype anyone might share outside the team.
 *
 * The markup is deliberately unchanged: the badge and its title attribute
 * still ship, and the same four fields are in flow-data.json regardless. What
 * changed is that the CSS reveals it only under .proto-stage--overview, the
 * contact-sheet view, whose reader is the person who generated the flow.
 *
 * So the guard is on the STYLESHEET, not the markup, and it has to assert both
 * directions. Asserting only "hidden by default" would pass on a stylesheet
 * that never shows it at all, which silently deletes a signal the author uses.
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var CSS_PATH = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
  "flow-renderer.css",
);
var JS_PATH = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
  "flow-renderer.js",
);

var CSS = fs.readFileSync(CSS_PATH, "utf8");
var JS = fs.readFileSync(JS_PATH, "utf8");

// Body of the first rule whose selector is exactly `selector`. Brace-counted
// rather than regex-matched, so a later rule mentioning the same class (the
// [data-tier] variants, the overview reveal) cannot be picked up instead.
function ruleBody(css, selector) {
  var lines = css.split("\n");
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== selector + " {") continue;
    var depth = 1;
    var body = [];
    for (var j = i + 1; j < lines.length && depth > 0; j++) {
      depth += (lines[j].match(/{/g) || []).length;
      depth -= (lines[j].match(/}/g) || []).length;
      if (depth > 0) body.push(lines[j]);
    }
    return body.join("\n");
  }
  return null;
}

// Drop comments so the prose explaining the old value is not read as the value.
function declarations(body) {
  return String(body == null ? "" : body).replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("tier badge is author provenance, not part of the screen", function () {
  it("still renders into the screen markup", function () {
    // If the badge stopped being emitted, the CSS below would be guarding
    // nothing and would keep passing. Assert the subject is present first.
    assert.ok(
      /class="tier-badge"/.test(JS),
      "flow-renderer.js no longer emits a tier badge. If it was removed on " +
        "purpose, delete this guard rather than relaxing it.",
    );
  });

  it("is hidden in the prototype view", function () {
    var body = declarations(ruleBody(CSS, ".tier-badge"));
    assert.ok(body !== "", ".tier-badge rule not found in flow-renderer.css");
    assert.ok(
      /display:\s*none\s*;/.test(body),
      "The base .tier-badge rule must hide it. It renders inside " +
        ".screen__content-area, so any visible default puts internal tier " +
        "metadata on every screen of a shared prototype.",
    );
  });

  it("is revealed on the Overview contact sheet", function () {
    var body = declarations(ruleBody(CSS, ".proto-stage--overview .tier-badge"));
    assert.ok(
      body !== null && body !== "",
      "No rule reveals the tier badge under .proto-stage--overview. Hiding it " +
        "everywhere deletes a signal the author uses; it belongs on the " +
        "contact sheet, not on the screen.",
    );
    assert.ok(
      /display:\s*inline-block\s*;/.test(body),
      "the Overview rule must restore the badge to inline-block",
    );
  });

  it("the Overview view class it keys on is the one the deliverable emits", function () {
    // The reveal is worthless if the class never appears. This is the join:
    // the stylesheet's hook and the template's class have to be the same word.
    var emitters = [
      path.join(__dirname, "..", "..", "templates", "flow-prototype-wrapper.html"),
      path.join(__dirname, "..", "..", "scripts", "renderers", "assemble-preview.js"),
      JS_PATH,
    ];
    var found = emitters.some(function (f) {
      return fs.existsSync(f) && /proto-stage--overview/.test(fs.readFileSync(f, "utf8"));
    });
    assert.ok(
      found,
      "Nothing in the deliverable emits .proto-stage--overview, so the badge " +
        "would be hidden in both views. Re-derive which class marks the " +
        "Overview view before changing the rule.",
    );
  });
});
