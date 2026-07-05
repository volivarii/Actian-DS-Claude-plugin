"use strict";

// ds-token-bindings.test.js — P1b binding-conformance gate (new 3 chrome leaves).
// Makes K1's domains.tokens load-bearing for page-header / breadcrumbs / tabs:
//   (a) every binding token resolves to a real --zen-* var in tokens.css
//   (b) every binding token is used (var(--zen-<token>)) in that component's
//       ds-base.css section — EXCEPT variant-alternative bindings in KNOWN_UNUSED.
// Direction is binding->CSS only (reverse not enforced — structural/raw-px vars
// legitimately exist without bindings).

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var PATHS = require("../../scripts/lib/paths.js");

var CSS = fs.readFileSync(
  path.join(__dirname, "../../scripts/renderers/html-renderers/ds-base.css"),
  "utf8",
);

// slug -> the component's root CSS selector (anchors the section lookup).
var ROOT_CLASS = {
  "page-header": ".ds-page-header",
  breadcrumbs: ".ds-breadcrumbs",
  tabs: ".ds-tabs",
};

// Bindings that describe variant alternatives the Default leaf does not render.
// Exempt from the "used" check (b) ONLY — never from "resolves" (a).
var KNOWN_UNUSED = {
  tabs: new Set(["font-weight-medium"]), // we render the body-standard inactive weight
};

// Rename transition (knowledge #341): text-link-* retired, text-primary now
// means interactive text, text-default is body text. Until the vendored
// guideline docs refresh past that change, their bindings may still name a
// pre-rename token while the CSS already uses the successor. A binding is
// "used" if any listed name appears. Delete this map once the vendored
// knowledge snapshot is newer than v0.34.71 and the suite is green without it.
var RENAME_ACCEPT = {
  "color-text-link-default": ["color-text-link-default", "color-text-primary"],
  "color-text-primary": ["color-text-primary", "color-text-default"],
};

// Every --zen-* var DEFINED in tokens.css (the "resolves" universe).
function definedZenVars() {
  var css = fs.readFileSync(PATHS.tokens.css, "utf8");
  var set = new Set();
  var re = /(--zen-[a-z0-9-]+)\s*:/g;
  var m;
  while ((m = re.exec(css))) set.add(m[1]);
  return set;
}

// The CSS text from the section-divider comment preceding rootClass to the next
// divider (or EOF). Dividers look like `/* ==== Name ==== */`.
function sectionFor(rootClass) {
  var marker = /\/\*\s*=+[^*]*=+\s*\*\//g;
  var idxs = [];
  var m;
  while ((m = marker.exec(CSS))) idxs.push(m.index);
  idxs.push(CSS.length);
  var at = CSS.indexOf(rootClass + " {");
  assert.ok(at !== -1, "root selector not found in ds-base.css: " + rootClass);
  var start = 0;
  var end = CSS.length;
  for (var i = 0; i < idxs.length; i++) {
    if (idxs[i] <= at) start = idxs[i];
    if (idxs[i] > at) {
      end = idxs[i];
      break;
    }
  }
  return CSS.slice(start, end);
}

var DEFINED = definedZenVars();

Object.keys(ROOT_CLASS).forEach(function (slug) {
  describe("domains.tokens binding conformance: " + slug, function () {
    var docPath = PATHS.components.guidelineDoc.byKey(slug);
    var doc = JSON.parse(fs.readFileSync(docPath, "utf8"));
    var tokensDomain = (doc.domains && doc.domains.tokens) || {};
    var bindings = tokensDomain.bindings || [];
    var section = sectionFor(ROOT_CLASS[slug]);
    var allow = KNOWN_UNUSED[slug] || new Set();

    it("has approved token bindings", function () {
      assert.equal(tokensDomain.status, "approved");
      assert.ok(bindings.length > 0, "no bindings for " + slug);
    });

    bindings.forEach(function (b) {
      it("binding '" + b.token + "' resolves to a real token", function () {
        assert.ok(
          DEFINED.has("--zen-" + b.token),
          "binding token --zen-" + b.token + " not defined in tokens.css",
        );
      });

      if (!allow.has(b.token)) {
        it(
          "binding '" + b.token + "' is used in the " + slug + " CSS",
          function () {
            // Whitespace-tolerant: the repo's format-on-save (Prettier) can wrap a
            // long declaration inside `var( ... )`, so match `var(<ws>--zen-token<ws>)`
            // rather than the exact single-line substring.
            var accepted = RENAME_ACCEPT[b.token] || [b.token];
            var used = accepted.some(function (name) {
              return new RegExp("var\\(\\s*--zen-" + name + "\\s*\\)").test(
                section,
              );
            });
            assert.ok(
              used,
              "binding token --zen-" +
                b.token +
                " (" +
                b.context +
                ") not used in the " +
                slug +
                " ds-base.css section",
            );
          },
        );
      }
    });
  });
});
