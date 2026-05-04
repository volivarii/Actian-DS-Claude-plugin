"use strict";

// Transforms Figma REST /styles + batched /nodes payloads into the same
// {textStyles, effectStyles} shape produced by /sync-design-system Phase 3
// (sync-phases.md). Pure function — orchestrator handles fetching.
//
// Input:
//   {
//     stylesPayload: { meta: { styles: [REST style entry, …] } },
//     nodes:         { <node_id>: <NodePayload>, … }   // batched /v1/files/:key/nodes
//   }
//
// Output:
//   { textStyles: [...], effectStyles: [...] }
//
// FILL and GRID style types are intentionally ignored — Phase 3 historically
// only extracts text + effect styles.

function transformEffectNode(meta, node) {
  var doc = (node && node.document) || {};
  var effects = Array.isArray(doc.effects) ? doc.effects : [];
  return {
    name: meta.name,
    key: meta.key,
    effects: effects.map(function (e) {
      return {
        type: e.type,
        color: e.color,
        offset: e.offset,
        radius: e.radius,
        // REST omits spread when 0; current registry expects an explicit value.
        spread: e.spread !== undefined ? e.spread : 0,
        visible: e.visible !== false, // default to true if undefined
      };
    }),
  };
}

function transformTextNode(meta, node) {
  var doc = (node && node.document) || {};
  var s = doc.style || {};
  return {
    name: meta.name,
    key: meta.key,
    fontFamily: s.fontFamily,
    fontStyle: s.fontStyle,
    fontSize: s.fontSize,
    lineHeight: {
      unit: s.lineHeightUnit || "PIXELS",
      value:
        s.lineHeightUnit === "PERCENT"
          ? s.lineHeightPercent || 0
          : s.lineHeightPx !== undefined
            ? s.lineHeightPx
            : 0,
    },
    letterSpacing: {
      unit: "PIXELS",
      value: s.letterSpacing !== undefined ? s.letterSpacing : 0,
    },
    textDecoration: s.textDecoration || "NONE",
    textCase: s.textCase || "ORIGINAL",
  };
}

function transformStyles(input) {
  var stylesList =
    (input &&
      input.stylesPayload &&
      input.stylesPayload.meta &&
      input.stylesPayload.meta.styles) ||
    [];
  var nodes = (input && input.nodes) || {};

  var textStyles = [];
  var effectStyles = [];

  stylesList.forEach(function (meta) {
    var node = nodes[meta.node_id];
    if (!node) return; // skip if node payload missing

    if (meta.style_type === "EFFECT") {
      effectStyles.push(transformEffectNode(meta, node));
    } else if (meta.style_type === "TEXT") {
      textStyles.push(transformTextNode(meta, node));
    }
    // FILL / GRID intentionally ignored
  });

  return { textStyles: textStyles, effectStyles: effectStyles };
}

module.exports = transformStyles;
