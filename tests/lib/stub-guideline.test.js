"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var stub = require("../../plugins/actian-design-system/scripts/lib/stub-guideline.js");

// A minimal merged guideline doc whose content domain carries the given status.
function guidelineDoc(contentStatus) {
  return {
    _schema_version: 1,
    slug: "button",
    domains: {
      content: { status: contentStatus, sections: [{ heading: "X", content: ["y"] }] },
    },
  };
}

test("isStubGuideline: true when no doc, true when content is not content-bearing", function () {
  assert.equal(stub.isStubGuideline(null), true);
  assert.equal(stub.isStubGuideline(undefined), true);
  assert.equal(stub.isStubGuideline({}), true);
  assert.equal(stub.isStubGuideline({ domains: {} }), true);
  assert.equal(stub.isStubGuideline(guidelineDoc("not-started")), true);
  assert.equal(stub.isStubGuideline(guidelineDoc("inherited")), true);
});

test("isStubGuideline: false for approved, draft and synthesized content", function () {
  assert.equal(stub.isStubGuideline(guidelineDoc("approved")), false);
  assert.equal(stub.isStubGuideline(guidelineDoc("draft")), false);
  assert.equal(stub.isStubGuideline(guidelineDoc("synthesized")), false);
});

test("isStubGuideline: a registry-alias copy reads like any other doc", function () {
  var aliasDoc = guidelineDoc("approved");
  aliasDoc._alias_of = "checkbox";
  aliasDoc.slug = "checkbox";
  assert.equal(stub.isStubGuideline(aliasDoc), false);
});

test("the content-bearing statuses are exactly approved, draft, synthesized", function () {
  assert.deepEqual(Array.from(stub.CONTENT_BEARING_STATUSES).sort(), ["approved", "draft", "synthesized"]);
});
