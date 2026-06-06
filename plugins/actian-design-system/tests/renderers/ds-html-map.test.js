"use strict";

// ds-html-map.test.js — Tests for the hi-fi DS render tier leaf mapping.
// TDD-first: this drives ds-html-map.js (renderDSComponent, switches on dsSlug).
// Repo style: node:test + node:assert.

var { describe, it } = require("node:test");
var assert = require("node:assert");

var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");

function render(node) {
  return ds.renderDSComponent(node);
}

describe("ds-html-map: button", function () {
  it("Primary: emits a <button> with ds-button--primary and the esc'd Label", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "button",
      variant: "Type=Primary, Size=Default, State=Default",
      props: { Label: "Save" },
    });
    assert.ok(html.indexOf("<button") === 0, "starts with <button");
    assert.ok(
      html.indexOf("ds-button ds-button--primary") !== -1,
      "has primary modifier",
    );
    assert.ok(html.indexOf("Save") !== -1, "renders label");
    assert.ok(html.indexOf("</button>") !== -1, "closes button tag");
  });

  it("Secondary: ds-button--secondary", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Secondary",
      props: { Label: "Cancel" },
    });
    assert.ok(html.indexOf("ds-button--secondary") !== -1);
  });

  it("Tertiary: ds-button--tertiary", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Tertiary",
      props: { Label: "Skip" },
    });
    assert.ok(html.indexOf("ds-button--tertiary") !== -1);
  });

  it("Critical primary maps to critical (NOT brand-blue primary)", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Critical primary",
      props: { Label: "Delete" },
    });
    assert.ok(
      html.indexOf("ds-button--critical") !== -1,
      "has critical modifier",
    );
    assert.ok(
      html.indexOf("ds-button--primary") === -1,
      "does NOT render as primary",
    );
  });

  it("Disabled: contains is-disabled class AND the disabled attribute", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Primary, State=Disabled",
      props: { Label: "Save" },
    });
    assert.ok(html.indexOf("is-disabled") !== -1, "has is-disabled class");
    assert.ok(
      html.indexOf(" disabled>") !== -1 || html.indexOf(" disabled ") !== -1,
      "emits the disabled attribute",
    );
  });

  it("not disabled: no disabled attribute", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Primary, State=Default",
      props: { Label: "Save" },
    });
    assert.ok(
      html.indexOf(" disabled") === -1,
      "no disabled attr when enabled",
    );
  });

  it("Small: contains ds-button--small", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Primary, Size=Small",
      props: { Label: "Save" },
    });
    assert.ok(html.indexOf("ds-button--small") !== -1);
  });

  it("both icon-show props truthy: two ds-button__icon spans", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Primary",
      props: {
        "Leading icon show": true,
        "Trailing icon show": true,
        Label: "Go",
      },
    });
    var count = html.split("ds-button__icon").length - 1;
    // each icon span contributes one class occurrence on the <span>
    assert.ok(count >= 2, "two icon spans present (got " + count + ")");
    assert.ok(html.indexOf("Go") !== -1, "label still rendered");
  });

  it("icon-show props absent/falsy: zero ds-button__icon spans", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Primary",
      props: { Label: "Go" },
    });
    assert.ok(
      html.indexOf("ds-button__icon") === -1,
      "no icon spans when unset",
    );
    var html2 = render({
      dsSlug: "button",
      variant: "Type=Primary",
      props: {
        Label: "Go",
        "Leading icon show": false,
        "Trailing icon show": false,
      },
    });
    assert.ok(
      html2.indexOf("ds-button__icon") === -1,
      "no icon spans when falsy",
    );
  });

  it("escapes a hostile Label", function () {
    var html = render({
      dsSlug: "button",
      variant: "Type=Primary",
      props: { Label: "<x>" },
    });
    assert.ok(html.indexOf("&lt;x&gt;") !== -1, "label escaped");
    assert.ok(html.indexOf("<x>") === -1, "no raw injection");
  });
});

describe("ds-html-map: input", function () {
  it("default: emits ds-field/ds-input scaffold with esc'd Label + Placeholder", function () {
    var html = render({
      dsSlug: "input",
      variant: "States=Default",
      props: { Label: "Email", "Placeholder text": "you@co.com" },
    });
    assert.ok(html.indexOf("ds-field") !== -1, "has ds-field");
    assert.ok(html.indexOf("ds-field__label") !== -1, "has label class");
    assert.ok(html.indexOf("ds-input") !== -1, "has ds-input");
    assert.ok(html.indexOf("ds-input__text") !== -1, "has input text");
    assert.ok(html.indexOf("Email") !== -1, "renders Label");
    assert.ok(html.indexOf("you@co.com") !== -1, "renders Placeholder text");
  });

  it("plain text input (no Trailing icon prop): NO ds-input__icon chevron", function () {
    var html = render({
      dsSlug: "input",
      variant: "States=Default",
      props: { Label: "Email", "Placeholder text": "you@co.com" },
    });
    assert.ok(
      html.indexOf("ds-input__icon") === -1,
      "no trailing chevron on a plain text input",
    );
  });

  it("with Trailing icon prop: renders the ds-input__icon chevron", function () {
    var html = render({
      dsSlug: "input",
      variant: "States=Default",
      props: { Label: "Email", "Trailing icon": "chevron" },
    });
    assert.ok(
      html.indexOf("ds-input__icon") !== -1,
      "trailing chevron present when Trailing icon prop set",
    );
  });

  it("Disabled (States=Disabled): ds-field carries is-disabled", function () {
    var html = render({
      dsSlug: "input",
      variant: "States=Disabled",
      props: { Label: "Email" },
    });
    assert.ok(
      html.indexOf("ds-field is-disabled") !== -1,
      "ds-field has is-disabled when States=Disabled",
    );
  });

  it("falls back to default Label/Placeholder text when absent", function () {
    var html = render({
      dsSlug: "input",
      variant: "States=Default",
      props: {},
    });
    assert.ok(html.indexOf("Label") !== -1, "default label");
    assert.ok(html.indexOf("Placeholder text") !== -1, "default placeholder");
  });
});

describe("ds-html-map: checkbox-with-label", function () {
  it("Selected=No: NOT checked, label rendered", function () {
    var html = render({
      dsSlug: "checkbox-with-label",
      variant: "Selected=No, State=Default",
      props: { Label: "Agree" },
    });
    assert.ok(
      html.indexOf("ds-checkbox--checked") === -1,
      "not checked when No",
    );
    assert.ok(html.indexOf("Agree") !== -1, "label rendered");
  });

  it("Selected=Yes: checked", function () {
    var html = render({
      dsSlug: "checkbox-with-label",
      variant: "Selected=Yes",
      props: { Label: "Agree" },
    });
    assert.ok(html.indexOf("ds-checkbox--checked") !== -1, "checked when Yes");
  });

  it("Disabled (State=Disabled): label carries is-disabled", function () {
    var html = render({
      dsSlug: "checkbox-with-label",
      variant: "Selected=No, State=Disabled",
      props: { Label: "Agree" },
    });
    assert.ok(
      html.indexOf("is-disabled") !== -1,
      "checkbox label has is-disabled when State=Disabled",
    );
  });
});

describe("ds-html-map: tag-default", function () {
  it("default (no icon): ds-tag pill with esc'd Label, no icon span", function () {
    var html = render({
      dsSlug: "tag-default",
      variant: "Color=Default",
      props: { Label: "Active" },
    });
    assert.ok(html.indexOf('<span class="ds-tag"') === 0, "starts with ds-tag");
    assert.ok(html.indexOf("Active") !== -1, "renders label");
    assert.ok(
      html.indexOf("ds-tag__icon") === -1,
      "no icon span when Leading icon show falsy",
    );
    assert.ok(
      html.indexOf("ds-tag--with-icon") === -1,
      "no with-icon modifier when icon off",
    );
  });

  it("Leading icon show: renders the folder icon span + with-icon modifier", function () {
    var html = render({
      dsSlug: "tag-default",
      variant: "Color=Default",
      props: { Label: "Folder", "Leading icon show": true },
    });
    assert.ok(
      html.indexOf("ds-tag ds-tag--with-icon") !== -1,
      "has with-icon modifier",
    );
    assert.ok(
      html.indexOf('<span class="ds-tag__icon">') !== -1,
      "has icon span",
    );
    assert.ok(html.indexOf("<svg") !== -1, "has inline svg");
    assert.ok(html.indexOf("Folder") !== -1, "renders label");
  });

  it("escapes a hostile Label", function () {
    var html = render({
      dsSlug: "tag-default",
      variant: "Color=Default",
      props: { Label: "<img src=x onerror=1>" },
    });
    assert.ok(html.indexOf("&lt;img") !== -1, "label escaped");
    assert.ok(html.indexOf("<img") === -1, "no raw injection");
  });
});

describe("ds-html-map: badge", function () {
  it("Number: ds-badge--number with esc'd Label", function () {
    var html = render({
      dsSlug: "badge",
      variant: "Type=Number",
      props: { Label: "3" },
    });
    assert.ok(
      html.indexOf("ds-badge ds-badge--number") !== -1,
      "has number modifier",
    );
    assert.ok(html.indexOf(">3</span>") !== -1, "renders the number");
    assert.ok(html.indexOf("ds-badge--dot") === -1, "not a dot");
  });

  it("Dot: ds-badge--dot, empty, no text", function () {
    var html = render({
      dsSlug: "badge",
      variant: "Type=Dot",
      props: { Label: "ignored" },
    });
    assert.ok(
      html.indexOf("ds-badge ds-badge--dot") !== -1,
      "has dot modifier",
    );
    assert.ok(html.indexOf("ignored") === -1, "dot does not render Label text");
    assert.ok(html.indexOf("ds-badge--number") === -1, "not a number");
  });

  it("escapes a hostile Label on Number", function () {
    var html = render({
      dsSlug: "badge",
      variant: "Type=Number",
      props: { Label: "<b>9</b>" },
    });
    assert.ok(html.indexOf("&lt;b&gt;9&lt;/b&gt;") !== -1, "label escaped");
    assert.ok(html.indexOf("<b>") === -1, "no raw injection");
  });
});

describe("ds-html-map: search", function () {
  it("default: ds-search with leading icon + placeholder text", function () {
    var html = render({
      dsSlug: "search",
      variant: "State=Default",
      props: { "Placeholder text": "Search catalog" },
    });
    assert.ok(
      html.indexOf('<div class="ds-search"') === 0,
      "starts with ds-search",
    );
    assert.ok(html.indexOf("ds-search__icon") !== -1, "has icon span");
    assert.ok(html.indexOf("<svg") !== -1, "has inline svg");
    assert.ok(html.indexOf("ds-search__text") !== -1, "has text span");
    assert.ok(html.indexOf("Search catalog") !== -1, "renders placeholder");
    assert.ok(html.indexOf("is-disabled") === -1, "not disabled");
  });

  it("falls back to 'Search' when no placeholder", function () {
    var html = render({
      dsSlug: "search",
      variant: "State=Default",
      props: {},
    });
    assert.ok(html.indexOf(">Search</span>") !== -1, "default placeholder");
  });

  it("Disabled: is-disabled (canonical spelling)", function () {
    var html = render({
      dsSlug: "search",
      variant: "State=Disabled",
      props: { "Placeholder text": "Search" },
    });
    assert.ok(
      html.indexOf("ds-search is-disabled") !== -1,
      "has is-disabled when State=Disabled",
    );
  });

  it("Disabled: accepts the kit typo 'Dsiabled'", function () {
    var html = render({
      dsSlug: "search",
      variant: "State=Dsiabled",
      props: { "Placeholder text": "Search" },
    });
    assert.ok(
      html.indexOf("ds-search is-disabled") !== -1,
      "has is-disabled for the 'Dsiabled' typo too",
    );
  });

  it("escapes a hostile placeholder", function () {
    var html = render({
      dsSlug: "search",
      variant: "State=Default",
      props: { "Placeholder text": '"><script>' },
    });
    assert.ok(html.indexOf("<script>") === -1, "no raw injection");
    assert.ok(html.indexOf("&lt;script&gt;") !== -1, "escaped");
  });
});

describe("ds-html-map: card-for-items (DS-native only)", function () {
  it("Catalog default: card composes .ds-tag for eyebrow + category, plus title/body", function () {
    var html = render({
      dsSlug: "card-for-items",
      variant: "Type=Catalog, State=Default",
      props: {
        Eyebrow: "Dataset",
        Title: "Sales records",
        Category: "Catalog",
        Body: "Quarterly sales figures across regions.",
      },
    });
    assert.ok(
      html.indexOf('<div class="ds-card"') === 0,
      "starts with ds-card",
    );
    assert.ok(
      html.indexOf("ds-card--selected") === -1,
      "not selected by default",
    );
    // composes the shared tag classes
    assert.ok(
      html.indexOf("ds-tag ds-card__eyebrow") !== -1,
      "eyebrow reuses ds-tag",
    );
    assert.ok(
      html.indexOf("ds-tag ds-tag--with-icon ds-card__cat") !== -1,
      "category reuses ds-tag w/ icon",
    );
    assert.ok(html.indexOf("ds-tag__icon") !== -1, "category folder icon");
    assert.ok(html.indexOf("ds-card__title") !== -1, "has title");
    assert.ok(html.indexOf("ds-card__body") !== -1, "has body");
    assert.ok(html.indexOf("Dataset") !== -1, "renders eyebrow");
    assert.ok(html.indexOf("Sales records") !== -1, "renders title");
    assert.ok(html.indexOf("Catalog") !== -1, "renders category");
    assert.ok(
      html.indexOf("Quarterly sales figures across regions.") !== -1,
      "renders body",
    );
  });

  it("Selected: ds-card--selected", function () {
    var html = render({
      dsSlug: "card-for-items",
      variant: "Type=Catalog, State=Selected",
      props: { Title: "Picked" },
    });
    assert.ok(
      html.indexOf("ds-card ds-card--selected") !== -1,
      "has selected modifier when State=Selected",
    );
  });

  it("falls back to defaults when props absent", function () {
    var html = render({
      dsSlug: "card-for-items",
      variant: "Type=Catalog",
      props: {},
    });
    assert.ok(html.indexOf("Dataset") !== -1, "default eyebrow");
    assert.ok(html.indexOf("Title") !== -1, "default title");
    assert.ok(html.indexOf("Catalog") !== -1, "default category");
  });

  it("escapes a hostile Title", function () {
    var html = render({
      dsSlug: "card-for-items",
      variant: "Type=Catalog",
      props: { Title: "<svg onload=1>" },
    });
    assert.ok(html.indexOf("&lt;svg") !== -1, "title escaped");
    assert.ok(html.indexOf("<svg onload") === -1, "no raw injection");
  });
});

describe("ds-html-map: fallback + resilience", function () {
  it("unknown dsSlug returns the graceful chip", function () {
    var html = render({ dsSlug: "nope", name: "Mystery" });
    assert.ok(
      html.indexOf('<span class="ds-component"') === 0,
      "graceful chip span",
    );
    assert.ok(html.indexOf('data-slug="nope"') !== -1, "carries slug");
    assert.ok(html.indexOf("Mystery") !== -1, "carries name");
  });

  it("empty node never throws, returns a chip", function () {
    var html;
    assert.doesNotThrow(function () {
      html = render({});
    });
    assert.ok(
      html.indexOf('<span class="ds-component"') === 0,
      "chip for empty node",
    );
  });

  it("hostile props shape never throws (normalizeProps absorbs it)", function () {
    // props:42 does NOT throw — normalizeProps treats a non-object as {} and the
    // button renders normally. The genuine catch-branch coverage is the test
    // below (a throwing `variant` getter). This guards graceful absorption.
    var html;
    assert.doesNotThrow(function () {
      html = render({ dsSlug: "button", variant: "Type=Primary", props: 42 });
    });
    assert.ok(typeof html === "string", "returns a string");
    assert.ok(html.indexOf("<button") === 0, "renders a normal button");
  });

  it("never throws — degrades to chip even if internals throw", function () {
    // Genuinely exercises the catch branch: reading node.variant throws.
    var evil = { dsSlug: "button" };
    Object.defineProperty(evil, "variant", {
      get: function () {
        throw new Error("boom");
      },
    });
    var html = render(evil);
    assert.ok(
      html.indexOf('<span class="ds-component"') === 0,
      "returns graceful chip on throw",
    );
  });
});
