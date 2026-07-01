"use strict";

// ds-html-map.test.js — Tests for the hi-fi DS render tier leaf mapping.
// TDD-first: this drives ds-html-map.js (renderDSComponent, switches on dsSlug).
// Repo style: node:test + node:assert.

var { describe, it } = require("node:test");
var assert = require("node:assert");

var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");
var PATHS = require("../../scripts/lib/paths.js");
var fs = require("fs");
var path = require("path");

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

describe("ds-html-map: orphan-ref gate", function () {
  it("every renderIcon('slug') in ds-html-map resolves to a vendored icon", function () {
    var src = fs.readFileSync(
      path.join(
        __dirname,
        "../../scripts/renderers/html-renderers/ds-html-map.js",
      ),
      "utf8",
    );
    var doc = JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8"));
    var known = doc.icons || {};
    var re = /renderIcon\(\s*["']([a-z0-9-]+)["']/g;
    var m,
      missing = [],
      used = [];
    while ((m = re.exec(src))) {
      used.push(m[1]);
      if (!(m[1] in known)) missing.push(m[1]);
    }
    assert.ok(
      used.length >= 4,
      "expected the migrated glyphs to call renderIcon (got " +
        used.length +
        ")",
    );
    assert.deepEqual(
      missing,
      [],
      "renderIcon slugs missing from vendored icons.json: " +
        missing.join(", "),
    );
  });
});

describe("ds-html-map: renderIcon", function () {
  it("known slug returns a bare svg with class + viewBox + body", function () {
    var html = ds.renderIcon("add");
    assert.ok(
      /^<svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true">/.test(
        html,
      ),
      "svg open tag",
    );
    assert.ok(/<\/svg>$/.test(html), "closes svg");
    assert.ok(
      html.indexOf("<path") !== -1 || html.indexOf("currentColor") !== -1,
      "has glyph body",
    );
  });
  it("rotate adds the rotation class", function () {
    assert.ok(
      /class="ds-icon ds-icon--rot180"/.test(
        ds.renderIcon("chevron-up", { rotate: 180 }),
      ),
      "rot180 class",
    );
  });
  it("unknown slug returns empty string (never throws)", function () {
    assert.equal(ds.renderIcon("definitely-not-an-icon"), "");
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

  // Intent×Emphasis taxonomy (knowledge v0.34.x). The transform-to-hifi feeder
  // and DS-native authoring emit these axes; the legacy Type= tests above gate
  // the back-compat fallback.
  it("Intent=Default, Emphasis=Filled → ds-button--primary", function () {
    var html = render({
      dsSlug: "button",
      variant: "Intent=Default, Emphasis=Filled",
      props: { Label: "Save" },
    });
    assert.ok(html.indexOf("ds-button--primary") !== -1);
  });

  it("Intent=Default, Emphasis=Outlined → ds-button--secondary", function () {
    var html = render({
      dsSlug: "button",
      variant: "Intent=Default, Emphasis=Outlined",
      props: { Label: "Cancel" },
    });
    assert.ok(html.indexOf("ds-button--secondary") !== -1);
  });

  it("Intent=Default, Emphasis=Ghost → ds-button--tertiary", function () {
    var html = render({
      dsSlug: "button",
      variant: "Intent=Default, Emphasis=Ghost",
      props: { Label: "Skip" },
    });
    assert.ok(html.indexOf("ds-button--tertiary") !== -1);
  });

  it("Intent=Critical, Emphasis=Filled → critical (NOT primary)", function () {
    var html = render({
      dsSlug: "button",
      variant: "Intent=Critical, Emphasis=Filled",
      props: { Label: "Delete" },
    });
    assert.ok(html.indexOf("ds-button--critical") !== -1, "has critical");
    assert.ok(
      html.indexOf("ds-button--primary") === -1,
      "does NOT render as primary",
    );
  });

  it("Intent=Critical, Emphasis=Outlined → ds-button--critical-secondary", function () {
    var html = render({
      dsSlug: "button",
      variant: "Intent=Critical, Emphasis=Outlined",
      props: { Label: "Remove" },
    });
    assert.ok(html.indexOf("ds-button--critical-secondary") !== -1);
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
  it("default: emits a <header> with brand, center, actions, and avatar", function () {
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
    assert.ok(html.indexOf("ds-header__center") !== -1, "has center block");
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

  it("global-header renders the real Studio cluster", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: {
        App: "Studio",
        Context: "Catalog",
        ContextValue: "Default",
        Search: true,
        Account: "VO",
      },
    });
    assert.match(html, /ds-header__context/);
    assert.match(html, /ds-header__search/);
    assert.match(html, /ds-header__action--whatsnew/);
    assert.match(html, /ds-header__action--notifications/);
    assert.match(html, /ds-header__action--apps/);
    assert.match(html, /ds-header__avatar/);
    assert.ok(!html.includes("[object Object]"));
    assert.ok(!/ds-header__action--ai/.test(html)); // Figma has no AI trigger
  });

  it("global-header: center section renders context label, value, and search placeholder", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: { Context: "MyDomain", ContextValue: "Staging", Search: true },
    });
    assert.ok(html.indexOf("MyDomain") !== -1, "renders Context label");
    assert.ok(html.indexOf("Staging") !== -1, "renders ContextValue");
    assert.ok(
      html.indexOf("Search items") !== -1,
      "renders search placeholder",
    );
  });

  it("global-header: Search=false omits the search field", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: { Search: false },
    });
    assert.ok(
      html.indexOf("ds-header__search") === -1,
      "no search when Search=false",
    );
  });

  it("global-header: right cluster has What's new text and dividers", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: { Account: "AB" },
    });
    assert.ok(
      html.indexOf("What&#39;s new") !== -1 || html.indexOf("What") !== -1,
      "renders whatsnew text",
    );
    assert.ok(html.indexOf("ds-header__divider") !== -1, "renders dividers");
    assert.ok(html.indexOf(">AB</") !== -1, "renders account initials");
  });

  it("global-header: no AI/sparkle trigger", function () {
    var html = render({
      dsSlug: "global-header",
      variant: "App type=Studio",
      props: {},
    });
    assert.ok(!/ds-header__action--ai/.test(html), "no AI trigger");
    assert.ok(!/sparkle/.test(html), "no sparkle");
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

describe("ds-html-map: page-header (P1b)", function () {
  it("renders title + optional description with bound classes", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: { Title: "Data Catalog", Description: "Browse datasets" },
    });
    assert.match(html, /<header class="ds-page-header">/);
    assert.match(html, /ds-page-header__title">Data Catalog</);
    assert.match(html, /ds-page-header__desc">Browse datasets</);
  });

  it("omits the description element when no Description prop", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: { Title: "Only title" },
    });
    assert.match(html, /ds-page-header__title">Only title</);
    assert.ok(html.indexOf("ds-page-header__desc") === -1);
  });

  it("never throws on empty props (graceful)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: {},
    });
    assert.equal(typeof html, "string");
    assert.match(html, /ds-page-header__title/);
  });
});

describe("ds-html-map: breadcrumbs (P1b)", function () {
  function bc(items) {
    return render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "breadcrumbs",
      props: { Items: items },
    });
  }

  it("renders one crumb per item with N-1 separators", function () {
    var html = bc("Catalog, Datasets, Orders");
    var crumbs = html.match(/ds-breadcrumbs__crumb(?!--)/g) || [];
    var seps = html.match(/ds-breadcrumbs__sep/g) || [];
    assert.equal(crumbs.length, 3);
    assert.equal(seps.length, 2);
  });

  it("marks the last crumb current and uses a rotated chevron separator", function () {
    var html = bc("Catalog, Orders");
    assert.match(
      html,
      /ds-breadcrumbs__crumb ds-breadcrumbs__crumb--current">Orders</,
    );
    assert.match(html, /ds-icon--rot180/); // chevron-left rotated → right-pointing
  });

  it("single crumb has no separator", function () {
    var html = bc("Home");
    assert.ok((html.match(/ds-breadcrumbs__sep/g) || []).length === 0);
  });

  it("never throws on empty props (graceful)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "breadcrumbs",
      props: {},
    });
    assert.equal(typeof html, "string");
    assert.match(html, /ds-breadcrumbs/);
  });

  it("all-empty items → nav with no crumbs or separators", function () {
    var html = bc(",,,");
    assert.match(html, /<nav class="ds-breadcrumbs"/);
    assert.equal((html.match(/ds-breadcrumbs__crumb/g) || []).length, 0);
    assert.equal((html.match(/ds-breadcrumbs__sep/g) || []).length, 0);
  });
});

describe("ds-html-map: tabs (P1b)", function () {
  function tabs(items, active) {
    var props = { Items: items };
    if (active != null) props.Active = active;
    return render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tabs",
      props: props,
    });
  }

  it("renders one tab button per item", function () {
    var html = tabs("Overview, Schema, Lineage");
    assert.equal((html.match(/ds-tabs__tab/g) || []).length, 3);
    assert.match(html, /<div class="ds-tabs" role="tablist">/);
  });

  it("marks the Active item is-active", function () {
    var html = tabs("Overview, Schema", "Schema");
    assert.match(html, /ds-tabs__tab is-active" role="tab">Schema</);
    assert.ok(/ds-tabs__tab" role="tab">Overview</.test(html));
  });

  it("defaults active to the first item", function () {
    var html = tabs("Overview, Schema");
    assert.match(html, /ds-tabs__tab is-active" role="tab">Overview</);
  });

  it("falls back to first tab when Active matches no item", function () {
    var html = tabs("Overview, Schema", "Nonexistent");
    assert.match(html, /ds-tabs__tab is-active" role="tab">Overview</);
    assert.equal((html.match(/is-active/g) || []).length, 1);
  });

  it("never throws on empty props (graceful)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tabs",
      props: {},
    });
    assert.equal(typeof html, "string");
    assert.match(html, /ds-tabs/);
  });

  it("all-empty items → empty tablist, no tabs", function () {
    var html = tabs(",,,");
    assert.match(html, /<div class="ds-tabs" role="tablist">/);
    assert.equal((html.match(/ds-tabs__tab/g) || []).length, 0);
  });
});

describe("ds-html-map: toggle (P1c)", function () {
  function tg(variant, props) {
    return render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "toggle",
      variant: variant,
      props: props || {},
    });
  }

  it("Off (Selected=No): ds-toggle label + switch + thumb, no --on, no is-disabled", function () {
    var html = tg("Toggle location=Left, Selected=No, State=Default", {
      Label: "Email notifications",
    });
    assert.ok(
      html.indexOf('<label class="ds-toggle">') === 0,
      "starts with the bare ds-toggle label",
    );
    assert.ok(html.indexOf("ds-toggle__switch") !== -1, "has the switch track");
    assert.ok(html.indexOf("ds-toggle__thumb") !== -1, "has the thumb");
    assert.ok(html.indexOf("ds-toggle__label") !== -1, "has the label slot");
    assert.ok(html.indexOf("Email notifications") !== -1, "renders the Label");
    assert.ok(html.indexOf("ds-toggle--on") === -1, "not on when Selected=No");
    assert.ok(html.indexOf("is-disabled") === -1, "not disabled by default");
  });

  it("On (Selected=Yes): ds-toggle--on", function () {
    var html = tg("Toggle location=Left, Selected=Yes, State=Default", {
      Label: "On",
    });
    assert.ok(
      html.indexOf("ds-toggle ds-toggle--on") !== -1,
      "has the on modifier when Selected=Yes",
    );
  });

  it("Right (Toggle location=Right): ds-toggle--right", function () {
    var html = tg("Toggle location=Right, Selected=No, State=Default", {
      Label: "Right-aligned",
    });
    assert.ok(
      html.indexOf("ds-toggle--right") !== -1,
      "has the right modifier when Toggle location=Right",
    );
  });

  it("Disabled (State=Disabled): is-disabled", function () {
    var html = tg("Toggle location=Left, Selected=No, State=Disabled", {
      Label: "Off",
    });
    assert.ok(
      html.indexOf("is-disabled") !== -1,
      "has is-disabled when State=Disabled",
    );
  });

  it("renders helper text when Helper text set and Show Helper text not false", function () {
    var html = tg("Toggle location=Left, Selected=Yes", {
      Label: "Auto-sync",
      "Helper text": "Sync every 5 minutes",
    });
    assert.ok(html.indexOf("ds-toggle__helper") !== -1, "has the helper slot");
    assert.ok(
      html.indexOf("Sync every 5 minutes") !== -1,
      "renders the helper copy",
    );
  });

  it("suppresses helper text when Show Helper text is false", function () {
    var html = tg("Toggle location=Left, Selected=Yes", {
      Label: "Auto-sync",
      "Helper text": "Sync every 5 minutes",
      "Show Helper text": false,
    });
    assert.ok(
      html.indexOf("ds-toggle__helper") === -1,
      "no helper slot when Show Helper text=false",
    );
  });

  it("no helper slot when no Helper text prop", function () {
    var html = tg("Toggle location=Left, Selected=No", { Label: "Plain" });
    assert.ok(
      html.indexOf("ds-toggle__helper") === -1,
      "no helper slot without Helper text",
    );
  });

  it("falls back to 'Label' when no Label prop", function () {
    var html = tg("Toggle location=Left, Selected=No", {});
    assert.ok(html.indexOf(">Label</span>") !== -1, "default label");
  });

  it("escapes a hostile Label", function () {
    var html = tg("Toggle location=Left, Selected=No", {
      Label: "<img src=x onerror=1>",
    });
    assert.ok(html.indexOf("&lt;img") !== -1, "label escaped");
    assert.ok(html.indexOf("<img") === -1, "no raw injection");
  });
});

describe("ds-html-map: radio-button (P1c)", function () {
  function rb(variant, props) {
    return render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "radio-button",
      variant: variant,
      props: props || {},
    });
  }

  it("Default unselected: ds-radio label + circle + dot + label, no --checked/--card/is-disabled", function () {
    var html = rb("Format=Default, Selected=No, State=Default", {
      Label: "Standard",
    });
    assert.ok(
      html.indexOf('<label class="ds-radio">') === 0,
      "starts with the bare ds-radio label",
    );
    assert.ok(html.indexOf("ds-radio__circle") !== -1, "has the ring");
    assert.ok(html.indexOf("ds-radio__dot") !== -1, "has the center dot");
    assert.ok(html.indexOf("ds-radio__label") !== -1, "has the label slot");
    assert.ok(html.indexOf("Standard") !== -1, "renders the Label");
    assert.ok(html.indexOf("ds-radio--checked") === -1, "not checked when No");
    assert.ok(html.indexOf("ds-radio--card") === -1, "not card by default");
    assert.ok(html.indexOf("is-disabled") === -1, "not disabled by default");
  });

  it("Selected=Yes: ds-radio--checked", function () {
    var html = rb("Format=Default, Selected=Yes", { Label: "Picked" });
    assert.ok(
      html.indexOf("ds-radio ds-radio--checked") !== -1,
      "has the checked modifier when Selected=Yes",
    );
  });

  it("Card format: ds-radio--card", function () {
    var html = rb("Format=Card format, Selected=No", { Label: "In a card" });
    assert.ok(
      html.indexOf("ds-radio--card") !== -1,
      "has the card modifier when Format=Card format",
    );
  });

  it("Disabled (State=Disabled): is-disabled", function () {
    var html = rb("Format=Default, Selected=No, State=Disabled", {
      Label: "Off",
    });
    assert.ok(
      html.indexOf("is-disabled") !== -1,
      "has is-disabled when State=Disabled",
    );
  });

  it("renders helper text when Helper text set and Show Helper text not false", function () {
    var html = rb("Format=Default, Selected=Yes", {
      Label: "Notify",
      "Helper text": "We'll email you",
    });
    assert.ok(html.indexOf("ds-radio__helper") !== -1, "has the helper slot");
    assert.ok(html.indexOf("We'll email you") !== -1, "renders helper copy");
  });

  it("suppresses helper text when Show Helper text is false", function () {
    var html = rb("Format=Default, Selected=Yes", {
      Label: "Notify",
      "Helper text": "We'll email you",
      "Show Helper text": false,
    });
    assert.ok(
      html.indexOf("ds-radio__helper") === -1,
      "no helper slot when Show Helper text=false",
    );
  });

  it("no helper slot when no Helper text prop", function () {
    var html = rb("Format=Default, Selected=No", { Label: "Plain" });
    assert.ok(
      html.indexOf("ds-radio__helper") === -1,
      "no helper slot without Helper text",
    );
  });

  it("falls back to 'Label' when no Label prop", function () {
    var html = rb("Format=Default, Selected=No", {});
    assert.ok(html.indexOf(">Label</span>") !== -1, "default label");
  });

  it("escapes a hostile Label", function () {
    var html = rb("Format=Default, Selected=No", {
      Label: "<img src=x onerror=1>",
    });
    assert.ok(html.indexOf("&lt;img") !== -1, "label escaped");
    assert.ok(html.indexOf("<img") === -1, "no raw injection");
  });
});

// B11: side-nav resolveActive must be case-insensitive so a lowercase Active
// value still highlights the correct item (aligns with flow-renderer.js:149-154).
describe("ds-html-map: side-nav — B11 case-insensitive Active", function () {
  it("Active 'catalog' (lowercase) matches 'Catalog' item and marks it is-active", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "View=Expanded",
      props: { Items: "Home, Catalog, Pipelines", Active: "catalog" },
    });
    // exactly one is-active mark
    var activeCount = html.split("is-active").length - 1;
    assert.equal(activeCount, 1, "exactly one active row");
    // the Catalog row is active: the is-active class must precede the Catalog label
    var activeIdx = html.indexOf("ds-sidenav__item is-active");
    assert.ok(activeIdx !== -1, "is-active class present");
    var catalogIdx = html.indexOf(">Catalog<");
    assert.ok(
      catalogIdx > activeIdx,
      "Catalog label follows its active row class (is-active at " +
        activeIdx +
        ", Catalog at " +
        catalogIdx +
        ")",
    );
    // Home (first item) must NOT be active: its row class must appear before
    // the is-active marker (the active row is Catalog, not Home)
    var homeLabel = html.indexOf(">Home<");
    assert.ok(
      homeLabel !== -1 && homeLabel < activeIdx,
      "Home row appears before the active (Catalog) row — Home is not active",
    );
  });

  it("Active 'PIPELINES' (uppercase) matches 'Pipelines' item", function () {
    var html = render({
      dsSlug: "side-nav",
      variant: "View=Expanded",
      props: { Items: "Catalog, Pipelines, Settings", Active: "PIPELINES" },
    });
    var activeCount = html.split("is-active").length - 1;
    assert.equal(activeCount, 1, "exactly one active row");
    var activeIdx = html.indexOf("ds-sidenav__item is-active");
    var pipelinesIdx = html.indexOf(">Pipelines<");
    assert.ok(
      pipelinesIdx > activeIdx,
      "Pipelines label follows its active row",
    );
  });
});

// ---------------------------------------------------------------------------
// Task 3: side-nav grouped — real Studio sidebar from Figma anatomy
// ---------------------------------------------------------------------------

describe("ds-html-map: side-nav — Task 3 grouped Studio sidebar", function () {
  it("side-nav renders grouped items with icons, active, collapse", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      props: {
        Groups: JSON.stringify([
          {
            items: [
              { label: "Dashboard", icon: "dashboard" },
              { label: "Catalog", icon: "directory" },
              { label: "Topics", icon: "more" },
            ],
          },
          {
            items: [
              { label: "Access request", icon: "user-single" },
              { label: "Analytics", icon: "dashboard" },
            ],
          },
        ]),
        Active: "Catalog",
      },
    });
    assert.strictEqual(
      (html.match(/ds-sidenav__group/g) || []).length,
      2,
      "two ds-sidenav__group containers",
    );
    assert.match(html, /ds-sidenav__icon/, "items have icon spans");
    assert.match(html, /ds-sidenav__collapse/, "collapse button present");
    assert.match(
      html,
      /ds-sidenav__item[^"]*is-active[\s\S]*?Catalog/,
      "Catalog item is active and label follows",
    );
  });

  it("side-nav legacy comma Items prop still works (back-compat)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      props: { Items: "Catalog, Pipelines", Active: "Catalog" },
    });
    assert.match(html, /is-active/, "active class present in legacy mode");
  });

  it("Groups renders separator between groups and before collapse", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      props: {
        Groups: JSON.stringify([
          { items: [{ label: "Dashboard", icon: "dashboard" }] },
          { items: [{ label: "Access request", icon: "user-single" }] },
        ]),
        Active: "Dashboard",
      },
    });
    assert.match(
      html,
      /ds-sidenav__separator/,
      "at least one separator present",
    );
  });

  it("Groups active defaults to first item across all groups when Active absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      props: {
        Groups: JSON.stringify([
          {
            items: [
              { label: "Dashboard", icon: "dashboard" },
              { label: "Catalog", icon: "directory" },
            ],
          },
        ]),
      },
    });
    var activeIdx = html.indexOf("ds-sidenav__item is-active");
    assert.ok(activeIdx !== -1, "an item is active");
    var dashboardIdx = html.indexOf("Dashboard");
    assert.ok(
      dashboardIdx > activeIdx,
      "Dashboard (first item) is the default active",
    );
  });

  it("Groups collapse button renders chevron-left icon (24px round)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      props: {
        Groups: JSON.stringify([
          { items: [{ label: "Dashboard", icon: "dashboard" }] },
        ]),
        Active: "Dashboard",
      },
    });
    assert.match(html, /ds-sidenav__collapse/, "collapse button present");
    // collapse button should contain the chevron-left icon (SVG)
    var collapseIdx = html.indexOf("ds-sidenav__collapse");
    assert.ok(collapseIdx !== -1, "collapse button exists");
    var svgAfterCollapse = html.indexOf("<svg", collapseIdx);
    assert.ok(svgAfterCollapse !== -1, "collapse contains an SVG icon");
  });

  it("Groups escapes hostile item labels", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      props: {
        Groups: JSON.stringify([
          { items: [{ label: "<script>bad</script>", icon: "dashboard" }] },
        ]),
        Active: "",
      },
    });
    assert.ok(html.indexOf("<script>") === -1, "no raw script tag");
    assert.match(html, /&lt;script&gt;/, "script tag is escaped");
  });
});

// ---------------------------------------------------------------------------
// Task A (audit B8): page-header actions slot
// ---------------------------------------------------------------------------

describe("ds-html-map: page-header — actions slot (B8)", function () {
  it("renders ds-page-header__actions with primary + secondary buttons from mixed Actions array", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: {
        Title: "Users",
        Actions: [{ label: "Add user", variant: "primary" }, "Export"],
      },
    });
    assert.ok(
      html.indexOf("ds-page-header__actions") !== -1,
      "actions container present",
    );
    assert.ok(
      html.indexOf("ds-button--primary") !== -1,
      "first action renders as primary button",
    );
    assert.ok(html.indexOf("Add user") !== -1, "first action label rendered");
    assert.ok(html.indexOf("Export") !== -1, "second action label rendered");
  });

  it("first action defaults to primary, second to secondary when variant omitted", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: {
        Title: "Roles",
        Actions: ["Create role", "Cancel"],
      },
    });
    assert.ok(
      html.indexOf("ds-button--primary") !== -1,
      "first string action → primary",
    );
    assert.ok(
      html.indexOf("ds-button--secondary") !== -1,
      "second string action → secondary",
    );
  });

  it("omits actions container when Actions prop is absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: { Title: "Dashboard" },
    });
    assert.ok(
      html.indexOf("ds-page-header__actions") === -1,
      "no actions container when Actions not set",
    );
  });

  it("omits actions container when Actions is an empty array", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      props: { Title: "Dashboard", Actions: [] },
    });
    assert.ok(
      html.indexOf("ds-page-header__actions") === -1,
      "no actions container for empty array",
    );
  });
});

// ---------------------------------------------------------------------------
// Task B (audit B7): critical-secondary button variant
// ---------------------------------------------------------------------------

describe("ds-html-map: button — critical-secondary (B7)", function () {
  it("Type=Critical secondary → ds-button--critical-secondary (NOT primary)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "button",
      variant: "Type=Critical secondary",
      props: { Label: "Delete" },
    });
    assert.ok(
      html.indexOf("ds-button--critical-secondary") !== -1,
      "has critical-secondary modifier",
    );
    assert.ok(
      html.indexOf("ds-button--primary") === -1,
      "does NOT fall back to primary",
    );
  });
});

// ---------------------------------------------------------------------------
// Task 9: table leaf (DS-native hi-fi program)
// ---------------------------------------------------------------------------

describe("ds-html-map: table (Task 9)", function () {
  it("renders header row + data rows from structured props", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "table",
      props: {
        Columns: "Name, Status, Owner",
        Rows: [
          ["Orders", "Active", "M. Chen"],
          ["Returns", "Draft", "A. Roy"],
        ],
      },
    });
    assert.ok(
      html.indexOf('<table class="ds-table"') !== -1,
      "has ds-table element",
    );
    assert.ok(/<th[^>]*>Name<\/th>/.test(html), "renders Name column header");
    assert.strictEqual(
      (html.match(/<tr class="ds-table__row"/g) || []).length,
      2,
      "renders exactly 2 data rows",
    );
    assert.ok(html.indexOf("M. Chen") !== -1, "renders cell value M. Chen");
  });

  it("renders all column headers from Columns prop", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "table",
      props: {
        Columns: "Name, Status, Owner",
        Rows: [["Orders", "Active", "M. Chen"]],
      },
    });
    assert.ok(/<th[^>]*>Name<\/th>/.test(html), "Name header present");
    assert.ok(/<th[^>]*>Status<\/th>/.test(html), "Status header present");
    assert.ok(/<th[^>]*>Owner<\/th>/.test(html), "Owner header present");
  });

  it("degrades gracefully on string rows", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "table",
      props: { Columns: "Name", Rows: "Orders, Returns" },
    });
    assert.ok(html.indexOf("ds-table") !== -1, "has ds-table class");
  });

  it("uses fallback columns when Columns prop absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "table",
      props: {},
    });
    assert.ok(html.indexOf("ds-table") !== -1, "has ds-table element");
    assert.ok(/<th[^>]*>Name<\/th>/.test(html), "fallback Name column");
  });

  it("renders thead and tbody structure", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "table",
      props: {
        Columns: "A, B",
        Rows: [["1", "2"]],
      },
    });
    assert.ok(html.indexOf("<thead>") !== -1, "has thead");
    assert.ok(html.indexOf("<tbody>") !== -1, "has tbody");
    assert.ok(
      html.indexOf('class="ds-table__head-row"') !== -1,
      "has head-row class",
    );
    assert.ok(html.indexOf('class="ds-table__th"') !== -1, "has th class");
    assert.ok(html.indexOf('class="ds-table__td"') !== -1, "has td class");
  });

  it("escapes XSS in cell values", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "table",
      props: {
        Columns: "<script>",
        Rows: [["<img onerror=x>"]],
      },
    });
    assert.ok(html.indexOf("<script>") === -1, "script tag not injected");
    assert.ok(
      html.indexOf("&lt;script&gt;") !== -1,
      "script tag escaped in header",
    );
    assert.ok(html.indexOf("&lt;img") !== -1, "img tag escaped in cell");
  });
});

// ---------------------------------------------------------------------------
// Task 9b: modal leaf (DS-native hi-fi program)
// ---------------------------------------------------------------------------

describe("ds-html-map: modal (Task 9b)", function () {
  it("renders backdrop + dialog wrapper with correct ARIA", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "modal",
      props: {
        Title: "Confirm deletion",
        Body: "This action cannot be undone.",
        Actions: [{ label: "Delete", variant: "primary" }],
      },
    });
    assert.ok(
      html.indexOf('class="ds-modal-backdrop"') !== -1,
      "has ds-modal-backdrop",
    );
    assert.ok(html.indexOf('class="ds-modal"') !== -1, "has ds-modal element");
    assert.ok(html.indexOf('role="dialog"') !== -1, "has role=dialog");
    assert.ok(html.indexOf('aria-modal="true"') !== -1, "has aria-modal=true");
  });

  it("renders title, body, and footer slots", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "modal",
      props: {
        Title: "Edit record",
        Body: "Make changes below.",
        Actions: [
          { label: "Save", variant: "primary" },
          { label: "Cancel", variant: "secondary" },
        ],
      },
    });
    assert.ok(
      html.indexOf('class="ds-modal__title"') !== -1,
      "has ds-modal__title",
    );
    assert.ok(
      html.indexOf('class="ds-modal__body"') !== -1,
      "has ds-modal__body",
    );
    assert.ok(
      html.indexOf('class="ds-modal__footer"') !== -1,
      "has ds-modal__footer",
    );
    assert.ok(html.indexOf("Edit record") !== -1, "title text present");
    assert.ok(html.indexOf("Make changes below.") !== -1, "body text present");
  });

  it("renders action buttons: first primary, rest secondary", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "modal",
      props: {
        Title: "Confirm",
        Body: "Are you sure?",
        Actions: [
          { label: "Confirm", variant: "primary" },
          { label: "Cancel", variant: "secondary" },
        ],
      },
    });
    assert.ok(
      html.indexOf("ds-button--primary") !== -1,
      "first action is primary",
    );
    assert.ok(
      html.indexOf("ds-button--secondary") !== -1,
      "second action is secondary",
    );
    assert.ok(html.indexOf("Confirm") !== -1, "action label present");
  });

  it("renders with string Actions fallback", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "modal",
      props: { Title: "Alert", Body: "Something happened.", Actions: "OK" },
    });
    assert.ok(html.indexOf('role="dialog"') !== -1, "still a dialog");
    assert.ok(html.indexOf("OK") !== -1, "string action label present");
  });

  it("renders title fallback when Title absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "modal",
      props: { Body: "Body text." },
    });
    assert.ok(html.indexOf('role="dialog"') !== -1, "still a dialog");
    assert.ok(html.indexOf("ds-modal__title") !== -1, "title slot present");
  });

  it("escapes XSS in title and body", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "modal",
      props: {
        Title: "<script>alert(1)</script>",
        Body: "<img onerror=x>",
      },
    });
    assert.ok(html.indexOf("<script>") === -1, "script not injected");
    assert.ok(html.indexOf("&lt;script&gt;") !== -1, "script escaped");
    assert.ok(html.indexOf("&lt;img") !== -1, "img escaped in body");
  });
});

// ---------------------------------------------------------------------------
// Task 9b: empty-state leaf (DS-native hi-fi program)
// ---------------------------------------------------------------------------

describe("ds-html-map: empty-state (Task 9b)", function () {
  it("renders the empty-state container with headline and body", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "empty-state",
      props: {
        Headline: "No results found",
        Body: "Try adjusting your search filters.",
        Cta: "Clear filters",
      },
    });
    assert.ok(
      html.indexOf('class="ds-empty-state"') !== -1,
      "has ds-empty-state container",
    );
    assert.ok(
      html.indexOf("ds-empty-state__headline") !== -1,
      "has headline element",
    );
    assert.ok(html.indexOf("ds-empty-state__body") !== -1, "has body element");
    assert.ok(html.indexOf("No results found") !== -1, "headline text present");
    assert.ok(html.indexOf("Try adjusting") !== -1, "body text present");
  });

  it("renders a primary CTA button when Cta prop is present", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "empty-state",
      props: {
        Headline: "Nothing here",
        Body: "Get started.",
        Cta: "Add item",
      },
    });
    assert.ok(
      html.indexOf("ds-button--primary") !== -1,
      "CTA is a primary button",
    );
    assert.ok(html.indexOf("Add item") !== -1, "CTA label present");
  });

  it("renders no button when Cta prop is absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "empty-state",
      props: { Headline: "Nothing here", Body: "No actions available." },
    });
    assert.ok(
      html.indexOf("<button") === -1,
      "no button rendered when Cta absent",
    );
  });

  it("uses fallback headline when Headline absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "empty-state",
      props: {},
    });
    assert.ok(html.indexOf("ds-empty-state") !== -1, "container present");
  });

  it("escapes XSS in headline and body", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "empty-state",
      props: {
        Headline: "<script>x</script>",
        Body: "<img onerror=x>",
        Cta: "<b>Click</b>",
      },
    });
    assert.ok(html.indexOf("<script>") === -1, "script not injected");
    assert.ok(html.indexOf("<img") === -1, "img tag not injected");
  });
});

// ---------------------------------------------------------------------------
// Task 9b: alert-banner leaf (DS-native hi-fi program)
// Registry variant axis: Type = Primary | Success | Warning | Danger
// (Note: registry uses "Danger" not "Error"; "Primary" maps to info semantics)
// ---------------------------------------------------------------------------

describe("ds-html-map: alert-banner (Task 9b)", function () {
  it("clamps a crafted Type to a safe enum — no class-attribute breakout (XSS)", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: 'Type=Danger"><script>alert(1)</script>',
      props: { Message: "x" },
    });
    assert.ok(
      html.indexOf("<script>") === -1,
      "crafted Type must not inject a <script> tag",
    );
    assert.ok(
      html.indexOf("ds-alert--primary") !== -1,
      "unknown/crafted Type falls back to the primary modifier",
    );
  });

  it("renders Warning banner with correct modifier, icon, and role=status", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: "Type=Warning",
      props: { Message: "Scheduled maintenance window tonight." },
    });
    assert.ok(
      html.indexOf("ds-alert--warning") !== -1,
      "has ds-alert--warning modifier",
    );
    assert.ok(
      html.indexOf("warning-filled") !== -1 || html.indexOf("ds-icon") !== -1,
      "warning-filled icon svg present",
    );
    assert.ok(html.indexOf('role="status"') !== -1, "Warning uses role=status");
    assert.ok(
      html.indexOf("Scheduled maintenance") !== -1,
      "message text present",
    );
  });

  it("renders Danger banner with role=alert", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: "Type=Danger",
      props: { Message: "Critical error occurred." },
    });
    assert.ok(
      html.indexOf("ds-alert--danger") !== -1,
      "has ds-alert--danger modifier",
    );
    assert.ok(html.indexOf('role="alert"') !== -1, "Danger uses role=alert");
    assert.ok(html.indexOf("Critical error") !== -1, "message text present");
  });

  it("renders Success banner with success-filled icon", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: "Type=Success",
      props: { Message: "Data saved successfully." },
    });
    assert.ok(
      html.indexOf("ds-alert--success") !== -1,
      "has ds-alert--success modifier",
    );
    assert.ok(
      html.indexOf("success-filled") !== -1 || html.indexOf("ds-icon") !== -1,
      "success-filled icon present",
    );
    assert.ok(html.indexOf('role="status"') !== -1, "Success uses role=status");
  });

  it("renders Primary (info) banner with info-filled icon", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: "Type=Primary",
      props: { Message: "New features available." },
    });
    assert.ok(
      html.indexOf("ds-alert--primary") !== -1,
      "has ds-alert--primary modifier",
    );
    assert.ok(
      html.indexOf("info-filled") !== -1 || html.indexOf("ds-icon") !== -1,
      "info-filled icon present",
    );
  });

  it("renders optional Title when present", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: "Type=Warning",
      props: { Title: "Heads up", Message: "Maintenance tonight." },
    });
    assert.ok(
      html.indexOf("ds-alert__title") !== -1,
      "title element present when Title prop given",
    );
    assert.ok(html.indexOf("Heads up") !== -1, "title text present");
  });

  it("defaults to role=status when no variant specified", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      props: { Message: "Info message." },
    });
    assert.ok(html.indexOf("ds-alert") !== -1, "ds-alert container present");
    assert.ok(html.indexOf('role="status"') !== -1, "defaults to role=status");
  });

  it("escapes XSS in Message and Title", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "alert-banner",
      variant: "Type=Warning",
      props: {
        Title: "<script>alert(1)</script>",
        Message: "<img onerror=x>",
      },
    });
    assert.ok(html.indexOf("<script>") === -1, "script not injected");
    assert.ok(html.indexOf("<img") === -1, "img not injected");
  });
});

// ---------------------------------------------------------------------------
// Task 11: chat-with-ai-steward leaf (DS-native hi-fi program)
// ---------------------------------------------------------------------------

describe("ds-html-map: chat-with-ai-steward (Task 11)", function () {
  it("steward (answered) renders sparkle header, insight, source, confidence, actions", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: {
        Title: "AI Steward",
        Insight: "Orders joins cleanly to Customers on customer_id.",
        Source: "Sales catalog",
        Confidence: "High",
      },
    });
    assert.ok(html.indexOf("ds-steward") !== -1, "has ds-steward container");
    assert.ok(
      html.indexOf('aria-label="Generated by AI"') !== -1,
      "sparkle has aria-label",
    );
    assert.ok(html.indexOf("Source:") !== -1, "source label present");
    assert.ok(html.indexOf("Sales catalog") !== -1, "source value present");
    assert.ok(html.indexOf("ds-badge") !== -1, "confidence = badge component");
    assert.ok(
      html.indexOf("Accept") !== -1 || html.indexOf("Regenerate") !== -1,
      "action buttons present",
    );
  });

  it("steward (generating) renders shimmer with aria-busy", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      variant: "State=Generating",
      props: {},
    });
    assert.ok(
      html.indexOf("ds-steward__shimmer") !== -1,
      "has shimmer element",
    );
    assert.ok(html.indexOf('aria-busy="true"') !== -1, "aria-busy on region");
  });

  it("renders default Title when absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: { Insight: "Some insight." },
    });
    assert.ok(html.indexOf("ds-steward") !== -1, "still renders steward");
    assert.ok(html.indexOf("ds-steward__title") !== -1, "title slot present");
  });

  it("renders disclaimer footer always", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: {},
    });
    assert.ok(
      html.indexOf("ds-steward__disclaimer") !== -1,
      "disclaimer always present",
    );
    assert.ok(html.indexOf("AI-generated") !== -1, "disclaimer text present");
  });

  it("omits source block when Source prop absent", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: { Title: "AI Steward", Insight: "A finding.", Confidence: "Low" },
    });
    assert.ok(html.indexOf("Source:") === -1, "no source when prop absent");
  });

  it("generating state renders Stop button instead of answer actions", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      variant: "State=Generating",
      props: {},
    });
    assert.ok(html.indexOf("Stop") !== -1, "Stop button in generating state");
    assert.ok(html.indexOf("Accept") === -1, "Accept absent in generating");
    assert.ok(
      html.indexOf("Regenerate") === -1,
      "Regenerate absent in generating",
    );
  });

  it("escapes XSS in Title, Insight, and Source", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: {
        Title: "<script>alert(1)</script>",
        Insight: "<img onerror=x>",
        Source: '<a href="evil">',
      },
    });
    assert.ok(html.indexOf("<script>") === -1, "script not injected in title");
    assert.ok(html.indexOf("&lt;script&gt;") !== -1, "script escaped");
    assert.ok(html.indexOf("<img") === -1, "img not injected in insight");
    assert.ok(html.indexOf("&lt;img") !== -1, "img escaped");
  });

  it("answered state uses aria-live=polite on body region", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: { Insight: "A data insight." },
    });
    assert.ok(
      html.indexOf('aria-live="polite"') !== -1,
      "answered body has aria-live=polite",
    );
  });

  it("uses aside semantic element", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: {},
    });
    assert.ok(html.indexOf("<aside") !== -1, "root element is aside");
  });

  // Task 4 — full Figma anatomy re-model
  it("steward header has New chat + settings + expand + close", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: { Title: "Data Steward", State: "Welcome" },
    });
    assert.match(html, /ds-steward__newchat/);
    assert.match(html, /ds-steward__control--settings/);
    assert.match(html, /ds-steward__control--expand/);
    assert.match(html, /ds-steward__control--close/);
  });

  it("Welcome state shows greeting + task-input footer with context chip + Plan", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      props: {
        Title: "Data Steward",
        State: "Welcome",
        Greeting: "Welcome Vincent!",
        Context: { type: "Dataset", name: "/why_not/table" },
      },
    });
    assert.match(html, /Welcome Vincent!/);
    assert.match(html, /ds-steward__taskinput/);
    assert.match(html, /Give Steward a task/);
    assert.match(html, /ds-steward__context-chip/);
    assert.match(html, /Dataset/);
    assert.match(html, /Plan/);
  });

  it("size=Drawer adds the docked modifier", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "chat-with-ai-steward",
      variant: "size=Drawer",
      props: { Title: "Data Steward", State: "Answered", Insight: "x" },
    });
    assert.match(html, /ds-steward--drawer/);
  });
});

// ---------------------------------------------------------------------------
// Hi-Fi Slice 1 — Task 4: 8 new override leaves (transform targets)
// Each was chip-degrading before; now a full tokens-only leaf.
// ---------------------------------------------------------------------------

describe("ds-html-map: notification (Task 4)", function () {
  it("renders a notification leaf — not a chip — with message + action", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "notification",
      props: {
        Message: "Your export is ready to download.",
        Action: "View",
      },
    });
    assert.ok(
      html.indexOf("ds-notification") !== -1,
      "notification built leaf class",
    );
    assert.ok(html.indexOf("ds-component") === -1, "notification not a chip");
    assert.ok(html.indexOf("Your export is ready") !== -1, "message text");
    assert.ok(
      html.indexOf("ds-button") !== -1 && html.indexOf("View") !== -1,
      "action button reused",
    );
  });

  it("Type=Critical adds the critical modifier and role=alert", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "notification",
      variant: "Type=Critical",
      props: { Message: "Pipeline failed." },
    });
    assert.ok(
      html.indexOf("ds-notification--critical") !== -1,
      "critical modifier",
    );
    assert.ok(html.indexOf('role="alert"') !== -1, "critical uses role=alert");
  });

  it("escapes XSS in Message", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "notification",
      props: { Message: "<script>alert(1)</script>" },
    });
    assert.ok(html.indexOf("<script>") === -1, "script not injected");
  });
});

describe("ds-html-map: stepper (Task 4)", function () {
  it("renders a stepper leaf — not a chip — with number + title/body", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "stepper",
      variant: "State=Active",
      props: { Step: "2", Title: "Configure source", Body: "Pick a dataset" },
    });
    assert.ok(html.indexOf("ds-stepper") !== -1, "stepper built leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "stepper not a chip");
    assert.ok(
      html.indexOf("ds-stepper--active") !== -1,
      "active state modifier",
    );
    assert.ok(html.indexOf("Configure source") !== -1, "title text");
    assert.ok(html.indexOf("Pick a dataset") !== -1, "body text");
  });

  it("State=Complete shows a check instead of the number", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "stepper",
      variant: "State=Complete",
      props: { Step: "1", Title: "Connect" },
    });
    assert.ok(html.indexOf("ds-stepper--complete") !== -1, "complete modifier");
    assert.ok(html.indexOf("ds-icon") !== -1, "complete renders a check glyph");
  });
});

describe("ds-html-map: tooltip (Task 4)", function () {
  it("renders a tooltip bubble — not a chip — with body text", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tooltip",
      props: { Body: "Only admins can edit this field." },
    });
    assert.ok(html.indexOf("ds-tooltip") !== -1, "tooltip built leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "tooltip not a chip");
    assert.ok(html.indexOf("Only admins") !== -1, "body text present");
    assert.ok(html.indexOf('role="tooltip"') !== -1, "has tooltip role");
  });
});

describe("ds-html-map: input-date (Task 4)", function () {
  it("renders a date field — not a chip — label + input + calendar button", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "input-date",
      variant: "Type=Single date,States=Enabled",
      props: { Label: "Start date", Helper: "MM/DD/YYYY" },
    });
    assert.ok(
      html.indexOf("ds-input-date") !== -1,
      "input-date built leaf class",
    );
    assert.ok(html.indexOf("ds-component") === -1, "input-date not a chip");
    assert.ok(html.indexOf("Start date") !== -1, "label text");
    assert.ok(
      html.indexOf("ds-input-date__calendar") !== -1,
      "calendar icon button",
    );
    assert.ok(html.indexOf("MM/DD/YYYY") !== -1, "helper text");
  });

  it("Type=Date range renders a second (end) input", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "input-date",
      variant: "Type=Date range,States=Enabled",
      props: { Label: "Range" },
    });
    assert.ok(html.indexOf("ds-input-date--range") !== -1, "range modifier");
  });

  it("States=Disabled adds the disabled flag", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "input-date",
      variant: "States=Disabled",
      props: { Label: "Start date" },
    });
    assert.ok(html.indexOf("is-disabled") !== -1, "disabled flag");
  });
});

describe("ds-html-map: rich-text (Task 4)", function () {
  it("renders an editor toolbar shell — not a chip — with grouped controls", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "rich-text",
      props: {},
    });
    assert.ok(
      html.indexOf("ds-rich-text") !== -1,
      "rich-text built leaf class",
    );
    assert.ok(html.indexOf("ds-component") === -1, "rich-text not a chip");
    assert.ok(html.indexOf("ds-rich-text__toolbar") !== -1, "toolbar present");
    assert.ok(html.indexOf("ds-icon") !== -1, "toolbar control glyphs");
  });

  it("State=Expanded adds the expanded modifier", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "rich-text",
      variant: "State=Expanded",
      props: {},
    });
    assert.ok(
      html.indexOf("ds-rich-text--expanded") !== -1,
      "expanded modifier",
    );
  });
});

describe("ds-html-map: dropdown-select-default (Task 4)", function () {
  it("renders a labeled select — not a chip — label + field + helper", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "dropdown-select-default",
      variant: "Type=Default,State=Default",
      props: {
        Label: "Connection",
        Description: "Where data lives",
        Helper: "Required",
        Value: "Snowflake",
      },
    });
    assert.ok(
      html.indexOf("ds-dropdown-select") !== -1,
      "dropdown-select built leaf class",
    );
    assert.ok(
      html.indexOf("ds-component") === -1,
      "dropdown-select not a chip",
    );
    assert.ok(html.indexOf("Connection") !== -1, "label text");
    assert.ok(html.indexOf("Snowflake") !== -1, "selected value");
    assert.ok(html.indexOf("Required") !== -1, "helper text");
    assert.ok(html.indexOf("ds-icon") !== -1, "chevron glyph");
  });

  it("State=Disabled adds the disabled flag", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "dropdown-select-default",
      variant: "State=Disabled",
      props: { Label: "Connection" },
    });
    assert.ok(html.indexOf("is-disabled") !== -1, "disabled flag");
  });
});

describe("ds-html-map: progress-bar-small (Task 4)", function () {
  it("renders a progress track + fill — not a chip — with percent label", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "progress-bar-small",
      variant: "Size=Default,Completeness=50%",
      props: {},
    });
    assert.ok(
      html.indexOf("ds-progress") !== -1,
      "progress-bar built leaf class",
    );
    assert.ok(html.indexOf("ds-component") === -1, "progress-bar not a chip");
    assert.ok(html.indexOf("ds-progress__fill") !== -1, "fill element");
    assert.ok(html.indexOf("50%") !== -1, "percent label");
    assert.ok(
      html.indexOf('role="progressbar"') !== -1,
      "has progressbar role",
    );
  });

  it("Size=Large adds the large modifier and reads Percent prop", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "progress-bar-small",
      variant: "Size=Large,Completeness=100%",
      props: { Percent: "100" },
    });
    assert.ok(html.indexOf("ds-progress--large") !== -1, "large modifier");
    assert.ok(html.indexOf("100%") !== -1, "percent label");
  });
});

describe("ds-html-map: tag-interactive (Task 4)", function () {
  it("renders an interactive tag — not a chip — leading icon + name + trailing icon", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tag-interactive",
      props: {
        Label: "Production",
        "Leading icon show": true,
        "Trailing icon show": true,
      },
    });
    assert.ok(
      html.indexOf("ds-tag-interactive") !== -1,
      "tag-interactive built leaf class",
    );
    assert.ok(
      html.indexOf("ds-component") === -1,
      "tag-interactive not a chip",
    );
    assert.ok(html.indexOf("Production") !== -1, "tag name");
    assert.ok(
      html.indexOf("ds-tag-interactive__remove") !== -1,
      "trailing remove control",
    );
  });

  it("State=Selected adds the selected modifier", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tag-interactive",
      variant: "State=Selected",
      props: { Label: "Active" },
    });
    assert.ok(
      html.indexOf("ds-tag-interactive--selected") !== -1,
      "selected modifier",
    );
  });

  it("State=Disabled adds the disabled flag", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tag-interactive",
      variant: "State=Disabled",
      props: { Label: "Archived" },
    });
    assert.ok(html.indexOf("is-disabled") !== -1, "disabled flag");
  });
});

// ---------------------------------------------------------------------------
// Task 3: dispatch override → anatomy → chip
// ---------------------------------------------------------------------------

describe("ds-html-map: dispatch override → anatomy → chip", function () {
  it("non-override slug with embedded anatomy → anatomy html, not chip", function () {
    // Stub window.__dsAnatomyMap with a fixture anatomy for a permanently-non-override slug
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    global.window = {
      __dsAnatomyMap: {
        "anatomy-only-fixture":
          '<div class="ds-anatomy" data-ds-slug="anatomy-only-fixture"></div>',
      },
    };
    var html = render({
      type: "INSTANCE",
      dsSlug: "anatomy-only-fixture",
      props: {},
    });
    global.window = prev;
    assert.ok(
      html.indexOf("ds-anatomy") !== -1,
      "embedded anatomy used for non-override slug",
    );
    assert.ok(
      html.indexOf("ds-component") === -1,
      "no graceful chip when anatomy present",
    );
  });

  it("non-override slug with server-side anatomy map (no window) → anatomy html, not chip", function () {
    // Server-side (Node) rendering has no window; the canonical flow-share
    // deliverable pre-renders in Node, so the map is supplied via setAnatomyMap.
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    delete global.window;
    ds.setAnatomyMap({
      "anatomy-only-fixture":
        '<div class="ds-anatomy" data-ds-slug="anatomy-only-fixture"></div>',
    });
    var html = render({
      type: "INSTANCE",
      dsSlug: "anatomy-only-fixture",
      props: {},
    });
    ds.setAnatomyMap(null);
    if (prev !== undefined) global.window = prev;
    assert.ok(
      html.indexOf("ds-anatomy") !== -1,
      "server-side anatomy map used when no window",
    );
    assert.ok(
      html.indexOf("ds-component") === -1,
      "no chip when server-side anatomy present",
    );
  });

  it("setAnatomyMap(null) resets — non-override slug chips again server-side", function () {
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    delete global.window;
    ds.setAnatomyMap({
      "anatomy-only-fixture":
        '<div class="ds-anatomy" data-ds-slug="anatomy-only-fixture"></div>',
    });
    ds.setAnatomyMap(null);
    var html = render({
      type: "INSTANCE",
      dsSlug: "anatomy-only-fixture",
      props: {},
    });
    if (prev !== undefined) global.window = prev;
    assert.ok(
      html.indexOf("ds-component") !== -1,
      "chip after map reset (no leakage across renders)",
    );
  });

  it("non-override slug, no anatomy → chip fallback", function () {
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    global.window = { __dsAnatomyMap: {} };
    var html = render({
      type: "INSTANCE",
      dsSlug: "totally-unknown-slug",
      props: {},
    });
    global.window = prev;
    assert.ok(
      html.indexOf("ds-component") !== -1,
      "chip fallback when no anatomy",
    );
  });

  it("override slug is NOT intercepted by anatomy map", function () {
    // Even if anatomy map has an entry for a BUILT_SLUG, override wins
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    global.window = {
      __dsAnatomyMap: {
        button: '<div class="ds-anatomy" data-ds-slug="button"></div>',
      },
    };
    var html = render({
      type: "INSTANCE",
      dsSlug: "button",
      variant: "Type=Primary",
      props: { Label: "Save" },
    });
    global.window = prev;
    assert.ok(
      html.indexOf("<button") === 0,
      "override renders real button element",
    );
    assert.ok(html.indexOf("ds-button--primary") !== -1, "has primary class");
    assert.ok(
      html.indexOf("ds-anatomy") === -1,
      "anatomy map NOT used for override slug",
    );
  });

  it("no window → chip fallback (server-side safety)", function () {
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    delete global.window;
    var html = render({
      type: "INSTANCE",
      dsSlug: "anatomy-only-fixture",
      props: {},
    });
    if (prev !== undefined) global.window = prev;
    assert.ok(
      html.indexOf("ds-component") !== -1,
      "chip when no window (no map available)",
    );
  });
});

// ---------------------------------------------------------------------------
// Hi-Fi A1 (narrow) — degraded-slug leaf overrides. Batch 1: overlays.
// ---------------------------------------------------------------------------

describe("ds-html-map: popover (A1)", function () {
  it("renders a popover card — not a chip — with title + body + info icon", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "popover",
      variant: "Type=Interaction guide",
      props: {
        Title: "Quick tip",
        Body: "Do this next",
        "Show info icon": true,
      },
    });
    assert.ok(html.indexOf("ds-popover") !== -1, "popover built leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "popover not a chip");
    assert.ok(html.indexOf("Quick tip") !== -1, "title text");
    assert.ok(html.indexOf("Do this next") !== -1, "body text");
    assert.ok(html.indexOf("ds-icon") !== -1, "info icon glyph shown");
  });

  it("Type=Advanced search adds the modifier; info icon off by default", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "popover",
      variant: "Type=Advanced search",
      props: { Title: "Filters" },
    });
    assert.ok(
      html.indexOf("ds-popover--advanced-search") !== -1,
      "advanced-search modifier",
    );
    assert.ok(
      html.indexOf("ds-popover__info") === -1,
      "no info icon by default",
    );
  });

  it("hostile prop shape does not throw", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "popover",
      props: { Title: { bad: 1 }, Body: [1, 2] },
    });
    assert.ok(typeof html === "string", "returns a string, never throws");
  });
});

describe("ds-html-map: account-dropdown (A1)", function () {
  it("renders an account menu — not a chip — with identity + default items", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "account-dropdown",
      props: { Name: "Ada Lovelace", Email: "ada@example.com" },
    });
    assert.ok(
      html.indexOf("ds-account-menu") !== -1,
      "account-menu leaf class",
    );
    assert.ok(html.indexOf("ds-component") === -1, "account-menu not a chip");
    assert.ok(html.indexOf("Ada Lovelace") !== -1, "name text");
    assert.ok(html.indexOf("ada@example.com") !== -1, "email text");
    assert.ok(html.indexOf("Sign out") !== -1, "default sign-out item");
    assert.ok(html.indexOf('role="menu"') !== -1, "menu semantics");
  });

  it("accepts a custom Items list", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "account-dropdown",
      props: { Items: "Profile, Preferences, Log out" },
    });
    assert.ok(html.indexOf("Preferences") !== -1, "custom item rendered");
  });
});

describe("ds-html-map: app-switcher-dropdown (A1)", function () {
  it("renders an app switcher menu — not a chip — with apps + settings", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "app-switcher-dropdown",
      props: { Items: "Data Studio, Catalog" },
    });
    assert.ok(
      html.indexOf("ds-app-switcher") !== -1,
      "app-switcher leaf class",
    );
    assert.ok(html.indexOf("ds-component") === -1, "app-switcher not a chip");
    assert.ok(html.indexOf("Data Studio") !== -1, "app item text");
    assert.ok(html.indexOf("Settings") !== -1, "settings row");
    assert.ok(html.indexOf('role="menu"') !== -1, "menu semantics");
  });

  it("falls back to a default app list when no Items given", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "app-switcher-dropdown",
      props: {},
    });
    assert.ok(
      html.indexOf("ds-app-switcher__app") !== -1,
      "default apps rendered",
    );
    assert.ok(html.indexOf("Data Studio") !== -1, "default app label");
    assert.ok(html.indexOf("Settings") !== -1, "settings row present");
  });
});

// ---------------------------------------------------------------------------
// Hi-Fi A1 (narrow) — degraded-slug leaf overrides. Batch 2: controls.
// ---------------------------------------------------------------------------

describe("ds-html-map: segmented-control (A1)", function () {
  it("renders a segmented control — not a chip — with items + active", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "segmented-control",
      props: { Items: "List, Grid, Board", Active: "Grid" },
    });
    assert.ok(html.indexOf("ds-segmented") !== -1, "segmented leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "segmented not a chip");
    assert.ok(html.indexOf("List") !== -1, "item 1");
    assert.ok(html.indexOf("Board") !== -1, "item 3");
    assert.ok(html.indexOf('role="tablist"') !== -1, "tablist semantics");
    assert.ok(
      /Grid<\/span>/.test(html) && html.indexOf("is-active") !== -1,
      "active item flagged",
    );
  });

  it("defaults to two options with the first active", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "segmented-control",
      props: {},
    });
    assert.ok(html.indexOf("is-active") !== -1, "an item is active by default");
    assert.ok(html.indexOf('aria-selected="true"') !== -1, "aria-selected set");
  });
});

describe("ds-html-map: toolbar (A1)", function () {
  it("renders a toolbar — not a chip — with action buttons + view scale", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "toolbar",
      variant: "Type=Combined,Orientation=Horizontal",
      props: { "Show View scale": true },
    });
    assert.ok(html.indexOf("ds-toolbar") !== -1, "toolbar leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "toolbar not a chip");
    assert.ok(html.indexOf('role="toolbar"') !== -1, "toolbar semantics");
    assert.ok(html.indexOf("ds-toolbar__scale") !== -1, "view scale shown");
    assert.ok(html.indexOf("ds-icon") !== -1, "action icons present");
  });

  it("Orientation=Vertical adds the modifier; no scale by default", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "toolbar",
      variant: "Orientation=Vertical",
      props: {},
    });
    assert.ok(html.indexOf("ds-toolbar--vertical") !== -1, "vertical modifier");
    assert.ok(html.indexOf("ds-toolbar__scale") === -1, "no scale by default");
  });
});

describe("ds-html-map: sticky-footer (A1)", function () {
  it("renders a sticky footer — not a chip — with DS action buttons", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "sticky-footer",
      props: { Primary: "Publish", Secondary: "Discard" },
    });
    assert.ok(html.indexOf("ds-sticky-footer") !== -1, "sticky-footer class");
    assert.ok(html.indexOf("ds-component") === -1, "sticky-footer not a chip");
    assert.ok(html.indexOf("Publish") !== -1, "primary action label");
    assert.ok(html.indexOf("Discard") !== -1, "secondary action label");
    assert.ok(
      html.indexOf("ds-button--primary") !== -1,
      "reuses the DS button primary class",
    );
  });

  it("defaults to Cancel + Save", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "sticky-footer",
      props: {},
    });
    assert.ok(html.indexOf("Save") !== -1, "default primary");
    assert.ok(html.indexOf("Cancel") !== -1, "default secondary");
  });
});

// ---------------------------------------------------------------------------
// Hi-Fi A1 (narrow) — degraded-slug leaf overrides. Batch 3: feedback + date.
// ---------------------------------------------------------------------------

describe("ds-html-map: loader (A1)", function () {
  it("renders a spinner — not a chip — with status role + optional label", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "loader",
      props: { Label: "Fetching results" },
    });
    assert.ok(html.indexOf("ds-loader") !== -1, "loader leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "loader not a chip");
    assert.ok(html.indexOf("ds-loader__spinner") !== -1, "spinner element");
    assert.ok(html.indexOf('role="status"') !== -1, "status role");
    assert.ok(html.indexOf("Fetching results") !== -1, "label text");
  });

  it("renders without a label and never throws", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "loader",
      props: {},
    });
    assert.ok(html.indexOf("ds-loader__spinner") !== -1, "spinner still shown");
    assert.ok(typeof html === "string", "returns a string");
  });
});

describe("ds-html-map: calendar (A1)", function () {
  it("renders a month grid — not a chip — with header, weekdays, selected day", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "calendar",
      variant: "Selection=Single",
      props: {},
    });
    assert.ok(html.indexOf("ds-calendar") !== -1, "calendar leaf class");
    assert.ok(html.indexOf("ds-component") === -1, "calendar not a chip");
    assert.ok(html.indexOf("ds-calendar__month") !== -1, "month header");
    assert.ok(html.indexOf("ds-calendar__weekdays") !== -1, "weekday row");
    assert.ok(html.indexOf("is-selected") !== -1, "a selected day");
    assert.ok(html.indexOf(">15</button>") !== -1, "renders day cells");
    assert.ok(html.indexOf("ds-icon") !== -1, "nav chevrons");
    assert.ok(
      html.indexOf('aria-pressed="true"') !== -1,
      "selected day carries non-visual selection state",
    );
    assert.ok(
      html.indexOf('role="grid"') === -1,
      "no invalid role=grid (lacks row/gridcell descendants)",
    );
  });

  it("Selection=Range renders a start→end band", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "calendar",
      variant: "Selection=Range",
      props: {},
    });
    assert.ok(html.indexOf("is-range-start") !== -1, "range start");
    assert.ok(html.indexOf("is-range-end") !== -1, "range end");
    assert.ok(html.indexOf("is-selected") === -1, "no single-select in range");
  });

  it("uses a provided Month label deterministically", function () {
    var html = render({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "calendar",
      props: { Month: "March 2027" },
    });
    assert.ok(html.indexOf("March 2027") !== -1, "custom month label");
  });
});
