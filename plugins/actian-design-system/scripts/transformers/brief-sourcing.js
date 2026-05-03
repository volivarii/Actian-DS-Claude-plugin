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

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function resolveSection(cardKey, ctx, recipe) {
  if (!recipe) throw new Error("resolveSection: missing recipe");
  if (recipe.phase === "generate") {
    return { phase: "B", grounding: recipe.grounding || [] };
  }
  if (recipe.phase !== "transcribe") {
    throw new Error("resolveSection: unknown phase '" + recipe.phase + "'");
  }
  // Phase A — dispatch by cardKey to the right transcription primitive
  var primary = null;
  var fallbackReason = null;
  if (cardKey === "card_header") {
    primary = transcribeFigmaDescription(ctx);
    fallbackReason = "Figma component description empty — author canonical version in Figma component properties";
  } else if (cardKey === "card_content") {
    primary = transcribeContentGuidelines(ctx && ctx.guidelinesJson);
    fallbackReason = "content_guidelines empty in component-guidelines JSON — Jeff to author Content frame in Figma + re-sync";
  } else {
    throw new Error("resolveSection: no transcription rule for cardKey '" + cardKey + "'");
  }

  if (primary) {
    return { phase: "A", source: "figma", content: primary.content };
  }
  return { phase: "A", source: null, fallback: true, fallbackReason: fallbackReason };
}

// ---------------------------------------------------------------------------
// Formatters — shape transcribed content into brief-data card shape
// ---------------------------------------------------------------------------

function formatForBrief(cardKey, sourceResult, ctx) {
  if (cardKey === "card_header") {
    return {
      name: ctx && ctx.component ? ctx.component : "",
      description: typeof sourceResult.content === "string" ? sourceResult.content : "",
      _source: sourceResult.source || "generated"
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
      _source: sourceResult.source || "generated"
    };
  }
  throw new Error("formatForBrief: unknown cardKey '" + cardKey + "'");
}

module.exports = {
  transcribeFigmaDescription: transcribeFigmaDescription,
  transcribeContentGuidelines: transcribeContentGuidelines,
  resolveSection: resolveSection,
  formatForBrief: formatForBrief
};
