#!/usr/bin/env node
"use strict";

/**
 * figma-codegen.js — Code-generation library for Figma Plugin API JavaScript.
 *
 * Generates Figma Plugin API JavaScript code STRINGS from structured node data.
 * This is a build-time code generator — it outputs code text that is later passed
 * to Figma's use_figma MCP tool. It does NOT run inside Figma.
 *
 * Usage:
 *   const cg = require('./figma-codegen');
 *   cg.resetCounter();
 *   const code = cg.generateCallCode(spec);
 *   // pass code to use_figma MCP tool
 */

// ---------------------------------------------------------------------------
// Variable counter
// ---------------------------------------------------------------------------

let _counter = 0;

/** Reset the variable name counter. Call before each generateCallCode(). */
function resetCounter() {
  _counter = 0;
}

/** Return next unique variable name, e.g. 'c0', 'c1', ... */
function nextVar(prefix) {
  prefix = prefix || "c";
  return prefix + _counter++;
}

// ---------------------------------------------------------------------------
// String escape helpers
// ---------------------------------------------------------------------------

/** Escape a value for embedding in single-quoted JS string literals. */
function esc(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Emit a JS literal for a value (string → single-quoted, other → JSON). */
function lit(val) {
  if (typeof val === "string") return "'" + esc(val) + "'";
  return JSON.stringify(val);
}

// ---------------------------------------------------------------------------
// Helper generators — return complete function source strings
// ---------------------------------------------------------------------------

/**
 * Returns JS source for a hexToRgb(hex) function.
 * Converts "#RRGGBB" to {r,g,b} in 0–1 range.
 */
function generateHexToRgb() {
  return [
    "function hexToRgb(hex) {",
    "  var h = hex.replace('#', '');",
    "  return {",
    "    r: parseInt(h.substring(0, 2), 16) / 255,",
    "    g: parseInt(h.substring(2, 4), 16) / 255,",
    "    b: parseInt(h.substring(4, 6), 16) / 255",
    "  };",
    "}",
  ].join("\n");
}

/**
 * Returns JS source for an angleToTransform(angleDeg) function.
 * Converts gradient angle (degrees) to Figma 2x3 transform matrix.
 */
function generateAngleToTransform() {
  return [
    "function angleToTransform(angleDeg) {",
    "  var rad = (angleDeg * Math.PI) / 180;",
    "  var cos = Math.cos(rad);",
    "  var sin = Math.sin(rad);",
    "  return [",
    "    [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],",
    "    [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos]",
    "  ];",
    "}",
  ].join("\n");
}

/**
 * Returns JS source for a setProp(instance, name, value) function.
 * Matches component property by name prefix before '#'.
 */
function generateSetProp() {
  return [
    "function setProp(instance, prefix, value) {",
    "  var props = instance.componentProperties;",
    "  for (var key in props) {",
    "    var propName = key.split('#')[0];",
    "    if (propName === prefix) {",
    "      instance.setProperties({ [key]: value });",
    "      return;",
    "    }",
    "  }",
    "}",
  ].join("\n");
}

/**
 * Returns JS source for _fillH(node) and _fillV(node) helpers.
 * These replace the inline IIFEs that were duplicated per sizing call.
 */
function generateFillHelpers() {
  return [
    "function _fillH(n) {",
    "  var p = n.parent; if (!p) return;",
    "  if (p.layoutMode && p.layoutMode !== 'NONE') { n.layoutSizingHorizontal = 'FILL'; }",
    "  else { n.resize(Math.max((p.width||0)-(p.paddingLeft||0)-(p.paddingRight||0),1), n.height); }",
    "}",
    "function _fillV(n) {",
    "  var p = n.parent; if (!p) return;",
    "  if (p.layoutMode && p.layoutMode !== 'NONE') { n.layoutSizingVertical = 'FILL'; }",
    "  else { n.resize(n.width, Math.max((p.height||0)-(p.paddingTop||0)-(p.paddingBottom||0),1)); }",
    "}",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Property code generators
// ---------------------------------------------------------------------------

/**
 * Generate fills code for a node variable.
 * fills: array of hex strings or gradient objects. Empty array = transparent.
 */
function genFills(varName, fills) {
  if (fills == null) return "";
  const lines = [];

  if (Array.isArray(fills) && fills.length === 0) {
    lines.push(varName + ".fills = [];");
    return lines.join("\n");
  }

  const arr = Array.isArray(fills) ? fills : [fills];
  const parts = arr.map((f) => {
    if (typeof f === "string") {
      return "{ type: 'SOLID', color: hexToRgb('" + esc(f) + "') }";
    }
    // Gradient object
    const typeMap = {
      LINEAR: "GRADIENT_LINEAR",
      RADIAL: "GRADIENT_RADIAL",
      ANGULAR: "GRADIENT_ANGULAR",
      DIAMOND: "GRADIENT_DIAMOND",
    };
    const figmaType = typeMap[f.type];
    if (figmaType) {
      const stops = (f.stops || []).map((s) => {
        return (
          "{ position: " +
          s.position +
          ", color: { r: hexToRgb('" +
          esc(s.color) +
          "').r, g: hexToRgb('" +
          esc(s.color) +
          "').g, b: hexToRgb('" +
          esc(s.color) +
          "').b, a: " +
          (s.opacity != null ? s.opacity : 1) +
          " } }"
        );
      });
      const transform =
        f.angle != null
          ? "angleToTransform(" + f.angle + ")"
          : "[[1, 0, 0], [0, 1, 0]]";
      return (
        "{ type: '" +
        figmaType +
        "', gradientStops: [" +
        stops.join(", ") +
        "], gradientTransform: " +
        transform +
        " }"
      );
    }
    // Pass-through
    return JSON.stringify(f);
  });

  lines.push(varName + ".fills = [" + parts.join(", ") + "];");
  return lines.join("\n");
}

/**
 * Generate auto-layout code for a frame variable.
 * layout: { mode, spacing, counterAxisSpacing, wrap, padding: [t,r,b,l],
 *            primaryAxisAlign, counterAxisAlign }
 * Always sets primaryAxisSizingMode and counterAxisSizingMode to 'AUTO'.
 */
function genLayout(varName, layout) {
  if (!layout) return "";
  const lines = [];

  if (layout.mode && layout.mode !== "NONE") {
    lines.push(varName + ".layoutMode = '" + esc(layout.mode) + "';");
  }
  if (layout.spacing != null) {
    lines.push(varName + ".itemSpacing = " + layout.spacing + ";");
  }
  if (layout.counterAxisSpacing != null) {
    lines.push(
      varName + ".counterAxisSpacing = " + layout.counterAxisSpacing + ";",
    );
  }
  if (layout.wrap) {
    lines.push(varName + ".layoutWrap = 'WRAP';");
  }
  if (Array.isArray(layout.padding)) {
    lines.push(varName + ".paddingTop = " + layout.padding[0] + ";");
    lines.push(varName + ".paddingRight = " + layout.padding[1] + ";");
    lines.push(varName + ".paddingBottom = " + layout.padding[2] + ";");
    lines.push(varName + ".paddingLeft = " + layout.padding[3] + ";");
  }
  if (layout.primaryAxisAlign) {
    lines.push(
      varName +
        ".primaryAxisAlignItems = '" +
        esc(layout.primaryAxisAlign) +
        "';",
    );
  }
  if (layout.counterAxisAlign) {
    lines.push(
      varName +
        ".counterAxisAlignItems = '" +
        esc(layout.counterAxisAlign) +
        "';",
    );
  }
  // Always set sizing modes to AUTO
  lines.push(varName + ".primaryAxisSizingMode = 'AUTO';");
  lines.push(varName + ".counterAxisSizingMode = 'AUTO';");

  return lines.join("\n");
}

/**
 * Generate stroke code for a node variable.
 * stroke: { color, weight, align, sides: { top, right, bottom, left } }
 */
function genStroke(varName, stroke) {
  if (!stroke) return "";
  const lines = [];

  if (stroke.color) {
    lines.push(
      varName +
        ".strokes = [{ type: 'SOLID', color: hexToRgb('" +
        esc(stroke.color) +
        "') }];",
    );
  }
  if (stroke.weight != null) {
    lines.push(varName + ".strokeWeight = " + stroke.weight + ";");
  }
  if (stroke.align) {
    lines.push(varName + ".strokeAlign = '" + esc(stroke.align) + "';");
  }
  if (stroke.sides) {
    if (stroke.sides.top === false)
      lines.push(varName + ".strokeTopWeight = 0;");
    if (stroke.sides.right === false)
      lines.push(varName + ".strokeRightWeight = 0;");
    if (stroke.sides.bottom === false)
      lines.push(varName + ".strokeBottomWeight = 0;");
    if (stroke.sides.left === false)
      lines.push(varName + ".strokeLeftWeight = 0;");
  }

  return lines.join("\n");
}

/**
 * Generate effects code for a node variable.
 * effects: [{ type, color, opacity, offset:{x,y}, radius, spread }]
 * DROP_SHADOW and INNER_SHADOW get blendMode: "NORMAL"
 */
function genEffects(varName, effects) {
  if (!effects || !effects.length) return "";

  const parts = effects.map((e) => {
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      const ox = (e.offset && e.offset.x) || 0;
      const oy = (e.offset && e.offset.y) || 0;
      const opacity = e.opacity != null ? e.opacity : 0.25;
      const radius = e.radius || 0;
      let s =
        "{ type: '" +
        e.type +
        "', visible: true, blendMode: 'NORMAL', color: { r: hexToRgb('" +
        esc(e.color) +
        "').r, g: hexToRgb('" +
        esc(e.color) +
        "').g, b: hexToRgb('" +
        esc(e.color) +
        "').b, a: " +
        opacity +
        " }, offset: { x: " +
        ox +
        ", y: " +
        oy +
        " }, radius: " +
        radius;
      if (e.spread != null) s += ", spread: " + e.spread;
      s += " }";
      return s;
    }
    if (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR") {
      return (
        "{ type: '" +
        e.type +
        "', visible: true, radius: " +
        (e.radius || 0) +
        " }"
      );
    }
    return JSON.stringify(e);
  });

  return varName + ".effects = [" + parts.join(", ") + "];";
}

/**
 * Generate cornerRadius code for a node variable.
 * cr: number (uniform) or { topLeft, topRight, bottomRight, bottomLeft }
 */
function genCornerRadius(varName, cr) {
  if (cr == null) return "";
  if (typeof cr === "number") {
    return varName + ".cornerRadius = " + cr + ";";
  }
  const lines = [];
  if (cr.topLeft != null)
    lines.push(varName + ".topLeftRadius = " + cr.topLeft + ";");
  if (cr.topRight != null)
    lines.push(varName + ".topRightRadius = " + cr.topRight + ";");
  if (cr.bottomRight != null)
    lines.push(varName + ".bottomRightRadius = " + cr.bottomRight + ";");
  if (cr.bottomLeft != null)
    lines.push(varName + ".bottomLeftRadius = " + cr.bottomLeft + ";");
  return lines.join("\n");
}

/**
 * Generate sizing code for a node variable.
 * sizing: { horizontal: 'FILL'|'HUG'|number, vertical: 'FILL'|'HUG'|number,
 *            minWidth, maxWidth, minHeight, maxHeight }
 * MUST be called after appendChild.
 */
function genSizing(varName, sizing) {
  if (!sizing) return "";
  const lines = [];

  const h = sizing.horizontal;
  if (h === "FILL") {
    lines.push("_fillH(" + varName + ");");
  } else if (h === "HUG") {
    lines.push(varName + ".layoutSizingHorizontal = 'HUG';");
  } else if (typeof h === "number") {
    lines.push(varName + ".layoutSizingHorizontal = 'FIXED';");
    lines.push(varName + ".resize(" + h + ", " + varName + ".height);");
  }

  const v = sizing.vertical;
  if (v === "FILL") {
    lines.push("_fillV(" + varName + ");");
  } else if (v === "HUG") {
    lines.push(varName + ".layoutSizingVertical = 'HUG';");
  } else if (typeof v === "number") {
    lines.push(varName + ".layoutSizingVertical = 'FIXED';");
    lines.push(varName + ".resize(" + varName + ".width, " + v + ");");
  }

  if (sizing.minWidth != null)
    lines.push(varName + ".minWidth = " + sizing.minWidth + ";");
  if (sizing.maxWidth != null)
    lines.push(varName + ".maxWidth = " + sizing.maxWidth + ";");
  if (sizing.minHeight != null)
    lines.push(varName + ".minHeight = " + sizing.minHeight + ";");
  if (sizing.maxHeight != null)
    lines.push(varName + ".maxHeight = " + sizing.maxHeight + ";");

  return lines.join("\n");
}

/**
 * Apply fills, cornerRadius, stroke, effects, and opacity to a node variable.
 * Returns an array of code lines (each already a complete statement).
 * Missing properties in spec are silently skipped.
 */
function genVisualProps(varName, spec) {
  const lines = [];
  if (spec.fills != null) {
    const fc = genFills(varName, spec.fills);
    if (fc) lines.push(fc);
  }
  if (spec.cornerRadius != null) {
    const cr = genCornerRadius(varName, spec.cornerRadius);
    if (cr) lines.push(cr);
  }
  if (spec.stroke) {
    const st = genStroke(varName, spec.stroke);
    if (st) lines.push(st);
  }
  if (spec.effects && spec.effects.length) {
    const ef = genEffects(varName, spec.effects);
    if (ef) lines.push(ef);
  }
  if (spec.opacity != null) {
    var opVal =
      typeof spec.opacity === "object" ? spec.opacity.value : spec.opacity;
    lines.push(varName + ".opacity = " + opVal + ";");
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Node code generators
// ---------------------------------------------------------------------------

/**
 * Dispatcher — routes by spec.type, returns code lines array.
 * varName: the JS variable name to assign the created node to.
 */
function generateNodeCode(spec, varName) {
  switch (spec.type) {
    case "FRAME":
      return _genFrame(spec, varName);
    case "TEXT":
      return _genText(spec, varName);
    case "RECT":
      return _genRect(spec, varName);
    case "ELLIPSE":
      return _genEllipse(spec, varName);
    case "DIVIDER":
      return _genDivider(spec, varName);
    case "INSTANCE":
      return _genInstance(spec, varName);
    case "LOCAL_INSTANCE":
      return _genLocalInstance(spec, varName);
    case "VECTOR":
      return _genVector(spec, varName);
    default:
      throw new Error("generateNodeCode: unknown node type: " + spec.type);
  }
}

/** Generate FRAME node code. */
function _genFrame(spec, varName) {
  const lines = [];
  lines.push("var " + varName + " = figma.createFrame();");
  if (spec.name) lines.push(varName + ".name = " + lit(spec.name) + ";");

  // Layout MUST be set before children
  if (spec.layout) {
    const layoutCode = genLayout(varName, spec.layout);
    if (layoutCode) lines.push(layoutCode);
  }

  // Visual properties
  genVisualProps(varName, spec).forEach((l) => lines.push(l));
  if (spec.clipsContent !== undefined) {
    lines.push(varName + ".clipsContent = " + spec.clipsContent + ";");
  }

  // Fixed size before children (if no auto-layout)
  if (spec.width !== undefined && spec.height !== undefined) {
    lines.push(varName + ".resize(" + spec.width + ", " + spec.height + ");");
  }

  // Build children recursively
  if (spec.children && spec.children.length) {
    for (let i = 0; i < spec.children.length; i++) {
      const child = spec.children[i];
      const childVar = nextVar("c");
      const childCode = generateNodeCode(child, childVar);
      lines.push(childCode);
      lines.push(varName + ".appendChild(" + childVar + ");");
      // Absolute positioning for children of NONE-layout frames
      if (child.x !== undefined) lines.push(childVar + ".x = " + child.x + ";");
      if (child.y !== undefined) lines.push(childVar + ".y = " + child.y + ";");
      if (child.sizing) {
        const sc = genSizing(childVar, child.sizing);
        if (sc) lines.push(sc);
      }
    }
  }

  return lines.join("\n");
}

/** Generate TEXT node code. */
function _genText(spec, varName) {
  const lines = [];
  lines.push("var " + varName + " = figma.createText();");
  if (spec.name) lines.push(varName + ".name = " + lit(spec.name) + ";");

  // Font parsing
  let fontFamily = "Inter";
  let fontStyle = "Regular";
  if (spec.font) {
    const parts = spec.font.split(":");
    fontFamily = parts[0];
    fontStyle = parts[1] ? parts[1].trim() : "Regular";
  }
  if (spec.bold) fontStyle = "Bold";

  // Style object support (alternative to flat props)
  if (spec.style) {
    if (spec.style.fontFamily) fontFamily = spec.style.fontFamily;
    if (spec.style.fontWeight) fontStyle = spec.style.fontWeight;
    if (spec.style.fontSize !== undefined) spec.size = spec.style.fontSize;
    if (spec.style.lineHeight !== undefined)
      spec.lineHeight = spec.style.lineHeight;
    if (spec.style.letterSpacing !== undefined)
      spec.letterSpacing = spec.style.letterSpacing;
  }

  lines.push(
    "await figma.loadFontAsync({ family: '" +
      esc(fontFamily) +
      "', style: '" +
      esc(fontStyle) +
      "' });",
  );
  lines.push(
    varName +
      ".fontName = { family: '" +
      esc(fontFamily) +
      "', style: '" +
      esc(fontStyle) +
      "' };",
  );

  if (spec.size !== undefined) {
    var szVal = typeof spec.size === "object" ? spec.size.value : spec.size;
    lines.push(varName + ".fontSize = " + szVal + ";");
  }
  if (spec.content !== undefined)
    lines.push(varName + ".characters = " + lit(String(spec.content)) + ";");

  // Color
  if (spec.color) {
    lines.push(
      varName +
        ".fills = [{ type: 'SOLID', color: hexToRgb('" +
        esc(spec.color) +
        "') }];",
    );
  }

  // Fixed width with height auto-resize
  if (spec.width !== undefined) {
    lines.push(
      varName + ".resize(" + spec.width + ", " + varName + ".height);",
    );
    lines.push(varName + ".textAutoResize = 'HEIGHT';");
  }

  if (spec.textAlign) {
    if (spec.textAlign.horizontal) {
      lines.push(
        varName +
          ".textAlignHorizontal = '" +
          esc(spec.textAlign.horizontal) +
          "';",
      );
    }
    if (spec.textAlign.vertical) {
      lines.push(
        varName +
          ".textAlignVertical = '" +
          esc(spec.textAlign.vertical) +
          "';",
      );
    }
  }

  if (spec.letterSpacing !== undefined) {
    if (typeof spec.letterSpacing === "number") {
      lines.push(
        varName +
          ".letterSpacing = { value: " +
          spec.letterSpacing +
          ", unit: 'PIXELS' };",
      );
    } else {
      lines.push(
        varName +
          ".letterSpacing = " +
          JSON.stringify(spec.letterSpacing) +
          ";",
      );
    }
  }

  if (spec.opacity != null) {
    var opVal2 =
      typeof spec.opacity === "object" ? spec.opacity.value : spec.opacity;
    lines.push(varName + ".opacity = " + opVal2 + ";");
  }

  if (spec.lineHeight !== undefined) {
    var lhVal =
      typeof spec.lineHeight === "object"
        ? spec.lineHeight.value
        : spec.lineHeight;
    lines.push(
      varName + ".lineHeight = { value: " + lhVal + ", unit: 'PIXELS' };",
    );
  }

  return lines.join("\n");
}

/** Generate RECT node code. */
function _genRect(spec, varName) {
  const lines = [];
  lines.push("var " + varName + " = figma.createRectangle();");
  if (spec.name) lines.push(varName + ".name = " + lit(spec.name) + ";");
  if (spec.width !== undefined && spec.height !== undefined) {
    lines.push(varName + ".resize(" + spec.width + ", " + spec.height + ");");
  }
  genVisualProps(varName, spec).forEach((l) => lines.push(l));
  return lines.join("\n");
}

/** Generate ELLIPSE node code. */
function _genEllipse(spec, varName) {
  const lines = [];
  lines.push("var " + varName + " = figma.createEllipse();");
  if (spec.name) lines.push(varName + ".name = " + lit(spec.name) + ";");
  if (spec.width !== undefined && spec.height !== undefined) {
    lines.push(varName + ".resize(" + spec.width + ", " + spec.height + ");");
  }
  genVisualProps(varName, spec).forEach((l) => lines.push(l));
  return lines.join("\n");
}

/** Generate DIVIDER node code (thin rectangle fallback). */
function _genDivider(spec, varName) {
  const lines = [];
  const w = spec.width || 300;
  const color = spec.color || "#E0E0E0";
  lines.push("var " + varName + " = figma.createRectangle();");
  lines.push(varName + ".name = 'Divider';");
  lines.push(varName + ".resize(" + w + ", 1);");
  lines.push(
    varName +
      ".fills = [{ type: 'SOLID', color: hexToRgb('" +
      esc(color) +
      "') }];",
  );
  return lines.join("\n");
}

/** Generate VECTOR node code — creates a minimal rectangle placeholder. */
function _genVector(spec, varName) {
  const lines = [];
  const w = spec.width != null ? spec.width : 16;
  const h = spec.height != null ? spec.height : 16;
  lines.push("var " + varName + " = figma.createRectangle();");
  if (spec.name) lines.push(varName + ".name = " + lit(spec.name) + ";");
  lines.push(varName + ".resize(" + w + ", " + h + ");");
  if (spec.fills != null) {
    const fc = genFills(varName, spec.fills);
    if (fc) lines.push(fc);
  }
  return lines.join("\n");
}

/** Shared implementation for LOCAL_INSTANCE and INSTANCE node code generation.
 * @param {object} spec - Node spec
 * @param {string} varName - Generated variable name for this node
 * @param {string} varPrefix - Either '_local_' or '_imp_'
 * @param {boolean} hasNullGuard - true for local instances (may be missing); false for imports (assumed present)
 */
function _genInstanceShared(spec, varName, varPrefix, hasNullGuard) {
  const lines = [];
  const ref = spec.ref;
  const csVar = varPrefix + ref;

  lines.push("var " + varName + ";");

  if (spec.variant) {
    lines.push("(function() {");
    lines.push("  var _cs = " + csVar + ";");
    if (hasNullGuard) {
      lines.push("  if (_cs && _cs.type === 'COMPONENT_SET') {");
    } else {
      lines.push("  if (_cs.type === 'COMPONENT_SET') {");
    }
    lines.push("    var _variants = _cs.children;");
    lines.push("    var _target = null;");
    lines.push("    for (var _i = 0; _i < _variants.length; _i++) {");
    lines.push(
      "      if (_variants[_i].name === " +
        lit(spec.variant) +
        ") { _target = _variants[_i]; break; }",
    );
    lines.push("    }");
    lines.push("    if (!_target) {");
    lines.push("      for (var _j = 0; _j < _variants.length; _j++) {");
    lines.push(
      "        if (_variants[_j].name.indexOf(" +
        lit(spec.variant) +
        ") !== -1) { _target = _variants[_j]; break; }",
    );
    lines.push("      }");
    lines.push("    }");
    lines.push("    if (_target) {");
    lines.push("      " + varName + " = _target.createInstance();");
    lines.push("    } else {");
    lines.push(
      "      " +
        varName +
        " = (_cs.defaultVariant || _cs.children[0]).createInstance();",
    );
    lines.push("    }");
    if (hasNullGuard) {
      lines.push("  } else if (_cs) {");
      lines.push("    " + varName + " = _cs.createInstance();");
      lines.push("  } else {");
      lines.push("    " + varName + " = figma.createFrame();");
      lines.push("    " + varName + ".name = 'Missing: " + esc(ref) + "';");
    } else {
      lines.push("  } else {");
      lines.push("    " + varName + " = _cs.createInstance();");
    }
    lines.push("  }");
    lines.push("})();");
  } else {
    lines.push("(function() {");
    lines.push("  var _cs = " + csVar + ";");
    if (hasNullGuard) {
      lines.push("  if (_cs && _cs.type === 'COMPONENT_SET') {");
    } else {
      lines.push("  if (_cs.type === 'COMPONENT_SET') {");
    }
    lines.push(
      "    " +
        varName +
        " = (_cs.defaultVariant || _cs.children[0]).createInstance();",
    );
    if (hasNullGuard) {
      lines.push("  } else if (_cs) {");
      lines.push("    " + varName + " = _cs.createInstance();");
      lines.push("  } else {");
      lines.push("    " + varName + " = figma.createFrame();");
      lines.push("    " + varName + ".name = 'Missing: " + esc(ref) + "';");
    } else {
      lines.push("  } else {");
      lines.push("    " + varName + " = _cs.createInstance();");
    }
    lines.push("  }");
    lines.push("})();");
  }

  if (spec.name) lines.push(varName + ".name = " + lit(spec.name) + ";");

  // Resize instance if width/height specified
  if (spec.width !== undefined && spec.height !== undefined) {
    lines.push(varName + ".resize(" + spec.width + ", " + spec.height + ");");
  } else if (spec.width !== undefined) {
    lines.push(
      varName + ".resize(" + spec.width + ", " + varName + ".height);",
    );
  } else if (spec.height !== undefined) {
    lines.push(
      varName + ".resize(" + varName + ".width, " + spec.height + ");",
    );
  }

  if (spec.props) {
    for (const prop in spec.props) {
      lines.push(
        "setProp(" +
          varName +
          ", " +
          lit(prop) +
          ", " +
          lit(spec.props[prop]) +
          ");",
      );
    }
  }

  if (spec.fills != null) {
    const fc = genFills(varName, spec.fills);
    if (fc) lines.push(fc);
  }

  // Detach instance and append children (for card shell pattern)
  if (spec.detach) {
    lines.push(varName + " = " + varName + ".detachInstance();");
  }

  if (spec.children && spec.children.length) {
    // After detach, find the "Content" slot inside the detached frame.
    // Components like Brief Card, Accessibility Card, and Code Block have
    // an internal "Content" frame — children must go there, not at root.
    // The Content frame is typically a fixed-height placeholder that needs
    // auto-layout setup (via spec.contentSlot) before children can be appended.
    const appendTarget = spec.detach ? varName + "_slot" : varName;
    if (spec.detach) {
      lines.push(
        "var " +
          appendTarget +
          " = " +
          varName +
          '.findOne(function(n) { return n.name === "Content"; }) || ' +
          varName +
          ";",
      );
      // Clear placeholder children from the Content slot
      lines.push("if (" + appendTarget + " !== " + varName + ") {");
      lines.push(
        "  while (" +
          appendTarget +
          ".children.length) " +
          appendTarget +
          ".children[0].remove();",
      );
      lines.push("}");
      // Configure the Content slot's auto-layout from spec.contentSlot
      if (spec.contentSlot && spec.contentSlot.layout) {
        const sl = spec.contentSlot.layout;
        lines.push("if (" + appendTarget + " !== " + varName + ") {");
        lines.push(
          "  " +
            appendTarget +
            ".layoutMode = '" +
            (sl.mode || "VERTICAL") +
            "';",
        );
        if (sl.spacing != null)
          lines.push(
            "  " + appendTarget + ".itemSpacing = " + sl.spacing + ";",
          );
        if (Array.isArray(sl.padding)) {
          lines.push(
            "  " + appendTarget + ".paddingTop = " + sl.padding[0] + ";",
          );
          lines.push(
            "  " + appendTarget + ".paddingRight = " + sl.padding[1] + ";",
          );
          lines.push(
            "  " + appendTarget + ".paddingBottom = " + sl.padding[2] + ";",
          );
          lines.push(
            "  " + appendTarget + ".paddingLeft = " + sl.padding[3] + ";",
          );
        }
        lines.push("  " + appendTarget + ".primaryAxisSizingMode = 'AUTO';");
        lines.push("  " + appendTarget + ".counterAxisSizingMode = 'AUTO';");
        // Root frame must also HUG vertically so it grows with content
        lines.push("  " + varName + ".primaryAxisSizingMode = 'AUTO';");
        lines.push("}");
      }
    }
    spec.children.forEach((child) => {
      const childVar = nextVar("c");
      const childCode = generateNodeCode(child, childVar);
      childCode.split("\n").forEach((l) => lines.push(l));
      lines.push(appendTarget + ".appendChild(" + childVar + ");");
      if (child.x !== undefined) lines.push(childVar + ".x = " + child.x + ";");
      if (child.y !== undefined) lines.push(childVar + ".y = " + child.y + ";");
      if (child.sizing) {
        const sc = genSizing(childVar, child.sizing);
        if (sc) sc.split("\n").forEach((l) => lines.push(l));
      }
    });
  }

  return lines.join("\n");
}

/** Generate LOCAL_INSTANCE node code (uses _local_<ref> instead of _imp_<ref>). */
function _genLocalInstance(spec, varName) {
  return _genInstanceShared(spec, varName, "_local_", true);
}

/** Generate INSTANCE node code. */
function _genInstance(spec, varName) {
  return _genInstanceShared(spec, varName, "_imp_", false);
}

// ---------------------------------------------------------------------------
// Full call assembler
// ---------------------------------------------------------------------------

/**
 * Pre-validate a spec object before code generation.
 * Returns { errors: string[], warnings: string[] }.
 */
function validateSpec(spec) {
  const errors = [];
  const warnings = [];

  if (!spec.meta) errors.push("spec.meta is required");
  if (!Array.isArray(spec.tree) || spec.tree.length === 0)
    errors.push("spec.tree must be a non-empty array");
  if (!Array.isArray(spec.fonts) || spec.fonts.length === 0)
    warnings.push("spec.fonts is empty — text nodes may fail to load fonts");

  // Check imports reference validity
  const importRefs = spec.imports ? Object.keys(spec.imports) : [];
  const localRefs = spec.localComponents
    ? Object.keys(spec.localComponents)
    : [];
  const allRefs = new Set([...importRefs, ...localRefs]);

  function checkNode(node, path) {
    if (!node || typeof node !== "object") {
      errors.push(path + ": node is not an object");
      return;
    }
    if (!node.type) {
      errors.push(path + ": missing type");
      return;
    }
    if (node.type === "INSTANCE" && !node.ref)
      errors.push(path + ": INSTANCE missing ref");
    if (node.type === "INSTANCE" && node.ref && !allRefs.has(node.ref))
      warnings.push(path + ': ref "' + node.ref + '" not in imports');
    if (node.type === "LOCAL_INSTANCE" && !node.ref)
      errors.push(path + ": LOCAL_INSTANCE missing ref");
    if (node.type === "TEXT" && !node.content && node.content !== "")
      warnings.push(path + ": TEXT with empty content");
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(function (c, i) {
        checkNode(c, path + ".children[" + i + "]");
      });
    }
  }

  if (Array.isArray(spec.tree)) {
    spec.tree.forEach(function (n, i) {
      checkNode(n, "tree[" + i + "]");
    });
  }

  return { errors: errors, warnings: warnings };
}

/**
 * Generate a complete self-contained Figma plugin JS string from a spec object.
 * The code is an async IIFE that creates all nodes and returns metadata.
 */
function generateCallCode(spec) {
  // Pre-validate
  var validation = validateSpec(spec);
  validation.warnings.forEach(function (w) {
    process.stderr.write("WARN: " + w + "\n");
  });
  if (validation.errors.length > 0) {
    validation.errors.forEach(function (e) {
      process.stderr.write("ERROR: " + e + "\n");
    });
    throw new Error("Spec validation failed: " + validation.errors.join("; "));
  }

  resetCounter();
  const lines = [];

  // 1. Helper functions
  lines.push(generateHexToRgb());
  lines.push("");
  lines.push(generateAngleToTransform());
  lines.push("");
  lines.push(generateSetProp());
  lines.push("");
  lines.push(generateFillHelpers());
  lines.push("");

  // 2. Top-level async code (use_figma sandbox supports top-level await)
  lines.push("");

  // 3. Navigate to target page
  const meta = spec.meta || {};
  lines.push("// Navigate to target page");
  lines.push(
    "var _targetNode = await figma.getNodeByIdAsync(" +
      lit(meta.targetNodeId) +
      ");",
  );
  lines.push("var _page = _targetNode;");
  lines.push("while (_page && _page.type !== 'PAGE') _page = _page.parent;");
  lines.push("if (_page) await figma.setCurrentPageAsync(_page);");
  lines.push("");

  // 4. Load fonts
  if (spec.fonts && spec.fonts.length) {
    lines.push("// Load fonts");
    lines.push("await Promise.all([");
    spec.fonts.forEach((f) => {
      const parts = f.split(":");
      const family = parts[0];
      const style = parts[1] ? parts[1].trim() : "Regular";
      lines.push(
        "  figma.loadFontAsync({ family: '" +
          esc(family) +
          "', style: '" +
          esc(style) +
          "' }),",
      );
    });
    lines.push("]);");
    lines.push("");
  }

  // 5. Import components
  const imports = spec.imports || {};
  const importKeys = Object.keys(imports);
  if (importKeys.length) {
    lines.push("// Import components");
    importKeys.forEach((ref) => {
      const def = imports[ref];
      const impVar = "_imp_" + ref;
      if (def.method === "set") {
        lines.push(
          "var " +
            impVar +
            " = await figma.importComponentSetByKeyAsync(" +
            lit(def.key) +
            ");",
        );
      } else {
        lines.push(
          "var " +
            impVar +
            " = await figma.importComponentByKeyAsync(" +
            lit(def.key) +
            ");",
        );
      }
    });
    lines.push("");
  }

  // 5b. Local components (by node ID or component key)
  const localComponents = spec.localComponents || {};
  const localCompKeys = Object.keys(localComponents);
  if (localCompKeys.length) {
    lines.push("// Load local components");
    localCompKeys.forEach((ref) => {
      const def = localComponents[ref];
      const localVar = "_local_" + ref;
      if (def.key) {
        // Component key (hash) — import from library
        lines.push(
          "var " +
            localVar +
            " = await figma.importComponentSetByKeyAsync(" +
            lit(def.key) +
            ");",
        );
      } else {
        // Node ID — get from current file
        lines.push(
          "var " +
            localVar +
            " = await figma.getNodeByIdAsync(" +
            lit(def.nodeId) +
            ");",
        );
      }
    });
    lines.push("");
  }

  // 5c. Variables (by key)
  const variables = spec.variables || {};
  const variableKeys = Object.keys(variables);
  if (variableKeys.length) {
    lines.push("// Import variables");
    variableKeys.forEach((ref) => {
      const def = variables[ref];
      const varVar = "_var_" + ref;
      lines.push(
        "var " +
          varVar +
          " = await figma.variables.importVariableByKeyAsync(" +
          lit(def.key) +
          ");",
      );
    });
    lines.push("");
  }

  // 5d. Styles (by key)
  const styles = spec.styles || {};
  const styleKeys = Object.keys(styles);
  if (styleKeys.length) {
    lines.push("// Import styles");
    styleKeys.forEach((ref) => {
      const def = styles[ref];
      const styleVar = "_style_" + ref;
      lines.push(
        "var " +
          styleVar +
          " = await figma.importStyleByKeyAsync(" +
          lit(def.key) +
          ");",
      );
    });
    lines.push("");
  }

  // 6. Create wrapper or find existing
  lines.push("// Create or find wrapper");
  if (meta.appendToId) {
    lines.push(
      "var _wrapper = await figma.getNodeByIdAsync(" +
        lit(meta.appendToId) +
        ");",
    );
    lines.push(
      "if (!_wrapper) throw new Error(" +
        lit("Wrapper " + meta.appendToId + " not found") +
        ");",
    );
  } else {
    lines.push("var _wrapper = figma.createFrame();");
    const wrapperName =
      meta.wrapperName ||
      (meta.skill || "output") + ": " + (meta.component || "output");
    lines.push("_wrapper.name = " + lit(wrapperName) + ";");
    lines.push("_wrapper.layoutMode = 'HORIZONTAL';");
    lines.push("_wrapper.itemSpacing = 32;");
    lines.push("_wrapper.primaryAxisSizingMode = 'AUTO';");
    lines.push("_wrapper.counterAxisSizingMode = 'AUTO';");
    lines.push("_wrapper.fills = [];");
  }
  lines.push("");

  // 7. Build tree nodes recursively
  lines.push("// Build tree");
  lines.push("var _nodeCount = 0;");
  const treeNodes = Array.isArray(spec.tree)
    ? spec.tree
    : spec.tree
      ? [spec.tree]
      : [];
  treeNodes.forEach((childSpec) => {
    const childVar = nextVar("c");
    const childCode = generateNodeCode(childSpec, childVar);
    childCode.split("\n").forEach((l) => lines.push(l));
    lines.push("_wrapper.appendChild(" + childVar + ");");
    if (childSpec.sizing) {
      const sc = genSizing(childVar, childSpec.sizing);
      if (sc) sc.split("\n").forEach((l) => lines.push(l));
    }
    lines.push("_nodeCount++;");
  });
  lines.push("");

  // 8. Create section + position (only for new wrappers)
  let hasSectionVar = false;
  if (!meta.appendToId) {
    hasSectionVar = true;
    const sectionName =
      meta.sectionName ||
      meta.wrapperName ||
      (meta.skill || "output") + ": " + (meta.component || "output");
    lines.push("// Create container frame and position below existing content");
    lines.push("var _section = figma.createFrame();");
    lines.push("_section.name = " + lit(sectionName) + ";");
    lines.push("_section.layoutMode = 'VERTICAL';");
    lines.push("_section.primaryAxisSizingMode = 'AUTO';");
    lines.push("_section.counterAxisSizingMode = 'AUTO';");
    lines.push("_section.fills = [];");
    lines.push("_section.appendChild(_wrapper);");
    lines.push(
      "var _parentPage = _targetNode && _targetNode.type === 'PAGE' ? _targetNode : figma.currentPage;",
    );
    lines.push("var _maxBottom = 0;");
    lines.push("var _pageChildren = _parentPage.children;");
    lines.push("for (var _p = 0; _p < _pageChildren.length; _p++) {");
    lines.push("  var _existing = _pageChildren[_p];");
    lines.push("  if (_existing.id === _section.id) continue;");
    lines.push(
      "  var _ey = typeof _existing.y === 'number' && isFinite(_existing.y) ? _existing.y : 0;",
    );
    lines.push(
      "  var _eh = typeof _existing.height === 'number' && isFinite(_existing.height) ? _existing.height : 0;",
    );
    lines.push("  var _bottom = _ey + _eh;");
    lines.push("  if (_bottom > _maxBottom) _maxBottom = _bottom;");
    lines.push("}");
    lines.push("_section.x = 0;");
    lines.push("_section.y = _maxBottom + 200;");
    lines.push("");
  }

  // 9. Tag with setSharedPluginData
  lines.push("// Tag with plugin data");
  lines.push(
    "_wrapper.setSharedPluginData('actian_ds', 'skill', " +
      lit(meta.skill || "") +
      ");",
  );
  lines.push(
    "_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());",
  );
  lines.push("");

  // 10. Return result
  lines.push("// Return metadata");
  if (hasSectionVar) {
    lines.push(
      "return { wrapperId: _wrapper.id, nodeCount: _nodeCount, sectionId: _section.id };",
    );
  } else {
    lines.push("return { wrapperId: _wrapper.id, nodeCount: _nodeCount };");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

/** Return byte size of compact JSON representation. */
function compactSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), "utf8");
}

/** Walk a tree of nodes and collect all ref values + DIVIDER markers. */
function scanRefs(nodes, refs) {
  if (!refs) refs = new Set();
  if (!Array.isArray(nodes)) return refs;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    if (node.ref) refs.add(node.ref);
    if (node.type === "DIVIDER") refs.add("divider");
    if (node.children) scanRefs(node.children, refs);
  }
  return refs;
}

/** Bin-pack items into groups where raw JSON size stays under maxBinSize. */
function binPack(items, maxBinSize, overhead) {
  const bins = [];
  let currentBin = [];
  let currentSize = 0;
  for (const item of items) {
    const itemSize = compactSize(item);
    if (
      currentBin.length > 0 &&
      currentSize + itemSize + overhead > maxBinSize
    ) {
      bins.push(currentBin);
      currentBin = [];
      currentSize = 0;
    }
    currentBin.push(item);
    currentSize += itemSize + overhead;
  }
  if (currentBin.length > 0) bins.push(currentBin);
  return bins;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Counter
  resetCounter,
  nextVar,
  // Helper generators
  generateHexToRgb,
  generateAngleToTransform,
  generateSetProp,
  // Property code generators
  genFills,
  genLayout,
  genStroke,
  genEffects,
  genCornerRadius,
  genSizing,
  genVisualProps,
  // Node code generators
  generateNodeCode,
  // Full call assembler
  generateCallCode,
  // Shared utilities
  compactSize,
  scanRefs,
  binPack,
  // Internal node generators (exported for testing)
  _genLocalInstance,
  _genVector,
};
