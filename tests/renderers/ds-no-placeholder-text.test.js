"use strict";

// ds-no-placeholder-text.test.js: a DS leaf authored without a label, a stage
// or a glossary relationship renders none, instead of printing the prop's
// name ("Label", "Stage", "VH Vehicle") as if it were content.
//
// The fix lives in the vendored renderer (knowledge #713, v0.34.212); this is
// the plugin-side mirror, so a refresh that brings the placeholders back fails
// here rather than in a flow someone is reading. Each case also renders the
// same leaf WITH the value, so an assertion cannot pass because the leaf
// stopped rendering altogether.

var { describe, it } = require("node:test");
var assert = require("node:assert/strict");

var ds = require("../../plugins/actian-design-system/scripts/lib/renderer.js").dsHtmlMap;

function render(slug, props) {
  return ds.renderDSComponent({
    type: "INSTANCE",
    library: "ds",
    dsSlug: slug,
    variant: "",
    props: props || {},
  });
}

// Text a reader would see: markup stripped, whitespace collapsed.
function visibleText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("a label-less DS control prints no label", function () {
  [
    "checkbox",
    "radio",
    "toggle",
    "dropdown-select-default",
    "text-input",
  ].forEach(function (slug) {
    it(slug + " without Label shows no 'Label', and shows the one it is given", function () {
      assert.doesNotMatch(visibleText(render(slug)), /\bLabel\b/);
      assert.match(visibleText(render(slug, { Label: "Owner" })), /\bOwner\b/);
    });
  });
});

describe("a search result card prints no stage or glossary it was not given", function () {
  it("without Stage shows no 'Stage', and shows the stage it is given", function () {
    assert.doesNotMatch(visibleText(render("search-result-card")), /\bStage\b/);
    assert.match(
      visibleText(render("search-result-card", { Stage: "Certified" })),
      /\bCertified\b/,
    );
  });

  it("without a glossary relationship shows no 'VH' or 'Vehicle', and shows the one it is given", function () {
    var bare = visibleText(render("search-result-card"));
    assert.doesNotMatch(bare, /\bVH\b/);
    assert.doesNotMatch(bare, /\bVehicle\b/);
    var given = visibleText(
      render("search-result-card", {
        "Glossary label": "Customer",
        "Glossary initials": "CU",
      }),
    );
    assert.match(given, /\bCU\b/);
    assert.match(given, /\bCustomer\b/);
  });
});
