#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var { validate } = require("../helpers/validate-cli.js");

describe("placeholder-text walker", function () {
  it("navItems[].state = Placeholder is the schema's shape, not a leak", function () {
    var r = validate({
      meta: { feature: "T", app: "Studio" },
      screens: [
        {
          name: "S1",
          template: "studio",
          navItems: [
            { label: "Catalog", state: "on" },
            { label: "Topics", state: "Placeholder" },
          ],
          content: [
            { type: "TEXT", content: "Hello", color: "var(--fm-text-primary)" },
          ],
        },
      ],
    });
    assert.doesNotMatch(r.out, /placeholder-text.*navItems/);
  });
  it("a TEXT node reading Page Title is still a leak (the check can fail)", function () {
    var r = validate({
      meta: { feature: "T", app: "Studio" },
      screens: [
        {
          name: "S1",
          template: "studio",
          content: [
            { type: "TEXT", content: "Page Title", color: "var(--fm-text-primary)" },
          ],
        },
      ],
    });
    assert.match(r.out, /P0 \[placeholder-text\]/);
  });
});
