#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var resolver = require(
  path.resolve(__dirname, "..", "scripts", "intent-resolver.js"),
);

describe("intent-resolver", function () {
  describe("resolveEffectiveIntent", function () {
    it("returns nodeIntent when set", function () {
      assert.strictEqual(
        resolver.resolveEffectiveIntent("destructive-action", null),
        "destructive-action",
      );
    });

    it("returns ancestorIntent when nodeIntent is undefined", function () {
      assert.strictEqual(
        resolver.resolveEffectiveIntent(undefined, "success-confirmation"),
        "success-confirmation",
      );
    });

    it("returns 'default' when both are absent", function () {
      assert.strictEqual(
        resolver.resolveEffectiveIntent(undefined, null),
        "default",
      );
      assert.strictEqual(
        resolver.resolveEffectiveIntent(null, null),
        "default",
      );
    });

    it("nodeIntent overrides ancestorIntent", function () {
      assert.strictEqual(
        resolver.resolveEffectiveIntent("error-state", "destructive-action"),
        "error-state",
      );
    });

    it("treats empty string as absent", function () {
      assert.strictEqual(
        resolver.resolveEffectiveIntent("", "destructive-action"),
        "destructive-action",
      );
    });
  });

  describe("walkWithIntent", function () {
    it("calls callback with node + 'default' when no intent anywhere", function () {
      var calls = [];
      resolver.walkWithIntent(
        { type: "FRAME", children: [{ type: "TEXT", content: "hi" }] },
        function (node, effective, p) {
          calls.push({ type: node.type, effective: effective, path: p });
        },
      );
      assert.strictEqual(calls.length, 2);
      assert.strictEqual(calls[0].effective, "default");
      assert.strictEqual(calls[1].effective, "default");
    });

    it("inherits cluster intent to descendants", function () {
      var calls = [];
      resolver.walkWithIntent(
        {
          type: "FRAME",
          intent: "destructive-action",
          children: [
            { type: "INSTANCE", ref: "fmButton" },
            { type: "INSTANCE", ref: "fmButton" },
          ],
        },
        function (node, effective) {
          calls.push({ type: node.type, effective: effective });
        },
      );
      assert.strictEqual(calls.length, 3);
      assert.strictEqual(calls[0].effective, "destructive-action");
      assert.strictEqual(calls[1].effective, "destructive-action");
      assert.strictEqual(calls[2].effective, "destructive-action");
    });

    it("leaf intent overrides ancestor", function () {
      var calls = [];
      resolver.walkWithIntent(
        {
          type: "FRAME",
          intent: "destructive-action",
          children: [
            { type: "INSTANCE", ref: "fmButton" },
            {
              type: "INSTANCE",
              ref: "fmButton",
              intent: "success-confirmation",
            },
          ],
        },
        function (node, effective) {
          calls.push({ ref: node.ref, effective: effective });
        },
      );
      var leaves = calls.filter(function (c) {
        return c.ref;
      });
      assert.strictEqual(leaves[0].effective, "destructive-action");
      assert.strictEqual(leaves[1].effective, "success-confirmation");
    });

    it("siblings do not affect each other", function () {
      var calls = [];
      resolver.walkWithIntent(
        {
          type: "FRAME",
          children: [
            { type: "FRAME", intent: "destructive-action", children: [] },
            { type: "INSTANCE", ref: "fmButton" },
          ],
        },
        function (node, effective) {
          calls.push({ type: node.type, ref: node.ref, effective: effective });
        },
      );
      var instance = calls.find(function (c) {
        return c.ref;
      });
      assert.strictEqual(instance.effective, "default");
    });

    it("walks arrays at root", function () {
      var calls = [];
      resolver.walkWithIntent(
        [
          { type: "TEXT", content: "a" },
          { type: "TEXT", content: "b" },
        ],
        function (node) {
          calls.push(node.content);
        },
      );
      assert.deepStrictEqual(calls, ["a", "b"]);
    });

    it("emits paths for downstream debugging", function () {
      var calls = [];
      resolver.walkWithIntent(
        {
          type: "FRAME",
          children: [{ type: "INSTANCE", ref: "fmButton" }],
        },
        function (node, effective, p) {
          calls.push({ type: node.type, path: p });
        },
        null,
        "screens[0].content",
      );
      assert.strictEqual(calls[0].path, "screens[0].content");
      assert.strictEqual(calls[1].path, "screens[0].content.children[0]");
    });

    it("handles null and primitive nodes gracefully", function () {
      var calls = [];
      resolver.walkWithIntent(null, function (n) {
        calls.push(n);
      });
      resolver.walkWithIntent("string", function (n) {
        calls.push(n);
      });
      resolver.walkWithIntent(42, function (n) {
        calls.push(n);
      });
      resolver.walkWithIntent(undefined, function (n) {
        calls.push(n);
      });
      assert.strictEqual(calls.length, 0);
    });

    it("recurses into arrays in children", function () {
      var calls = [];
      resolver.walkWithIntent(
        {
          type: "FRAME",
          children: [
            {
              type: "FRAME",
              intent: "destructive-action",
              children: [{ type: "INSTANCE", ref: "fmButton" }],
            },
          ],
        },
        function (node, effective) {
          if (node.ref) calls.push({ ref: node.ref, effective: effective });
        },
      );
      assert.strictEqual(calls[0].effective, "destructive-action");
    });
  });
});
