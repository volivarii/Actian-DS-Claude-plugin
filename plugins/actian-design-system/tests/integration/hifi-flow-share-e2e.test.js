"use strict";
/**
 * hifi-flow-share-e2e.test.js — END-TO-END (offline) test for the hi-fi DS
 * render tier wired through the canonical flow-share deliverable.
 *
 * Proves that `assembleFlowShare(data)` renders DS-flagged INSTANCE nodes
 * (library:"ds") via the DS interpreter (ds-html-map.js) — emitting hi-fi
 * `.ds-*` markup, NOT the lo-fi FM chip — AND that the matching leaf styles
 * (ds-base.css) are inlined into the self-contained file, AND that the
 * deliverable stays fully offline (no external resource loads).
 *
 * It also keeps a negative control: a lo-fi FM node (ref:"fmButton", no
 * `library`) still renders `fm-button`, proving the DS wiring did not break
 * the FM tier.
 *
 * Render path under test (server-side, in Node):
 *   assembleFlowShare → flow-renderer.renderScreen → render-node.renderNode
 *     → (INSTANCE library:"ds") ds-html-map.renderDSComponent
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");

// ---------------------------------------------------------------------------
// Hi-fi flow-data fixture: one screen whose content[] holds DS-flagged
// INSTANCE nodes (button + input + checkbox), plus a negative-control screen
// with a lo-fi FM button (no `library`).
// ---------------------------------------------------------------------------
var HIFI_FLOW = {
  meta: {
    feature: "Hi-fi DS E2E",
    app: "Studio",
    pluginVersion: "0.0.0-test",
  },
  screens: [
    {
      name: "Screen 1: DS components",
      template: "studio",
      content: [
        {
          type: "INSTANCE",
          library: "ds",
          dsSlug: "button",
          variant: "Type=Primary, Size=Default",
          props: { Label: "Save" },
          name: "Save button",
        },
        {
          type: "INSTANCE",
          library: "ds",
          dsSlug: "text-input",
          variant: "States=Default",
          props: { Label: "Workspace name", "Placeholder text": "Untitled" },
          name: "Name field",
        },
        {
          type: "INSTANCE",
          library: "ds",
          dsSlug: "checkbox-with-label",
          variant: "Selected=Yes, State=Default",
          props: { Label: "Remember me" },
          name: "Remember checkbox",
        },
      ],
    },
    // Negative control: a lo-fi FM button (no `library`) must still render
    // through the FM tier, proving the DS wiring is additive, not a takeover.
    {
      name: "Screen 2: lo-fi control",
      template: "studio",
      content: [
        {
          type: "INSTANCE",
          ref: "fmButton",
          variant: "Type=Primary, Size=md",
          props: { Label: "Cancel" },
          name: "Cancel button",
        },
      ],
    },
  ],
};

describe("assembleFlowShare — hi-fi DS tier end-to-end (offline)", function () {
  var html; // compute once, share across assertions
  it("assembles without throwing", function () {
    html = assembleFlowShare(HIFI_FLOW);
    assert.ok(
      typeof html === "string" && html.length > 0,
      "returns non-empty string",
    );
  });

  // --- Hi-fi MARKUP: the DS seam rendered the node, not an fm-component chip.
  it("renders hi-fi DS button markup (class=ds-button), not an FM chip", function () {
    assert.ok(
      html.indexOf('class="ds-button') !== -1,
      'expected hi-fi "ds-button" markup from the DS interpreter',
    );
    assert.ok(
      html.indexOf("ds-button--primary") !== -1,
      "expected the primary button modifier class",
    );
    assert.ok(html.indexOf("Save") !== -1, "expected the button label");
    // The DS button must NOT degrade to the graceful DS chip.
    assert.ok(
      html.indexOf('class="ds-component"') === -1,
      "DS button should render full markup, not the graceful chip",
    );
  });

  it("renders hi-fi DS input + checkbox markup", function () {
    assert.ok(
      html.indexOf('class="ds-field"') !== -1 ||
        html.indexOf("ds-field") !== -1,
      "expected hi-fi ds-field input markup",
    );
    assert.ok(
      html.indexOf("ds-checkbox") !== -1,
      "expected hi-fi ds-checkbox markup",
    );
    assert.ok(
      html.indexOf("ds-checkbox--checked") !== -1,
      "expected checked-state modifier (Selected=Yes)",
    );
  });

  // --- ds-base.css INLINED. Discriminating assertions that would FAIL if
  // ds-base.css were dropped from FLOW_CSS:
  //  - the file-header comment is unique to ds-base.css and can never appear in
  //    rendered markup or any other inlined CSS (ironclad "file was inlined").
  //  - dot-prefixed `.ds-*` selectors appear ONLY in ds-base.css — the markup
  //    carries them space/quote-prefixed (`class="ds-button ds-button--primary"`),
  //    so a leading-dot match cannot be satisfied by markup or by fm-base.css.
  //  - a `var(--zen-*)` property value can only come from CSS, never from markup.
  it("inlines ds-base.css content (CSS-only markers, not markup)", function () {
    assert.ok(
      html.indexOf("ds-base.css — hi-fi DS leaf styles") !== -1,
      "expected the ds-base.css file-header comment inlined in <style>",
    );
    assert.ok(
      html.indexOf(".ds-button--primary") !== -1,
      "expected the .ds-button--primary RULE (dot-prefixed) from ds-base.css",
    );
    assert.ok(
      html.indexOf("var(--zen-color-bg-emphasis)") !== -1,
      "expected ds-base.css's .ds-button--primary background token value (CSS-only)",
    );
  });

  // --- OFFLINE contract: no external resource loads, no meta-refresh.
  it("is fully offline (no external http resources, no meta refresh)", function () {
    assert.ok(
      html.indexOf('http-equiv="refresh"') === -1,
      "deliverable must not auto-refresh",
    );
    assert.ok(
      html.indexOf('src="http') === -1,
      'no external script/img src="http..."',
    );
    assert.ok(
      html.indexOf('href="http') === -1,
      'no external stylesheet/font href="http..."',
    );
    assert.ok(
      html.indexOf("@import url(http") === -1,
      "no CSS @import of a remote URL",
    );
  });

  // --- Embedded fonts: Roboto (DS) + Inter (FM) faces ship inline as data
  // URIs, so the offline contract holds AND DS leaves render in the real
  // --zen-font-family-text face instead of silently falling back (audit B4).
  it("embeds Roboto + Inter woff2 faces as data URIs (no network fonts)", function () {
    assert.ok(
      /@font-face[^}]*font-family:\s*"Roboto"/.test(html),
      "expected an embedded Roboto @font-face",
    );
    assert.ok(
      /@font-face[^}]*font-family:\s*"Inter"/.test(html),
      "expected an embedded Inter @font-face",
    );
    assert.ok(
      html.indexOf("src: url(data:font/woff2;base64,") !== -1,
      "faces must be base64 data URIs, not network URLs",
    );
    assert.ok(
      !/fonts\.(googleapis|gstatic)\.com/.test(html),
      "no Google Fonts network references",
    );
  });

  // --- NEGATIVE CONTROL: the FM tier still renders.
  it("still renders the lo-fi FM button (fm-button) — DS wiring is additive", function () {
    assert.ok(
      html.indexOf("fm-button") !== -1,
      "expected the FM button to still render as fm-button (FM tier intact)",
    );
    assert.ok(html.indexOf("Cancel") !== -1, "expected the FM button label");
  });
});
