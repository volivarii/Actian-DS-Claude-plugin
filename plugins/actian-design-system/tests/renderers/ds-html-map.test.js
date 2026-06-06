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
