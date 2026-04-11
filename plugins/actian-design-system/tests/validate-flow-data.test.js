#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var validate = require(path.join(PLUGIN_ROOT, "scripts", "validate-flow-data.js"));

describe("validate-flow-data", function () {
  describe("findBannedText", function () {
    it("detects banned text in props.Label", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [{
          name: "Screen 1: Test",
          content: [{
            type: "INSTANCE",
            ref: "fmButton",
            props: { Label: "Button label" }
          }]
        }]
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0, "should find banned text");
      assert.ok(issues[0].value === "Button label");
      assert.strictEqual(issues[0].severity, "P0");
    });

    it("detects banned text in TEXT node content", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [{
          name: "Screen 1: Test",
          content: [{
            type: "TEXT",
            content: "Page Title"
          }]
        }]
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0);
      assert.ok(issues[0].value === "Page Title");
    });

    it("detects banned text in pageHeader.title", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [{
          name: "Screen 1: Test",
          pageHeader: { title: "Page Title" },
          content: []
        }]
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0);
    });

    it("detects banned text nested in children", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [{
          name: "Screen 1: Test",
          content: [{
            type: "FRAME",
            children: [{
              type: "TEXT",
              content: "Description text"
            }]
          }]
        }]
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0);
      assert.ok(issues[0].value === "Description text");
    });

    it("returns empty array for clean data", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [{
          name: "Screen 1: Dashboard",
          content: [{
            type: "INSTANCE",
            ref: "fmButton",
            props: { Label: "Create data product" }
          }]
        }]
      };
      var issues = validate.findBannedText(data);
      assert.strictEqual(issues.length, 0);
    });
  });
});
