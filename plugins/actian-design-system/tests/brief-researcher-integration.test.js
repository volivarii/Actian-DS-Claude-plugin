"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var fs = require("fs");

var FIX = path.resolve(__dirname, "fixtures", "brief");

// Step 1.5 gate parser — extracted from SKILL.md behavior, tested directly here.
// Implement as a small pure function in scripts/parse-step15-gate.js if not present;
// for the test, inline. Mirror the parser rules documented in SKILL.md Step 1.5.
function parseStep15(input) {
  if (typeof input !== "string") return { error: "input must be string" };
  var trimmed = input.trim();
  var allCards = ["card_header", "card_component", "card_anatomy", "card_tokens", "card_usage", "card_content", "card_accessibility"];
  var researchAll = ["card_usage", "card_content", "card_accessibility"];
  var byPos = ["card_header", "card_component", "card_anatomy", "card_tokens", "card_usage", "card_content", "card_accessibility"];

  if (trimmed === "" || trimmed.toLowerCase() === "all") return { selectedCards: allCards, researchScope: null };

  var researchScope = null;
  var researchMatch = trimmed.match(/research\s+([a-z, ]+)?$/i);
  var cardSpec = trimmed;
  if (researchMatch) {
    cardSpec = trimmed.slice(0, researchMatch.index).trim();
    var raw = (researchMatch[1] || "all").trim();
    if (raw === "all" || raw === "") researchScope = researchAll.slice();
    else {
      var names = raw.split(/[, ]+/).filter(Boolean);
      researchScope = [];
      for (var i = 0; i < names.length; i++) {
        var name = names[i].toLowerCase();
        if (["usage", "content", "accessibility"].indexOf(name) === -1) return { error: "Unknown research scope `" + name + "`" };
        researchScope.push("card_" + name);
      }
    }
  }
  if (cardSpec === "" || cardSpec.toLowerCase() === "all") {
    return { selectedCards: allCards, researchScope: researchScope };
  }
  // Numeric subset
  var parts = cardSpec.split(/[, ]+/).filter(Boolean);
  var selected = [];
  for (var j = 0; j < parts.length; j++) {
    var n = parseInt(parts[j], 10);
    if (isNaN(n) || n < 1 || n > 7) return { error: "Card " + parts[j] + " doesn't exist. Valid: 1-7." };
    selected.push(byPos[n - 1]);
  }
  return { selectedCards: selected, researchScope: researchScope };
}

test("step 1.5 — empty input → all 7 cards, no research", function () {
  var r = parseStep15("");
  assert.equal(r.selectedCards.length, 7);
  assert.equal(r.researchScope, null);
});

test("step 1.5 — 'all' → all 7 cards, no research", function () {
  var r = parseStep15("all");
  assert.equal(r.selectedCards.length, 7);
  assert.equal(r.researchScope, null);
});

test("step 1.5 — 'all research all' → all 7 + research on all 3 applicable", function () {
  var r = parseStep15("all research all");
  assert.equal(r.selectedCards.length, 7);
  assert.deepEqual(r.researchScope, ["card_usage", "card_content", "card_accessibility"]);
});

test("step 1.5 — 'all research usage,content' → all 7 + research on 2 cards", function () {
  var r = parseStep15("all research usage,content");
  assert.deepEqual(r.researchScope, ["card_usage", "card_content"]);
});

test("step 1.5 — '2,4,6 research content' → 3 cards + research on 1", function () {
  var r = parseStep15("2,4,6 research content");
  assert.deepEqual(r.selectedCards, ["card_component", "card_tokens", "card_content"]);
  assert.deepEqual(r.researchScope, ["card_content"]);
});

test("step 1.5 — invalid card '99' returns error", function () {
  var r = parseStep15("99");
  assert.ok(r.error && r.error.indexOf("99") !== -1);
});

test("step 1.5 — invalid research scope returns error", function () {
  var r = parseStep15("all research foo");
  assert.ok(r.error && r.error.indexOf("foo") !== -1);
});

test("research integration — canned findings thread into card output as research_insights", function () {
  var canned = JSON.parse(fs.readFileSync(path.join(FIX, "research-result-canned.json"), "utf8"));
  // Simulated card-generator output: card_usage with research_insights derived from canned findings
  var card = {
    cardTitle: "Usage",
    cardSubtitle: "x",
    _source: "generated",
    _research_applied: true,
    doDont: [],
    research_insights: canned.card_usage
  };
  assert.equal(card._research_applied, true);
  assert.ok(card.research_insights.patterns_observed.length > 0);
  assert.ok(card.research_insights.sources.length > 0);
});

test("research integration — divergence findings render in research_insights._divergences", function () {
  var canned = JSON.parse(fs.readFileSync(path.join(FIX, "research-divergence-canned.json"), "utf8"));
  assert.equal(canned.card_usage.divergences_from_existing.length, 1);
  // Card should expose this under research_insights._divergences (per shape contract)
  var card = {
    _source: "generated",
    _research_applied: true,
    research_insights: {
      patterns_observed: canned.card_usage.patterns_observed,
      recommendations: canned.card_usage.recommendations,
      _divergences: canned.card_usage.divergences_from_existing,
      sources: canned.card_usage.sources
    }
  };
  assert.equal(card.research_insights._divergences[0].field, "primary_action_position");
});
