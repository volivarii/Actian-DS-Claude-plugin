"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var fs = require("fs");
var sourcing = require("../../scripts/transformers/brief-sourcing.js");

var FIX = path.resolve(__dirname, "..", "fixtures", "brief");

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
  assert.equal(
    sourcing.transcribeFigmaDescription({ nodeDescription: "" }),
    null,
  );
  assert.equal(
    sourcing.transcribeFigmaDescription({ nodeDescription: "   " }),
    null,
  );
  assert.equal(
    sourcing.transcribeFigmaDescription({ nodeDescription: undefined }),
    null,
  );
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
  assert.equal(
    sourcing.transcribeContentGuidelines({ content_guidelines: {} }),
    null,
  );
  assert.equal(
    sourcing.transcribeContentGuidelines({
      content_guidelines: { sections: [] },
    }),
    null,
  );
  assert.equal(sourcing.transcribeContentGuidelines({}), null);
});

// resolveSection — dispatcher
test("resolveSection — header card with description present → figma result", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  var recipe = {
    card: "card_header",
    phase: "transcribe",
    source: {
      primary: { type: "registry-description" },
      secondary: { type: "figma-mcp" },
      fallback: "claude-generate",
    },
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
    source: {
      primary: { type: "registry-description" },
      secondary: { type: "figma-mcp" },
      fallback: "claude-generate",
    },
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
    grounding: ["vendor/foundations/src/foundations.md"],
  };
  var result = sourcing.resolveSection("card_anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.deepEqual(result.grounding, ["vendor/foundations/src/foundations.md"]);
});

test("resolveSection — content card with rich guidelines → figma result", function () {
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-rich.json"),
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guidelines-content-sections" },
      fallback: "claude-generate",
    },
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.source, "figma");
  assert.ok(result.content);
});

test("resolveSection — content card with empty guidelines → fallback", function () {
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-empty.json"),
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guidelines-content-sections" },
      fallback: "claude-generate",
    },
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

// Stub-aware routing — _stub: true forces Phase B regardless of recipe
test("resolveSection — stub guideline forces Phase B fallback (transcribe recipe)", function () {
  var ctx = {
    component: "Tooltip",
    slug: "tooltip",
    guidelinesJson: {
      component: "Tooltip",
      _stub: true,
      content_guidelines: null,
      design_guidelines: null,
    },
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guidelines-content-sections" },
      fallback: "claude-generate",
    },
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.phase, "B", "stub should route to Phase B");
  assert.equal(result.source, null);
  assert.equal(result.fallback, true);
  assert.match(result.fallbackReason, /stub/i);
});

test("resolveSection — stub guideline forces Phase B even on generate recipe (preserves grounding)", function () {
  var ctx = {
    component: "Tooltip",
    slug: "tooltip",
    guidelinesJson: { _stub: true },
  };
  var recipe = {
    card: "card_anatomy",
    phase: "generate",
    grounding: ["vendor/foundations/src/foundations.md"],
  };
  var result = sourcing.resolveSection("card_anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.deepEqual(result.grounding, ["vendor/foundations/src/foundations.md"]);
  assert.equal(result.fallback, true);
});

test("resolveSection — non-stub guideline routes normally (regression guard)", function () {
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: {
      component: "Button",
      content_guidelines: { sections: [{ heading: "X", content: ["rule 1"] }] },
    },
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guidelines-content-sections" },
      fallback: "claude-generate",
    },
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.source, "figma", "non-stub should still route to figma");
  assert.equal(result.phase, "A");
});

// formatForBrief — shaping helpers
test("formatForBrief — header content shapes name + description fields", function () {
  var ctx = loadFixture("button-with-figma-description.json");
  var result = sourcing.formatForBrief(
    "card_header",
    { source: "figma", content: ctx.nodeDescription },
    ctx,
  );
  assert.equal(result.name, "Button");
  assert.ok(result.description.length > 0);
  assert.equal(result._source, "figma");
});

test("formatForBrief — content card shapes content_guidelines.sections into rules array", function () {
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-rich.json"),
  };
  var content = sourcing.transcribeContentGuidelines(
    ctx.guidelinesJson,
  ).content;
  var result = sourcing.formatForBrief(
    "card_content",
    { source: "figma", content: content },
    ctx,
  );
  assert.ok(Array.isArray(result.rules));
  assert.ok(result.rules.length > 0);
  assert.equal(result._source, "figma");
});

// ---------------------------------------------------------------------------
// card_motion — Decision 4 / Brief Refresh v2 / v1.65.0
// ---------------------------------------------------------------------------

var DRAWER_PATTERN = {
  name: "Drawer (open/close)",
  phases: [
    {
      Phase: "Open",
      Duration: "duration-slow",
      Easing: "ease-entrance",
      Behavior: "Slides in from the right",
    },
    {
      Phase: "Close",
      Duration: "duration-base",
      Easing: "ease-exit",
      Behavior: "Slides out to the right",
    },
  ],
};

test("card_motion — resolveSection returns figma source when guideline declares a known pattern", function () {
  var ctx = {
    component: "Drawer",
    guidelinesJson: { behavior: { motion: { pattern: "drawer" } } },
    motionPatterns: { drawer: DRAWER_PATTERN },
  };
  var result = sourcing.resolveSection("card_motion", ctx, {
    phase: "transcribe",
    grounding: ["vendor/foundations/src/foundations.md"],
  });
  assert.equal(result.phase, "A");
  assert.equal(result.source, "figma");
  assert.equal(result.content.patternSlug, "drawer");
  assert.equal(result.content.phases.length, 2);
});

test("card_motion — skipCard when guideline has no behavior.motion", function () {
  var ctx = {
    guidelinesJson: { behavior: null },
    motionPatterns: { drawer: DRAWER_PATTERN },
  };
  var result = sourcing.resolveSection("card_motion", ctx, {
    phase: "transcribe",
    grounding: ["vendor/foundations/src/foundations.md"],
  });
  assert.equal(result.phase, "A");
  assert.equal(result.source, null);
  assert.equal(result.skipCard, true);
});

test("card_motion — fallback when slug references unknown pattern", function () {
  var ctx = {
    guidelinesJson: {
      behavior: { motion: { pattern: "nonexistent-pattern" } },
    },
    motionPatterns: { drawer: DRAWER_PATTERN },
  };
  var result = sourcing.resolveSection("card_motion", ctx, {
    phase: "transcribe",
    grounding: ["vendor/foundations/src/foundations.md"],
  });
  assert.equal(result.phase, "A");
  assert.equal(result.fallback, true);
  assert.match(result.fallbackReason, /not found in foundations/);
});

test("card_motion — formatForBrief preserves phase rows + adds optional fields", function () {
  var motionResult = {
    source: "figma",
    content: {
      patternSlug: "drawer",
      patternName: "Drawer (open/close)",
      phases: DRAWER_PATTERN.phases,
      logic_and_accessibility: ["Reduced motion: disable fades"],
      notes: ["Note A"],
      overrides: "Side nav variant uses faster close",
    },
  };
  var formatted = sourcing.formatForBrief("card_motion", motionResult, {});
  assert.equal(formatted.patternSlug, "drawer");
  assert.equal(formatted.phases.length, 2);
  assert.equal(formatted.logic_and_accessibility.length, 1);
  assert.equal(formatted.notes.length, 1);
  assert.equal(formatted.overrides, "Side nav variant uses faster close");
  assert.equal(formatted._source, "figma");
});
