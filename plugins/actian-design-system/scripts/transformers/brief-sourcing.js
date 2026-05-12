#!/usr/bin/env node
"use strict";

/**
 * brief-sourcing.js — Phase A transcription utility for /component-brief.
 *
 * Pure module — no MCP, no network. Caller pre-fetches all required context
 * (Figma node.description from get_design_context or dskit.json,
 * component-guidelines/<slug>.json from disk).
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

function transcribeContentGuidelines(guidelinesJson) {
  if (!guidelinesJson || !guidelinesJson.content_guidelines) return null;
  var sections = guidelinesJson.content_guidelines.sections;
  if (!Array.isArray(sections) || sections.length === 0) return null;
  return { source: "figma", content: { sections: sections } };
}

// Motion is a registry-derived card (pattern data lives in
// vendor/foundations/dist/tokens/motion.json under #patterns.<slug>).
// The component-guideline only declares which pattern + optional overrides;
// the canonical phase data comes from foundations. Caller passes
// ctx.motionPatterns (the patterns object from foundations/dist/tokens/motion.json).
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

// Phase 2c — category fallback for card_motion. Used when the component's
// guideline has no behavior.motion.pattern but ctx.categoryDefaults
// declares one or more motion_refs (patternRefs in dist projection).
// Takes a resolver function so the dispatcher can supply either the
// category-defaults-loader or a test stub.
function transcribeCategoryMotionFallback(categoryDefaults, motionRefResolver) {
  if (!categoryDefaults || !categoryDefaults.card_motion) return null;
  var refs = categoryDefaults.card_motion.patternRefs;
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
// card_tokens and card_usage have no category-level mapping in the
// defaults file shape, so they are intentionally excluded.
var CATEGORY_DEFAULTS_PHASE_B_CARDS = {
  card_anatomy: true,
  card_component: true,
  card_accessibility: true,
};

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function resolveSection(cardKey, ctx, recipe) {
  if (!recipe) throw new Error("resolveSection: missing recipe");

  // Stub guidelines short-circuit ALL cards to Phase B.
  if (ctx && ctx.guidelinesJson && ctx.guidelinesJson._stub === true) {
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
      "content_guidelines empty in component-guidelines JSON — Jeff to author Content frame in Figma + re-sync";
  } else if (cardKey === "card_motion") {
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
    var rules = [];
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (Array.isArray(s.content)) {
        for (var j = 0; j < s.content.length; j++) {
          rules.push(s.content[j]);
        }
      }
    }
    return {
      rules: rules,
      terminology: [],
      _source: sourceResult.source || "generated",
    };
  }
  if (cardKey === "card_motion") {
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
  resolveSection: resolveSection,
  formatForBrief: formatForBrief,
  CATEGORY_DEFAULTS_PHASE_B_CARDS: CATEGORY_DEFAULTS_PHASE_B_CARDS,
};
