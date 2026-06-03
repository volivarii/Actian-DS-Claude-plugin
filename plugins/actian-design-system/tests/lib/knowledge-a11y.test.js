"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var a11y = require("../../scripts/lib/knowledge/a11y.js");

// Real foundation slugs present in the vendored a11y-index (stable WCAG sections).
// (Confirmed in vendor/accessibility/dist/a11y-index.json#bySlug.)
var KNOWN_A = "color-contrast";
var KNOWN_B = "focus-keyboard";
var KNOWN_C = "aria-labels";
var UNKNOWN = "definitely-not-a-real-a11y-slug";

test("resolveLinkedCriteria groups component vs inherited", function () {
  var doc = { meta: { a11y_refs: [{ ref: KNOWN_A }] } };
  var cat = { a11y_refs: { requirementRefs: [{ ref: KNOWN_B, note: "n" }] } };
  var r = a11y.resolveLinkedCriteria(doc, cat);
  assert.equal(r.resolved, true);
  assert.equal(r.component.length, 1);
  assert.equal(r.component[0].slug, KNOWN_A);
  assert.ok(Array.isArray(r.component[0].wcag));
  assert.ok(
    typeof r.component[0].title === "string" && r.component[0].title.length > 0,
  );
  assert.equal(r.inherited.length, 1);
  assert.equal(r.inherited[0].slug, KNOWN_B);
  assert.equal(r.inherited[0].note, "n");
});

test("dedupe: a slug in both groups stays only in component", function () {
  var doc = { meta: { a11y_refs: [{ ref: KNOWN_A }] } };
  var cat = {
    a11y_refs: { requirementRefs: [{ ref: KNOWN_A }, { ref: KNOWN_B }] },
  };
  var r = a11y.resolveLinkedCriteria(doc, cat);
  assert.equal(r.component.length, 1);
  assert.equal(r.inherited.length, 1);
  assert.equal(r.inherited[0].slug, KNOWN_B);
  assert.ok(
    !r.inherited.some(function (c) {
      return c.slug === KNOWN_A;
    }),
  );
});

test("unresolved slugs are skipped", function () {
  var doc = { meta: { a11y_refs: [{ ref: UNKNOWN }, { ref: KNOWN_C }] } };
  var r = a11y.resolveLinkedCriteria(doc, null);
  assert.equal(r.component.length, 1);
  assert.equal(r.component[0].slug, KNOWN_C);
});

test("stub doc (no meta.a11y_refs) -> inherited only", function () {
  var cat = { a11y_refs: { requirementRefs: [{ ref: KNOWN_A }] } };
  var r = a11y.resolveLinkedCriteria({ domains: {} }, cat);
  assert.equal(r.component.length, 0);
  assert.equal(r.inherited.length, 1);
  assert.equal(r.resolved, true);
});

test("nothing resolvable -> resolved:false, empty", function () {
  var r = a11y.resolveLinkedCriteria(null, null);
  assert.deepEqual(r, { component: [], inherited: [], resolved: false });
});

test("empty wcag still yields a criterion (title-only render is the renderer's job)", function () {
  // 'principles' is a header-tier entry that resolves with wcag: [].
  var doc = { meta: { a11y_refs: [{ ref: "principles" }] } };
  var r = a11y.resolveLinkedCriteria(doc, null);
  assert.equal(r.component.length, 1);
  assert.ok(Array.isArray(r.component[0].wcag));
});

test("linkedCriteriaForComponent opts override skips loading", function () {
  var r = a11y.linkedCriteriaForComponent("whats-new-dropdown", {
    guidelinesJson: { meta: { a11y_refs: [{ ref: KNOWN_A }] } },
    categoryDefaults: null,
  });
  assert.equal(r.component.length, 1);
  assert.equal(r.component[0].slug, KNOWN_A);
  assert.equal(r.inherited.length, 0);
});

test("linkedCriteriaForComponent load-by-slug resolves a documented component", function () {
  // 'whats-new-dropdown' carries meta.a11y_refs in the vendored guidelines —
  // a documented component MUST resolve component-level criteria (guards against
  // a future re-vendor silently dropping its refs).
  var r = a11y.linkedCriteriaForComponent("whats-new-dropdown");
  assert.equal(r.resolved, true);
  assert.ok(
    r.component.length > 0,
    "whats-new-dropdown must have component-level criteria",
  );
  assert.ok(Array.isArray(r.inherited));
});

test("linkedCriteriaForComponent unknown slug -> resolved:false", function () {
  var r = a11y.linkedCriteriaForComponent("definitely-not-a-real-component");
  assert.equal(r.resolved, false);
  assert.equal(r.component.length, 0);
  assert.equal(r.inherited.length, 0);
});

test("linkedCriteriaForCategory returns inherited only", function () {
  // 'action' category-defaults carries requirementRefs in the vendor snapshot.
  var r = a11y.linkedCriteriaForCategory("action");
  assert.ok(Array.isArray(r.inherited));
  assert.equal(typeof r.resolved, "boolean");
  assert.equal(r.resolved, true);
  assert.equal(r.component, undefined);
});
