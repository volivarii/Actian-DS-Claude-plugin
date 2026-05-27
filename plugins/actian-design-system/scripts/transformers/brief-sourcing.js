#!/usr/bin/env node
"use strict";

/**
 * brief-sourcing.js — Phase A transcription utility for /component-brief.
 *
 * Pure module — no MCP, no network. Caller pre-fetches all required context
 * (Figma node.description from get_design_context or dskit.json, the merged
 * per-component guideline doc components/dist/guidelines/<slug>.json from disk).
 *
 * Module API:
 *   var s = require('./brief-sourcing');
 *   var result = s.resolveSection(cardKey, ctx, recipe);
 *     // → { phase: "A"|"B", source: "figma"|null, content?, grounding?,
 *           fallback?, fallbackReason? }
 *   var fmt = s.formatForBrief(cardKey, sourceResult, ctx);
 *     // → object shaped per the brief data schema for this cardKey
 */

// ---------------------------------------------------------------------------
// Transcription primitives
// ---------------------------------------------------------------------------

function transcribeFigmaDescription(ctx) {
  var d = ctx && ctx.nodeDescription;
  if (typeof d !== "string") return null;
  var trimmed = d.trim();
  if (trimmed.length === 0) return null;
  return { source: "figma", content: trimmed };
}

// Reads the `content` domain of the merged per-component guideline doc
// (components/dist/guidelines/<slug>.json). Three content-bearing statuses:
//   - approved: per-component authored, signed-off
//   - draft:    per-component authored, unreviewed
//   - synthesized: no per-component authored content; sections sourced entirely
//                  from pattern fan-out (each section carries section.source =
//                  "pattern:<slug>"). See knowledge v0.15.0 +
//                  scripts/content/fanout-patterns.js.
// inherited / not-started (or an absent domain) means there is nothing to
// transcribe — the card falls through to Phase B.
// NOTE: `source: "figma"` is a legacy value name. It marks "transcribed from
// curated source material" (vs "generated"); the source is now the knowledge
// repo's authored markdown, not the Figma file. The schema's _source enum
// (validate-schema.js BRIEF_VALID_SOURCES) keeps the historical value.
var CONTENT_BEARING_STATUSES = new Set(["approved", "draft", "synthesized"]);

function transcribeContentGuidelines(guidelinesJson) {
  if (!guidelinesJson || !guidelinesJson.domains) return null;
  var content = guidelinesJson.domains.content;
  if (!content) return null;
  if (!CONTENT_BEARING_STATUSES.has(content.status)) return null;
  var sections = content.sections;
  if (!Array.isArray(sections) || sections.length === 0) return null;
  return { source: "figma", content: { sections: sections } };
}

// Legacy path: the old Figma-scraped guideline carried `behavior.motion`.
// The current multi-domain guideline doc has no per-component motion — its
// `domains.behavior` is status-only (typically `inherited`), so this returns
// null for it and resolveSection falls through to
// transcribeCategoryMotionFallback(). Kept as a defensive guard; canonical
// phase data lives in vendor/foundations/dist/tokens/motion.json under
// #patterns.<slug>. Caller passes ctx.motionPatterns (that patterns object).
function transcribeMotionPattern(guidelinesJson, motionPatterns) {
  if (!guidelinesJson || !guidelinesJson.behavior) return null;
  var motion = guidelinesJson.behavior.motion;
  if (!motion || typeof motion.pattern !== "string" || !motion.pattern) {
    return null;
  }
  var slug = motion.pattern;
  var pattern =
    motionPatterns && Object.prototype.hasOwnProperty.call(motionPatterns, slug)
      ? motionPatterns[slug]
      : null;
  if (!pattern) {
    return {
      source: null,
      missingPattern: true,
      slug: slug,
    };
  }
  return {
    source: "figma",
    content: {
      patternSlug: slug,
      patternName: pattern.name || slug,
      phases: Array.isArray(pattern.phases) ? pattern.phases : [],
      logic_and_accessibility: pattern.logic_and_accessibility || null,
      notes: pattern.notes || null,
      overrides: typeof motion.overrides === "string" ? motion.overrides : null,
    },
  };
}

// Phase 2c — category fallback for motion. Used when the component's
// guideline has no behavior.motion.pattern but ctx.categoryDefaults
// declares one or more motion_refs (patternRefs in dist projection).
// Takes a resolver function so the dispatcher can supply either the
// category-defaults-loader or a test stub.
function transcribeCategoryMotionFallback(categoryDefaults, motionRefResolver) {
  if (!categoryDefaults || !categoryDefaults.motion_refs) return null;
  var refs = categoryDefaults.motion_refs.patternRefs;
  if (!Array.isArray(refs) || refs.length === 0) return null;
  if (typeof motionRefResolver !== "function") return null;
  // Use the first ref as the canonical fallback. Additional refs in the
  // category defaults are advisory and surface via Phase B grounding.
  var first = refs[0];
  if (!first || typeof first.ref !== "string") return null;
  var pattern = motionRefResolver(first.ref);
  if (!pattern) return null;
  return {
    patternSlug: pattern.slug || first.ref,
    patternName: pattern.name || first.ref,
    phases: Array.isArray(pattern.phases) ? pattern.phases : [],
    logic_and_accessibility: pattern.logic_and_accessibility || null,
    notes: pattern.notes || null,
    overrides: null,
    _categoryNote: typeof first.note === "string" ? first.note : null,
  };
}

// Phase 2c — which Phase B cards receive categoryDefaults grounding.
// tokens and usage have no category-level mapping in the
// defaults file shape, so they are intentionally excluded.
var CATEGORY_DEFAULTS_PHASE_B_CARDS = {
  anatomy: true,
  variants: true,
  accessibility: true,
};

// A guideline is a "stub" — no curated content to transcribe — when there is
// no doc at all (ctx.guidelinesJson null, a component with no entry in
// components/dist/guidelines/) or the doc's `content` domain is not in one
// of the content-bearing statuses (approved/draft/synthesized — synthesized
// added in knowledge v0.15.0 for pattern-fan-out-only components). Replaces
// the `_stub` boolean from the retired Figma-scraped guideline layer. Used
// by the component-brief skill to set `meta._stubGuideline` (drives the
// "Guidance pending curation" footer cue). Note: resolveSection's
// all-cards-to-Phase-B short-circuit fires only for the *present-but-stub*
// case — see the guard there for why a fully absent doc is handled per-card
// instead.
function isStubGuideline(guidelinesJson) {
  if (!guidelinesJson || !guidelinesJson.domains) return true;
  var content = guidelinesJson.domains.content;
  if (!content) return true;
  return !CONTENT_BEARING_STATUSES.has(content.status);
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function resolveSection(cardKey, ctx, recipe) {
  if (!recipe) throw new Error("resolveSection: missing recipe");

  // A guideline doc that EXISTS but carries no curated content (its `content`
  // domain is inherited/not-started) short-circuits ALL cards to Phase B —
  // the v0.9.x equivalent of the old `_stub: true` scraped JSON. When there
  // is no guideline doc at all (ctx.guidelinesJson absent), do NOT
  // short-circuit: each card's normal flow handles it — card_header still
  // transcribes the Figma description, card_content falls back per-card,
  // motion resolves via the category fallback. (meta._stubGuideline is
  // still set from isStubGuideline() so the footer cue shows either way.)
  if (ctx && ctx.guidelinesJson && isStubGuideline(ctx.guidelinesJson)) {
    var stubResult = {
      phase: "B",
      source: null,
      fallback: true,
      fallbackReason:
        "guideline is a stub (no curated content); routing to Phase B",
      grounding: (recipe && recipe.grounding) || [],
    };
    if (
      ctx.categoryDefaults &&
      CATEGORY_DEFAULTS_PHASE_B_CARDS[cardKey] === true
    ) {
      stubResult.categoryDefaults = ctx.categoryDefaults;
    }
    return stubResult;
  }

  if (recipe.phase === "generate") {
    var genResult = { phase: "B", grounding: recipe.grounding || [] };
    if (
      ctx &&
      ctx.categoryDefaults &&
      CATEGORY_DEFAULTS_PHASE_B_CARDS[cardKey] === true
    ) {
      genResult.categoryDefaults = ctx.categoryDefaults;
    }
    return genResult;
  }
  if (recipe.phase !== "transcribe") {
    throw new Error("resolveSection: unknown phase '" + recipe.phase + "'");
  }

  // Phase A
  var primary = null;
  var fallbackReason = null;
  if (cardKey === "card_header") {
    primary = transcribeFigmaDescription(ctx);
    fallbackReason =
      "Figma component description empty — author canonical version in Figma component properties";
  } else if (cardKey === "card_content") {
    primary = transcribeContentGuidelines(ctx && ctx.guidelinesJson);
    fallbackReason =
      "content domain has no content-bearing status in the component guideline doc — " +
      "author components/src/<slug>/content.md in the knowledge repo " +
      "(or add the slug to a pattern's relatedComponents frontmatter)";
  } else if (cardKey === "motion") {
    var motionResult = transcribeMotionPattern(
      ctx && ctx.guidelinesJson,
      ctx && ctx.motionPatterns,
    );
    if (motionResult && motionResult.source === "figma") {
      return { phase: "A", source: "figma", content: motionResult.content };
    }
    if (motionResult && motionResult.missingPattern) {
      return {
        phase: "A",
        source: null,
        fallback: true,
        fallbackReason:
          "behavior.motion.pattern '" +
          motionResult.slug +
          "' not found in foundations tokens/motion.json#patterns — fix the slug or author the pattern",
      };
    }
    // No component pattern. Try category fallback before skipping.
    if (ctx && ctx.categoryDefaults) {
      var fallback = transcribeCategoryMotionFallback(
        ctx.categoryDefaults,
        ctx.motionRefResolver,
      );
      if (fallback) {
        return {
          phase: "A",
          source: "figma",
          content: fallback,
          fallback: true,
          fallbackReason: "category-motion-default",
        };
      }
    }
    return { phase: "A", source: null, skipCard: true };
  } else {
    throw new Error(
      "resolveSection: no transcription rule for cardKey '" + cardKey + "'",
    );
  }

  if (primary) {
    return { phase: "A", source: "figma", content: primary.content };
  }
  return {
    phase: "A",
    source: null,
    fallback: true,
    fallbackReason: fallbackReason,
  };
}

// ---------------------------------------------------------------------------
// Formatters — shape transcribed content into brief-data card shape
// ---------------------------------------------------------------------------

function formatForBrief(cardKey, sourceResult, ctx) {
  if (cardKey === "card_header") {
    return {
      name: ctx && ctx.component ? ctx.component : "",
      description:
        typeof sourceResult.content === "string" ? sourceResult.content : "",
      _source: sourceResult.source || "generated",
    };
  }
  if (cardKey === "card_content") {
    var content = sourceResult.content || {};
    var sections = Array.isArray(content.sections) ? content.sections : [];
    // Map the guideline doc's content sections (heading + mixed items) onto
    // the canonical card_content shape that renderCard7, the card-generator
    // recipe, and the brief-data schema all share:
    //   rules:       [ { title, description, do?, dont? } ]
    //   terminology: [ { term, use } ]
    // Per section: string + { note } items join into a rule `description`
    // under the section heading; { term, rule } items become terminology
    // entries; { do, dont } items attach do/dont examples (the first pair to
    // the section's prose rule, any extras as their own rules). { table }
    // items have no card_content slot and are skipped. The pre-v1.84
    // formatter flattened every item into `rules[]` raw — producing a shape
    // renderCard7 could not render; this maps to the real shape instead.
    var rules = [];
    var terminology = [];

    function proseOf(items) {
      // Concat the narrative bits of a section into one description string.
      // Handles all parser shapes that carry prose-like text:
      //   - {prose}              standalone paragraph (current parser)
      //   - {bullets:[...]}      one list, items joined (current parser)
      //   - {note}               blockquote/callout (current + legacy)
      //   - string               legacy bare bullet (pre-prose JSON)
      // Other shapes (do/dont/term/table/example) are not narrative and are
      // handled by the caller's ingest() walk below.
      var bits = [];
      for (var n = 0; n < items.length; n++) {
        var it = items[n];
        if (typeof it === "string") bits.push(it);
        else if (it && typeof it === "object") {
          if (typeof it.prose === "string") bits.push(it.prose);
          else if (Array.isArray(it.bullets)) bits.push(it.bullets.join(" "));
          else if (it.note != null) bits.push(it.note);
        }
      }
      return bits.join(" ");
    }

    function ingest(heading, items) {
      if (!Array.isArray(items)) return;
      var dodonts = [];
      for (var m = 0; m < items.length; m++) {
        var it = items[m];
        if (it && typeof it === "object") {
          // `term` checked before `rule` — terminology items are { term, rule }.
          if (it.term != null) {
            terminology.push({
              term: it.term,
              use: it.rule != null ? it.rule : it.definition || "",
            });
          } else if (it.do && it.dont) {
            // Both sides must carry content — a half-filled pair (one empty
            // cell) is not a real do/dont. Matches renderCard7's guard so the
            // two ends never disagree on what counts as a pair.
            dodonts.push({ do: it.do, dont: it.dont });
          }
        }
      }
      var description = proseOf(items);
      var hasProseRule = false;
      if (description) {
        var rule = { title: heading, description: description };
        if (dodonts.length) {
          rule.do = dodonts[0].do;
          rule.dont = dodonts[0].dont;
          dodonts = dodonts.slice(1);
        }
        rules.push(rule);
        hasProseRule = true;
      }
      for (var p = 0; p < dodonts.length; p++) {
        rules.push({
          title: hasProseRule || p > 0 ? "" : heading,
          description: "",
          do: dodonts[p].do,
          dont: dodonts[p].dont,
        });
      }
    }

    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var heading = s.heading || "Overview";
      ingest(heading, s.content);
      if (Array.isArray(s.subsections)) {
        for (var ss = 0; ss < s.subsections.length; ss++) {
          ingest(
            s.subsections[ss].subheading || heading,
            s.subsections[ss].content,
          );
        }
      }
    }
    return {
      rules: rules,
      terminology: terminology,
      _source: sourceResult.source || "generated",
    };
  }
  if (cardKey === "motion") {
    var m = sourceResult.content || {};
    var card = {
      patternSlug: m.patternSlug || "",
      patternName: m.patternName || "",
      phases: Array.isArray(m.phases) ? m.phases : [],
      _source: sourceResult.source || "generated",
    };
    if (Array.isArray(m.logic_and_accessibility))
      card.logic_and_accessibility = m.logic_and_accessibility;
    if (Array.isArray(m.notes)) card.notes = m.notes;
    if (typeof m.overrides === "string" && m.overrides.length > 0)
      card.overrides = m.overrides;
    return card;
  }
  throw new Error("formatForBrief: unknown cardKey '" + cardKey + "'");
}

module.exports = {
  transcribeFigmaDescription: transcribeFigmaDescription,
  transcribeContentGuidelines: transcribeContentGuidelines,
  transcribeMotionPattern: transcribeMotionPattern,
  transcribeCategoryMotionFallback: transcribeCategoryMotionFallback,
  isStubGuideline: isStubGuideline,
  resolveSection: resolveSection,
  formatForBrief: formatForBrief,
  CATEGORY_DEFAULTS_PHASE_B_CARDS: CATEGORY_DEFAULTS_PHASE_B_CARDS,
};
