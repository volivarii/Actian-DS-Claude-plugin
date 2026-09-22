"use strict";

/**
 * stub-guideline.js: is a merged guideline doc a stub?
 *
 * A guideline is a "stub" (no curated content) when there is no doc at all
 * (a component with no entry in components/dist/guidelines/) or the doc's
 * `content` domain is not in one of the content-bearing statuses:
 * approved, draft, or synthesized (added in knowledge v0.15.0 for
 * pattern-fan-out-only components). This replaces the `_stub` boolean of
 * the retired Figma-scraped guideline layer, and it is what
 * validate-flow-data.js reads to flag stub-guideline components.
 *
 * Extracted on 2026-09-22 from scripts/transformers/brief-sourcing.js, the
 * retired brief skill's transcription module, which left with that skill.
 */

var CONTENT_BEARING_STATUSES = new Set(["approved", "draft", "synthesized"]);

function isStubGuideline(guidelinesJson) {
  if (!guidelinesJson || !guidelinesJson.domains) return true;
  var content = guidelinesJson.domains.content;
  if (!content) return true;
  return !CONTENT_BEARING_STATUSES.has(content.status);
}

module.exports = {
  CONTENT_BEARING_STATUSES: CONTENT_BEARING_STATUSES,
  isStubGuideline: isStubGuideline,
};
