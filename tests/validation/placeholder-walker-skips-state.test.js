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
            {
              type: "TEXT",
              content: "Page Title",
              color: "var(--fm-text-primary)",
            },
          ],
        },
      ],
    });
    assert.match(r.out, /P0 \[placeholder-text\]/);
  });
  it("navItems[].label reading Nav Item is still a leak (label is user-visible copy)", function () {
    var r = validate({
      meta: { feature: "T", app: "Studio" },
      screens: [
        {
          name: "S1",
          template: "studio",
          navItems: [{ label: "Nav Item", state: "on" }],
          content: [
            { type: "TEXT", content: "Hello", color: "var(--fm-text-primary)" },
          ],
        },
      ],
    });
    assert.match(r.out, /P0 \[placeholder-text\].*navItems\[0\]\.label/);
  });
  it("adds[].composedFrom naming the button leaf is not a leak (Task 6.6)", function () {
    // composedFrom lists real DS slugs (catalog-quality Slice 1's adds[]
    // schema) — the same identifier vocabulary as ref/dsSlug, not
    // user-visible copy. "button" alone matches PLACEHOLDER_PATTERNS'
    // /^Button$/i (the FM component's own leaked default), so this fixture
    // is the exact collision task-6.6's Data Steward panel adds[] entry hit.
    var r = validate({
      meta: { feature: "T", app: "Studio" },
      screens: [
        {
          id: "s1",
          name: "S1",
          template: "studio",
          adds: [
            {
              name: "Data Steward panel",
              composedFrom: [
                "drawer",
                "text-area",
                "toggle",
                "button",
                "read-only-tag",
              ],
              why: "no component holds a conversation with an agent",
            },
          ],
          content: [
            {
              type: "FRAME",
              name: "Panel",
              adds: "Data Steward panel",
              children: [
                {
                  type: "TEXT",
                  content: "Hello",
                  color: "var(--fm-text-primary)",
                },
              ],
            },
          ],
        },
      ],
    });
    assert.doesNotMatch(r.out, /placeholder-text.*composedFrom/);
  });
  it("adds[].name reading bare 'Button' is still a leak (name is authored prose, not a slug list)", function () {
    var r = validate({
      meta: { feature: "T", app: "Studio" },
      screens: [
        {
          id: "s1",
          name: "S1",
          template: "studio",
          adds: [
            {
              name: "Button",
              composedFrom: ["button"],
              why: "test only, 30+ chars long",
            },
          ],
          content: [
            { type: "TEXT", content: "Hello", color: "var(--fm-text-primary)" },
          ],
        },
      ],
    });
    assert.match(r.out, /P0 \[placeholder-text\].*adds\[0\]\.name/);
  });
});
