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

// Build a minimal v0.9.x merged guideline doc with a given content domain.
// `contentStatus` drives isStubGuideline; `sections` is the content body.
function guidelineDoc(contentStatus, sections) {
  var content = { status: contentStatus };
  if (contentStatus === "approved" || contentStatus === "draft") {
    content.owner = "content-team";
    content.markdown = "# Stub markdown";
    content.sections = sections || [];
  } else if (contentStatus === "synthesized") {
    // Pattern fan-out (knowledge v0.15.0+) emits sections with
    // section.source markers, no markdown, no owner.
    content.sections = (sections || []).map(function (s) {
      var out = { heading: s.heading, content: s.content };
      out.source = s.source || "pattern:test";
      if (s.subsections) out.subsections = s.subsections;
      return out;
    });
  }
  return {
    _schema_version: 1,
    _meta: {
      auto_generated: true,
      source: "components/src/button/",
      do_not_edit:
        "Edit the per-domain source files; CI regenerates this file.",
    },
    slug: "button",
    component: "Button",
    meta: { category: "action" },
    domains: {
      content: content,
      design: { status: "inherited" },
      behavior: { status: "inherited" },
    },
  };
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

// transcribeContentGuidelines — reads the v0.9.x guideline doc's content domain
test("transcribeContentGuidelines — returns sections + figma source when content domain is approved", function () {
  var guidelines = loadFixture("button-component-guidelines-rich.json");
  var result = sourcing.transcribeContentGuidelines(guidelines);
  assert.equal(result.source, "figma");
  assert.ok(Array.isArray(result.content.sections));
  assert.equal(result.content.sections.length, 2);
});

test("transcribeContentGuidelines — returns null when content domain has no content-bearing status", function () {
  // The "empty" fixture is a present doc whose content domain is not-started.
  var guidelines = loadFixture("button-component-guidelines-empty.json");
  assert.equal(sourcing.transcribeContentGuidelines(guidelines), null);
  // inherited content domain → also null
  assert.equal(
    sourcing.transcribeContentGuidelines(guidelineDoc("inherited")),
    null,
  );
});

test("transcribeContentGuidelines — returns sections when status is 'synthesized' (knowledge v0.15.0+ pattern fan-out)", function () {
  // Pattern fan-out into a component with no per-component content.md
  // produces a guideline doc with status=synthesized + sections carrying
  // section.source markers. Brief-sourcing must surface those sections
  // alongside approved/draft.
  var guidelines = guidelineDoc("synthesized", [
    {
      heading: "Empty state",
      source: "pattern:empty-and-system-states",
      content: [{ prose: "Empty states explain what to do next." }],
    },
  ]);
  var result = sourcing.transcribeContentGuidelines(guidelines);
  assert.equal(result.source, "figma");
  assert.equal(result.content.sections.length, 1);
  assert.equal(
    result.content.sections[0].source,
    "pattern:empty-and-system-states",
  );
});

test("isStubGuideline — treats 'synthesized' status as NON-stub", function () {
  // Pattern fan-out content should drive the full transcribe flow, not the
  // "Guidance pending curation" footer.
  var doc = guidelineDoc("synthesized", [
    {
      heading: "X",
      source: "pattern:y",
      content: [{ prose: "z" }],
    },
  ]);
  assert.equal(sourcing.isStubGuideline(doc), false);
});

test("transcribeContentGuidelines — returns null when domains / sections missing or empty", function () {
  assert.equal(sourcing.transcribeContentGuidelines({}), null);
  assert.equal(sourcing.transcribeContentGuidelines({ domains: {} }), null);
  // approved but no sections array
  assert.equal(
    sourcing.transcribeContentGuidelines({
      domains: { content: { status: "approved" } },
    }),
    null,
  );
  // approved with an empty sections array
  assert.equal(
    sourcing.transcribeContentGuidelines({
      domains: { content: { status: "approved", sections: [] } },
    }),
    null,
  );
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
    card: "anatomy",
    phase: "generate",
    grounding: ["vendor/foundations/src/tokens.md"],
  };
  var result = sourcing.resolveSection("anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.deepEqual(result.grounding, ["vendor/foundations/src/tokens.md"]);
});

test("resolveSection — content card with an approved content domain → figma result", function () {
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-rich.json"),
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guideline-doc-content-domain" },
      fallback: "claude-generate",
    },
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.phase, "A");
  assert.equal(result.source, "figma");
  assert.ok(result.content);
});

test("resolveSection — content card, present doc with no curated content → stub Phase B", function () {
  // The "empty" fixture is a present-but-stub doc (content not-started). A
  // present stub short-circuits ALL cards to Phase B.
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: loadFixture("button-component-guidelines-empty.json"),
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guideline-doc-content-domain" },
      fallback: "claude-generate",
    },
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.equal(result.source, null);
  assert.equal(result.fallback, true);
  assert.match(result.fallbackReason, /stub/i);
});

test("resolveSection — no guideline doc at all → card_header still transcribes (no short-circuit)", function () {
  // A component with no guideline doc (ctx.guidelinesJson absent) is NOT
  // short-circuited — card_header still transcribes its Figma description.
  var ctx = loadFixture("button-with-figma-description.json");
  delete ctx.guidelinesJson;
  var result = sourcing.resolveSection("card_header", ctx, {
    card: "card_header",
    phase: "transcribe",
    source: { primary: { type: "registry-description" } },
  });
  assert.equal(result.phase, "A");
  assert.equal(result.source, "figma");
});

test("resolveSection — unknown phase throws", function () {
  assert.throws(function () {
    sourcing.resolveSection("card_x", {}, { phase: "weird" });
  }, /unknown phase/i);
});

// Stub-aware routing — a present-but-stub guideline forces Phase B
test("resolveSection — stub guideline forces Phase B fallback (transcribe recipe)", function () {
  var ctx = {
    component: "Tooltip",
    slug: "tooltip",
    guidelinesJson: guidelineDoc("not-started"),
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guideline-doc-content-domain" },
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
    guidelinesJson: guidelineDoc("inherited"),
  };
  var recipe = {
    card: "anatomy",
    phase: "generate",
    grounding: ["vendor/foundations/src/tokens.md"],
  };
  var result = sourcing.resolveSection("anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.deepEqual(result.grounding, ["vendor/foundations/src/tokens.md"]);
  assert.equal(result.fallback, true);
});

test("resolveSection — non-stub guideline routes normally (regression guard)", function () {
  var ctx = {
    component: "Button",
    slug: "button",
    guidelinesJson: guidelineDoc("approved", [
      { heading: "Style", content: ["Use sentence case."] },
    ]),
  };
  var recipe = {
    card: "card_content",
    phase: "transcribe",
    source: {
      primary: { type: "guideline-doc-content-domain" },
      fallback: "claude-generate",
    },
  };
  var result = sourcing.resolveSection("card_content", ctx, recipe);
  assert.equal(result.source, "figma", "non-stub should still route to figma");
  assert.equal(result.phase, "A");
});

// isStubGuideline — the per-domain-status replacement for the `_stub` boolean
test("isStubGuideline — true when no doc, true when content not approved/draft, false otherwise", function () {
  assert.equal(sourcing.isStubGuideline(null), true);
  assert.equal(sourcing.isStubGuideline(undefined), true);
  assert.equal(sourcing.isStubGuideline({}), true);
  assert.equal(sourcing.isStubGuideline(guidelineDoc("not-started")), true);
  assert.equal(sourcing.isStubGuideline(guidelineDoc("inherited")), true);
  assert.equal(
    sourcing.isStubGuideline(
      guidelineDoc("approved", [{ heading: "X", content: ["y"] }]),
    ),
    false,
  );
  assert.equal(
    sourcing.isStubGuideline(
      guidelineDoc("draft", [{ heading: "X", content: ["y"] }]),
    ),
    false,
  );
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

test("formatForBrief — content card maps guideline sections into rules + terminology", function () {
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
  // rich fixture: section 1 is two { term, rule } items → terminology;
  // section 2 has one prose string + one { do, dont } → one rule with do/dont.
  assert.ok(Array.isArray(result.rules));
  assert.equal(result.terminology.length, 2);
  assert.equal(result.terminology[0].term, "Cancel vs Close");
  assert.ok(typeof result.terminology[0].use === "string");
  var dodontRule = result.rules.filter(function (r) {
    return r.do && r.dont;
  })[0];
  assert.ok(dodontRule, "a rule with a do/dont pair is produced");
  assert.equal(dodontRule.do, "Create integration");
  // a terminology-only section produces NO rule (its items all become
  // terminology entries; proseOf() is empty so no rule is pushed)
  assert.ok(
    !result.rules.some(function (r) {
      return r.title === "Terminology for button labeling";
    }),
    "a term-only section must not also emit a rule",
  );
  // every rule carries title + description strings (renderCard7 contract)
  assert.ok(
    result.rules.every(function (r) {
      return typeof r.title === "string" && typeof r.description === "string";
    }),
  );
  assert.equal(result._source, "figma");
});

test("formatForBrief — content card extracts prose from new {prose} and {bullets} shapes", function () {
  // Knowledge parser v2 emits {prose} (was {note}) for paragraphs and
  // {bullets:[...]} (was bare strings) for lists. The plugin reads vendored
  // JSON which will eventually carry these new shapes — proseOf() must
  // surface them as section descriptions, not silently drop them.
  var doc = {
    _schema_version: 1,
    slug: "x",
    component: "X",
    meta: { category: "action" },
    domains: {
      content: {
        status: "approved",
        markdown: "",
        sections: [
          {
            heading: "Stepper labels",
            content: [
              { prose: "Use the following label terminology consistently:" },
              { bullets: ["Back for previous.", "Next for intermediate."] },
              { prose: "Do not mix Continue and Next in the same flow." },
            ],
          },
        ],
      },
    },
  };
  var ctx = { component: "X", slug: "x", guidelinesJson: doc };
  var content = sourcing.transcribeContentGuidelines(doc).content;
  var result = sourcing.formatForBrief(
    "card_content",
    { source: "figma", content: content },
    ctx,
  );
  assert.equal(result.rules.length, 1);
  var desc = result.rules[0].description;
  assert.match(desc, /label terminology consistently/);
  assert.match(desc, /Back for previous\./);
  assert.match(desc, /Do not mix Continue and Next/);
});

test("transcribeContentGuidelines / isStubGuideline — registry-alias copy is handled like any other doc", function () {
  // Knowledge ships registry-key alias copies, e.g. checkbox-with-label.json
  // carrying `_alias_of: "checkbox"`. The plugin loads it by slug like any
  // guideline doc; the extra `_alias_of` field must be harmlessly ignored.
  var aliasDoc = guidelineDoc("approved", [
    { heading: "Style", content: ["Use sentence case for the label."] },
  ]);
  aliasDoc._alias_of = "checkbox";
  aliasDoc.slug = "checkbox"; // alias copies keep the canonical slug
  assert.equal(sourcing.isStubGuideline(aliasDoc), false);
  var result = sourcing.transcribeContentGuidelines(aliasDoc);
  assert.equal(result.source, "figma");
  assert.equal(result.content.sections.length, 1);
});

// ---------------------------------------------------------------------------
// transcribeMotionPattern — legacy defensive guard
//
// The v0.9.x merged guideline doc carries NO per-component motion (its
// `domains.behavior` is status-only). transcribeMotionPattern therefore
// returns null for every real guideline doc, and resolveSection's motion
// branch always resolves via the category fallback (see below). The function
// is kept as a defensive guard for the retired Figma-scraped `behavior.motion`
// shape; these tests exercise it directly.
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

test("transcribeMotionPattern — legacy shape: returns figma content for a known pattern", function () {
  var result = sourcing.transcribeMotionPattern(
    { behavior: { motion: { pattern: "drawer" } } },
    { drawer: DRAWER_PATTERN },
  );
  assert.equal(result.source, "figma");
  assert.equal(result.content.patternSlug, "drawer");
  assert.equal(result.content.phases.length, 2);
});

test("transcribeMotionPattern — returns null for the v0.9.x doc shape (no behavior.motion)", function () {
  // domains.behavior is status-only — there is no top-level `behavior.motion`.
  assert.equal(
    sourcing.transcribeMotionPattern(guidelineDoc("approved", []), {
      drawer: DRAWER_PATTERN,
    }),
    null,
  );
  assert.equal(sourcing.transcribeMotionPattern({ behavior: null }, {}), null);
});

test("transcribeMotionPattern — flags missingPattern for an unknown slug", function () {
  var result = sourcing.transcribeMotionPattern(
    { behavior: { motion: { pattern: "nonexistent-pattern" } } },
    { drawer: DRAWER_PATTERN },
  );
  assert.equal(result.source, null);
  assert.equal(result.missingPattern, true);
  assert.equal(result.slug, "nonexistent-pattern");
});

test("formatForBrief — motion preserves phase rows + adds optional fields", function () {
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
  var formatted = sourcing.formatForBrief("motion", motionResult, {});
  assert.equal(formatted.patternSlug, "drawer");
  assert.equal(formatted.phases.length, 2);
  assert.equal(formatted.logic_and_accessibility.length, 1);
  assert.equal(formatted.notes.length, 1);
  assert.equal(formatted.overrides, "Side nav variant uses faster close");
  assert.equal(formatted._source, "figma");
});

// --- Phase 2c — category defaults wiring ---

var CATEGORY_DEFAULTS_FIXTURE = {
  slug: "form-input-selection",
  anatomy: {
    parts: [
      { name: "Label", description: "control label" },
      { name: "Control", description: "the input" },
    ],
  },
  variants: {
    variantAxes: [{ axis: "State", values: ["default", "focus", "error"] }],
  },
  motion_refs: {
    patternRefs: [{ ref: "state-transitions", note: "focus feedback" }],
  },
  a11y_refs: {
    requirementRefs: [{ ref: "keyboard-focus" }, { ref: "color-contrast" }],
  },
};

test("resolveSection — Phase B card with ctx.categoryDefaults attaches it to result", function () {
  var ctx = {
    guidelinesJson: guidelineDoc("not-started"),
    category: "form-input-selection",
    categoryDefaults: CATEGORY_DEFAULTS_FIXTURE,
  };
  var recipe = { phase: "generate", grounding: ["vendor/foo.md"] };
  var result = sourcing.resolveSection("anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.ok(result.categoryDefaults, "categoryDefaults must be attached");
  assert.equal(result.categoryDefaults.slug, "form-input-selection");
  assert.ok(result.categoryDefaults.anatomy, "anatomy section must be present");
});

test("resolveSection — tokens Phase B does NOT receive categoryDefaults (no mapping in defaults file)", function () {
  var ctx = {
    guidelinesJson: guidelineDoc("not-started"),
    category: "form-input-selection",
    categoryDefaults: CATEGORY_DEFAULTS_FIXTURE,
  };
  var recipe = { phase: "generate", grounding: [] };
  var result = sourcing.resolveSection("tokens", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.equal(
    result.categoryDefaults,
    undefined,
    "tokens has no category-level defaults",
  );
});

test("resolveSection — usage Phase B does NOT receive categoryDefaults (no mapping)", function () {
  var ctx = {
    guidelinesJson: guidelineDoc("not-started"),
    category: "form-input-selection",
    categoryDefaults: CATEGORY_DEFAULTS_FIXTURE,
  };
  var recipe = { phase: "generate", grounding: [] };
  var result = sourcing.resolveSection("usage", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.equal(result.categoryDefaults, undefined);
});

test("resolveSection — Phase B with no ctx.categoryDefaults leaves categoryDefaults undefined", function () {
  var ctx = { guidelinesJson: guidelineDoc("not-started") };
  var recipe = { phase: "generate", grounding: [] };
  var result = sourcing.resolveSection("anatomy", ctx, recipe);
  assert.equal(result.phase, "B");
  assert.equal(result.categoryDefaults, undefined);
});

test("resolveSection — motion Phase A: non-stub doc + categoryDefaults → category motion fallback", function () {
  var STATE_TRANSITIONS = {
    slug: "state-transitions",
    name: "State Transitions",
    phases: [{ Phase: "hover", Duration: "100ms" }],
  };
  var ctx = {
    // a non-stub doc (so resolveSection reaches the motion branch); its
    // domains.behavior is status-only, so transcribeMotionPattern returns null
    // and the category fallback resolves the pattern.
    guidelinesJson: guidelineDoc("approved", [
      { heading: "Style", content: ["Use sentence case."] },
    ]),
    categoryDefaults: CATEGORY_DEFAULTS_FIXTURE,
    motionRefResolver: function (slug) {
      return slug === "state-transitions" ? STATE_TRANSITIONS : null;
    },
  };
  var recipe = { phase: "transcribe" };
  var result = sourcing.resolveSection("motion", ctx, recipe);
  assert.equal(result.phase, "A");
  assert.equal(
    result.source,
    "figma",
    "category fallback still counts as transcribed",
  );
  assert.equal(result.fallback, true);
  assert.equal(result.fallbackReason, "category-motion-default");
  assert.equal(result.content.patternSlug, "state-transitions");
  assert.equal(result.content.patternName, "State Transitions");
});

test("resolveSection — motion: non-stub doc, no categoryDefaults → skipCard", function () {
  var ctx = {
    guidelinesJson: guidelineDoc("approved", [
      { heading: "Style", content: ["Use sentence case."] },
    ]),
  };
  var recipe = { phase: "transcribe" };
  var result = sourcing.resolveSection("motion", ctx, recipe);
  assert.equal(result.phase, "A");
  assert.equal(result.skipCard, true, "no fallback when no categoryDefaults");
});

// NOTE: the pre-v1.84 test "component HAS pattern → existing path wins over
// category default" is removed — the v0.9.x merged guideline doc carries no
// per-component motion pattern, so that precedence scenario no longer exists.
// transcribeMotionPattern's legacy behaviour is covered by the direct unit
// tests above.
