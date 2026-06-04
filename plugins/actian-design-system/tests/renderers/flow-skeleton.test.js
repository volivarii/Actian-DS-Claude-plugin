"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var flow = require("../../scripts/renderers/html-renderers/flow-renderer.js");

describe("flow-renderer skeleton (status:pending)", function () {
  it("renders a shimmer skeleton with a name caption for a pending screen", function () {
    var html = flow.screen({
      name: "Catalog",
      template: "studio",
      status: "pending",
    });
    assert.match(html, /screen--pending/, "frame carries pending modifier");
    assert.match(
      html,
      /fm-skeleton__block--title/,
      "shimmer title block present",
    );
    assert.match(
      html,
      /fm-skeleton__caption">Catalog</,
      "screen name caption present",
    );
    assert.doesNotMatch(
      html,
      /Page Title|Button label|Description text/,
      "no banned placeholder text",
    );
  });

  it("keeps chrome silhouette for a pending screen on a chrome template", function () {
    var html = flow.screen({
      name: "Catalog",
      template: "studio",
      status: "pending",
    });
    assert.match(html, /fm-app-header/, "app header chrome present");
    assert.match(html, /fm-sidebar/, "sidebar chrome present");
  });

  it("BACK-COMPAT: a screen with no status renders with no skeleton markup", function () {
    var ready = flow.screen({
      name: "Catalog",
      template: "studio",
      content: [{ type: "TEXT", content: "Hello", size: 16 }],
    });
    assert.doesNotMatch(ready, /fm-skeleton/, "no skeleton markup");
    assert.doesNotMatch(ready, /screen--pending/, "no pending modifier");
    assert.match(ready, /Hello/, "real content still rendered");
  });

  it("pending bare template: skeleton + pending modifier, no chrome", function () {
    var html = flow.screen({
      name: "Mobile",
      template: "bare",
      status: "pending",
    });
    assert.match(
      html,
      /screen--bare screen--pending/,
      "bare frame carries pending modifier",
    );
    assert.match(html, /fm-skeleton/, "skeleton present");
    assert.doesNotMatch(html, /fm-app-header/, "no chrome on bare");
  });

  it("BACK-COMPAT: a non-pending status (ready) does not trigger skeleton", function () {
    var html = flow.screen({
      name: "X",
      template: "studio",
      status: "ready",
      content: [{ type: "TEXT", content: "Hi", size: 16 }],
    });
    assert.doesNotMatch(
      html,
      /fm-skeleton/,
      "non-pending status renders no skeleton",
    );
    assert.match(html, /Hi/, "real content rendered");
  });
});
