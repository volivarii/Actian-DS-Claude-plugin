"use strict";

// ds-html-map.test.js — Tests for the hi-fi DS render tier leaf mapping.
// TDD-first: this drives ds-html-map.js (renderDSComponent, switches on dsSlug).
// Repo style: node:test + node:assert.

var { describe, it } = require("node:test");
var assert = require("node:assert");

var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");
var PATHS = require("../../scripts/lib/paths.js");
var fs = require("fs");

function render(node) {
  return ds.renderDSComponent(node);
}

describe("ds-html-map: P1a precondition", function () {
  it("vendored icons.json has the slugs renderIcon needs", function () {
    var iconsPath = PATHS.components.icons.svg;
    assert.ok(
      iconsPath,
      "PATHS.components.icons.svg must resolve (vendored manifest)",
    );
    var doc = JSON.parse(fs.readFileSync(iconsPath, "utf8"));
    var slugs = Object.keys(doc.icons || {});
    ["add", "chevron-up", "simple-check", "directory"].forEach(function (s) {
      assert.ok(
        slugs.indexOf(s) !== -1,
        "vendored icons.json missing required slug: " + s,
      );
    });
  });
});

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

describe("ds-html-map: global-header", function () {
  it("default: emits a <header> with brand, app label, spacer, avatar", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: {},
    });
    assert.ok(
      html.indexOf('<header class="ds-header"') === 0,
      "starts with ds-header",
    );
    assert.ok(html.indexOf("ds-header__brand") !== -1, "has brand");
    assert.ok(html.indexOf("ds-header__logo") !== -1, "has logo");
    assert.ok(html.indexOf("ds-header__app") !== -1, "has app label");
    assert.ok(html.indexOf("ds-header__spacer") !== -1, "has spacer");
    assert.ok(html.indexOf("ds-header__actions") !== -1, "has actions");
    assert.ok(html.indexOf("ds-header__avatar") !== -1, "has avatar");
    assert.ok(html.indexOf("</header>") !== -1, "closes header tag");
  });

  it("App label defaults to the App type variant value", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Explorer",
      props: {},
    });
    assert.ok(html.indexOf(">Explorer</span>") !== -1, "uses App type value");
  });

  it("App prop overrides the App type variant value", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: { App: "My Workspace" },
    });
    assert.ok(html.indexOf("My Workspace") !== -1, "renders App prop");
    assert.ok(
      html.indexOf(">Studio</span>") === -1,
      "App prop wins over variant",
    );
  });

  it("falls back to 'Studio' when neither App prop nor variant present", function () {
    var html = render({ dsSlug: "global-header", variant: "", props: {} });
    assert.ok(html.indexOf(">Studio</span>") !== -1, "default app label");
  });

  it("Account prop sets the avatar initials; defaults to 'AU'", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: { Account: "VO" },
    });
    assert.ok(html.indexOf(">VO</span>") !== -1, "renders Account initials");
    var html2 = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: {},
    });
    assert.ok(html2.indexOf(">AU</span>") !== -1, "default avatar initials");
  });

  it("escapes a hostile App label", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: { App: "<img src=x onerror=1>" },
    });
    assert.ok(html.indexOf("&lt;img") !== -1, "app label escaped");
    assert.ok(html.indexOf("<img") === -1, "no raw injection");
  });
});

describe("ds-html-map: side-nav", function () {
  it("Expanded default: nav with one item per default label, no collapsed modifier", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "App=Studio, View=Expanded",
      props: {},
    });
    assert.ok(
      html.indexOf('<nav class="ds-sidenav"') === 0,
      "starts with ds-sidenav (not collapsed)",
    );
    assert.ok(
      html.indexOf("ds-sidenav--collapsed") === -1,
      "no collapsed modifier when Expanded",
    );
    var itemCount = html.split("ds-sidenav__item").length - 1;
    // default Items = "Catalog, Pipelines, Connections, Settings" → 4 rows.
    // (each row's class string contributes the substring once.)
    assert.equal(itemCount, 4, "four item rows from the default Items");
    assert.ok(html.indexOf("Catalog") !== -1, "renders Catalog");
    assert.ok(html.indexOf("Pipelines") !== -1, "renders Pipelines");
    assert.ok(html.indexOf("Connections") !== -1, "renders Connections");
    assert.ok(html.indexOf("Settings") !== -1, "renders Settings");
    assert.ok(html.indexOf("ds-sidenav__icon") !== -1, "rows have icons");
    assert.ok(html.indexOf("ds-sidenav__label") !== -1, "rows have labels");
  });

  it("item count tracks the Items prop (comma-split + trim)", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "View=Expanded",
      props: { Items: "Home,  Reports , Admin" },
    });
    var itemCount = html.split("ds-sidenav__item").length - 1;
    assert.equal(itemCount, 3, "three rows from three Items");
    assert.ok(html.indexOf(">Home</span>") !== -1, "trimmed Home");
    assert.ok(html.indexOf(">Reports</span>") !== -1, "trimmed Reports");
    assert.ok(html.indexOf(">Admin</span>") !== -1, "trimmed Admin");
  });

  it("is-active lands on the Active label's row only", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "View=Expanded",
      props: { Items: "Catalog, Pipelines, Settings", Active: "Pipelines" },
    });
    var activeCount = html.split("is-active").length - 1;
    assert.equal(activeCount, 1, "exactly one active row");
    // the active row is the Pipelines one: its class string precedes the label
    var activeIdx = html.indexOf("ds-sidenav__item is-active");
    assert.ok(activeIdx !== -1, "active row carries is-active");
    var pipeIdx = html.indexOf("Pipelines");
    assert.ok(pipeIdx > activeIdx, "Pipelines label follows its active row");
  });

  it("Active defaults to the first item when not specified", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "View=Expanded",
      props: { Items: "Catalog, Pipelines" },
    });
    var activeCount = html.split("is-active").length - 1;
    assert.equal(activeCount, 1, "one active row by default");
    // first row (Catalog) is the active one
    var firstItem = html.indexOf("ds-sidenav__item");
    assert.ok(
      html.indexOf("ds-sidenav__item is-active") === firstItem,
      "first item is active by default",
    );
  });

  it("Collapsed view adds ds-sidenav--collapsed", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "App=Studio, View=Collapsed",
      props: { Items: "Catalog, Pipelines" },
    });
    assert.ok(
      html.indexOf('<nav class="ds-sidenav ds-sidenav--collapsed"') === 0,
      "has collapsed modifier when View=Collapsed",
    );
  });

  it("escapes hostile item labels", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "View=Expanded",
      props: { Items: "<x>,Safe" },
    });
    assert.ok(html.indexOf("&lt;x&gt;") !== -1, "label escaped");
    assert.ok(html.indexOf("<x>") === -1, "no raw injection");
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
