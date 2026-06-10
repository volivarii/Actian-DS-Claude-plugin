"use strict";
/**
 * flow-share-hifi-promotion.test.js — Unit tests for the meta-level hi-fi
 * promotion signals in assembleFlowShare.
 *
 * Bug B3: transform-to-hifi.js:420 stamps meta.mode="hifi" but the assembler
 * never read it, so converted flows rendered DS leaves inside lo-fi FM chrome.
 * These are the FIRST tests of the promotion block.
 *
 * Four cases:
 *   1. meta.library:"ds"  → hi-fi promotion fires (pre-existing path)
 *   2. meta.hifi:true     → hi-fi promotion fires (pre-existing path)
 *   3. meta.mode:"hifi"   → hi-fi promotion fires (THE FIX — was missing)
 *   4. no signal          → negative control: FM chrome only, no hi-fi markers
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");

// ---------------------------------------------------------------------------
// Shared fixture parts
// ---------------------------------------------------------------------------

// A single screen with a DS-flagged INSTANCE node (button). The per-screen
// `library` is intentionally ABSENT so it inherits from meta-level promotion.
var screen = {
  id: "s1",
  name: "Home",
  template: "studio",
  content: [
    {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "button",
      props: { Label: "Go" },
    },
  ],
};

// Base data: no hi-fi signal at the meta level — used as-is for the negative
// control (case 4) and as a prototype that's extended for cases 1-3.
var base = { meta: { feature: "t", app: "Studio" }, screens: [screen] };

// ---------------------------------------------------------------------------
// Helper: produce a variant with a single meta property set
// ---------------------------------------------------------------------------
function withMeta(key, value) {
  return Object.assign({}, base, {
    meta: Object.assign({}, base.meta, { [key]: value }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("assembleFlowShare — hi-fi promotion signals", function () {
  // Case 1: meta.library:"ds" — direct library signal (pre-existing)
  it('meta.library:"ds" promotes to hi-fi chrome (data-theme + ds-button)', function () {
    var html = assembleFlowShare(withMeta("library", "ds"));
    assert.ok(
      /<[a-z][^>]*\sdata-theme="studio"/.test(html),
      'expected data-theme="studio" in hi-fi chrome',
    );
    assert.ok(
      html.indexOf("ds-button") !== -1,
      "expected ds-button leaf in promoted hi-fi output",
    );
  });

  // Case 2: meta.hifi:true — legacy boolean signal (pre-existing)
  it("meta.hifi:true promotes to hi-fi chrome (data-theme + ds-button)", function () {
    var html = assembleFlowShare(withMeta("hifi", true));
    assert.ok(
      /<[a-z][^>]*\sdata-theme="studio"/.test(html),
      'expected data-theme="studio" in hi-fi chrome',
    );
    assert.ok(
      html.indexOf("ds-button") !== -1,
      "expected ds-button leaf in promoted hi-fi output",
    );
  });

  // Case 3: meta.mode:"hifi" — THE FIX: transform-to-hifi stamps this signal
  it('meta.mode:"hifi" promotes to hi-fi chrome (data-theme + ds-button)', function () {
    var html = assembleFlowShare(withMeta("mode", "hifi"));
    assert.ok(
      /<[a-z][^>]*\sdata-theme="studio"/.test(html),
      'expected data-theme="studio" in hi-fi chrome (meta.mode:"hifi" must promote)',
    );
    assert.ok(
      html.indexOf("ds-button") !== -1,
      'expected ds-button leaf when meta.mode:"hifi" (was broken — assembler never read mode)',
    );
  });

  // Case 4: negative control — no signal means no hi-fi promotion.
  // NB: the selector ".screen--hifi" always appears in the inlined CSS, so
  // assert on class USAGE in markup (and the data-theme stamp), not on the
  // bare substring.
  it("no hi-fi signal: does not add screen--hifi marker", function () {
    var html = assembleFlowShare(base);
    assert.ok(
      !/class="[^"]*screen--hifi/.test(html),
      "expected no screen--hifi class usage when no hi-fi meta signal present",
    );
    assert.ok(
      !/<[a-z][^>]*\sdata-theme="studio"/.test(html),
      "expected no data-theme stamp on markup when no hi-fi meta signal present",
    );
  });
});
