"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var RECIPE_DIR = path.resolve(__dirname, "..", "recipes", "brief");
var INDEX_PATH = path.join(RECIPE_DIR, "_index.json");

test("brief recipes — _index.json exists and references existing files", function () {
  assert.ok(fs.existsSync(INDEX_PATH), "_index.json must exist");
  var idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  assert.equal(idx.length, 7, "expected exactly 7 cards (Header, Component, Anatomy, Tokens, Usage, Content, Accessibility)");
  for (var i = 0; i < idx.length; i++) {
    var entry = idx[i];
    assert.ok(entry.file, "entry " + i + " must have file");
    assert.ok(entry.card, "entry " + i + " must have card");
    var filePath = path.join(RECIPE_DIR, entry.file);
    assert.ok(fs.existsSync(filePath), "recipe file " + entry.file + " must exist");
    assert.ok(!/^card\d+-/.test(entry.file), "recipe filename " + entry.file + " must not start with card<number>-");
    assert.ok(!/^card\d+_/.test(entry.card), "recipe card key " + entry.card + " must not start with card<number>_");
  }
});

test("brief recipes — every recipe declares phase", function () {
  var idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  for (var i = 0; i < idx.length; i++) {
    var recipe = JSON.parse(fs.readFileSync(path.join(RECIPE_DIR, idx[i].file), "utf8"));
    assert.ok(
      recipe.phase === "transcribe" || recipe.phase === "generate",
      "recipe " + idx[i].file + " phase must be 'transcribe' or 'generate', got: " + recipe.phase
    );
  }
});

test("brief recipes — transcribe recipes have source block with primary + fallback", function () {
  var idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  for (var i = 0; i < idx.length; i++) {
    var recipe = JSON.parse(fs.readFileSync(path.join(RECIPE_DIR, idx[i].file), "utf8"));
    if (recipe.phase !== "transcribe") continue;
    assert.ok(recipe.source, "transcribe recipe " + idx[i].file + " must have source block");
    assert.ok(recipe.source.primary, "source.primary required");
    assert.ok(recipe.source.fallback, "source.fallback required");
  }
});

test("brief recipes — generate recipes have grounding array", function () {
  var idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  for (var i = 0; i < idx.length; i++) {
    var recipe = JSON.parse(fs.readFileSync(path.join(RECIPE_DIR, idx[i].file), "utf8"));
    if (recipe.phase !== "generate") continue;
    assert.ok(Array.isArray(recipe.grounding), "generate recipe " + idx[i].file + " must have grounding array");
  }
});

test("brief recipes — usage / content / accessibility have research applicable", function () {
  var idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  var researchCards = ["card_usage", "card_content", "card_accessibility"];
  for (var i = 0; i < idx.length; i++) {
    if (researchCards.indexOf(idx[i].card) === -1) continue;
    var recipe = JSON.parse(fs.readFileSync(path.join(RECIPE_DIR, idx[i].file), "utf8"));
    assert.ok(recipe.research, "recipe " + idx[i].file + " must have research block (research-applicable card)");
    assert.equal(recipe.research.applicable, true, "research.applicable must be true");
    assert.ok(Array.isArray(recipe.research.focus) && recipe.research.focus.length > 0, "research.focus must be non-empty array");
  }
});

test("brief recipes — card5_api and card9_code are gone", function () {
  assert.ok(!fs.existsSync(path.join(RECIPE_DIR, "card5-api.json")), "card5-api.json must be deleted");
  assert.ok(!fs.existsSync(path.join(RECIPE_DIR, "card9-code.json")), "card9-code.json must be deleted");
  var idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  for (var i = 0; i < idx.length; i++) {
    assert.notEqual(idx[i].card, "card5_api", "card5_api must not appear in _index.json");
    assert.notEqual(idx[i].card, "card9_code", "card9_code must not appear in _index.json");
    assert.notEqual(idx[i].card, "card_api", "card_api must not appear in _index.json");
    assert.notEqual(idx[i].card, "card_code", "card_code must not appear in _index.json");
  }
});
