"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var fs = require("fs");
var sourcing = require("../scripts/transformers/brief-sourcing.js");

var FIX = path.resolve(__dirname, "fixtures", "brief");

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIX, name), "utf8"));
}

// transcribeFigmaDescription
test("transcribeFigmaDescription — returns content + figma source when description present", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  var result = sourcing.transcribeFigmaDescription(ctx);
  assert.equal(result.source, "figma");
  assert.ok(result.content.length > 0);
  assert.ok(result.content.indexOf("Primary action element") !== -1);
});

test("transcribeFigmaDescription — returns null when description null", function () {
  var ctx = loadFixture("button-no-figma-description.json");
  var result = sourcing.transcribeFigmaDescription(ctx);
  assert.equal(result, null);
});

test("transcribeFigmaDescription — returns null when description empty/whitespace", function () {
  assert.equal(sourcing.transcribeFigmaDescription({ nodeDescription: "" }), null);
  assert.equal(sourcing.transcribeFigmaDescription({ nodeDescription: "   " }), null);
  assert.equal(sourcing.transcribeFigmaDescription({ nodeDescription: undefined }), null);
});

// transcribeContentGuidelines
test("transcribeContentGuidelines — returns formatted content + figma source when sections present", function () {
  var guidelines = loadFixture("button-component-guidelines-rich.json");
  var result = sourcing.transcribeContentGuidelines(guidelines);
  assert.equal(result.source, "figma");
  assert.ok(Array.isArray(result.content.sections));
  assert.equal(result.content.sections.length, 2);
});

test("transcribeContentGuidelines — returns null when content_guidelines is null", function () {
  var guidelines = loadFixture("button-component-guidelines-empty.json");
  assert.equal(sourcing.transcribeContentGuidelines(guidelines), null);
});

test("transcribeContentGuidelines — returns null when content_guidelines.sections is missing/empty", function () {
  assert.equal(sourcing.transcribeContentGuidelines({ content_guidelines: {} }), null);
  assert.equal(sourcing.transcribeContentGuidelines({ content_guidelines: { sections: [] } }), null);
  assert.equal(sourcing.transcribeContentGuidelines({}), null);
});

// resolveSection — dispatcher
test("resolveSection — header card with description present → figma result", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  var recipe = {
    card: "card_header",
    phase: "transcribe",
    source: { primary: { type: "registry-description" }, secondary: { type: "figma-mcp" }, fallback: "claude-generate" }
  };
  var result = sourcing.resolveSection("card_header", ctx, recipe);
  assert.equal(result.phase, "A");
  assert.equal(result.source, "figma");
  assert.ok(result.content);
});

test("resolveSection — header card with no description → fallback signal", function () {
  var ctx = loadFixture("button-no-figma-description.json");
  var recipe = {
    card: "card_header",
    phase: "transcribe",
    source: { primary: { type: "registry-description" }, secondary: { type: "figma-mcp" }, fallback: "claude-generate" }
  };
  var result = sourcing.resolveSection("card_header", ctx, recipe);
  assert.equal(result.phase, "A");
  assert.equal(result.source, null);
  assert.equal(result.fallback, true);
  assert.ok(result.fallbackReason && result.fallbackReason.length > 0);
});

test("resolveSection — generate recipe → returns Phase B marker, no transcription", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  var recipe = {
    card: "card_anatomy",
    phase: "generate",
    grounding: ["docs/foundations.md"]
  };
  var result = sourcing.resolveSection("card_anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.deepEqual(result.grounding, ["docs/foundations.md"]);
});

test("resolveSection — content card with rich guidelines → figma result", function () {
  var ctx = {
    component: "Button", slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-rich.json")
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: { primary: { type: "guidelines-content-sections" }, fallback: "claude-generate" }
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.source, "figma");
  assert.ok(result.content);
});

test("resolveSection — content card with empty guidelines → fallback", function () {
  var ctx = {
    component: "Button", slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-empty.json")
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: { primary: { type: "guidelines-content-sections" }, fallback: "claude-generate" }
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.source, null);
  assert.equal(result.fallback, true);
});

test("resolveSection — unknown phase throws", function () {
  assert.throws(function () {
    sourcing.resolveSection("card_x", {}, { phase: "weird" });
  }, /unknown phase/i);
});

// formatForBrief — shaping helpers
test("formatForBrief — header content shapes name + description fields", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  var result = sourcing.formatForBrief("card_header", { source: "figma", content: ctx.nodeDescription }, ctx);
  assert.equal(result.name, "Button");
  assert.ok(result.description.length > 0);
  assert.equal(result._source, "figma");
});

test("formatForBrief — content card shapes content_guidelines.sections into rules array", function () {
  var ctx = { component: "Button", slug: "button", guidelinesJson: loadFixture("button-component-guidelines-rich.json") };
  var content = sourcing.transcribeContentGuidelines(ctx.guidelinesJson).content;
  var result = sourcing.formatForBrief("card_content", { source: "figma", content: content }, ctx);
  assert.ok(Array.isArray(result.rules));
  assert.ok(result.rules.length > 0);
  assert.equal(result._source, "figma");
});
