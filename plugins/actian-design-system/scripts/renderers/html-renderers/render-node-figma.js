#!/usr/bin/env node
"use strict";

/**
 * render-node-figma.js — Deterministic Figma Plugin API code emitter for
 * component-node trees (the `content[]` array from a screen spec).
 *
 * Mirrors the CLI contract of figma-table/render-figma.js exactly so the AI
 * can call both the same way (capture stdout, pass to use_figma).
 *
 * Usage:
 *   echo '{"content":[...]}' | node render-node-figma.js [--parent-id <id>]
 *   node render-node-figma.js --spec spec.json --parent-id <contentSlotId>
 *
 * Output:
 *   - On success: stdout is Plugin API JS code; stderr is JSON manifest; exit 0.
 *   - On invalid spec: stdout is empty; stderr is JSON error report; exit 1.
 *
 * Tasks 3-7 fill in the emit() function. This scaffold wires the CLI + gate.
 */

var fs = require("fs");
var validateNode = require("./validate-node.js");

// ---------------------------------------------------------------------------
// CLI — copied verbatim from figma-table/render-figma.js lines 38-70
// ---------------------------------------------------------------------------

function parseArgv(argv) {
  var args = { parentId: null, specPath: null };
  for (var i = 2; i < argv.length; i++) {
    if (argv[i] === "--parent-id") args.parentId = argv[++i];
    else if (argv[i] === "--spec") args.specPath = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") {
      process.stderr.write(
        "Usage: render-node-figma.js [--spec <file>] [--parent-id <id>]\n",
      );
      process.exit(0);
    }
  }
  return args;
}

function readSpecSync(specPath) {
  if (specPath) return fs.readFileSync(specPath, "utf8");
  // stdin
  var data = "";
  var buf = Buffer.alloc(4096);
  var fd = 0;
  while (true) {
    try {
      var n = fs.readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      data += buf.toString("utf8", 0, n);
    } catch (e) {
      if (e.code === "EAGAIN") continue;
      break;
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  var args = parseArgv(process.argv);
  var raw = readSpecSync(args.specPath);
  var spec;
  try {
    spec = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: [{ path: "", message: "invalid JSON: " + e.message }],
      }),
    );
    process.exit(1);
  }

  var nodes = Array.isArray(spec.content) ? spec.content : [spec];

  var errors = [];
  nodes.forEach(function (n, i) {
    validateNode.validateTree(n, "content[" + i + "]").forEach(function (e) {
      errors.push(e);
    });
  });

  if (errors.length) {
    process.stderr.write(JSON.stringify({ ok: false, errors: errors }));
    process.exit(1);
  }

  var out = emit(nodes, args.parentId);
  process.stdout.write(out.code);
  process.stderr.write(JSON.stringify({ ok: true, manifest: out.manifest }));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Emitter — Task 3+: translates component-node trees to Figma Plugin API JS.
// ---------------------------------------------------------------------------

// --- Color helpers ----------------------------------------------------------

function hexToRgb(hex) {
  // "#RRGGBB" -> {r,g,b} 0..1
  var h = String(hex).replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function rgbLit(hex) {
  var c = hexToRgb(hex);
  return "{ r:" + c.r + ", g:" + c.g + ", b:" + c.b + " }";
}

// --- Padding helper (mirrors render-node.js:98-125) -------------------------
// Padding may live at node.layout.padding OR node.padding.

function emitPadding(node, v, lines) {
  var p =
    node.layout && node.layout.padding != null
      ? node.layout.padding
      : node.padding;
  if (p == null) return;
  var t, r, b, l;
  if (Array.isArray(p)) {
    // [top, right, bottom, left]
    t = p[0] || 0;
    r = p[1] || 0;
    b = p[2] || 0;
    l = p[3] || 0;
  } else if (typeof p === "object") {
    t = p.top != null ? p.top : p.vertical != null ? p.vertical : 0;
    r = p.right != null ? p.right : p.horizontal != null ? p.horizontal : 0;
    b = p.bottom != null ? p.bottom : p.vertical != null ? p.vertical : 0;
    l = p.left != null ? p.left : p.horizontal != null ? p.horizontal : 0;
  } else {
    // scalar — same value on all sides
    t = r = b = l = Number(p);
  }
  lines.push(v + ".paddingTop = " + t + ";");
  lines.push(v + ".paddingRight = " + r + ";");
  lines.push(v + ".paddingBottom = " + b + ";");
  lines.push(v + ".paddingLeft = " + l + ";");
}

// --- Corner radius helper (mirrors render-node.js:153-170) ------------------

function emitCornerRadius(node, v, lines) {
  if (node.cornerRadius == null) return;
  if (typeof node.cornerRadius === "number") {
    lines.push(v + ".topLeftRadius = " + node.cornerRadius + ";");
    lines.push(v + ".topRightRadius = " + node.cornerRadius + ";");
    lines.push(v + ".bottomRightRadius = " + node.cornerRadius + ";");
    lines.push(v + ".bottomLeftRadius = " + node.cornerRadius + ";");
  } else if (typeof node.cornerRadius === "object") {
    var cr = node.cornerRadius;
    lines.push(v + ".topLeftRadius = " + (cr.topLeft || 0) + ";");
    lines.push(v + ".topRightRadius = " + (cr.topRight || 0) + ";");
    lines.push(v + ".bottomRightRadius = " + (cr.bottomRight || 0) + ";");
    lines.push(v + ".bottomLeftRadius = " + (cr.bottomLeft || 0) + ";");
  }
}

// --- Stroke helper (mirrors render-node.js:173-189) -------------------------

function emitStroke(node, v, lines) {
  if (!node.stroke) return;
  var stroke = node.stroke;
  var weight = stroke.weight != null ? stroke.weight : 1;
  var color = stroke.color || "#000000";
  lines.push(
    v + ".strokes = [{ type: 'SOLID', color: " + rgbLit(color) + " }];",
  );
  if (stroke.sides && typeof stroke.sides === "object") {
    // Per-side weights via individual strokeTopWeight/etc.
    if (stroke.sides.top) lines.push(v + ".strokeTopWeight = " + weight + ";");
    if (stroke.sides.right)
      lines.push(v + ".strokeRightWeight = " + weight + ";");
    if (stroke.sides.bottom)
      lines.push(v + ".strokeBottomWeight = " + weight + ";");
    if (stroke.sides.left)
      lines.push(v + ".strokeLeftWeight = " + weight + ";");
  } else {
    lines.push(v + ".strokeWeight = " + weight + ";");
    lines.push(v + ".strokeAlign = 'INSIDE';");
  }
}

// --- Sizing helper -----------------------------------------------------------
// FILL  -> record in ctx.fillSizing for Task 7 (post-append)
// HUG   -> default, no-op
// number -> emit resize() / explicit size in body now

function recordSizing(node, v, ctx) {
  var sizing = node.sizing || {};
  // Horizontal
  if (sizing.horizontal === "FILL") {
    ctx.fillSizing.push({
      varName: v,
      axis: "layoutSizingHorizontal",
      value: "FILL",
    });
  } else if (typeof sizing.horizontal === "number") {
    // Resize is done below; emit a width set via resize stub so caller can use it
    ctx._pendingResize = ctx._pendingResize || {};
    ctx._pendingResize[v] = ctx._pendingResize[v] || {};
    ctx._pendingResize[v].w = sizing.horizontal;
  }
  // Vertical
  if (sizing.vertical === "FILL") {
    ctx.fillSizing.push({
      varName: v,
      axis: "layoutSizingVertical",
      value: "FILL",
    });
  } else if (typeof sizing.vertical === "number") {
    ctx._pendingResize = ctx._pendingResize || {};
    ctx._pendingResize[v] = ctx._pendingResize[v] || {};
    ctx._pendingResize[v].h = sizing.vertical;
  }
}

// --- Frame emitter ----------------------------------------------------------

function emitFrame(node, v, lines, ctx) {
  lines.push("const " + v + " = figma.createFrame();");
  if (node.name) lines.push(v + ".name = " + JSON.stringify(node.name) + ";");
  var L = node.layout || {};
  if (L.mode === "HORIZONTAL" || L.mode === "VERTICAL") {
    lines.push(v + ".layoutMode = '" + L.mode + "';");
    lines.push(v + ".primaryAxisSizingMode = 'AUTO';");
    lines.push(v + ".counterAxisSizingMode = 'AUTO';");
  }
  if (L.spacing != null)
    lines.push(v + ".itemSpacing = " + Number(L.spacing) + ";");
  if (L.primaryAxisAlignItems)
    lines.push(
      v + ".primaryAxisAlignItems = '" + L.primaryAxisAlignItems + "';",
    );
  var ca = L.counterAxisAlignItems || L.counterAxisAlign;
  if (ca)
    lines.push(
      v + ".counterAxisAlignItems = '" + (ca === "STRETCH" ? "MIN" : ca) + "';",
    );
  emitPadding(node, v, lines);
  if (node.fills && node.fills[0])
    lines.push(
      v + ".fills = [{ type: 'SOLID', color: " + rgbLit(node.fills[0]) + " }];",
    );
  emitCornerRadius(node, v, lines);
  emitStroke(node, v, lines);
  if (node.opacity != null)
    lines.push(v + ".opacity = " + Number(node.opacity) + ";");
  if (node.clipsContent) lines.push(v + ".clipsContent = true;");
  // Emit numeric sizes (in body, before children)
  var sizing = node.sizing || {};
  if (typeof sizing.horizontal === "number") {
    lines.push(
      v +
        ".resize(" +
        sizing.horizontal +
        ", " +
        (typeof sizing.vertical === "number"
          ? sizing.vertical
          : v + ".height") +
        ");",
    );
  } else if (typeof sizing.vertical === "number") {
    lines.push(v + ".resize(" + v + ".width, " + sizing.vertical + ");");
  }
  // Recurse into children
  (node.children || []).forEach(function (child, i) {
    var cv = v + "_c" + i;
    emitNode(child, cv, lines, ctx);
    lines.push(v + ".appendChild(" + cv + ");");
  });
  recordSizing(node, v, ctx);
}

// --- Text helpers -----------------------------------------------------------

function parseFont(font, def) {
  var p = String(font || "").split(":");
  return {
    family: (p[0] || def || "Inter").trim(),
    style: (p[1] || "Regular").trim(),
  };
}

function emitText(node, v, lines, ctx) {
  var fn = parseFont(node.font, ctx.defaultFont);
  ctx.fonts[fn.family + "|" + fn.style] = fn; // dedup; preloaded by the header (below)
  lines.push("const " + v + " = figma.createText();");
  lines.push(
    v +
      ".fontName = { family: " +
      JSON.stringify(fn.family) +
      ", style: " +
      JSON.stringify(fn.style) +
      " };",
  );
  lines.push(
    v +
      ".characters = " +
      JSON.stringify(node.content != null ? node.content : node.text || "") +
      ";",
  );
  var size = typeof node.size === "object" ? node.size.value : node.size;
  if (size != null) lines.push(v + ".fontSize = " + Number(size) + ";");
  if (node.lineHeight && typeof node.lineHeight === "object")
    lines.push(
      v +
        ".lineHeight = { value: " +
        Number(node.lineHeight.value) +
        ", unit: " +
        JSON.stringify(node.lineHeight.unit || "PIXELS") +
        " };",
    );
  if (node.letterSpacing && typeof node.letterSpacing === "object")
    lines.push(
      v +
        ".letterSpacing = { value: " +
        Number(node.letterSpacing.value) +
        ", unit: " +
        JSON.stringify(node.letterSpacing.unit || "PIXELS") +
        " };",
    );
  if (node.color)
    lines.push(
      v + ".fills = [{ type:'SOLID', color: " + rgbLit(node.color) + " }];",
    );
  if (node.textAlign && node.textAlign.horizontal)
    lines.push(
      v + ".textAlignHorizontal = '" + node.textAlign.horizontal + "';",
    );
  if (node.textCase === "UPPER") lines.push(v + ".textCase = 'UPPER';");
  if (node.opacity != null)
    lines.push(v + ".opacity = " + Number(node.opacity) + ";");
}

// --- Node dispatcher --------------------------------------------------------

function emitNode(node, v, lines, ctx) {
  switch (node.type) {
    case "FRAME":
      return emitFrame(node, v, lines, ctx);
    case "TEXT":
      return emitText(node, v, lines, ctx);
    // INSTANCE / RECT / ELLIPSE / DIVIDER added in later tasks
    default:
      return; // unknown handled by the validate gate before emit
  }
}

// --- Top-level emit ---------------------------------------------------------

function emit(nodes, parentId) {
  var ctx = { fonts: {}, fillSizing: [], defaultFont: "Inter" };
  var body = [];
  nodes.forEach(function (n, i) {
    emitNode(n, "root" + i, body, ctx);
  });
  var header = [];
  var fonts = Object.keys(ctx.fonts)
    .sort()
    .map(function (k) {
      return ctx.fonts[k];
    }); // sort -> deterministic order
  if (fonts.length) {
    header.push(
      "await Promise.all([" +
        fonts
          .map(function (f) {
            return (
              "figma.loadFontAsync({ family: " +
              JSON.stringify(f.family) +
              ", style: " +
              JSON.stringify(f.style) +
              " })"
            );
          })
          .join(", ") +
        "]);",
    );
  }
  return {
    code: header.concat(body).join("\n"),
    manifest: { rootCount: nodes.length, fontCount: fonts.length },
  };
}

if (require.main === module) main();
module.exports = { emit: emit };
