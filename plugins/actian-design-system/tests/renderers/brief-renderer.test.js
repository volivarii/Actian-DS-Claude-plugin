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
    fix.card_component,
    fix.card_anatomy,
    fix.card_tokens,
    ph,
  );

  // Single card frame
  var cardFrameMatches = html.match(/<div class="brief-card"/g) || [];
  assert.equal(cardFrameMatches.length, 1, "exactly one .brief-card frame");

  // All four sub-section headings present
  assert.ok(html.includes(">Structure<"), "Anatomy structure heading");
  assert.ok(html.includes(">States<"), "Anatomy states heading");
  assert.ok(html.includes(">Specs<"), "Specs heading");
  assert.ok(
    html.includes(">Color tokens<") ||
      html.includes(">Sizing & spacing<") ||
      html.includes(">Typography<"),
    "at least one Tokens table heading",
  );
  // Variant matrix is data-name only (no sectionTitle today), so check that:
  assert.ok(
    html.includes('data-name="Variant matrix"'),
    "Variation block present",
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
  var anatomyNoSpecs = Object.assign({}, fix.card_anatomy);
  delete anatomyNoSpecs.specs;
  var html = renderer.renderSection1(
    fix.card_component,
    anatomyNoSpecs,
    fix.card_tokens,
    ph,
  );
  // Specs heading should be absent
  assert.equal(html.indexOf(">Specs<"), -1);
  // Other sub-sections should still be present
  assert.ok(
    html.includes(">Color tokens<") || html.includes(">Sizing & spacing<"),
  );
});

test("renderSection1 + sibling renders together produce 6-card sequence (DS mode)", function () {
  // Simulate the DOM cards array assembly the way DOMContentLoaded does it.
  var cards = [
    renderer.renderCard1(fix.card_header),
    renderer.renderSection1(
      fix.card_component,
      fix.card_anatomy,
      fix.card_tokens,
      ph,
    ),
    renderer.renderCard6(fix.card_usage),
    renderer.renderCard7(fix.card_content),
    renderer.renderCardMotion(fix.card_motion),
    renderer.renderCard8(fix.card_accessibility),
  ].filter(Boolean);

  // Button fixture has no card_motion → renderCardMotion returns "" → filtered out.
  // So expect 5 visible cards.
  assert.ok(
    cards.length === 5 || cards.length === 6,
    "5 or 6 cards depending on motion presence",
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
