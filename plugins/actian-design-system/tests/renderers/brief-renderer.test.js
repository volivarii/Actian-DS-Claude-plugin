"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var fs = require("fs");

var renderer = require("../../scripts/renderers/html-renderers/brief-renderer.js");
var BUTTON_FIXTURE = path.resolve(
  __dirname,
  "..",
  "fixtures",
  "button-brief-data.json",
);
var fix = JSON.parse(fs.readFileSync(BUTTON_FIXTURE, "utf8"));

function ph(name) {
  return '<div data-stub-component="' + name + '"></div>';
}

test("renderSection1 returns one supercard with 4 sub-section headings", function () {
  var html = renderer.renderSection1(
    fix.variants,
    fix.anatomy,
    fix.tokens,
    ph,
  );

  // Single card frame
  var cardFrameMatches = html.match(/<div class="brief-card"/g) || [];
  assert.equal(cardFrameMatches.length, 1, "exactly one .brief-card frame");

  // All four sub-section headings present. First headings per sub-section now
  // carry Draft badges (when _source is "generated"), so text is followed by a
  // space and a <span> — check for ">Anatomy " and ">Variation " etc.
  // Note: renderAnatomyContent now emits "Anatomy" as the first heading (was
  // "Structure"); inner headings "States" and "Parts reference" are unchanged.
  assert.ok(
    html.includes(">Anatomy<") || html.includes(">Anatomy "),
    "Anatomy heading (first sub-section)",
  );
  assert.ok(html.includes(">States<"), "Anatomy states heading");
  assert.ok(
    html.includes(">Specs<") || html.includes(">Specs "),
    "Specs heading",
  );
  // renderTokensContent now emits "Tokens" as the first heading (was
  // "Color tokens"); inner headings "Sizing & spacing" / "Typography" are
  // unchanged.
  assert.ok(
    html.includes(">Tokens<") ||
      html.includes(">Tokens ") ||
      html.includes(">Sizing & spacing<") ||
      html.includes(">Typography<"),
    "at least one Tokens table heading",
  );
  // Variant matrix now has a "Variation" sectionTitle heading.
  assert.ok(
    html.includes(">Variation<") || html.includes(">Variation "),
    "Variation heading present",
  );

  // Default card title ("Anatomy, variation, tokens & specs") visible
  assert.ok(
    html.includes("Anatomy, variation, tokens"),
    "supercard default title rendered",
  );
});

test("renderSection1 returns empty string when all three inputs are empty", function () {
  var html = renderer.renderSection1(null, null, null, ph);
  assert.equal(html, "");
});

test("renderSection1 omits Specs sub-section when anatomy.specs absent", function () {
  var anatomyNoSpecs = Object.assign({}, fix.anatomy);
  delete anatomyNoSpecs.specs;
  var html = renderer.renderSection1(
    fix.variants,
    anatomyNoSpecs,
    fix.tokens,
    ph,
  );
  // Specs heading should be absent
  assert.equal(html.indexOf(">Specs<"), -1);
  assert.equal(html.indexOf(">Specs "), -1);
  // Other sub-sections should still be present
  // Note: first Tokens heading is now "Tokens" (not "Color tokens").
  assert.ok(
    html.includes(">Tokens<") ||
      html.includes(">Tokens ") ||
      html.includes(">Sizing & spacing<"),
  );
});

test("Draft badge appears for generated sub-sections without _authored flag", function () {
  // Button fixture is AI-generated (Phase B), no _authored flags.
  var html = renderer.renderSection1(
    fix.variants,
    fix.anatomy,
    fix.tokens,
    ph,
  );
  // Expect at least 3 Draft badges (one per sub-section heading where source is set)
  var matches = html.match(/class="subsection-draft-badge"/g) || [];
  assert.ok(
    matches.length >= 3,
    "at least 3 Draft badges (Anatomy / Variation / Tokens / Specs minus any missing)",
  );
});

test("Draft badge suppressed when sub-section card has _authored: true", function () {
  // Mark anatomy as authored. Anatomy and Specs both source from anatomy,
  // so both their sub-section headings should drop the badge.
  var anatomyAuthored = Object.assign({}, fix.anatomy, {
    _authored: true,
  });
  var html = renderer.renderSection1(
    fix.variants,
    anatomyAuthored,
    fix.tokens,
    ph,
  );
  // Variation and Tokens still draft → 2 badges remain
  var matches = html.match(/class="subsection-draft-badge"/g) || [];
  assert.equal(
    matches.length,
    2,
    "Anatomy + Specs badges suppressed; Variation + Tokens still drafted",
  );
});

test("Draft badge suppressed when sub-section card has _source: 'figma'", function () {
  // Figma-sourced sub-section is treated as canonical; no badge.
  var componentFigma = Object.assign({}, fix.variants, {
    _source: "figma",
  });
  var html = renderer.renderSection1(
    componentFigma,
    fix.anatomy,
    fix.tokens,
    ph,
  );
  // Variation badge suppressed; Anatomy + Tokens + Specs still draft (assuming
  // their _source remains "generated"). Specs derives from anatomy so it gets
  // anatomy's source state — counted with Anatomy.
  var matches = html.match(/class="subsection-draft-badge"/g) || [];
  assert.ok(
    matches.length >= 2 && matches.length <= 3,
    "Variation badge suppressed; others still draft (Specs may or may not)",
  );
});

test("renderSection1 + sibling renders together produce 6-card sequence (DS mode)", function () {
  // Simulate the DOM cards array assembly the way DOMContentLoaded does it.
  var cards = [
    renderer.renderCard1(fix.card_header),
    renderer.renderSection1(
      fix.variants,
      fix.anatomy,
      fix.tokens,
      ph,
    ),
    renderer.renderCard6(fix.usage),
    renderer.renderCard7(fix.card_content),
    renderer.renderCardMotion(fix.motion),
    renderer.renderCard8(fix.accessibility),
  ].filter(Boolean);

  // Button fixture has no motion → renderCardMotion returns "" → filtered out.
  // So expect EXACTLY 5 cards. (If a future fixture adds motion, write a
  // separate test asserting === 6 — don't loosen this one to OR.)
  assert.equal(
    cards.length,
    5,
    "exactly 5 cards (no motion in Button fixture)",
  );

  // Joined HTML should contain exactly one Section 1 supercard title.
  var joined = cards.join("\n");
  assert.ok(
    joined.includes("Anatomy, variation, tokens"),
    "supercard title appears in assembled output",
  );

  // Three legacy data-names should NOT appear as standalone cards
  var componentDataName =
    joined.match(/<div class="brief-card" data-name="Component"/g) || [];
  var anatomyDataName =
    joined.match(/<div class="brief-card" data-name="Anatomy"/g) || [];
  var tokensDataName =
    joined.match(/<div class="brief-card" data-name="Design tokens"/g) || [];
  assert.equal(componentDataName.length, 0, "no separate Component card");
  assert.equal(anatomyDataName.length, 0, "no separate Anatomy card");
  assert.equal(tokensDataName.length, 0, "no separate Design tokens card");
});
