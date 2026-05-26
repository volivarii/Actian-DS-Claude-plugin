"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var fs = require("fs");
var sourcing = require("../../scripts/transformers/brief-sourcing.js");
var schema = require("../../scripts/validation/validate-schema.js");

var FIX = path.resolve(__dirname, "..", "fixtures", "brief");
var RECIPE_DIR = path.resolve(__dirname, "..", "..", "recipes", "brief");

function loadRecipe(file) {
  return JSON.parse(fs.readFileSync(path.join(RECIPE_DIR, file), "utf8"));
}

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIX, name), "utf8"));
}

// Simulate the skill's Phase A loop in tests
function runPhaseA(ctx, selectedCards) {
  var idx = JSON.parse(
    fs.readFileSync(path.join(RECIPE_DIR, "_index.json"), "utf8"),
  );
  var byCard = {};
  for (var i = 0; i < idx.length; i++)
    byCard[idx[i].card] = loadRecipe(idx[i].file);
  var data = { meta: { component: ctx.component, pluginVersion: "1.62.0" } };
  for (var j = 0; j < selectedCards.length; j++) {
    var key = selectedCards[j];
    var recipe = byCard[key];
    if (!recipe || recipe.phase !== "transcribe") continue;
    var result = sourcing.resolveSection(key, ctx, recipe);
    if (result.source === "figma") {
      data[key] = sourcing.formatForBrief(key, result, ctx);
      data[key].cardTitle = recipe.title;
      data[key].cardSubtitle = recipe.description;
    } else {
      // Skip inline fallback in test — main agent does it; here we just stamp the fallback shape.
      data[key] = {
        cardTitle: recipe.title,
        cardSubtitle: recipe.description,
        _source: "generated",
        _fallback: true,
        _fallbackReason: result.fallbackReason,
      };
      // Synthetic content so validator doesn't trip on emptiness:
      if (key === "card_header") {
        data[key].name = ctx.component;
        data[key].description = "[fallback stub]";
      }
      if (key === "card_content") {
        data[key].rules = [{ title: "Stub", description: "[fallback stub]" }];
        data[key].terminology = [];
      }
    }
  }
  return data;
}

test("flow — Header transcribes from Figma description when present", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  ctx.component = "Button";
  ctx.guidelinesJson = loadFixture("button-component-guidelines-rich.json");
  var data = runPhaseA(ctx, ["card_header"]);
  assert.equal(data.card_header._source, "figma");
  assert.ok(data.card_header.description.length > 0);
  assert.equal(data.card_header._fallback, undefined);
});

test("flow — Header falls back when Figma description empty", function () {
  var ctx = loadFixture("button-no-figma-description.json");
  ctx.component = "Button";
  ctx.guidelinesJson = loadFixture("button-component-guidelines-rich.json");
  var data = runPhaseA(ctx, ["card_header"]);
  assert.equal(data.card_header._source, "generated");
  assert.equal(data.card_header._fallback, true);
  assert.ok(data.card_header._fallbackReason.length > 0);
});

test("flow — Content transcribes from an approved content domain", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  ctx.component = "Button";
  ctx.guidelinesJson = loadFixture("button-component-guidelines-rich.json");
  var data = runPhaseA(ctx, ["card_content"]);
  assert.equal(data.card_content._source, "figma");
  assert.ok(Array.isArray(data.card_content.rules));
  assert.ok(Array.isArray(data.card_content.terminology));
  assert.ok(
    data.card_content.rules.length + data.card_content.terminology.length > 0,
  );
});

test("flow — Content falls back when the guideline doc is a stub", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  ctx.component = "Button";
  ctx.guidelinesJson = loadFixture("button-component-guidelines-empty.json");
  var data = runPhaseA(ctx, ["card_content"]);
  assert.equal(data.card_content._source, "generated");
  assert.equal(data.card_content._fallback, true);
});

test("flow — full Phase A + simulated Phase B passes validateBriefData", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  ctx.component = "Button";
  ctx.guidelinesJson = loadFixture("button-component-guidelines-rich.json");
  var data = runPhaseA(ctx, ["card_header", "card_content"]);
  // Stub Phase B cards (would be populated by card-generator agent in real runs)
  data.variants = {
    cardTitle: "Component",
    cardSubtitle: "x",
    _source: "generated",
    variantMatrix: [],
  };
  data.anatomy = {
    cardTitle: "Anatomy",
    cardSubtitle: "x",
    _source: "generated",
    parts: [],
  };
  data.tokens = {
    cardTitle: "Tokens",
    cardSubtitle: "x",
    _source: "generated",
    colorTokens: [],
  };
  data.usage = {
    cardTitle: "Usage",
    cardSubtitle: "x",
    _source: "generated",
    doDont: [],
  };
  data.accessibility = {
    cardTitle: "Accessibility",
    cardSubtitle: "x",
    _source: "generated",
    requirements: [],
  };

  var result = schema.validateBriefData(data);
  var errors = result.findings.filter(function (f) {
    return f.severity === "error";
  });
  assert.equal(
    errors.length,
    0,
    "expected no errors, got: " + JSON.stringify(errors),
  );
});

test("flow — selected-card subset only generates those keys", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  ctx.component = "Button";
  ctx.guidelinesJson = loadFixture("button-component-guidelines-rich.json");
  var data = runPhaseA(ctx, ["card_header"]); // only Header
  assert.ok(data.card_header);
  assert.equal(data.card_content, undefined);
});

test("flow — validateBriefData rejects card_api / card_code / card_states", function () {
  var data = {
    meta: {},
    card_header: { _source: "figma", name: "Button", description: "x" },
    card_api: { _source: "generated", props: [] },
    card_code: { _source: "generated", tokens: [] },
  };
  var result = schema.validateBriefData(data);
  var forbidden = result.findings.filter(function (f) {
    return f.kind === "forbidden-card-key";
  });
  assert.equal(forbidden.length, 2, "expected 2 forbidden-card-key findings");
});
