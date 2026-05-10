#!/usr/bin/env node
"use strict";

/**
 * transform-to-hifi.test.js — Snapshot tests for the FM-to-DS transform script.
 *
 * Validates the behaviour of the transform core: variant parsing/serialization,
 * instance rewriting, recursive tree walking, property mapping, and top-level
 * meta enrichment.
 *
 * Test groups:
 *   Part 1: parseVariant  — string → object
 *   Part 2: serializeVariant — object → string
 *   Part 3: transform (button) — FM button → DS button with variant mapping + Shape drop
 *   Part 4: transform (unmapped) — explicitly unmappable refs produce unmapped flag
 *   Part 5: transform (nested) — FRAME children are transformed recursively
 *   Part 6: transform (passthrough) — TEXT / DIVIDER nodes pass through unchanged
 *   Part 7: transform (propertyMap) — FM property names rewritten via propertyMap
 *   Part 8: transform (meta) — result always has meta.mode === "hifi"
 *
 * Run with: node --test plugins/actian-design-system/tests/transform-to-hifi.test.js
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

// ---------------------------------------------------------------------------
// Load the module under test + supporting data
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var t = require(
  path.join(PLUGIN_ROOT, "scripts", "transformers", "transform-to-hifi"),
);
var mapData = require(
  path.join(PLUGIN_ROOT, "vendor", "fm-to-ds-map", "fm-to-ds-map.json"),
);
var dsRegistry = require(
  path.join(PLUGIN_ROOT, "vendor", "components", "registries", "dskit.json"),
);

// Shorthand helpers for single-instance transforms
function xformInstance(node) {
  return t.transformInstance(node, mapData, dsRegistry);
}

function xformNodes(nodes) {
  return t.transformNodes(nodes, mapData, dsRegistry);
}

// ---------------------------------------------------------------------------
// Part 1: parseVariant
// ---------------------------------------------------------------------------

describe("Transform-to-Hifi Tests", function () {
  describe("Part 1: parseVariant", function () {
    it("parses a standard variant string into an object", function () {
      var result = t.parseVariant("Type=Primary, Size=md");
      assert.deepStrictEqual(result, { Type: "Primary", Size: "md" });
    });

    it("handles extra whitespace around delimiters", function () {
      var result = t.parseVariant("Type = Primary ,  Size = md ");
      assert.deepStrictEqual(result, { Type: "Primary", Size: "md" });
    });

    it("handles a single axis=value pair", function () {
      var result = t.parseVariant("State=Default");
      assert.deepStrictEqual(result, { State: "Default" });
    });

    it("returns empty object for empty string", function () {
      var result = t.parseVariant("");
      assert.deepStrictEqual(result, {});
    });

    it("returns empty object for null", function () {
      var result = t.parseVariant(null);
      assert.deepStrictEqual(result, {});
    });

    it("returns empty object for undefined", function () {
      var result = t.parseVariant(undefined);
      assert.deepStrictEqual(result, {});
    });

    it("parses a four-axis variant string", function () {
      var result = t.parseVariant(
        "Type=Primary, Size=md, Shape=Regular, State=Default",
      );
      assert.deepStrictEqual(result, {
        Type: "Primary",
        Size: "md",
        Shape: "Regular",
        State: "Default",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Part 2: serializeVariant
  // ---------------------------------------------------------------------------

  describe("Part 2: serializeVariant", function () {
    it("serializes an object to a sorted key=value string", function () {
      var result = t.serializeVariant({
        Size: "Default",
        Type: "Primary",
        State: "Default",
      });
      // Keys sorted alphabetically: Size, State, Type
      assert.strictEqual(result, "Size=Default, State=Default, Type=Primary");
    });

    it("serializes a single-key object", function () {
      var result = t.serializeVariant({ States: "Default" });
      assert.strictEqual(result, "States=Default");
    });

    it("returns empty string for empty object", function () {
      var result = t.serializeVariant({});
      assert.strictEqual(result, "");
    });

    it("returns empty string for null", function () {
      var result = t.serializeVariant(null);
      assert.strictEqual(result, "");
    });

    it("round-trips through parse then serialize (sorted)", function () {
      var original = "Type=Primary, Size=md";
      var obj = t.parseVariant(original);
      var serialized = t.serializeVariant(obj);
      // Serialized form is sorted so Size comes before Type
      assert.strictEqual(serialized, "Size=md, Type=Primary");
    });
  });

  // ---------------------------------------------------------------------------
  // Part 3: transform (button)
  // ---------------------------------------------------------------------------

  describe("Part 3: transform (button)", function () {
    var buttonNode = {
      type: "INSTANCE",
      ref: "fmButton",
      variant: "Type=Primary, Size=md, Shape=Regular, State=Default",
      props: { Label: "Click me" },
    };

    var result;
    // Run once and reuse
    it("returns a transformed DS button instance", function () {
      result = xformInstance(buttonNode);
      assert.strictEqual(result.type, "INSTANCE");
      assert.strictEqual(result.ref, "dsButton");
      assert.strictEqual(result.library, "ds");
      assert.strictEqual(result.dsSlug, "button");
    });

    it("maps FM Type=Primary to DS Type=Primary", function () {
      var out = xformInstance(buttonNode);
      var parsed = t.parseVariant(out.variant);
      assert.strictEqual(parsed.Type, "Primary");
    });

    it("maps FM Size=md to DS Size=Default", function () {
      var out = xformInstance(buttonNode);
      var parsed = t.parseVariant(out.variant);
      assert.strictEqual(parsed.Size, "Default");
    });

    it("maps FM State=Default to DS State=Default", function () {
      var out = xformInstance(buttonNode);
      var parsed = t.parseVariant(out.variant);
      assert.strictEqual(parsed.State, "Default");
    });

    it("drops the Shape axis (not present in DS button variants)", function () {
      var out = xformInstance(buttonNode);
      var parsed = t.parseVariant(out.variant);
      assert.strictEqual(parsed.Shape, undefined);
    });

    it("does not set unmapped flag", function () {
      var out = xformInstance(buttonNode);
      assert.strictEqual(out.unmapped, undefined);
    });

    it("passes through Label prop unchanged", function () {
      var out = xformInstance(buttonNode);
      assert.strictEqual(out.props.Label, "Click me");
    });
  });

  // ---------------------------------------------------------------------------
  // Part 4: transform (unmapped)
  // ---------------------------------------------------------------------------

  describe("Part 4: transform (unmapped)", function () {
    var stickyNote = {
      type: "INSTANCE",
      ref: "fmStickyNote",
      variant: "Color=Yellow",
      props: { text: "review me" },
    };

    it("sets unmapped: true for an explicitly unmappable ref", function () {
      var out = xformInstance(stickyNote);
      assert.strictEqual(out.unmapped, true);
    });

    it("preserves originalRef on unmapped node", function () {
      var out = xformInstance(stickyNote);
      assert.strictEqual(out.originalRef, "fmStickyNote");
    });

    it("sets a non-empty unmappedReason string", function () {
      var out = xformInstance(stickyNote);
      assert.ok(
        typeof out.unmappedReason === "string" && out.unmappedReason.length > 0,
        "unmappedReason should be a non-empty string",
      );
    });

    it("preserves original ref field unchanged on unmapped node", function () {
      var out = xformInstance(stickyNote);
      // The node's ref should still be the FM ref (not rewritten to DS)
      assert.strictEqual(out.ref, "fmStickyNote");
    });

    it("also sets unmapped: true for a completely unknown FM ref", function () {
      var unknownNode = {
        type: "INSTANCE",
        ref: "fmUnknownWidget",
        variant: "Type=X",
        props: {},
      };
      var out = xformInstance(unknownNode);
      assert.strictEqual(out.unmapped, true);
      assert.strictEqual(out.originalRef, "fmUnknownWidget");
    });

    it("sets unmapped: true when mapping.dsKey does not resolve in dskit.json", function () {
      // Synthetic mapData with a single mapping whose dsKey is bogus —
      // exercises the post-resolution fallback branch in transformInstance
      // where slugFromKey or dsRegistry.components[slug] yields nothing.
      var fmRef = "fmGhostComponent";
      var syntheticMapData = {
        mappings: {
          fmGhostComponent: {
            dsKey: "BOGUS-KEY-DOES-NOT-EXIST",
            defaultVariant: {},
            variantMap: {},
            dropVariants: [],
          },
        },
        unmappable: {},
      };
      var node = {
        type: "INSTANCE",
        ref: fmRef,
        variant: "",
        props: {},
      };
      var out = t.transformInstance(
        node,
        syntheticMapData,
        dsRegistry,
        "default",
      );
      assert.strictEqual(out.unmapped, true);
      assert.strictEqual(out.originalRef, fmRef);
      assert.ok(
        typeof out.unmappedReason === "string" &&
          out.unmappedReason.indexOf(
            "does not resolve in dskit.json registry",
          ) !== -1,
        "unmappedReason should mention 'does not resolve in dskit.json registry'",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Part 5: transform (nested)
  // ---------------------------------------------------------------------------

  describe("Part 5: transform (nested)", function () {
    var frame = {
      type: "FRAME",
      name: "Login Form",
      children: [
        {
          type: "INSTANCE",
          ref: "fmTextInput",
          variant: "Type=Empty",
          props: { "Show label": "Email" },
        },
        {
          type: "INSTANCE",
          ref: "fmCheckbox",
          variant: "State=Off, Style=Default",
          props: {},
        },
      ],
    };

    var result;
    it("returns an array with one FRAME node", function () {
      result = xformNodes([frame]);
      assert.ok(Array.isArray(result), "result should be an array");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].type, "FRAME");
    });

    it("preserves the FRAME's name", function () {
      var out = xformNodes([frame]);
      assert.strictEqual(out[0].name, "Login Form");
    });

    it("transforms fmTextInput child to dsInput", function () {
      var out = xformNodes([frame]);
      var textInput = out[0].children[0];
      assert.strictEqual(textInput.ref, "dsInput");
      assert.strictEqual(textInput.dsSlug, "input");
    });

    it("transforms fmCheckbox child to dsCheckboxWithLabel", function () {
      var out = xformNodes([frame]);
      var checkbox = out[0].children[1];
      assert.strictEqual(checkbox.ref, "dsCheckboxWithLabel");
      assert.strictEqual(checkbox.dsSlug, "checkbox-with-label");
    });

    it("maps fmTextInput Show label prop to DS Label prop", function () {
      var out = xformNodes([frame]);
      var textInput = out[0].children[0];
      assert.strictEqual(textInput.props.Label, "Email");
    });

    it("does not mutate the original frame object", function () {
      var original = JSON.stringify(frame);
      xformNodes([frame]);
      assert.strictEqual(JSON.stringify(frame), original);
    });
  });

  // ---------------------------------------------------------------------------
  // Part 6: transform (passthrough)
  // ---------------------------------------------------------------------------

  describe("Part 6: transform (passthrough)", function () {
    it("passes TEXT nodes through unchanged", function () {
      var textNode = { type: "TEXT", text: "Hello World" };
      var out = xformNodes([textNode]);
      assert.strictEqual(out.length, 1);
      assert.deepStrictEqual(out[0], textNode);
    });

    it("passes DIVIDER nodes through unchanged", function () {
      var divider = { type: "DIVIDER", orientation: "horizontal" };
      var out = xformNodes([divider]);
      assert.strictEqual(out.length, 1);
      assert.deepStrictEqual(out[0], divider);
    });

    it("handles an empty nodes array", function () {
      var out = xformNodes([]);
      assert.deepStrictEqual(out, []);
    });

    it("handles a mixed array: TEXT + INSTANCE", function () {
      var nodes = [
        { type: "TEXT", text: "Label" },
        {
          type: "INSTANCE",
          ref: "fmButton",
          variant: "Type=Primary, Size=md",
          props: { Label: "Go" },
        },
      ];
      var out = xformNodes(nodes);
      assert.strictEqual(out.length, 2);
      assert.strictEqual(out[0].type, "TEXT");
      assert.strictEqual(out[0].text, "Label");
      assert.strictEqual(out[1].ref, "dsButton");
    });
  });

  // ---------------------------------------------------------------------------
  // Part 7: transform (propertyMap)
  // ---------------------------------------------------------------------------

  describe("Part 7: transform (propertyMap)", function () {
    it("renames FM '\ud83d\udc41 Leading Icon' to DS 'Leading icon show'", function () {
      var buttonNode = {
        type: "INSTANCE",
        ref: "fmButton",
        variant: "Type=Primary, Size=md",
        props: { "\ud83d\udc41 Leading Icon": true },
      };
      var out = xformInstance(buttonNode);
      assert.strictEqual(out.props["Leading icon show"], true);
      assert.strictEqual(out.props["\ud83d\udc41 Leading Icon"], undefined);
    });

    it("renames FM '\ud83d\udc41 Trailing Icon' to DS 'Trailing icon show'", function () {
      var buttonNode = {
        type: "INSTANCE",
        ref: "fmButton",
        variant: "Type=Primary, Size=md",
        props: { "\ud83d\udc41 Trailing Icon": false },
      };
      var out = xformInstance(buttonNode);
      assert.strictEqual(out.props["Trailing icon show"], false);
      assert.strictEqual(out.props["\ud83d\udc41 Trailing Icon"], undefined);
    });

    it("passes through properties with no mapping entry unchanged", function () {
      var buttonNode = {
        type: "INSTANCE",
        ref: "fmButton",
        variant: "Type=Primary, Size=md",
        props: { Label: "Submit", someCustomProp: "value" },
      };
      var out = xformInstance(buttonNode);
      assert.strictEqual(out.props.Label, "Submit");
      assert.strictEqual(out.props.someCustomProp, "value");
    });
  });

  // ---------------------------------------------------------------------------
  // Part 8: transform (meta)
  // ---------------------------------------------------------------------------

  describe("Part 8: transform (meta)", function () {
    var flowData = {
      meta: { version: "1.0", author: "Vincent" },
      screens: [
        {
          id: "screen-1",
          content: [
            { type: "TEXT", text: "Hello" },
            {
              type: "INSTANCE",
              ref: "fmButton",
              variant: "Type=Primary, Size=md",
              props: { Label: "Submit" },
            },
          ],
        },
      ],
    };

    it("result has meta.mode === 'hifi'", function () {
      var out = t.transform(flowData, {
        mapData: mapData,
        dsRegistry: dsRegistry,
      });
      assert.strictEqual(out.meta.mode, "hifi");
    });

    it("result has meta.transformedAt as an ISO date string", function () {
      var out = t.transform(flowData, {
        mapData: mapData,
        dsRegistry: dsRegistry,
      });
      assert.ok(
        typeof out.meta.transformedAt === "string" &&
          out.meta.transformedAt.length > 0,
        "meta.transformedAt should be a non-empty string",
      );
      // Should parse as a valid date
      var d = new Date(out.meta.transformedAt);
      assert.ok(
        !isNaN(d.getTime()),
        "meta.transformedAt should be a valid ISO date",
      );
    });

    it("preserves original meta fields alongside new ones", function () {
      var out = t.transform(flowData, {
        mapData: mapData,
        dsRegistry: dsRegistry,
      });
      assert.strictEqual(out.meta.version, "1.0");
      assert.strictEqual(out.meta.author, "Vincent");
    });

    it("result has meta.transformStats with total, mapped, unmapped counts", function () {
      var out = t.transform(flowData, {
        mapData: mapData,
        dsRegistry: dsRegistry,
      });
      var stats = out.meta.transformStats;
      assert.ok(stats !== undefined, "meta.transformStats should be present");
      assert.strictEqual(typeof stats.total, "number");
      assert.strictEqual(typeof stats.mapped, "number");
      assert.strictEqual(typeof stats.unmapped, "number");
    });

    it("counts 1 mapped instance (the button) in transformStats", function () {
      var out = t.transform(flowData, {
        mapData: mapData,
        dsRegistry: dsRegistry,
      });
      assert.strictEqual(out.meta.transformStats.total, 1);
      assert.strictEqual(out.meta.transformStats.mapped, 1);
      assert.strictEqual(out.meta.transformStats.unmapped, 0);
    });

    it("result has a screens array matching the input screen count", function () {
      var out = t.transform(flowData, {
        mapData: mapData,
        dsRegistry: dsRegistry,
      });
      assert.ok(Array.isArray(out.screens), "screens should be an array");
      assert.strictEqual(out.screens.length, 1);
    });

    it("does not mutate the original flowData", function () {
      var original = JSON.stringify(flowData);
      t.transform(flowData, { mapData: mapData, dsRegistry: dsRegistry });
      assert.strictEqual(JSON.stringify(flowData), original);
    });
  });

  describe("intent threading", function () {
    var mapData = {
      mappings: {
        fmButton: {
          dsKey: "5a6d10d26bef3cc83955bf32a318c6b4682f25d3",
          dsSlug: "button",
          defaultVariant: { Type: "Primary", Size: "Large", State: "Idle" },
          variantMap: {
            Type: { Primary: "Primary", Destructive: "Critical primary" },
            Size: { md: "Large", sm: "Small" },
            State: { Default: "Idle" },
          },
          intentVariants: {
            "destructive-action": { Type: "Critical primary" },
            default: null,
          },
        },
      },
    };
    var dsRegistry = {
      components: {
        button: {
          variants: {
            Type: ["Primary", "Critical primary", "Critical secondary"],
            Size: ["Large", "Small"],
            State: ["Idle"],
          },
        },
      },
    };

    it("FRAME intent inherits to child INSTANCE, applies intentVariants", function () {
      var result = t.transformNodes(
        [
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                variant: "Type=Primary, Size=md, State=Default",
                props: { Label: "Delete" },
              },
            ],
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      var inst = result[0].children[0];
      assert.strictEqual(inst.dsSlug, "button");
      assert.ok(
        inst.variant.indexOf("Type=Critical primary") !== -1,
        "got: " + inst.variant,
      );
    });

    it("leaf intent overrides ancestor intent", function () {
      var result = t.transformNodes(
        [
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                intent: "default",
                variant: "Type=Primary, Size=md, State=Default",
                props: { Label: "OK" },
              },
            ],
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      var inst = result[0].children[0];
      assert.ok(
        inst.variant.indexOf("Type=Primary") !== -1,
        "got: " + inst.variant,
      );
    });

    it("axis not in intentVariants falls through to variantMap", function () {
      var result = t.transformNodes(
        [
          {
            type: "INSTANCE",
            ref: "fmButton",
            intent: "destructive-action",
            variant: "Type=Primary, Size=sm, State=Default",
            props: {},
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      var inst = result[0];
      assert.ok(inst.variant.indexOf("Type=Critical primary") !== -1);
      assert.ok(
        inst.variant.indexOf("Size=Small") !== -1,
        "got: " + inst.variant,
      );
    });

    it("default intent does not override (intentVariants entry is null)", function () {
      var result = t.transformNodes(
        [
          {
            type: "INSTANCE",
            ref: "fmButton",
            intent: "default",
            variant: "Type=Primary, Size=md, State=Default",
            props: {},
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      var inst = result[0];
      assert.ok(inst.variant.indexOf("Type=Primary") !== -1);
    });

    it("INSTANCE intent dropped from hifi output", function () {
      var result = t.transformNodes(
        [
          {
            type: "INSTANCE",
            ref: "fmButton",
            intent: "destructive-action",
            variant: "Type=Primary, Size=md, State=Default",
            props: {},
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      assert.strictEqual(
        result[0].intent,
        undefined,
        "intent should be dropped from INSTANCE output",
      );
    });

    it("FRAME intent preserved in hifi output", function () {
      var result = t.transformNodes(
        [
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [],
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      assert.strictEqual(
        result[0].intent,
        "destructive-action",
        "FRAME intent should be preserved",
      );
    });

    it("missing intent / no intentVariants does nothing", function () {
      var result = t.transformNodes(
        [
          {
            type: "INSTANCE",
            ref: "fmButton",
            variant: "Type=Primary, Size=md, State=Default",
            props: {},
          },
        ],
        mapData,
        dsRegistry,
        null,
      );
      assert.ok(result[0].variant.indexOf("Type=Primary") !== -1);
    });
  });
});
